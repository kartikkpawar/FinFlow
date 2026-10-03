"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import { MerchantStatus, useCreateMerchant, useMerchants } from "@/features/merchants/api";

const statuses: Array<MerchantStatus | "ALL"> = ["ALL", "PENDING", "ACTIVE", "SUSPENDED", "INACTIVE", "REJECTED"];
const colors: Record<MerchantStatus, string> = { PENDING: "gold", ACTIVE: "green", SUSPENDED: "orange", INACTIVE: "default", REJECTED: "red" };
type MerchantForm = { name: string; businessName: string; email: string; phone: string };

export default function MerchantsPage() {
  const [form] = Form.useForm<MerchantForm>();
  const [filters, setFilters] = useState({ search: "", status: "ALL" as MerchantStatus | "ALL" });
  const [open, setOpen] = useState(false);
  const query = useMerchants({ page: 1, limit: 20, search: filters.search.trim() || undefined, status: filters.status === "ALL" ? undefined : filters.status });
  const create = useCreateMerchant();
  function submit(values: MerchantForm) { create.mutate(values, { onSuccess: () => { form.resetFields(); setOpen(false); } }); }
  const columns = [
    { title: "Business", key: "business", render: (_: unknown, merchant: MerchantForm) => <><Typography.Text strong>{merchant.businessName}</Typography.Text><br /><Typography.Text type="secondary">{merchant.name}</Typography.Text></> },
    { title: "Contact", key: "contact", render: (_: unknown, merchant: MerchantForm) => <><div>{merchant.email}</div><Typography.Text type="secondary">{merchant.phone}</Typography.Text></> },
    { title: "Status", dataIndex: "status", render: (status: MerchantStatus) => <Tag color={colors[status]}>{status}</Tag> },
    { title: "Created", dataIndex: "createdAt", render: (value: string) => new Date(value).toLocaleDateString() },
    { title: "", key: "open", align: "right" as const, render: (_: unknown, merchant: { id: number }) => <Link href={`/merchants/${merchant.id}`}><Button type="link">Manage</Button></Link> },
  ];
  return <div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Typography.Title level={2} className="!mb-1">Merchants</Typography.Title><Typography.Text type="secondary">Manage merchant accounts and lifecycle status.</Typography.Text></div><Button type="primary" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Create merchant"}</Button></div>
    {open && <Card><Form form={form} layout="vertical" onFinish={submit}><div className="grid gap-x-4 md:grid-cols-2"><Form.Item name="name" label="Contact name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="businessName" label="Business name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input type="email" /></Form.Item><Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input type="tel" /></Form.Item></div><Button type="primary" htmlType="submit" loading={create.isPending}>Create merchant</Button></Form></Card>}
    <Card><Space wrap className="w-full"><Input.Search allowClear value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search by business name..." className="w-full sm:w-80" /><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={statuses.map((value) => ({ value, label: value === "ALL" ? "All statuses" : value }))} className="w-full sm:w-48" /></Space><Table className="mt-4" rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} columns={columns} locale={{ emptyText: query.isError ? "Unable to load merchants." : "No merchants found." }} scroll={{ x: 760 }} /></Card>
  </div>;
}
