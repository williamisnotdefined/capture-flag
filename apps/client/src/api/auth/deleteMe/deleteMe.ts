import { deleteJson } from "@api/client";

export function deleteMe() {
  return deleteJson<{ ok: true }>("/auth/me");
}
