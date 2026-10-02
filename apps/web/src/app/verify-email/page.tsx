"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("The verification link is missing or invalid.");
      return;
    }

    let active = true;

    apiFetch<{ message?: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((result) => {
        if (!active) return;
        setStatus("success");
        setMessage(result.message ?? "Your email has been verified successfully.");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setMessage("We couldn't verify your email. The link may be invalid or expired.");
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl sm:p-10">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl ${status === "success" ? "bg-emerald-50 text-emerald-600" : status === "error" ? "bg-red-50 text-red-600" : "bg-blue-50 text-brand"}`}>
          {status === "success" ? "✓" : status === "error" ? "!" : "…"}
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink">
          {status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Verify your email"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">{message}</p>

        {status === "success" && (
          <button onClick={() => router.replace("/login")} className="mt-8 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            Continue to login
          </button>
        )}

        {status === "error" && (
          <Link href="/signup" className="mt-8 inline-block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            Back to sign up
          </Link>
        )}
      </section>
    </main>
  );
}
