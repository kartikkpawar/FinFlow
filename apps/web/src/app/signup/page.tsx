"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type RegisterResponse = {
  email_verify: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        },
      });

      router.replace(`/verify-email?token=${encodeURIComponent(result.email_verify)}`);
    } catch {
      setError("We couldn't create your account. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-2">
        <section className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-2xl font-bold">FinFlow</div>
            <p className="mt-6 max-w-sm text-3xl font-semibold leading-tight">Create your financial operations workspace.</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Start with your account, verify your email, then create your first merchant workspace.</p>
          </div>
          <p className="text-xs text-slate-400">Secure access through the FinFlow API Gateway.</p>
        </section>

        <section className="p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-medium text-brand">Get started</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Create your FinFlow account</h1>
            <p className="mt-2 text-sm text-muted">Create an account to set up your first workspace.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Full name</span>
                <input required minLength={2} value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
                <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Phone</span>
                <input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" autoComplete="tel" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Password</span>
                  <input required minLength={8} type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Confirm password</span>
                  <input required minLength={8} type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" className="w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>

              {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button disabled={submitting} className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
