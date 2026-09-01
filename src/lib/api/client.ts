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

  /**
   * A file upload, which is not a request that can be given a deadline.
   *
   * The client-wide 20s timeout is right for an API call: past that, something
   * is wrong. It is the wrong shape entirely for a transfer, where the duration
   * is a function of file size and the customer's upstream bandwidth, not of
   * whether anything is wrong. A 5 MB photo on a slow connection is a perfectly
   * healthy 40-second upload, and it was being aborted at 20 — mid-transfer,
   * with the bytes already partly sent.
   *
   * `timeout: 0` removes the deadline rather than raising it. Any fixed number
   * is a guess about somebody else's connection, and picking a bigger one only
   * moves where it is wrong.
   *
   * `onProgress` reports 0–100. Without it a long upload is indistinguishable
   * from a hung one, which is the other half of why this felt broken.
   */
  upload: <T>(
    url: string,
    body: FormData,
    onProgress?: (percent: number) => void,
    config?: AxiosRequestConfig,
  ) =>
    apiRequest<T>({
      ...config,
      method: "POST",
      url,
      data: body,
      timeout: 0,
      onUploadProgress: onProgress
        ? (e) => {
            // `total` is absent when the size is not known up front; reporting
            // a made-up percentage would be worse than reporting none.
            if (!e.total) return;
            onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
          }
        : undefined,
    }),
};
