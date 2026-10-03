"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  MerchantStatus,
  useMerchant,
  useUpdateMerchant,
  useUpdateMerchantStatus,
} from "@/features/merchants/api";

const transitions: Record<MerchantStatus, MerchantStatus[]> = {
  PENDING: ["ACTIVE", "REJECTED"],
  ACTIVE: ["SUSPENDED", "INACTIVE"],
  SUSPENDED: ["ACTIVE", "INACTIVE"],
  INACTIVE: ["ACTIVE"],
  REJECTED: [],
};
const statusColors: Record<MerchantStatus, string> = {
  PENDING: "gold",
  ACTIVE: "green",
  SUSPENDED: "orange",
  INACTIVE: "default",
  REJECTED: "red",
};

type MerchantForm = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
};

export default function AdminMerchantDetailsPage() {
  const params = useParams<{ merchantId: string }>();
  const merchantId = Number(params.merchantId);
  const query = useMerchant(params.merchantId);
  const update = useUpdateMerchant(merchantId);
  const updateStatus = useUpdateMerchantStatus(merchantId);
  const [editing, setEditing] = useState(false);
  const merchant = query.data;

  if (query.isLoading) return <Card loading />;
  if (query.isError || !merchant)
    return (
      <Card>
        <Typography.Text type="danger">
          Unable to load merchant.
        </Typography.Text>
      </Card>
    );

  const available = transitions[merchant.status];
  const initialValues: MerchantForm = {
    name: merchant.name,
    businessName: merchant.businessName,
    email: merchant.email,
    phone: merchant.phone,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/admin/merchants">← Merchants</Link>
          <Typography.Title level={2} className="!mb-1 !mt-2">
            {merchant.businessName}
          </Typography.Title>
          <Typography.Text type="secondary">
            Merchant #{merchant.id}
          </Typography.Text>
        </div>
        <Space wrap>
          <Tag color={statusColors[merchant.status]}>{merchant.status}</Tag>
          <Button onClick={() => setEditing((value) => !value)}>
            {editing ? "Cancel edit" : "Edit"}
          </Button>
          {available.map((status) => (
            <Button
              key={status}
              type="primary"
              danger={status === "REJECTED"}
              loading={updateStatus.isPending}
              onClick={() => updateStatus.mutate(status)}
            >
              {status === "ACTIVE"
                ? "Activate"
                : status === "REJECTED"
                  ? "Reject"
                  : status === "SUSPENDED"
                    ? "Suspend"
                    : "Deactivate"}
            </Button>
          ))}
        </Space>
      </div>

      {editing && (
        <Card title="Edit merchant">
          <Form
            layout="vertical"
            initialValues={initialValues}
            onFinish={(values: MerchantForm) =>
              update.mutate(values, { onSuccess: () => setEditing(false) })
            }
          >
            <div className="grid gap-x-4 md:grid-cols-2">
              <Form.Item
                name="name"
                label="Contact name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="businessName"
                label="Business name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit" loading={update.isPending}>
              Save changes
            </Button>
          </Form>
        </Card>
      )}

      <Card title="Merchant details">
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, lg: 4 }}
          items={[
            { label: "Contact", children: merchant.name },
            { label: "Email", children: merchant.email },
            { label: "Phone", children: merchant.phone },
            {
              label: "Created",
              children: new Date(merchant.createdAt).toLocaleDateString(),
            },
          ]}
        />
      </Card>
      <Card title="Merchant administration">
        <Typography.Paragraph type="secondary">
          Manage users and merchant-specific configuration using the existing
          merchant APIs.
        </Typography.Paragraph>
        <Space wrap>
          <Link href={`/merchants/${merchant.id}`}>
            <Button>Open merchant workspace</Button>
          </Link>
          <Link href={`/admin/merchant-users?merchantId=${merchant.id}`}>
            <Button>View merchant users</Button>
          </Link>
          <Link href={`/merchants/${merchant.id}`}>
            <Button>Settings & integrations</Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}
