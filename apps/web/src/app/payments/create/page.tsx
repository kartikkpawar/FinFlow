"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, InputNumber, Select, Typography } from "antd";
import { toast } from "react-toastify";
import { AppShell } from "@/components/app-shell";
import { useCreatePayment } from "@/features/payments/hooks";

export default function CreatePaymentPage() {
  const router = useRouter();
  const mutation = useCreatePayment();
  const [metadata, setMetadata] = useState("{}");

  async function submit(values: { amount: number; currency: string; reference: string; description?: string; customerId?: string }) {
    let parsedMetadata: Record<string, unknown> = {};
    try { parsedMetadata = metadata.trim() ? JSON.parse(metadata) : {}; } catch { toast.error("Metadata must be valid JSON"); return; }
    if (!parsedMetadata || Array.isArray(parsedMetadata) || typeof parsedMetadata !== "object") { toast.error("Metadata must be a JSON object"); return; }
    try {
      const payment = await mutation.mutateAsync({ ...values, metadata: parsedMetadata });
      toast.success("Payment created");
      router.push(`/payments/${payment.id}`);
    } catch { /* API interceptor displays the error */ }
  }

  return <AppShell><div className="mx-auto max-w-3xl space-y-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Payments</p><Typography.Title className="!mb-1 !mt-2">Create payment</Typography.Title><Typography.Paragraph type="secondary">Create a payment in minor currency units. For INR, ₹100 = 10000.</Typography.Paragraph></div><Card bordered={false} className="!rounded-2xl !shadow-sm"><Form layout="vertical" onFinish={submit} initialValues={{ currency: "INR" }} requiredMark="optional"><div className="grid gap-5 sm:grid-cols-2"><Form.Item name="amount" label="Amount (minor units)" rules={[{ required: true, type: "number", min: 1 }]}><InputNumber className="!w-full" size="large" min={1} precision={0} placeholder="100000" /></Form.Item><Form.Item name="currency" label="Currency" rules={[{ required: true }]}><Select size="large" options={[{ value: "INR", label: "INR — Indian Rupee" }, { value: "USD", label: "USD — US Dollar" }, { value: "EUR", label: "EUR — Euro" }]} /></Form.Item></div><Form.Item name="reference" label="Reference" rules={[{ required: true, max: 255 }]}><Input size="large" placeholder="ORDER-12345" /></Form.Item><Form.Item name="customerId" label="Customer ID"><Input size="large" placeholder="customer_123" /></Form.Item><Form.Item name="description" label="Description"><Input.TextArea rows={3} maxLength={1000} showCount placeholder="Order payment" /></Form.Item><Form.Item label="Metadata (JSON)"><Input.TextArea rows={5} value={metadata} onChange={(event) => setMetadata(event.target.value)} /></Form.Item><div className="flex justify-end gap-3"><Button size="large" onClick={() => router.back()}>Cancel</Button><Button type="primary" htmlType="submit" size="large" loading={mutation.isPending}>Create payment</Button></div></Form></Card></div></AppShell>;
}
