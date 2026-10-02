export default function DashboardPage() {
  const metrics = [
    ["Active merchants", "—", "Connect the merchant service to load live data"],
    ["Open tasks", "—", "Task service coming next"],
    ["Payments today", "—", "Payment service coming next"],
    ["Pending reviews", "—", "Operational review queue"],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">A high-level view of your FinFlow operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, description]) => (
          <div key={label} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Workspace overview</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">The portal is wired to the API Gateway. Merchant management is the first live domain, with tasks, payments, reporting and other workflows added incrementally behind the same application shell.</p>
      </div>
    </div>
  );
}
