"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";

const navigation = [
  { label: "Overview", href: "/admin/dashboard" },
  { label: "Merchants", href: "/admin/merchants" },
  { label: "Merchant Users", href: "/admin/merchant-users" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, token, logout } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
      return;
    }

    if (!loading && token && user?.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [loading, router, token, user]);

  if (loading || !token || user?.role !== "SUPER_ADMIN") {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-muted">Checking administrator access...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-5">
          <Link href="/admin/dashboard" className="text-xl font-bold tracking-tight">FinFlow</Link>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-brand">Administration</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-50 text-brand" : "text-muted hover:bg-slate-50 hover:text-ink"}`}>{item.label}</Link>;
          })}
        </nav>
        <div className="border-t border-border p-4">
          <p className="truncate px-3 text-xs text-muted">{user.email}</p>
          <button onClick={() => { logout(); router.replace("/login"); }} className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-muted hover:bg-slate-50 hover:text-ink">Log out</button>
        </div>
      </aside>
      <main className="min-h-screen lg:pl-64">
        <div className="border-b border-border bg-white px-5 py-4 lg:hidden">
          <div className="flex items-center justify-between"><Link href="/admin/dashboard" className="font-bold">FinFlow Admin</Link><button onClick={() => { logout(); router.replace("/login"); }} className="text-sm text-muted">Log out</button></div>
        </div>
        <div className="mx-auto max-w-7xl p-5 sm:p-7">{children}</div>
      </main>
    </div>
  );
}
