export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function apiRequest<TResponse>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(Array.isArray(payload.message) ? payload.message.join(", ") : payload.message);
  }

  return response.json() as Promise<TResponse>;
}

export function postJson<TResponse>(path: string, body: unknown) {
  return apiRequest<TResponse>(path, {
    body: JSON.stringify(body),
    method: "POST",
  });
}

export function patchJson<TResponse>(path: string, body: unknown) {
  return apiRequest<TResponse>(path, {
    body: JSON.stringify(body),
    method: "PATCH",
  });
}

export function deleteJson<TResponse>(path: string) {
  return apiRequest<TResponse>(path, {
    method: "DELETE",
  });
}
