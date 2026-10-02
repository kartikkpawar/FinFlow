"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { merchantManagementApi } from "@/features/merchants/management";

export default function AcceptInvitationClient({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function accept() {
    if (!token) {
      setMessage("This invitation link is missing its token.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await merchantManagementApi.acceptInvitation(token);
      setSuccess(true);
      setMessage("Invitation accepted. Redirecting to the merchant workspace...");
      window.setTimeout(() => router.replace(`/merchants/${result.merchantId}`), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to accept this invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="text-2xl font-bold text-ink">FinFlow</div>
        <h1 className="mt-8 text-2xl font-bold text-ink">Join merchant workspace</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Accept the invitation to add your authenticated FinFlow account to this merchant.</p>
        {message && <div className={`mt-6 rounded-lg p-3 text-sm ${success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</div>}
        <button disabled={loading || success || !token} onClick={accept} className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Accepting..." : success ? "Accepted" : "Accept invitation"}
        </button>
      </section>
    </main>
  );
}
