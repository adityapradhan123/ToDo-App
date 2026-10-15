import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function refreshCsrfToken() {
  const { data } = await api.get<{ token: string }>("/csrf-token");

  api.defaults.headers.common["x-csrf-token"] = data.token;
}