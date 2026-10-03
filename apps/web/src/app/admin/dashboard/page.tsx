"use client";

import Link from "next/link";
import { useMerchants } from "@/features/merchants/api";

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><p className="text-sm font-medium text-muted">{label}</p><p className="mt-4 text-3xl font-bold tracking-tight text-ink">{value}</p><p className="mt-2 text-xs text-muted">{detail}</p></div>;
}

export default function SuperAdminDashboardPage() {
  const all = useMerchants({ page: 1, limit: 1 });
  const active = useMerchants({ page: 1, limit: 1, status: "ACTIVE" });
  const pending = useMerchants({ page: 1, limit: 1, status: "PENDING" });
  const suspended = useMerchants({ page: 1, limit: 1, status: "SUSPENDED" });

  const total = all.data?.total ?? 0;
  const activeCount = active.data?.total ?? 0;
  const pendingCount = pending.data?.total ?? 0;
  const suspendedCount = suspended.data?.total ?? 0;
  const loading = all.isLoading || active.isLoading || pending.isLoading || suspended.isLoading;

  return <div className="space-y-7">
    <section className="relative overflow-hidden rounded-3xl bg-ink px-7 py-8 text-white shadow-xl sm:px-9 sm:py-10">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div><span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">Platform administration</span><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Super Admin Dashboard</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Manage FinFlow merchants and merchant memberships from one platform-wide workspace.</p></div>
        <Link href="/admin/merchants" className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-slate-100">Manage merchants →</Link>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total merchants" value={loading ? 0 : total} detail="All platform merchants" />
      <Metric label="Active merchants" value={loading ? 0 : activeCount} detail="Currently active" />
      <Metric label="Pending approval" value={loading ? 0 : pendingCount} detail="Awaiting review" />
      <Metric label="Suspended" value={loading ? 0 : suspendedCount} detail="Currently suspended" />
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm"><h2 className="font-semibold text-ink">Merchant operations</h2><p className="mt-1 text-sm text-muted">Manage the complete merchant lifecycle.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href="/admin/merchants" className="rounded-xl border border-border p-4 hover:bg-slate-50"><p className="text-sm font-semibold text-ink">Merchant directory</p><p className="mt-1 text-xs text-muted">Search, filter and update merchants.</p></Link><Link href="/admin/merchant-users" className="rounded-xl border border-border p-4 hover:bg-slate-50"><p className="text-sm font-semibold text-ink">Merchant users</p><p className="mt-1 text-xs text-muted">Review memberships across merchants.</p></Link></div></div>
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm"><h2 className="font-semibold text-ink">Lifecycle controls</h2><p className="mt-1 text-sm text-muted">Supported merchant status transitions.</p><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted">Pending</span><span className="font-medium text-ink">Approve or reject</span></div><div className="flex justify-between"><span className="text-muted">Active</span><span className="font-medium text-ink">Suspend or deactivate</span></div><div className="flex justify-between"><span className="text-muted">Suspended</span><span className="font-medium text-ink">Reactivate or deactivate</span></div></div></div>
    </section>
  </div>;
}
