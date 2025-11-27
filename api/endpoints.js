// src/api/endpoints.js
const Routes = {
  V1Base: "/api/v1",

  AUTH: {
    LOGIN: "/auth/login",
    PROFILE: "/auth/profile",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh-token",
    FORGOT: "/auth/forgot-password",
    RESET: "/auth/reset-password",
  },


  // below are example additional endpoints
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
