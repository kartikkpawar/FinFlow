"use client";

import Link from "next/link";
import { Card, Empty, Spin } from "antd";
import { AppShell } from "@/components/app-shell";
import { usePayments } from "@/features/payments/hooks";
import { formatMoney, formatDate, StatusBadge } from "@/features/payments/payment-status";

export default function DashboardPage() {
  const { data, isLoading } = usePayments({ page: 1, limit: 5 });
  const payments = data?.items ?? [];
  const succeeded = payments.filter((payment) => payment.status === "SUCCEEDED");
  const pending = payments.filter((payment) => ["PENDING", "PROCESSING"].includes(payment.status));
  const failed = payments.filter((payment) => payment.status === "FAILED");

  return <AppShell>
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Overview</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Good to see you.</h1><p className="mt-2 text-sm text-muted">Monitor payment activity and keep your financial operations moving.</p></div><Link href="/payments/create" className="rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">Create payment</Link></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Total payments", value: data?.total ?? 0, sub: "Across current merchant scope" }, { label: "Succeeded", value: succeeded.length, sub: "Recent page" }, { label: "In progress", value: pending.length, sub: "Pending or processing" }, { label: "Failed", value: failed.length, sub: "Recent page" }].map((item) => <Card key={item.label} bordered={false} className="!rounded-2xl !shadow-sm"><p className="text-xs font-medium text-muted">{item.label}</p><p className="mt-3 text-3xl font-bold text-ink">{isLoading ? <Spin size="small" /> : item.value}</p><p className="mt-2 text-xs text-slate-400">{item.sub}</p></Card>)}
      </div>

      <Card bordered={false} className="!rounded-2xl !shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-ink">Recent payments</h2><p className="mt-1 text-xs text-muted">Latest activity in your workspace</p></div><Link href="/payments" className="text-sm font-semibold text-brand">View all</Link></div>{isLoading ? <div className="py-12 text-center"><Spin /></div> : payments.length === 0 ? <Empty description="No payments yet" /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-slate-100 text-xs text-slate-400"><th className="pb-3 font-medium">Reference</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Created</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b border-slate-50 last:border-0"><td className="py-4"><Link href={`/payments/${payment.id}`} className="font-semibold text-ink hover:text-brand">{payment.reference}</Link><div className="mt-1 text-xs text-slate-400">#{payment.id}</div></td><td className="py-4 text-sm font-semibold text-ink">{formatMoney(payment.amount, payment.currency)}</td><td className="py-4"><StatusBadge status={payment.status} /></td><td className="py-4 text-sm text-muted">{formatDate(payment.createdAt)}</td></tr>)}</tbody></table></div>}</Card>
    </div>
  </AppShell>;
}
