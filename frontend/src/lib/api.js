export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers
    },
    body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}
