import type { MeResponse } from "../../../types";
import { apiRequest } from "../../client";

export function getMe() {
  return apiRequest<MeResponse>("/auth/me");
}
