"use client";

import Link from "next/link";
import { use, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Modal,
  Spin,
  Table,
  Tag,
  InputNumber,
  Input,
} from "antd";
import { toast } from "react-toastify";
import { AppShell } from "@/components/app-shell";
import {
  useCancelPayment,
  useCreateRefund,
  usePayment,
  usePaymentRefunds,
} from "@/features/payments/hooks";
import {
  formatDate,
  formatMoney,
  StatusBadge,
} from "@/features/payments/payment-status";

export default function PaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = use(params);
  const id = Number(paymentId);
  const { data: payment, isLoading } = usePayment(id);
  const { data: refunds = [] } = usePaymentRefunds(id);
  const cancel = useCancelPayment(id);
  const refund = useCreateRefund(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>();
  const [refundReason, setRefundReason] = useState("");

  if (isLoading)
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spin />
        </div>
      </AppShell>
    );
  if (!payment)
    return (
      <AppShell>
        <Empty description="Payment not found" />
      </AppShell>
    );

  async function handleCancel() {
    try {
      await cancel.mutateAsync();
      toast.success("Payment cancelled");
      setCancelOpen(false);
    } catch {}
  }
  async function handleRefund() {
    if (!refundAmount) return;
    try {
      await refund.mutateAsync({
        amount: refundAmount,
        reason: refundReason || undefined,
      });
      toast.success("Refund created");
      setRefundOpen(false);
      setRefundAmount(undefined);
      setRefundReason("");
    } catch {}
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link href="/payments" className="text-sm font-medium text-brand">
              ← Payments
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-ink">
                {payment.reference}
              </h1>
              <StatusBadge status={payment.status} />
            </div>
            <p className="mt-2 text-sm text-muted">
              Payment #{payment.id} · Created {formatDate(payment.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {payment.status === "PENDING" && (
              <Button onClick={() => setCancelOpen(true)}>Cancel</Button>
            )}
            {payment.status === "SUCCEEDED" && (
              <Button type="primary" onClick={() => setRefundOpen(true)}>
                Create refund
              </Button>
            )}
          </div>
        </div>
        <Card bordered={false} className="!rounded-2xl !shadow-sm">
          <Descriptions
            column={{ xs: 1, sm: 2 }}
            bordered
            items={[
              {
                key: "amount",
                label: "Amount",
                children: (
                  <span className="font-semibold">
                    {formatMoney(payment.amount, payment.currency)}
                  </span>
                ),
              },
              {
                key: "currency",
                label: "Currency",
                children: payment.currency,
              },
              {
                key: "customer",
                label: "Customer",
                children: payment.customerId ?? "—",
              },
              {
                key: "description",
                label: "Description",
                children: payment.description ?? "—",
              },
              {
                key: "created",
                label: "Created",
                children: formatDate(payment.createdAt),
              },
              {
                key: "updated",
                label: "Updated",
                children: formatDate(payment.updatedAt),
              },
            ]}
          />
        </Card>
        <Card bordered={false} className="!rounded-2xl !shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-ink">Refunds</h2>
          {refunds.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No refunds for this payment"
            />
          ) : (
            <Table
              rowKey="id"
              pagination={false}
              dataSource={refunds}
              columns={[
                { title: "ID", dataIndex: "id" },
                {
                  title: "Amount",
                  render: (_, row) => formatMoney(row.amount, payment.currency),
                },
                {
                  title: "Reason",
                  dataIndex: "reason",
                  render: (value) => value ?? "—",
                },
                {
                  title: "Status",
                  render: (_, row) => <StatusBadge status={row.status} />,
                },
                {
                  title: "Created",
                  render: (_, row) => formatDate(row.createdAt),
                },
              ]}
            />
          )}
        </Card>
        <Modal
          title="Cancel payment"
          open={cancelOpen}
          onCancel={() => setCancelOpen(false)}
          onOk={() => void handleCancel()}
          okText="Cancel payment"
          confirmLoading={cancel.isPending}
        >
          <p>
            Are you sure you want to cancel <strong>{payment.reference}</strong>
            ?
          </p>
        </Modal>
        <Modal
          title="Create refund"
          open={refundOpen}
          onCancel={() => setRefundOpen(false)}
          onOk={() => void handleRefund()}
          okText="Create refund"
          confirmLoading={refund.isPending}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Amount (minor units)
              </label>
              <InputNumber
                className="!w-full"
                min={1}
                max={payment.amount}
                precision={0}
                value={refundAmount}
                onChange={(value) => setRefundAmount(value ?? undefined)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Reason</label>
              <Input
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
                maxLength={500}
              />
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
