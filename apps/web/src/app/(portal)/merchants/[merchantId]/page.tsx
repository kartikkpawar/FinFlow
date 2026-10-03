"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, Descriptions, Form, Input, Select, Space, Switch, Table, Tabs, Tag, Typography } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMerchant } from "@/features/merchants/api";
import { MerchantUsersPanel } from "@/features/merchants/merchant-users-panel";
import { merchantManagementApi, useMerchantApiKeys, useMerchantAudit, useMerchantInvitations, useMerchantSettings, useMerchantWebhooks, type MerchantRole } from "@/features/merchants/management";

const roleOptions = ["MERCHANT_USER", "MERCHANT_ADMIN"].map((value) => ({ value, label: value }));
const statusColors: Record<string, string> = { PENDING: "gold", ACTIVE: "green", SUSPENDED: "orange", INACTIVE: "default", REJECTED: "red" };

type MerchantDetail = { id: number; businessName: string; name: string; email: string; phone: string; status: string; createdAt: string; modifiedAt: string };

export default function MerchantDetailPage() {
  const params = useParams<{ merchantId: string }>();
  const id = Number(params.merchantId);
  const merchantQuery = useMerchant(params.merchantId);
  const [tab, setTab] = useState("Overview");
  if (merchantQuery.isLoading) return <Card loading />;
  if (merchantQuery.isError || !merchantQuery.data) return <Card><Typography.Text type="danger">Unable to load this merchant.</Typography.Text></Card>;
  const merchant = merchantQuery.data;
  const items = [
    { key: "Overview", label: "Overview", children: <Overview merchant={merchant} /> },
    { key: "Users", label: "Users", children: <MerchantUsersPanel merchantId={id} /> },
    { key: "Settings", label: "Settings", children: <Settings merchantId={id} /> },
    { key: "Invitations", label: "Invitations", children: <Invitations merchantId={id} /> },
    { key: "API Keys", label: "API Keys", children: <ApiKeys merchantId={id} /> },
    { key: "Webhooks", label: "Webhooks", children: <Webhooks merchantId={id} /> },
    { key: "Audit", label: "Audit", children: <Audit merchantId={id} /> },
  ];
  return <div className="mx-auto max-w-7xl space-y-6"><Link href="/merchants">← Back to merchants</Link><Card><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><Typography.Text type="secondary">Merchant #{merchant.id}</Typography.Text><Typography.Title level={2} className="!mb-1 !mt-1">{merchant.businessName}</Typography.Title><Typography.Text type="secondary">{merchant.name} · {merchant.email}</Typography.Text></div><Tag color={statusColors[merchant.status]}>{merchant.status}</Tag></div><Tabs activeKey={tab} onChange={setTab} items={items} className="mt-5" /></Card></div>;
}

function Overview({ merchant }: { merchant: MerchantDetail }) {
  return <div className="grid gap-6 md:grid-cols-2"><Card title="Contact"><Descriptions column={1} items={[{ label: "Email", children: merchant.email }, { label: "Phone", children: merchant.phone }]} /></Card><Card title="Account"><Descriptions column={1} items={[{ label: "Status", children: <Tag color={statusColors[merchant.status]}>{merchant.status}</Tag> }, { label: "Created", children: new Date(merchant.createdAt).toLocaleString() }, { label: "Modified", children: new Date(merchant.modifiedAt).toLocaleString() }]} /></Card></div>;
}

function Settings({ merchantId }: { merchantId: number }) {
  const query = useMerchantSettings(merchantId);
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => merchantManagementApi.updateSettings(merchantId, data), onSuccess: () => client.invalidateQueries({ queryKey: ["merchant-settings", merchantId] }) });
  if (query.isLoading) return <Card loading />;
  if (!query.data) return null;
  return <Card title="Merchant settings"><Form layout="vertical" initialValues={query.data} onFinish={(values) => mutation.mutate(values)}><div className="grid gap-x-4 md:grid-cols-3"><Form.Item name="timezone" label="Timezone" rules={[{ required: true, message: "Please enter the timezone." }]}><Input /></Form.Item><Form.Item name="currency" label="Currency" rules={[{ required: true, message: "Please enter the currency." }]}><Input /></Form.Item><Form.Item name="notificationsEnabled" label="Notifications" valuePropName="checked"><Switch checkedChildren="Enabled" unCheckedChildren="Disabled" /></Form.Item></div><Button type="primary" htmlType="submit" loading={mutation.isPending}>Save settings</Button></Form></Card>;
}

function Invitations({ merchantId }: { merchantId: number }) {
  const query = useMerchantInvitations(merchantId); const [form] = Form.useForm<{ email: string; role: MerchantRole }>();
  const mutation = useMutation({ mutationFn: (values: { email: string; role: MerchantRole }) => merchantManagementApi.invite(merchantId, values), onSuccess: (result) => { form.resetFields(); void navigator.clipboard?.writeText(result.token); void query.refetch(); } });
  const revoke = useMutation({ mutationFn: (id: number) => merchantManagementApi.revokeInvitation(merchantId, id), onSuccess: () => query.refetch() });
  const columns = [{ title: "Email", dataIndex: "email" }, { title: "Role", dataIndex: "role" }, { title: "Status", dataIndex: "status", render: (value: string) => <Tag>{value}</Tag> }, { title: "Expires", dataIndex: "expiresAt", render: (value: string) => new Date(value).toLocaleDateString() }, { title: "", key: "revoke", align: "right" as const, render: (_: unknown, row: { id: number; status: string }) => row.status === "PENDING" ? <Button danger type="link" onClick={() => revoke.mutate(row.id)}>Revoke</Button> : null }];
  return <Card title="Invitations"><Form form={form} layout="inline" onFinish={(values) => mutation.mutate(values)} className="mb-5"><Form.Item name="email" rules={[{ required: true, message: "Please enter the recipient's email address." }, { type: "email", message: "Please enter a valid email address." }]}><Input placeholder="Email" /></Form.Item><Form.Item name="role" initialValue="MERCHANT_USER" rules={[{ required: true, message: "Please select a merchant role." }]}><Select options={roleOptions} className="w-44" /></Form.Item><Form.Item><Button type="primary" htmlType="submit" loading={mutation.isPending}>Invite</Button></Form.Item></Form><Table rowKey="id" dataSource={query.data ?? []} columns={columns} loading={query.isLoading} /></Card>;
}

