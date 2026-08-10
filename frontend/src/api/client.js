import axios from "axios";

// Set VITE_API_BASE_URL in frontend/.env if your backend runs on a
// different host/port. Default matches the Express backend's own default
// port (backend/src/config/env.js: PORT=5000).
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token here once auth is decided (JWT / session cookie).
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("taza_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
