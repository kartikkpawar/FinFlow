"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/features/auth/auth-context";
import { useCreateMerchant } from "@/features/merchants/api";
import { merchantManagementApi } from "@/features/merchants/management";

const steps = ["Choose", "Workspace", "Ready"];
type Mode = "choose" | "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useRequireAuth();
  const createMerchant = useCreateMerchant();
  const [mode, setMode] = useState<Mode>("choose");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ businessName: "", name: "", email: "", phone: "" });
  const [invitationToken, setInvitationToken] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user) setForm((current) => ({ ...current, email: current.email || user.email }));
  }, [user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">Loading FinFlow...</div>;

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  function selectMode(nextMode: Exclude<Mode, "choose">) {
    setMode(nextMode);
    setStep(1);
    setJoinError(null);
  }

  function submitCreate(event: FormEvent) {
    event.preventDefault();
    createMerchant.mutate(form, { onSuccess: () => setStep(2) });
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    setJoining(true);
    setJoinError(null);
    try {
      const result = await merchantManagementApi.acceptInvitation(invitationToken.trim());
      setStep(2);
      window.setTimeout(() => router.replace(`/merchants/${result.merchantId}`), 500);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "We couldn't accept this invitation. Please check the invitation token and try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-surface">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_45%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-lg shadow-blue-500/20">F</div><span className="text-lg font-bold tracking-tight text-ink">FinFlow</span></div><span className="hidden text-sm text-muted sm:block">Account setup</span></header>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12">
          <div className="mb-10 flex items-center justify-center gap-2 sm:gap-4">{steps.map((label, index) => <div key={label} className="flex items-center gap-2 sm:gap-4"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${index <= step ? "bg-brand text-white" : "border border-border bg-white text-muted"}`}>{index < step ? "✓" : index + 1}</div><span className={`hidden text-sm font-medium sm:block ${index <= step ? "text-ink" : "text-muted"}`}>{label}</span>{index < steps.length - 1 && <div className={`h-px w-8 sm:w-20 ${index < step ? "bg-brand" : "bg-border"}`} />}</div>)}</div>

          {step === 0 && <section className="rounded-3xl border border-border bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10"><div className="mb-8 max-w-xl"><span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand">Welcome to FinFlow</span><h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">How would you like to get started?</h1><p className="mt-3 text-base leading-7 text-muted">Create your own merchant workspace or join an existing workspace using an invitation from your team.</p></div><div className="grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => selectMode("create")} className="group rounded-2xl border border-border bg-slate-50 p-6 text-left transition hover:border-brand hover:bg-blue-50/50"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand shadow-sm">＋</div><h2 className="mt-5 text-lg font-semibold text-ink">Create a workspace</h2><p className="mt-2 text-sm leading-6 text-muted">Start a new merchant workspace. You&apos;ll become its merchant admin.</p><span className="mt-5 inline-flex text-sm font-semibold text-brand">Create workspace →</span></button><button type="button" onClick={() => selectMode("join")} className="group rounded-2xl border border-border bg-slate-50 p-6 text-left transition hover:border-brand hover:bg-blue-50/50"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand shadow-sm">↗</div><h2 className="mt-5 text-lg font-semibold text-ink">Join a workspace</h2><p className="mt-2 text-sm leading-6 text-muted">Use the invitation token sent by your organization to join an existing workspace.</p><span className="mt-5 inline-flex text-sm font-semibold text-brand">Join workspace →</span></button></div></section>}

          {step === 1 && mode === "create" && <form onSubmit={submitCreate} className="rounded-3xl border border-border bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10"><div className="mb-8"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Step 2 of 3</span><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Tell us about your business.</h1><p className="mt-2 text-sm leading-6 text-muted">Creating a workspace automatically makes you its merchant admin.</p></div><div className="grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-ink">Business name</span><input required value={form.businessName} onChange={(event) => update("businessName", event.target.value)} placeholder="Acme Payments" className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-500/10" /></label><label><span className="mb-2 block text-sm font-medium text-ink">Contact name</span><input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your full name" className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-500/10" /></label><label><span className="mb-2 block text-sm font-medium text-ink">Phone</span><input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-500/10" /></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-ink">Business email</span><input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted outline-none" /></label></div>{createMerchant.isError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">We couldn&apos;t create your workspace. Please check the details and try again.</p>}<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep(0)} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-ink hover:bg-gray-50">Back</button><button disabled={createMerchant.isPending} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60">{createMerchant.isPending ? "Creating workspace..." : "Create workspace"}</button></div></form>}

          {step === 1 && mode === "join" && <form onSubmit={submitJoin} className="rounded-3xl border border-border bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10"><div className="mb-8"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Step 2 of 3</span><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Join your workspace.</h1><p className="mt-2 text-sm leading-6 text-muted">Paste the invitation token from the email or invitation link. Your assigned merchant role comes from the invitation.</p></div><label className="block"><span className="mb-2 block text-sm font-medium text-ink">Invitation token</span><textarea required value={invitationToken} onChange={(event) => setInvitationToken(event.target.value)} rows={4} placeholder="Paste your invitation token" className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-blue-500/10" /></label>{joinError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{joinError}</p>}<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={() => setStep(0)} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-ink hover:bg-gray-50">Back</button><button disabled={joining || !invitationToken.trim()} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60">{joining ? "Joining workspace..." : "Join workspace"}</button></div></form>}

          {step === 2 && <section className="rounded-3xl border border-border bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">✓</div><span className="mt-6 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Workspace ready</span><h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">You&apos;re ready to go.</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">Your workspace access is ready. Continue to your FinFlow dashboard.</p><button onClick={() => router.push("/dashboard")} className="mt-8 rounded-xl bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700">Go to dashboard</button></section>}
        </div>
        <p className="pb-2 text-center text-xs text-muted">Secure financial operations, built for teams.</p>
      </div>
    </main>
  );
}
