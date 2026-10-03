"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, InputNumber, Space, Table, Tag, Typography } from "antd";
import { usePlatformMerchantUsers } from "@/features/merchants/api";

export default function AdminMerchantUsersPage() {
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [merchantId, setMerchantId] = useState<number | undefined>(params.get("merchantId") ? Number(params.get("merchantId")) : undefined);
  const query = usePlatformMerchantUsers({ page: 1, limit: 50, search: search.trim() || undefined, merchantId });
  const columns = [
    { title: "User ID", dataIndex: "userId", render: (value: number) => <Typography.Text strong>#{value}</Typography.Text> },
    { title: "Merchant", key: "merchant", render: (_: unknown, item: { merchantName: string; merchantId: number }) => <><Typography.Text strong>{item.merchantName}</Typography.Text><br /><Typography.Text type="secondary">Merchant #{item.merchantId}</Typography.Text></> },
    { title: "Role", dataIndex: "role", render: (value: string) => <Tag color="blue">{value}</Tag> },
    { title: "Joined", dataIndex: "createdAt", render: (value: string) => new Date(value).toLocaleDateString() },
    { title: "Open", key: "open", align: "right" as const, render: (_: unknown, item: { merchantId: number }) => <Link href={`/admin/merchants/${item.merchantId}`}><Button type="link">View merchant</Button></Link> },
  ];

  return <div className="space-y-6">
    <div><Typography.Text className="text-brand">Merchant administration</Typography.Text><Typography.Title level={2} className="!mb-1 !mt-1">Merchant Users</Typography.Title><Typography.Text type="secondary">Review merchant memberships across the entire platform.</Typography.Text></div>
    <Card><Space wrap className="w-full"><Input.Search value={search} onChange={(event) => setSearch(event.target.value)} allowClear placeholder="Search by merchant name..." className="w-full sm:w-80" /><InputNumber value={merchantId} onChange={(value) => setMerchantId(value ?? undefined)} min={1} placeholder="Merchant ID" className="w-full sm:w-40" /></Space></Card>
    <Card><Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} columns={columns} locale={{ emptyText: query.isError ? "Unable to load merchant users." : "No merchant users found." }} scroll={{ x: 720 }} /></Card>
  </div>;
}
