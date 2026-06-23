import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

const PUBLIC_PATHS = ["/", "/login", "/register", "/auth/callback"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}?`));
}

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    if (isPublicPath(window.location.pathname)) {
      sessionStorage.removeItem("auth-redirect-in-flight");
    }
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!isPublicPath(window.location.pathname)) {
        const redirectTarget = "/login?reason=session-expired";
        if (sessionStorage.getItem("auth-redirect-in-flight") !== redirectTarget) {
          sessionStorage.setItem("auth-redirect-in-flight", redirectTarget);
          window.location.replace(redirectTarget);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
