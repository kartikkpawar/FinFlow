"use client";

import Link from "next/link";
import { Button, Card, Col, Row, Tag, Typography } from "antd";
import { useAuth } from "@/features/auth/auth-context";

const metrics = [
  { label: "Active merchants", value: "—", detail: "Live merchant data" },
  {
    label: "Payments today",
    value: "—",
    detail: "Payment service coming next",
  },
  { label: "Open tasks", value: "—", detail: "Task service coming next" },
  { label: "Pending reviews", value: "—", detail: "Operational queue" },
];
const quickActions = [
  {
    title: "Add a merchant",
    description: "Create and configure a merchant workspace.",
    href: "/onboarding",
  },
  {
    title: "View merchants",
    description: "Review accounts, status and contact details.",
    href: "/merchants",
  },
  {
    title: "Review payments",
    description: "Payment operations will appear here next.",
    href: "/payments",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName =
    user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Card
        className="border-0 bg-ink shadow-xl"
        styles={{ body: { padding: 32 } }}
      >
        <div className="flex flex-col justify-between gap-7 text-white lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <Tag color="blue">Operations overview</Tag>
            <Typography.Title level={1} className="!mb-2 !mt-4 !text-white">
              Good to see you, {firstName}.
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-slate-300">
              Keep an eye on your financial operations from one place. Your live
              service metrics will appear here as each FinFlow domain comes
              online.
            </Typography.Paragraph>
          </div>
          <Link href="/onboarding">
            <Button size="large">Create workspace →</Button>
          </Link>
        </div>
      </Card>
      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col key={metric.label} xs={24} sm={12} xl={6}>
            <Card>
              <Typography.Text type="secondary">{metric.label}</Typography.Text>
              <Typography.Title level={2} className="!mb-1 !mt-4">
                {metric.value}
              </Typography.Title>
              <Typography.Text type="secondary">
                {metric.detail}
              </Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Quick actions" extra={<Tag>Portal</Tag>}>
            <Row gutter={[12, 12]}>
              {quickActions.map((action) => (
                <Col key={action.title} xs={24} sm={8}>
                  <Link href={action.href}>
                    <Card size="small" hoverable title={action.title}>
                      {action.description}
                      <div className="mt-4 text-xs font-semibold text-brand">
                        Open →
                      </div>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="Workspace status"
            extra={<Tag color="green">Online</Tag>}
          >
            {["Authentication", "Merchant management", "Payments", "Tasks"].map(
              (service, index) => (
                <div
                  key={service}
                  className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${index < 2 ? "bg-emerald-500" : "bg-slate-300"}`}
                  />
                  <div>
                    <Typography.Text strong>{service}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" className="text-xs">
                      {index < 2 ? "Available" : "Coming next"}
                    </Typography.Text>
                  </div>
                </div>
              ),
            )}
          </Card>
        </Col>
      </Row>
      <Card>
        <Typography.Text className="text-brand">
          FinFlow workspace
        </Typography.Text>
        <Typography.Title level={3} className="!mb-1">
          Your operational center is ready.
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Merchant management is live today. Payments, tasks and reporting can
          plug into this dashboard without changing the overall workspace.
        </Typography.Paragraph>
        <Link href="/merchants">
          <Button>Explore merchants</Button>
        </Link>
      </Card>
    </div>
  );
}
