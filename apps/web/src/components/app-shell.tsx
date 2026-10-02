"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/features/auth/auth-context";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/merchants", label: "Merchants" },
  { href: "/tasks", label: "Tasks" },
  { href: "/payments", label: "Payments" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useRequireAuth();
  const pathname = usePathname();

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading FinFlow...</div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-xl font-bold tracking-tight text-ink">FinFlow</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-blue-50 text-brand" : "text-gray-600 hover:bg-gray-50 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 truncate text-xs text-muted">{user.email}</div>
          <button onClick={logout} className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-gray-50">
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white/95 px-6 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">FinFlow Portal</p>
            <p className="text-sm font-semibold text-ink">Financial Operations</p>
          </div>
          <div className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">{user.role}</div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
