import {
  createPollInputSchema,
  voteSubmissionRankedSchema,
  voteSubmissionStarSchema,
  type CreatePollInput
} from "@ballot/shared";

export function parseCreatePollInput(input: unknown): CreatePollInput {
  return createPollInputSchema.parse(input);
}

export function parseRankedVote(input: unknown) {
  return voteSubmissionRankedSchema.parse(input);
}

export function parseStarVote(input: unknown) {
  return voteSubmissionStarSchema.parse(input);
}
