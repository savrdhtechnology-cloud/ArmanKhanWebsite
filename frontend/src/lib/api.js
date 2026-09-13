import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: false,
});

// Attach token from localStorage if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ahs_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const formatError = (detail) => {
  if (!detail) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
};

export default api;
