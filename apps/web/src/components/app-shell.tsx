"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/features/auth/auth-context";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/merchants", label: "Merchants", icon: "◫" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
  { href: "/payments", label: "Payments", icon: "$" },
  { href: "/reports", label: "Reports", icon: "▥" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useRequireAuth();
  const pathname = usePathname();

  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">
        Loading FinFlow...
      </div>
    );

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200/80 bg-white lg:flex lg:flex-col">
        <div className="flex h-[72px] items-center border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-md shadow-blue-500/20">
              F
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">
              FinFlow
            </span>
          </div>
        </div>
        <div className="px-4 pt-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <nav className="mt-2 space-y-1">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-50 text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"}`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${active ? "bg-white shadow-sm" : "bg-slate-100"}`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-brand">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {user.email}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {user.role.replaceAll("_", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              FinFlow Portal
            </p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              Financial Operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="hidden rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-slate-50 sm:block"
            >
              New workspace
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-brand ring-4 ring-slate-50">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-5 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
