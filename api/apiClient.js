import axios from "axios";
import { useAuthStore } from "../store/authStore";
import Routes from "./endpoints";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  withCredentials: true,
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

// Response interceptor to handle token refresh

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
        const isProfileCheck = originalRequest.url.includes(Routes.AUTH.PROFILE);
        if (isProfileCheck) {
            return Promise.reject(error);
        }
        originalRequest._retry = true;

        try {
            const { refreshTokens } = useAuthStore.getState();
            // Note: The `refreshTokens` function relies on the HTTP-only refresh token cookie.
            const result = await refreshTokens();

            if (result.success) {
                const { accessToken } = useAuthStore.getState();
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            }
        } catch (refreshError) {
            console.error("Token refresh failed, logging out:", refreshError);
            const { logout } = useAuthStore.getState();
            await logout();
            window.location.href = '/login';
        }
    }

    // Reject all other errors (non-401, non-retry 401 on profile check, or failed token refresh).
    return Promise.reject(error);
  }
);

export default apiClient;
