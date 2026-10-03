"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { MerchantStatus, useMerchant, useUpdateMerchant, useUpdateMerchantStatus } from "@/features/merchants/api";

const transitions: Record<MerchantStatus, MerchantStatus[]> = { PENDING: ["ACTIVE", "REJECTED"], ACTIVE: ["SUSPENDED", "INACTIVE"], SUSPENDED: ["ACTIVE", "INACTIVE"], INACTIVE: ["ACTIVE"], REJECTED: [] };

export default function AdminMerchantDetailsPage() {
  const params = useParams<{ merchantId: string }>();
  const merchantId = params.merchantId;
  const query = useMerchant(merchantId);
  const update = useUpdateMerchant(Number(merchantId));
  const updateStatus = useUpdateMerchantStatus(Number(merchantId));
  const merchant = query.data;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", businessName: "", email: "", phone: "" });

  if (query.isLoading) return <div className="p-10 text-sm text-muted">Loading merchant...</div>;
  if (query.isError || !merchant) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load merchant.</div>;

  const available = transitions[merchant.status];

  function beginEdit() {
    setForm({ name: merchant.name, businessName: merchant.businessName, email: merchant.email, phone: merchant.phone });
    setEditing(true);
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Link href="/admin/merchants" className="text-sm font-medium text-brand hover:underline">← Merchants</Link><h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{merchant.businessName}</h1><p className="mt-1 text-sm text-muted">Merchant #{merchant.id}</p></div><div className="flex gap-2"><StatusBadge status={merchant.status} /> <button onClick={beginEdit} className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-ink">Edit</button>{available.map((status) => <button key={status} disabled={updateStatus.isPending} onClick={() => updateStatus.mutate(status)} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{status === "ACTIVE" ? "Activate" : status === "REJECTED" ? "Reject" : status === "SUSPENDED" ? "Suspend" : "Deactivate"}</button>)}</div></div>

    {editing && <form onSubmit={(event) => { event.preventDefault(); update.mutate(form, { onSuccess: () => setEditing(false) }); }} className="grid gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm md:grid-cols-2"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contact name" className="rounded-lg border border-border px-3 py-2.5 text-sm" /><input required value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} placeholder="Business name" className="rounded-lg border border-border px-3 py-2.5 text-sm" /><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" className="rounded-lg border border-border px-3 py-2.5 text-sm" /><input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" className="rounded-lg border border-border px-3 py-2.5 text-sm" /><div className="flex gap-2 md:col-span-2"><button disabled={update.isPending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{update.isPending ? "Saving..." : "Save changes"}</button><button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Cancel</button></div></form>}

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info label="Contact" value={merchant.name} /><Info label="Email" value={merchant.email} /><Info label="Phone" value={merchant.phone} /><Info label="Created" value={new Date(merchant.createdAt).toLocaleDateString()} /></section>

    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm"><h2 className="font-semibold text-ink">Merchant administration</h2><p className="mt-1 text-sm text-muted">Manage users and merchant-specific configuration using the existing merchant APIs.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Link href={`/merchants/${merchant.id}`} className="rounded-xl border border-border p-4 text-sm font-semibold hover:bg-slate-50">Open merchant workspace</Link><Link href={`/admin/merchant-users?merchantId=${merchant.id}`} className="rounded-xl border border-border p-4 text-sm font-semibold hover:bg-slate-50">View merchant users</Link><Link href={`/merchants/${merchant.id}`} className="rounded-xl border border-border p-4 text-sm font-semibold hover:bg-slate-50">Settings & integrations</Link></div></section>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p><p className="mt-2 truncate text-sm font-semibold text-ink">{value}</p></div>; }
function StatusBadge({ status }: { status: MerchantStatus }) { const classes: Record<MerchantStatus, string> = { PENDING: "bg-amber-50 text-amber-700", ACTIVE: "bg-emerald-50 text-emerald-700", SUSPENDED: "bg-orange-50 text-orange-700", INACTIVE: "bg-gray-100 text-gray-600", REJECTED: "bg-red-50 text-red-700" }; return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{status}</span>; }
