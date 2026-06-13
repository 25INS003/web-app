import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiError } from "./types";
import type { ApiResponse } from "./types";

// Same-origin via nginx in prod ("/api/v1"); dev compose injects the full URL.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

// Browser client. Auth rides on the backend's httpOnly cookies, so we only need
// `withCredentials` — no token is ever read into JS (that was the old XSS vector).
export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20_000,
});

// Single-flight refresh: concurrent 401s share one refresh call, then all retry.
let refreshing: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  // Bare axios (not `http`) so the refresh call itself can't trigger this
  // interceptor and loop.
  await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthCall =
      url.includes("/auth/login") || url.includes("/auth/refresh-token");

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing ??= refreshSession().finally(() => {
          refreshing = null;
        });
        await refreshing;
        return http(original); // retry with the rotated cookies
      } catch {
        // refresh failed — fall through; the UI/guards send the user to /login
      }
    }

    const data = error.response?.data;
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as ApiResponse<unknown>).message)
        : (error.message ?? "Request failed");
    return Promise.reject(new ApiError(message, status ?? 0, data));
  },
);

// Returns the already-unwrapped `data` payload from the response envelope.
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await http.request<ApiResponse<T>>(config);
  return res.data.data;
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "POST", url, data: body }),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "PUT", url, data: body }),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "PATCH", url, data: body }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: "DELETE", url }),
};
