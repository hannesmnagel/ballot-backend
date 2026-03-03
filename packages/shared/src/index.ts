import { z } from "zod";

export const votingMethodSchema = z.enum(["RCV", "CONDORCET", "STAR"]);
export type VotingMethod = z.infer<typeof votingMethodSchema>;

export const pollStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED"]);
export type PollStatus = z.infer<typeof pollStatusSchema>;

export const createPollInputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional().default(""),
  method: votingMethodSchema,
  options: z.array(z.string().min(1).max(100)).min(2).max(30),
  requireVoterName: z.boolean().default(false),
  showVoterNamesInResults: z.boolean().default(false),
  showNameToBallotMapping: z.boolean().default(false),
  maxVoters: z.number().int().min(1).max(100000),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional()
});

export type CreatePollInput = z.infer<typeof createPollInputSchema>;

export const voteSubmissionRankedSchema = z.object({
  voterName: z.string().max(120).optional(),
  rankings: z.array(
    z.object({
      optionId: z.string().uuid(),
      rank: z.number().int().positive()
    })
  ).min(2)
});

export const voteSubmissionStarSchema = z.object({
  voterName: z.string().max(120).optional(),
  scores: z.array(
    z.object({
      optionId: z.string().uuid(),
      score: z.number().int().min(0).max(5)
    })
  ).min(2)
});

export type VoteSubmissionInputRanked = z.infer<typeof voteSubmissionRankedSchema>;
export type VoteSubmissionInputSTAR = z.infer<typeof voteSubmissionStarSchema>;

export type PollPublicView = {
  pollId: string;
  title: string;
  description: string;
  method: VotingMethod;
  status: PollStatus;
  options: Array<{ id: string; label: string }>;
  requireVoterName: boolean;
  maxVoters: number;
  votesCast: number;
  closesAt: string | null;
};

export type PollResultsView = {
  pollId: string;
  method: VotingMethod;
  winnerOptionId: string | null;
  aggregate: Record<string, number>;
  rounds?: Array<Record<string, number>>;
  pairwise?: Record<string, Record<string, number>>;
  runoff?: { finalists: [string, string]; votes: Record<string, number> };
  voterNames?: string[];
  voterBallotMap?: Array<{ voterName: string; ballot: unknown }>;
};

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_URL: z.string().url(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email()
});
