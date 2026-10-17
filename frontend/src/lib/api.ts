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

let csrfRefreshPromise: Promise<string> | null = null;

export function refreshCsrfToken(): Promise<string> {
  if (!csrfRefreshPromise) {
    csrfRefreshPromise = api
      .get<{ token: string }>("/csrf-token")
      .then(({ data }) => {
        api.defaults.headers.common["x-csrf-token"] = data.token;
        return data.token;
      })
      .finally(() => {
        csrfRefreshPromise = null;
      });
  }

  return csrfRefreshPromise;
}
