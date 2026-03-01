import { createHash, randomBytes } from "node:crypto";

export function randomToken(size = 32) {
  return randomBytes(size).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
