import axios from "axios";
import { useAuthStore } from "../store/authStore";
import Routes from "./endpoints";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://nedyway.com/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
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
      const isProfileCheck = originalRequest.url.includes(Routes.AUTH.PROFILE);
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