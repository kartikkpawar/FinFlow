"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { getAuthenticatedRoute } from "@/features/auth/auth-routing";

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z" />
        <circle cx="12" cy="12" r="2.75" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 5.1A10.5 10.5 0 0 1 12 4.88c6.25 0 9.75 7.12 9.75 7.12a17.6 17.6 0 0 1-3.18 3.94M6.61 6.62C3.75 8.32 2.25 12 2.25 12s3.5 7.12 9.75 7.12 9.75-6 9.75-6-3.5-6-9.75-6S2.25 12 2.25 12Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, token, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setCheckingSession(false);
      return;
    }

    let active = true;

    async function redirectAuthenticatedUser() {
      try {
        const route = await getAuthenticatedRoute();
        if (active) router.replace(route);
      } catch {
        if (active) setCheckingSession(false);
      }
    }

    redirectAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [authLoading, router, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(await getAuthenticatedRoute());
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || (token && checkingSession)) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white">Checking your FinFlow session...</div>;
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
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" inputMode="email" required autoComplete="email" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Password</span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-border px-3 py-2.5 pr-11 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-100"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </label>

              <button disabled={submitting} className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              New to FinFlow? <Link href="/signup" className="font-semibold text-brand hover:underline">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
