"use client";

import Link from "next/link";
import { useState } from "react";
import { MerchantStatus, useMerchants } from "@/features/merchants/api";

const statuses: Array<MerchantStatus | "ALL"> = ["ALL", "PENDING", "ACTIVE", "SUSPENDED", "INACTIVE", "REJECTED"];

export default function MerchantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MerchantStatus | "ALL">("ALL");
  const query = useMerchants({ page: 1, limit: 20, search: search.trim() || undefined, status: status === "ALL" ? undefined : status });

  const merchants = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Merchants</h1>
          <p className="mt-1 text-sm text-muted">Manage merchant accounts and lifecycle status.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by business name..." className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100" />
        <select value={status} onChange={(event) => setStatus(event.target.value as MerchantStatus | "ALL")} className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100">
          {statuses.map((value) => <option key={value} value={value}>{value === "ALL" ? "All statuses" : value}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {query.isLoading ? (
          <div className="p-8 text-center text-sm text-muted">Loading merchants...</div>
        ) : query.isError ? (
          <div className="p-8 text-center text-sm text-red-600">Unable to load merchants. Check that the API Gateway and Merchant Service are running.</div>
        ) : merchants.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">No merchants found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-gray-50 text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-5 py-3 font-medium">Business</th><th className="px-5 py-3 font-medium">Contact</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Created</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4"><div className="font-semibold text-ink">{merchant.businessName}</div><div className="text-xs text-muted">{merchant.name}</div></td>
                    <td className="px-5 py-4"><div>{merchant.email}</div><div className="text-xs text-muted">{merchant.phone}</div></td>
                    <td className="px-5 py-4"><StatusBadge status={merchant.status} /></td>
                    <td className="px-5 py-4 text-muted">{new Date(merchant.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right"><Link href={`/merchants/${merchant.id}`} className="font-medium text-brand hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MerchantStatus }) {
  const classes: Record<MerchantStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    ACTIVE: "bg-emerald-50 text-emerald-700",
    SUSPENDED: "bg-orange-50 text-orange-700",
    INACTIVE: "bg-gray-100 text-gray-600",
    REJECTED: "bg-red-50 text-red-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{status}</span>;
}