function ApiKeys({ merchantId }: { merchantId: number }) {
  const query = useMerchantApiKeys(merchantId); const [form] = Form.useForm<{ name: string }>(); const [secret, setSecret] = useState<string | null>(null);
  const create = useMutation({ mutationFn: (values: { name: string }) => merchantManagementApi.createApiKey(merchantId, values), onSuccess: (result) => { setSecret(result.secret); form.resetFields(); void query.refetch(); } });
  const revoke = useMutation({ mutationFn: (id: number) => merchantManagementApi.revokeApiKey(merchantId, id), onSuccess: () => query.refetch() });
  const columns = [{ title: "Name", dataIndex: "name" }, { title: "Prefix", dataIndex: "prefix", render: (value: string) => <Typography.Text code>{value}…</Typography.Text> }, { title: "Created", dataIndex: "createdAt", render: (value: string) => new Date(value).toLocaleDateString() }, { title: "", key: "revoke", align: "right" as const, render: (_: unknown, row: { id: number; revokedAt: string | null }) => !row.revokedAt ? <Button danger type="link" onClick={() => revoke.mutate(row.id)}>Revoke</Button> : null }];
  return <Card title="API keys"><Form form={form} layout="inline" onFinish={(values) => create.mutate(values)} className="mb-4"><Form.Item name="name" rules={[{ required: true, message: "Please enter a name for the API key." }, { min: 2, message: "API key name must be at least 2 characters." }]}><Input placeholder="Key name" /></Form.Item><Form.Item><Button type="primary" htmlType="submit" loading={create.isPending}>Create key</Button></Form.Item></Form>{secret && <Alert className="mb-4" type="warning" showIcon message="Copy this secret now" description={<Typography.Text code copyable>{secret}</Typography.Text>} />}<Table rowKey="id" dataSource={query.data ?? []} columns={columns} loading={query.isLoading} /></Card>;
}

function Webhooks({ merchantId }: { merchantId: number }) {
  const query = useMerchantWebhooks(merchantId); const [form] = Form.useForm<{ url: string }>(); const [secret, setSecret] = useState<string | null>(null);
  const create = useMutation({ mutationFn: (values: { url: string }) => merchantManagementApi.createWebhook(merchantId, { url: values.url, events: ["payment.created", "payment.failed"] }), onSuccess: (result) => { setSecret(result.secret); form.resetFields(); void query.refetch(); } });
  const remove = useMutation({ mutationFn: (id: number) => merchantManagementApi.deleteWebhook(merchantId, id), onSuccess: () => query.refetch() });
  const toggle = useMutation({ mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => merchantManagementApi.updateWebhook(merchantId, id, { enabled }), onSuccess: () => query.refetch() });
  const columns = [{ title: "URL", dataIndex: "url", ellipsis: true }, { title: "Events", dataIndex: "events", render: (events: string[]) => events.join(", ") }, { title: "Enabled", dataIndex: "enabled", render: (enabled: boolean, row: { id: number }) => <Switch checked={enabled} onChange={(value) => toggle.mutate({ id: row.id, enabled: value })} /> }, { title: "", key: "delete", align: "right" as const, render: (_: unknown, row: { id: number }) => <Button danger type="link" onClick={() => remove.mutate(row.id)}>Delete</Button> }];
  return <Card title="Webhooks"><Form form={form} layout="inline" onFinish={(values) => create.mutate(values)} className="mb-4"><Form.Item name="url" rules={[{ required: true, message: "Please enter the webhook URL." }, { type: "url", message: "Please enter a valid URL, including https://." }]}><Input placeholder="https://example.com/webhook" className="w-full sm:w-96" /></Form.Item><Form.Item><Button type="primary" htmlType="submit" loading={create.isPending}>Add webhook</Button></Form.Item></Form>{secret && <Alert className="mb-4" type="warning" showIcon message="Webhook secret (shown once)" description={<Typography.Text code copyable>{secret}</Typography.Text>} />}<Table rowKey="id" dataSource={query.data ?? []} columns={columns} loading={query.isLoading} /></Card>;
}

function Audit({ merchantId }: { merchantId: number }) {
  const query = useMerchantAudit(merchantId); const columns = [{ title: "Action", dataIndex: "action" }, { title: "Resource", key: "resource", render: (_: unknown, row: { resourceType: string; resourceId?: number | null }) => `${row.resourceType}${row.resourceId ? ` #${row.resourceId}` : ""}` }, { title: "Actor", dataIndex: "actorUserId" }, { title: "Time", dataIndex: "createdAt", render: (value: string) => new Date(value).toLocaleString() }];
  return <Card title="Audit log"><Table rowKey="id" dataSource={query.data?.items ?? []} columns={columns} loading={query.isLoading} /></Card>;
}
