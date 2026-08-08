import axios from "axios";

// BACKEND TEAM: set VITE_API_BASE_URL in a .env file at the project root,
// e.g. VITE_API_BASE_URL=http://localhost:4000/api
// Every route below should live under this base per the docs/api.md contract.
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

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
