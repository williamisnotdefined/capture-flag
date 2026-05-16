import { apiRequest } from "@api/client";
import type { MeResponse } from "@src/types";

export function getMe() {
  return apiRequest<MeResponse>("/auth/me");
}
