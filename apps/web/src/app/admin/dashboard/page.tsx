"use client";

import Link from "next/link";
import { Card, Col, Row, Statistic, Tag, Typography } from "antd";
import { useMerchants } from "@/features/merchants/api";

const lifecycle = [
  ["Pending", "Approve or reject"],
  ["Active", "Suspend or deactivate"],
  ["Suspended", "Reactivate or deactivate"],
] as const;

export default function SuperAdminDashboardPage() {
  const all = useMerchants({ page: 1, limit: 1 });
  const active = useMerchants({ page: 1, limit: 1, status: "ACTIVE" });
  const pending = useMerchants({ page: 1, limit: 1, status: "PENDING" });
  const suspended = useMerchants({ page: 1, limit: 1, status: "SUSPENDED" });
  const loading =
    all.isLoading ||
    active.isLoading ||
    pending.isLoading ||
    suspended.isLoading;

  return (
    <div className="space-y-7">
      <Card
        className="overflow-hidden border-0 bg-ink shadow-xl"
        styles={{ body: { padding: 32 } }}
      >
        <div className="flex flex-col justify-between gap-6 text-white sm:flex-row sm:items-end">
          <div>
            <Tag color="blue">Platform administration</Tag>
            <Typography.Title level={1} className="!mb-2 !mt-4 !text-white">
              Super Admin Dashboard
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !max-w-2xl !text-slate-300">
              Manage FinFlow merchants and merchant memberships from one
              platform-wide workspace.
            </Typography.Paragraph>
          </div>
          <Link href="/admin/merchants">
            <span className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink">
              Manage merchants →
            </span>
          </Link>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Total merchants"
              value={loading ? 0 : (all.data?.total ?? 0)}
              loading={loading}
            />
            <Typography.Text type="secondary">
              All platform merchants
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Active merchants"
              value={loading ? 0 : (active.data?.total ?? 0)}
              loading={loading}
            />
            <Typography.Text type="secondary">Currently active</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Pending approval"
              value={loading ? 0 : (pending.data?.total ?? 0)}
              loading={loading}
            />
            <Typography.Text type="secondary">Awaiting review</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="Suspended"
              value={loading ? 0 : (suspended.data?.total ?? 0)}
              loading={loading}
            />
            <Typography.Text type="secondary">
              Currently suspended
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Merchant operations" extra={<Tag>Platform</Tag>}>
            <Typography.Paragraph type="secondary">
              Manage the complete merchant lifecycle.
            </Typography.Paragraph>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Link href="/admin/merchants">
                  <Card size="small" hoverable title="Merchant directory">
                    Search, filter and update merchants.
                  </Card>
                </Link>
              </Col>
              <Col xs={24} sm={12}>
                <Link href="/admin/merchant-users">
                  <Card size="small" hoverable title="Merchant users">
                    Review memberships across merchants.
                  </Card>
                </Link>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Lifecycle controls">
            {lifecycle.map(([status, action]) => (
              <div
                key={status}
                className="flex justify-between border-b border-border py-3 last:border-0"
              >
                <Typography.Text type="secondary">{status}</Typography.Text>
                <Typography.Text strong>{action}</Typography.Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
