import type { PaymentStatus, RefundStatus } from "./types";

const styles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/10",
  PROCESSING: "bg-blue-50 text-blue-700 ring-blue-600/10",
  SUCCEEDED: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  FAILED: "bg-red-50 text-red-700 ring-red-600/10",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/10",
  EXPIRED: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

export function StatusBadge({ status }: { status: PaymentStatus | RefundStatus | string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${styles[status] ?? styles.PENDING}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
