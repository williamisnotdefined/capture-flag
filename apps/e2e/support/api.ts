import { apiBaseUrl } from "./env";

export function apiUrl(path: string) {
  return new URL(path, apiBaseUrl).toString();
}
