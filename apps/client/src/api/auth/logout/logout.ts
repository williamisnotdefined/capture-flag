import { apiRequest } from "../../client";

export function logout() {
  return apiRequest<{ ok: true }>("/auth/logout", { method: "POST" });
}
