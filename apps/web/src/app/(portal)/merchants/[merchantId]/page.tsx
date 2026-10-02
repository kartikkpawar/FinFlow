"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMerchant } from "@/features/merchants/api";

export default function MerchantDetailPage() {
  const params = useParams<{ merchantId: string }>();
  const query = useMerchant(params.merchantId);

  if (query.isLoading) return <div className="p-8 text-sm text-muted">Loading merchant...</div>;
  if (query.isError || !query.data) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load this merchant.</div>;

  const merchant = query.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/merchants" className="text-sm font-medium text-brand hover:underline">← Back to merchants</Link>

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Merchant #{merchant.id}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{merchant.businessName}</h1>
          <p className="mt-1 text-sm text-muted">{merchant.name}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">{merchant.status}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Contact information">
          <Info label="Email" value={merchant.email} />
          <Info label="Phone" value={merchant.phone} />
        </InfoCard>
        <InfoCard title="Account information">
          <Info label="Status" value={merchant.status} />
          <Info label="Created" value={new Date(merchant.createdAt).toLocaleString()} />
          <Info label="Last modified" value={new Date(merchant.modifiedAt).toLocaleString()} />
        </InfoCard>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Merchant operations</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Merchant memberships, configuration, credentials and lifecycle actions will live here as those backend capabilities are added.</p>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border bg-white p-6 shadow-sm"><h2 className="text-base font-semibold text-ink">{title}</h2><div className="mt-5 space-y-4">{children}</div></section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p><p className="mt-1 text-sm font-medium text-ink">{value}</p></div>;
}
