"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Button, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
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
    if (!loading && token && user?.role !== "SUPER_ADMIN")
      router.replace("/dashboard");
  }, [loading, router, token, user]);

  const menuItems = useMemo<MenuProps["items"]>(
    () => navigation.map((item) => ({ key: item.href, label: item.label })),
    [],
  );
  const displayName = user?.name?.trim() || user?.email || "Administrator";

  if (loading || !token || user?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-muted">
        Checking administrator access...
      </div>
    );
  }

  function navigate({ key }: { key: string }) {
    router.push(key);
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <Layout className="min-h-screen bg-slate-50">
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        width={256}
        className="border-r border-border"
      >
        <div className="border-b border-border px-6 py-5">
          <Link
            href="/admin/dashboard"
            className="text-xl font-bold tracking-tight text-ink"
          >
            FinFlow
          </Link>
          <Typography.Text className="mt-1 block text-xs font-medium uppercase tracking-[0.16em] text-brand">
            Administration
          </Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[
            navigation.find(
              (item) =>
                pathname === item.href || pathname.startsWith(`${item.href}/`),
            )?.href ?? "/admin/dashboard",
          ]}
          items={menuItems}
          onClick={navigate}
          className="border-none px-2 py-3"
        />
        <div className="absolute bottom-0 w-full border-t border-border bg-white p-4">
          <Space align="start" className="w-full">
            <Avatar>{displayName.charAt(0).toUpperCase()}</Avatar>
            <div className="min-w-0 flex-1">
              <Typography.Text strong ellipsis className="block">
                {displayName}
              </Typography.Text>
              <Typography.Text
                type="secondary"
                ellipsis
                className="block text-xs"
              >
                {user.email}
              </Typography.Text>
            </div>
          </Space>
          <Button
            type="text"
            block
            className="mt-2 text-left"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </Layout.Sider>
      <Layout>
        <Layout.Header className="flex items-center border-b border-border bg-white px-5 lg:hidden">
          <Space className="w-full justify-between">
            <Link href="/admin/dashboard" className="font-bold text-ink">
              FinFlow Admin
            </Link>
            <Button type="text" onClick={handleLogout}>
              Log out
            </Button>
          </Space>
        </Layout.Header>
        <Layout.Content className="mx-auto w-full max-w-7xl p-5 sm:p-7">
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
