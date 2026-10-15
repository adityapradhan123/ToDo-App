import { useState } from "react";
import { CheckSquare, LoaderCircle } from "lucide-react";
import { api, refreshCsrfToken } from "./lib/api";
import { loginSchema, registerSchema } from "./schemas";
import type { User } from "./types";

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const schema = mode === "login" ? loginSchema : registerSchema;
    const input = mode === "login"
      ? { email, password }
      : { name, email, password };

    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

    setLoading(true);

    try {
         const { data } = await api.post(
  `/auth/${mode}`,
  parsed.data
);

await refreshCsrfToken();
onLogin(data.user);

    } catch (err: any) {
      setError(
        err.response?.data?.message || "Could not connect to the server"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="rounded-xl bg-indigo-500 p-3">
            <CheckSquare size={25} className="text-white" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">
            Taskflow
          </span>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#111114] p-7 shadow-2xl sm:p-9">
          <h1 className="text-2xl font-semibold text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === "login"
              ? "Sign in to continue to your workspace."
              : "Organize your work, one task at a time."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {mode === "register" && (
              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Full name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-white outline-none transition focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 font-medium text-white transition hover:bg-indigo-400 disabled:opacity-60"
            >
              {loading && <LoaderCircle size={18} className="animate-spin" />}
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Your workspace. Your focus.
        </p>
      </div>
    </main>
  );
}