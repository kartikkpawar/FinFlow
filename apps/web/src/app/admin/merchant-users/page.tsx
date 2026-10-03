"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { usePlatformMerchantUsers } from "@/features/merchants/api";

export default function AdminMerchantUsersPage() {
  const params = useSearchParams();
  const initialMerchantId = params.get("merchantId") ?? "";
  const [search, setSearch] = useState("");
  const [merchantId, setMerchantId] = useState(initialMerchantId);
  const query = usePlatformMerchantUsers({ page: 1, limit: 50, search: search.trim() || undefined, merchantId: merchantId ? Number(merchantId) : undefined });

  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-brand">Merchant administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Merchant Users</h1><p className="mt-1 text-sm text-muted">Review merchant memberships across the entire platform.</p></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by merchant name..." className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand" /><input value={merchantId} onChange={(event) => setMerchantId(event.target.value.replace(/\D/g, ""))} placeholder="Merchant ID" inputMode="numeric" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm sm:w-40" /></div>
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">{query.isLoading ? <div className="p-10 text-center text-sm text-muted">Loading merchant users...</div> : query.isError ? <div className="p-10 text-center text-sm text-red-600">Unable to load merchant users.</div> : query.data?.items.length === 0 ? <div className="p-10 text-center text-sm text-muted">No merchant users found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">User ID</th><th className="px-5 py-3">Merchant</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3 text-right">Open</th></tr></thead><tbody className="divide-y divide-border">{query.data?.items.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-medium text-ink">#{item.userId}</td><td className="px-5 py-4"><div className="font-semibold text-ink">{item.merchantName}</div><div className="text-xs text-muted">Merchant #{item.merchantId}</div></td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-brand">{item.role}</span></td><td className="px-5 py-4 text-muted">{new Date(item.createdAt).toLocaleDateString()}</td><td className="px-5 py-4 text-right"><Link href={`/admin/merchants/${item.merchantId}`} className="font-semibold text-brand hover:underline">View merchant</Link></td></tr>)}</tbody></table></div>}</div>
  </div>;
}
