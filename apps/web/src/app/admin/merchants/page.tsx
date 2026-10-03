"use client";

import Link from "next/link";
import { useState } from "react";
import { MerchantStatus, useCreateMerchant, useMerchants, useUpdateMerchantStatus } from "@/features/merchants/api";

const statuses: Array<MerchantStatus | "ALL"> = ["ALL", "PENDING", "ACTIVE", "SUSPENDED", "INACTIVE", "REJECTED"];
const transitions: Record<MerchantStatus, MerchantStatus[]> = { PENDING: ["ACTIVE", "REJECTED"], ACTIVE: ["SUSPENDED", "INACTIVE"], SUSPENDED: ["ACTIVE", "INACTIVE"], INACTIVE: ["ACTIVE"], REJECTED: [] };

export default function AdminMerchantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MerchantStatus | "ALL">("ALL");
  const [open, setOpen] = useState(false);
  const query = useMerchants({ page: 1, limit: 50, search: search.trim() || undefined, status: status === "ALL" ? undefined : status });
  const create = useCreateMerchant();
  const [form, setForm] = useState({ name: "", businessName: "", email: "", phone: "" });

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-brand">Merchant administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Merchants</h1><p className="mt-1 text-sm text-muted">Create, review and manage every merchant on the platform.</p></div><button onClick={() => setOpen((value) => !value)} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">{open ? "Close" : "Create merchant"}</button></div>

    {open && <form onSubmit={(event) => { event.preventDefault(); create.mutate(form, { onSuccess: () => { setForm({ name: "", businessName: "", email: "", phone: "" }); setOpen(false); } }); }} className="grid gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm md:grid-cols-2"><input required placeholder="Contact name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg border border-border px-3 py-2.5 text-sm" /><input required placeholder="Business name" value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} className="rounded-lg border border-border px-3 py-2.5 text-sm" /><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-lg border border-border px-3 py-2.5 text-sm" /><input required type="tel" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="rounded-lg border border-border px-3 py-2.5 text-sm" /><button disabled={create.isPending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2">{create.isPending ? "Creating..." : "Create merchant"}</button></form>}

    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by business name..." className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brand" /><select value={status} onChange={(event) => setStatus(event.target.value as MerchantStatus | "ALL")} className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm">{statuses.map((value) => <option key={value} value={value}>{value === "ALL" ? "All statuses" : value}</option>)}</select></div>

    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">{query.isLoading ? <div className="p-10 text-center text-sm text-muted">Loading merchants...</div> : query.isError ? <div className="p-10 text-center text-sm text-red-600">Unable to load merchants.</div> : query.data?.items.length === 0 ? <div className="p-10 text-center text-sm text-muted">No merchants found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3">Business</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{query.data?.items.map((merchant) => <MerchantRow key={merchant.id} merchant={merchant} />)}</tbody></table></div>}</div>
  </div>;
}

function MerchantRow({ merchant }: { merchant: { id: number; name: string; businessName: string; email: string; phone: string; status: MerchantStatus; createdAt: string } }) {
  const updateStatus = useUpdateMerchantStatus(merchant.id);
  const available = transitions[merchant.status];

  return <tr className="hover:bg-slate-50"><td className="px-5 py-4"><div className="font-semibold text-ink">{merchant.businessName}</div><div className="text-xs text-muted">{merchant.name}</div></td><td className="px-5 py-4"><div>{merchant.email}</div><div className="text-xs text-muted">{merchant.phone}</div></td><td className="px-5 py-4"><StatusBadge status={merchant.status} /></td><td className="px-5 py-4 text-muted">{new Date(merchant.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><Link href={`/admin/merchants/${merchant.id}`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-white">View</Link>{available.map((nextStatus) => <button key={nextStatus} disabled={updateStatus.isPending} onClick={() => updateStatus.mutate(nextStatus)} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{nextStatus === "ACTIVE" ? (merchant.status === "PENDING" ? "Approve" : "Activate") : nextStatus === "REJECTED" ? "Reject" : nextStatus === "SUSPENDED" ? "Suspend" : "Deactivate"}</button>)}</div></td></tr>;
}

function StatusBadge({ status }: { status: MerchantStatus }) { const classes: Record<MerchantStatus, string> = { PENDING: "bg-amber-50 text-amber-700", ACTIVE: "bg-emerald-50 text-emerald-700", SUSPENDED: "bg-orange-50 text-orange-700", INACTIVE: "bg-gray-100 text-gray-600", REJECTED: "bg-red-50 text-red-700" }; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{status}</span>; }
