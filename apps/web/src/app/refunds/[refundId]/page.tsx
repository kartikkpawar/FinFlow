"use client";

import Link from "next/link";
import { use } from "react";
import { Card, Descriptions, Empty, Spin } from "antd";
import { AppShell } from "@/components/app-shell";
import { getRefund } from "@/features/payments/api";
import { usePayment } from "@/features/payments/hooks";
import { useQuery } from "@tanstack/react-query";
import { formatDate, formatMoney, StatusBadge } from "@/features/payments/payment-status";

export default function RefundDetailPage({ params }: { params: Promise<{ refundId: string }> }) {
  const { refundId } = use(params);
  const id = Number(refundId);
  const { data: refund, isLoading } = useQuery({ queryKey: ["refund", id], queryFn: () => getRefund(id), enabled: Number.isInteger(id) && id > 0 });
  const { data: payment } = usePayment(refund?.paymentId ?? 0);

  if (isLoading) return <AppShell><div className="flex min-h-[50vh] items-center justify-center"><Spin /></div></AppShell>;
  if (!refund) return <AppShell><Empty description="Refund not found" /></AppShell>;

  return <AppShell><div className="mx-auto max-w-4xl space-y-6"><div><Link href={`/payments/${refund.paymentId}`} className="text-sm font-medium text-brand">← Payment #{refund.paymentId}</Link><div className="mt-3 flex items-center gap-3"><h1 className="text-3xl font-bold tracking-tight text-ink">Refund #{refund.id}</h1><StatusBadge status={refund.status} /></div><p className="mt-2 text-sm text-muted">Created {formatDate(refund.createdAt)}</p></div><Card bordered={false} className="!rounded-2xl !shadow-sm"><Descriptions column={{ xs: 1, sm: 2 }} bordered items={[{ key: "amount", label: "Amount", children: formatMoney(refund.amount, payment?.currency ?? "INR") }, { key: "payment", label: "Payment", children: <Link href={`/payments/${refund.paymentId}`} className="text-brand">{payment?.reference ?? `#${refund.paymentId}`}</Link> }, { key: "reason", label: "Reason", children: refund.reason ?? "—" }, { key: "provider", label: "Provider refund ID", children: refund.providerRefundId ?? "—" }, { key: "created", label: "Created", children: formatDate(refund.createdAt) }, { key: "updated", label: "Updated", children: formatDate(refund.updatedAt) }]} /></Card></div></AppShell>;
}
