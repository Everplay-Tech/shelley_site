// ─── MENTORR API Client ─────────────────────────────────────────────────────
// Typed fetch wrapper for the MENTORR API.
// Base URL comes from NEXT_PUBLIC_API_URL env var.
// This file is plumbing only — no actual endpoint calls yet.

const DEFAULT_API_URL = "https://mentorr-api-production.up.railway.app";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status: number;
}

export async function fetchApi<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API request failed: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  const data = (await response.json()) as T;
  return {
    data,
    status: response.status,
    ok: true,
  };
}

/**
 * GET helper
 */
export function apiGet<T = unknown>(path: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(path, { method: "GET" });
}

/**
 * POST helper
 */
export function apiPost<T = unknown>(
  path: string,
  body: unknown
): Promise<ApiResponse<T>> {
  return fetchApi<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
