// src/api/endpoints.js
const Routes = {
  V1Base: "/api/v1",

  AUTH: {
    // Core Auth
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
    ME: "/auth/me", // Matches router.get("/me")

    // OTP / Password Reset Flow
    PASSWORD: {
      FORGOT: "/auth/password/forgot",
      VERIFY_OTP: "/auth/password/verify-otp",
      RESEND_OTP: "/auth/password/resend-otp",
      RESET: "/auth/password/reset",
      SET: "/auth/password/set",
      CHANGE: "/auth/password/change",
    },

    // Social Auth
    SOCIAL: {
      GOOGLE: "/auth/google",
      FACEBOOK: "/auth/facebook",
      LINK: "/auth/social/link",
      UNLINK: "/auth/social/unlink",
      ACCOUNTS: "/auth/social/accounts",
    },
  },

  // Example additional endpoints
  USERS: {
    LIST: "/users",
    DETAIL: (id) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },

  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id) => `/products/${id}`,
  },

  ORDERS: {
    LIST: "/orders",
    DETAIL: (id) => `/orders/${id}`,
  },
};

export default Routes;
