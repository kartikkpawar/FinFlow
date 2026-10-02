export default function ReportsPage() {
  return <ComingSoon title="Reports" description="Operational and financial reporting will be added after the core domain services are available." />;
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-border bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-ink">{title}</h1><p className="mt-2 text-sm text-muted">{description}</p></div>;
}
