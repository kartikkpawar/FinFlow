export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Profile, security, merchant configuration and platform settings will be added as those APIs are implemented."
    />
  );
}

function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
