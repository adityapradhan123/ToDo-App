import { useEffect, useState } from "react";
import Auth from "./Auth";
import Board from "./Board";
import type { User } from "./types";
import { api, refreshCsrfToken } from "./lib/api";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

useEffect(() => {
  let cancelled = false;

  async function checkSession() {
    try {
      await refreshCsrfToken();

      const { data } = await api.get("/auth/me");

      if (!cancelled) {
        setUser(data.user);
      }
    } catch {
      if (!cancelled) {
        setUser(null);
      }
    } finally {
      if (!cancelled) {
        setCheckingSession(false);
      }
    }
  }

  void checkSession();

  return () => {
    cancelled = true;
  };
}, []);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] text-sm text-zinc-400">
        Loading Taskflow...
      </main>
    );
  }

  return user ? (
    <Board user={user} onLogout={() => setUser(null)} />
  ) : (
    <Auth onLogin={setUser} />
  );
}