"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, Empty, Spin } from "antd";
import { AppShell } from "@/components/app-shell";
import { listPayments } from "@/features/payments/api";
import { listPaymentRefunds } from "@/features/payments/api";
import { formatDate, formatMoney, StatusBadge } from "@/features/payments/payment-status";

export default function RefundsPage() {
  const { data: payments, isLoading } = useQuery({ queryKey: ["refunds", "payments"], queryFn: () => listPayments({ page: 1, limit: 100 }) });
  const { data: refunds = [], isLoading: refundsLoading } = useQuery({
    queryKey: ["refunds", "all", payments?.items.map((p) => p.id)],
    queryFn: async () => {
      const results = await Promise.all((payments?.items ?? []).map(async (payment) => ({ payment, refunds: await listPaymentRefunds(payment.id) })));
      return results.flatMap(({ payment, refunds }) => refunds.map((refund) => ({ refund, payment })));
    },
    enabled: Boolean(payments?.items.length),
  });

  return <AppShell><div className="mx-auto max-w-7xl space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Transactions</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Refunds</h1><p className="mt-2 text-sm text-muted">Review refunds across the current merchant scope.</p></div><Card bordered={false} className="!rounded-2xl !shadow-sm">{isLoading || refundsLoading ? <div className="py-16 text-center"><Spin /></div> : !refunds.length ? <Empty description="No refunds yet" /> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-slate-100 text-xs text-slate-400"><th className="pb-3 font-medium">Refund</th><th className="pb-3 font-medium">Payment</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Created</th></tr></thead><tbody>{refunds.map(({ refund, payment }) => <tr key={refund.id} className="border-b border-slate-50 last:border-0"><td className="py-4"><Link href={`/refunds/${refund.id}`} className="font-semibold text-ink hover:text-brand">Refund #{refund.id}</Link><div className="mt-1 text-xs text-slate-400">{refund.reason ?? "No reason"}</div></td><td className="py-4"><Link href={`/payments/${payment.id}`} className="text-sm font-medium text-brand">{payment.reference}</Link></td><td className="py-4 text-sm font-semibold">{formatMoney(refund.amount, payment.currency)}</td><td className="py-4"><StatusBadge status={refund.status} /></td><td className="py-4 text-sm text-muted">{formatDate(refund.createdAt)}</td></tr>)}</tbody></table></div>}</Card></div></AppShell>;
}
