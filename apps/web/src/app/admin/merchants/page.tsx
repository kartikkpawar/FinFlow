"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from "antd";
import { MerchantStatus, useCreateMerchant, useMerchants, useUpdateMerchantStatus } from "@/features/merchants/api";

const statuses: Array<MerchantStatus | "ALL"> = ["ALL", "PENDING", "ACTIVE", "SUSPENDED", "INACTIVE", "REJECTED"];
const transitions: Record<MerchantStatus, MerchantStatus[]> = { PENDING: ["ACTIVE", "REJECTED"], ACTIVE: ["SUSPENDED", "INACTIVE"], SUSPENDED: ["ACTIVE", "INACTIVE"], INACTIVE: ["ACTIVE"], REJECTED: [] };
const statusColors: Record<MerchantStatus, string> = { PENDING: "gold", ACTIVE: "green", SUSPENDED: "orange", INACTIVE: "default", REJECTED: "red" };

type MerchantForm = { name: string; businessName: string; email: string; phone: string };

export default function AdminMerchantsPage() {
  const [form] = Form.useForm<MerchantForm>();
  const [filters, setFilters] = useState({ search: "", status: "ALL" as MerchantStatus | "ALL" });
  const [open, setOpen] = useState(false);
  const query = useMerchants({ page: 1, limit: 50, search: filters.search.trim() || undefined, status: filters.status === "ALL" ? undefined : filters.status });
  const create = useCreateMerchant();

  function submit(values: MerchantForm) {
    create.mutate(values, { onSuccess: () => { form.resetFields(); setOpen(false); } });
  }

  const columns = [
    { title: "Business", key: "business", render: (_: unknown, merchant: MerchantForm & { id: number }) => <><Typography.Text strong>{merchant.businessName}</Typography.Text><br /><Typography.Text type="secondary">{merchant.name}</Typography.Text></> },
    { title: "Contact", key: "contact", render: (_: unknown, merchant: MerchantForm) => <><div>{merchant.email}</div><Typography.Text type="secondary">{merchant.phone}</Typography.Text></> },
    { title: "Status", key: "status", render: (_: unknown, merchant: { status: MerchantStatus }) => <Tag color={statusColors[merchant.status]}>{merchant.status}</Tag> },
    { title: "Created", key: "createdAt", render: (_: unknown, merchant: { createdAt: string }) => new Date(merchant.createdAt).toLocaleDateString() },
    { title: "Actions", key: "actions", align: "right" as const, render: (_: unknown, merchant: MerchantForm & { id: number; status: MerchantStatus }) => <MerchantActions merchant={merchant} /> },
  ];

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Typography.Text className="text-brand">Merchant administration</Typography.Text><Typography.Title level={2} className="!mb-1 !mt-1">Merchants</Typography.Title><Typography.Text type="secondary">Create, review and manage every merchant on the platform.</Typography.Text></div><Button type="primary" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Create merchant"}</Button></div>

    {open && <Card><Form form={form} layout="vertical" onFinish={submit}><div className="grid gap-x-4 md:grid-cols-2"><Form.Item name="name" label="Contact name" rules={[{ required: true }]}><Input placeholder="Contact name" /></Form.Item><Form.Item name="businessName" label="Business name" rules={[{ required: true }]}><Input placeholder="Business name" /></Form.Item><Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input type="email" placeholder="Email" /></Form.Item><Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input type="tel" placeholder="Phone" /></Form.Item></div><Button type="primary" htmlType="submit" loading={create.isPending}>Create merchant</Button></Form></Card>}

    <Card><Space direction="vertical" size="middle" className="w-full"><Space wrap className="w-full"><Input.Search allowClear value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search by business name..." className="w-full sm:w-80" /><Select value={filters.status} onChange={(status) => setFilters((current) => ({ ...current, status }))} options={statuses.map((value) => ({ value, label: value === "ALL" ? "All statuses" : value }))} className="w-full sm:w-48" /></Space><Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} columns={columns} locale={{ emptyText: query.isError ? "Unable to load merchants." : "No merchants found." }} scroll={{ x: 900 }} /></Space></Card>
  </div>;
}

function MerchantActions({ merchant }: { merchant: MerchantForm & { id: number; status: MerchantStatus } }) {
  const updateStatus = useUpdateMerchantStatus(merchant.id);
  const available = transitions[merchant.status];
  const label = (nextStatus: MerchantStatus) => nextStatus === "ACTIVE" ? (merchant.status === "PENDING" ? "Approve" : "Activate") : nextStatus === "REJECTED" ? "Reject" : nextStatus === "SUSPENDED" ? "Suspend" : "Deactivate";
  return <Space wrap><Link href={`/admin/merchants/${merchant.id}`}><Button size="small">View</Button></Link>{available.map((nextStatus) => <Button key={nextStatus} size="small" type="primary" danger={nextStatus === "REJECTED"} loading={updateStatus.isPending} onClick={() => updateStatus.mutate(nextStatus)}>{label(nextStatus)}</Button>)}</Space>;
}
