import axios from "axios";
import { useAuthStore } from "../store/authStore";
import Routes from "./endpoints";

// Same-origin by default, matching src/lib/api/client.ts.
//
// NEXT_PUBLIC_* is inlined at build time, and the Dockerfile deliberately does
// not take the API origin as a build arg — one image has to stay valid in every
// environment. So `NEXT_PUBLIC_API_URL` is NOT set in the deployed bundle, no
// matter what the Deployment's env says: setting it on the pod is too late,
// the value was already frozen into the client chunks during `npm run build`.
//
// That made this fallback the real base URL in dev and production alike, and it
// pointed at the developer's own machine. Every store built on this client —
// the whole shop-owner portal and the admin portal — asked the *visitor's*
// browser for http://localhost:8000, which answers nothing, so axios failed
// with a bare Network Error: no `err.response`, hence the generic "Failed to
// fetch shops." with no status to explain it. Pages on src/lib/api/client.ts
// (the dashboard) were unaffected, which is why only parts of the app broke.
//
// "/api/v1" resolves against whatever fronts the app: nginx in the dev stack,
// the Ingress in production. `next dev` outside Docker has neither — that case
// is what next.config.mjs's DEV_API_PROXY rewrite exists for, not this default.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
  withCredentials: true,
});

// variables to manage the refresh state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Check if it's a 401 and not already a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // 2. Prevent refresh loop on login/profile specific routes
      const isProfileCheck = originalRequest.url.includes(Routes.AUTH.ME);
      if (isProfileCheck || window.location.pathname === '/login') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 3. If a refresh is already happening, "pause" this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshTokens } = useAuthStore.getState();
        const result = await refreshTokens();

        if (result.success) {
          const { accessToken } = useAuthStore.getState();
          processQueue(null, accessToken); // Resume all waiting requests
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }

        // A failed refresh lands HERE, not in the catch below: `refreshTokens`
        // swallows its own error and reports failure by returning
        // `{ success: false }`. So the catch never ran on the path that
        // actually fails, and this branch did not exist — `processQueue` was
        // never called, leaving every request queued behind the refresh pending
        // FOREVER. Those promises are settled by hand, so axios' own timeout
        // does not apply to them: the caller just hung, and any spinner it was
        // driving hung with it.
        //
        // Same teardown as the catch: flush the queue so the waiters reject,
        // then log out and send the user to /login.
        const sessionError =
          error.response?.data?.message || "Session expired";
        processQueue(new Error(sessionError), null);
        const { logout: endSession } = useAuthStore.getState();
        await endSession();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError, null);
        const { logout } = useAuthStore.getState();
        await logout();
        // Only redirect if not already on login to prevent infinite loops
        if (window.location.pathname !== '/login') {
           window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;