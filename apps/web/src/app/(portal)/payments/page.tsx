export default function PaymentsPage() {
  return <ComingSoon title="Payments" description="Payment operations will connect to the Payment Service when that domain is implemented." />;
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-border bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-ink">{title}</h1><p className="mt-2 text-sm text-muted">{description}</p></div>;
}
