"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Empty, Input, Select, Spin } from "antd";
import { usePayments } from "@/features/payments/hooks";
import {
  formatMoney,
  formatDate,
  StatusBadge,
} from "@/features/payments/payment-status";
import type { PaymentStatus } from "@/features/payments/types";

export default function PaymentsPage() {
  const [status, setStatus] = useState<PaymentStatus | undefined>();
  const [reference, setReference] = useState("");
  const { data, isLoading, isFetching } = usePayments({
    page: 1,
    limit: 50,
    status,
    reference: reference || undefined,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Transactions
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Payments
          </h1>
          <p className="mt-2 text-sm text-muted">
            Search, inspect and manage payments.
          </p>
        </div>
        <Link
          href="/payments/create"
          className="rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
        >
          Create payment
        </Link>
      </div>
      <Card bordered={false} className="!rounded-2xl !shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            size="large"
            placeholder="Search by reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            allowClear
          />
          <Select
            size="large"
            placeholder="All statuses"
            value={status}
            onChange={setStatus}
            allowClear
            options={[
              "PENDING",
              "PROCESSING",
              "SUCCEEDED",
              "FAILED",
              "CANCELLED",
              "EXPIRED",
            ].map((value) => ({ value, label: value }))}
          />
        </div>
      </Card>
      <Card bordered={false} className="!rounded-2xl !shadow-sm">
        <div className="mb-4 flex justify-between">
          <span className="text-sm font-medium text-muted">
            {data?.total ?? 0} payments
          </span>
          {isFetching && <Spin size="small" />}
        </div>
        {isLoading ? (
          <div className="py-16 text-center">
            <Spin />
          </div>
        ) : !data?.items.length ? (
          <Empty description="No payments match your filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="pb-3 font-medium">Payment</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4">
                      <Link
                        href={`/payments/${payment.id}`}
                        className="font-semibold text-ink hover:text-brand"
                      >
                        {payment.reference}
                      </Link>
                      <div className="mt-1 text-xs text-slate-400">
                        #{payment.id}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted">
                      {payment.customerId ?? "—"}
                    </td>
                    <td className="py-4 text-sm font-semibold text-ink">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="py-4 text-sm text-muted">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
