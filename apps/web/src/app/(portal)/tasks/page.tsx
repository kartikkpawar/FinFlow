export default function TasksPage() {
  return <ComingSoon title="Tasks" description="Task management will connect to the Task Service in the next backend phase." />;
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-border bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-ink">{title}</h1><p className="mt-2 text-sm text-muted">{description}</p></div>;
}
