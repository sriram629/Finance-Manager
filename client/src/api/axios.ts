import axios from "axios";

// Get the backend URL from your environment variables
const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5050/api" : "/api")).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * This interceptor automatically attaches the JWT token
 * to every request after the user logs in.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && localStorage.getItem("authToken") && !error.config?.url?.startsWith("/auth/")) {
    window.dispatchEvent(new Event("auth:expired"));
  }
  return Promise.reject(error);
});
export default api;
