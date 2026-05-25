const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  // Supabase stores the session in localStorage under a known key.
  // We extract the access_token from the active session object.
  const raw = localStorage.getItem("sb-gvmhidazdkibzdqzvvdb-auth-token");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  base: API_BASE,
  getToken,
  get: (path: string) => apiFetch(path, { method: "GET" }),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  wsSignalingUrl(sessionId: string): string {
    const url = new URL(`${API_BASE}/ws/signaling/${sessionId}/browser`);
    const token = getToken();
    if (token) url.searchParams.set("token", token);
    // Return ws:// or wss:// depending on the API_BASE protocol
    return url
      .toString()
      .replace(/^http/, "ws");
  },
};
