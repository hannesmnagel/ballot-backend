import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type VerifiedRegistrationResponse
} from "@simplewebauthn/server";
import { prisma } from "./prisma";
import { addHours } from "./time";
import { hashToken } from "./crypto";

const RP_NAME = "Ballot";
const RP_ID = process.env.PASSKEY_RP_ID ?? "localhost";
const ORIGIN = process.env.PASSKEY_ORIGIN ?? "http://localhost:3000";

type ChallengeType = "PASSKEY_REGISTER" | "PASSKEY_LOGIN";

async function saveChallenge(challenge: string, kind: ChallengeType, userId?: string) {
  const tokenHash = hashToken(`${kind}:${challenge}`);
  await prisma.authChallenge.create({
    data: {
      userId,
      kind,
      tokenHash,
      expiresAt: addHours(new Date(), 1)
    }
  });
}

async function consumeChallenge(challenge: string, kind: ChallengeType, userId?: string) {
  const tokenHash = hashToken(`${kind}:${challenge}`);
  const row = await prisma.authChallenge.findUnique({ where: { tokenHash } });
  if (!row || row.kind !== kind || row.expiresAt < new Date()) return false;
  if (userId && row.userId !== userId) return false;

  await prisma.authChallenge.delete({ where: { tokenHash } });
  return true;
}

export async function createPasskeyRegistrationOptions(userId: string, userName?: string) {
  const existing = await prisma.authAccount.findMany({
    where: { userId, provider: "PASSKEY" }
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: userName ?? userId,
    userID: Buffer.from(userId),
    attestationType: "none",
    excludeCredentials: existing.map((account) => ({
      id: account.providerAccountId,
      transports: (account.transports ?? "").split(",").filter(Boolean) as AuthenticatorTransport[]
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred", // Allows device to skip verification if not available
      requireResidentKey: false // Don't require resident key for better compatibility
    }
  });

  await saveChallenge(options.challenge, "PASSKEY_REGISTER", userId);
  return options;
}

export async function verifyPasskeyRegistration(params: {
  userId: string;
  response: Parameters<typeof verifyRegistrationResponse>[0]["response"];
}): Promise<VerifiedRegistrationResponse> {
  const verified = await verifyRegistrationResponse({
    response: params.response,
    expectedChallenge: async (challenge) => consumeChallenge(challenge, "PASSKEY_REGISTER", params.userId),
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: false // Don't enforce user verification
  });

  if (verified.verified && verified.registrationInfo) {
    await prisma.authAccount.create({
      data: {
        userId: params.userId,
        provider: "PASSKEY",
        providerAccountId: verified.registrationInfo.credential.id,
        credentialPublicKey: Buffer.from(verified.registrationInfo.credential.publicKey),
        counter: verified.registrationInfo.credential.counter,
        transports: params.response.response.transports?.join(","),
        aaguid: verified.registrationInfo.aaguid
      }
    });
  }

  return verified;
}

export async function createPasskeyLoginOptions() {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred", // Allows device to skip verification if not available
    allowCredentials: [] // Empty for discoverable credentials (passkeys)
  });

  await saveChallenge(options.challenge, "PASSKEY_LOGIN");
  return options;
}

export async function verifyPasskeyLogin(response: Parameters<typeof verifyAuthenticationResponse>[0]["response"]) {
  const account = await prisma.authAccount.findFirst({
    where: {
      provider: "PASSKEY",
      providerAccountId: response.id
    }
  });

  if (!account?.credentialPublicKey || account.counter == null) {
    throw new Error("Passkey credential not found");
  }

  const verified = await verifyAuthenticationResponse({
    response,
    expectedChallenge: async (challenge) => consumeChallenge(challenge, "PASSKEY_LOGIN"),
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: account.providerAccountId,
      publicKey: new Uint8Array(account.credentialPublicKey),
      counter: account.counter
    },
    requireUserVerification: false // Don't enforce user verification
  });

  if (verified.verified) {
    await prisma.authAccount.update({
      where: { id: account.id },
      data: { counter: verified.authenticationInfo.newCounter }
    });
  }

  return { verified: verified.verified, userId: account.userId };
}
