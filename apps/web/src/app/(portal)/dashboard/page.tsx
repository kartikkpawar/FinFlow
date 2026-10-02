"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";

const metrics = [
  { label: "Active merchants", value: "—", detail: "Live merchant data" },
  { label: "Payments today", value: "—", detail: "Payment service coming next" },
  { label: "Open tasks", value: "—", detail: "Task service coming next" },
  { label: "Pending reviews", value: "—", detail: "Operational queue" },
];

const quickActions = [
  { title: "Add a merchant", description: "Create and configure a merchant workspace.", href: "/onboarding", icon: "+" },
  { title: "View merchants", description: "Review accounts, status and contact details.", href: "/merchants", icon: "→" },
  { title: "Review payments", description: "Payment operations will appear here next.", href: "/payments", icon: "$" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.email?.split("@")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-ink px-7 py-8 text-white shadow-xl shadow-slate-200/60 sm:px-9 sm:py-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">Operations overview</span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Good to see you, {firstName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Keep an eye on your financial operations from one place. Your live service metrics will appear here as each FinFlow domain comes online.</p>
          </div>
          <Link href="/onboarding" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100">Create workspace <span className="ml-2">→</span></Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between"><p className="text-sm font-medium text-muted">{metric.label}</p><span className="h-2 w-2 rounded-full bg-slate-200 transition group-hover:bg-brand" /></div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-ink">{metric.value}</p>
            <p className="mt-2 text-xs text-muted">{metric.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-5"><div><h2 className="font-semibold text-ink">Quick actions</h2><p className="mt-1 text-xs text-muted">Jump into the workflows you use most.</p></div><span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-muted">Portal</span></div>
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {quickActions.map((action) => <Link key={action.title} href={action.href} className="group p-6 transition hover:bg-slate-50"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-semibold text-brand transition group-hover:bg-brand group-hover:text-white">{action.icon}</div><h3 className="mt-4 text-sm font-semibold text-ink">{action.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{action.description}</p><span className="mt-4 inline-block text-xs font-semibold text-brand">Open →</span></Link>)}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold text-ink">Workspace status</h2><p className="mt-1 text-xs text-muted">Service rollout</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Online</span></div>
          <div className="mt-6 space-y-4">
            {["Authentication", "Merchant management", "Payments", "Tasks"].map((service, index) => <div key={service} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${index < 2 ? "bg-emerald-500" : "bg-slate-300"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-ink">{service}</p><p className="text-xs text-muted">{index < 2 ? "Available" : "Coming next"}</p></div></div>)}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-border bg-slate-50/70 p-6 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">FinFlow workspace</p><h2 className="mt-1 text-lg font-semibold text-ink">Your operational center is ready.</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Merchant management is live today. Payments, tasks and reporting can plug into this dashboard without changing the overall workspace.</p></div><Link href="/merchants" className="shrink-0 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-slate-50">Explore merchants</Link></div></section>
    </div>
  );
}
