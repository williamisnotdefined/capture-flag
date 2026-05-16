import { apiRequest } from "@api/client";

export function logout() {
  return apiRequest<{ ok: true }>("/auth/logout", { method: "POST" });
}
