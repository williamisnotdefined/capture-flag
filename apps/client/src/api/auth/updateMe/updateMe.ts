import { patchJson } from "@api/client";
import type { UserSummary } from "@src/types";

export type UpdateMeInput = {
  name: string;
};

export function updateMe(input: UpdateMeInput) {
  return patchJson<UserSummary>("/auth/me", input);
}
