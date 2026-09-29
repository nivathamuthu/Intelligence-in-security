import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const sessionId = localStorage.getItem("cart_session_id");
  if (sessionId) {
    config.headers["X-Cart-Session"] = sessionId;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/api/auth/login")) {
      if (localStorage.getItem("admin_token")) {
        localStorage.removeItem("admin_token");
        window.dispatchEvent(new Event("admin-unauthorized"));
        const path = window.location.pathname;
        if (path.startsWith("/admin") && path !== "/admin/login") {
          window.location.assign("/admin/login");
        }
      }
    }
    return Promise.reject(error);
  },
);

export default client;
