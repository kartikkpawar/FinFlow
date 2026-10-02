"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-2">
        <section className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-2xl font-bold">FinFlow</div>
            <p className="mt-6 max-w-sm text-3xl font-semibold leading-tight">One workspace for your financial operations.</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Manage merchants, tasks, payments and operational reporting from a single portal.</p>
          </div>
          <p className="text-xs text-slate-400">Secure access through the FinFlow API Gateway.</p>
        </section>

        <section className="p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-medium text-brand">Welcome back</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Sign in to FinFlow</h1>
            <p className="mt-2 text-sm text-muted">Use your FinFlow account credentials.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Password</span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
              </label>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <button disabled={submitting} className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
