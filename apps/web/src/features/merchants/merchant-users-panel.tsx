"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  merchantManagementApi,
  useMerchantInvitations,
  useMerchantUsers,
  type MerchantRole,
  type MerchantUserStatus,
} from "./management";

const roleOptions = ["MERCHANT_USER", "MERCHANT_ADMIN"].map((value) => ({
  value,
  label: value,
}));
const statusOptions = ["ACTIVE", "INACTIVE"].map((value) => ({
  value,
  label: value,
}));
const statusColors: Record<MerchantUserStatus, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
};

type InviteForm = { email: string; role: MerchantRole };

export function MerchantUsersPanel({ merchantId }: { merchantId: number }) {
  const client = useQueryClient();
  const users = useMerchantUsers(merchantId);
  const invitations = useMerchantInvitations(merchantId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form] = Form.useForm<InviteForm>();

  const invite = useMutation({
    mutationFn: (values: InviteForm) =>
      merchantManagementApi.invite(merchantId, values),
    onSuccess: () => {
      form.resetFields();
      setInviteOpen(false);
      void client.invalidateQueries({
        queryKey: ["merchant-invitations", merchantId],
      });
    },
  });
  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: MerchantRole }) =>
      merchantManagementApi.updateUser(merchantId, userId, { role }),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ["merchant-users", merchantId],
      }),
  });
  const updateStatus = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: number;
      status: MerchantUserStatus;
    }) => merchantManagementApi.updateUserStatus(merchantId, userId, status),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ["merchant-users", merchantId],
      }),
  });
  const remove = useMutation({
    mutationFn: (userId: number) =>
      merchantManagementApi.removeUser(merchantId, userId),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ["merchant-users", merchantId],
      }),
  });
  const revoke = useMutation({
    mutationFn: (invitationId: number) =>
      merchantManagementApi.revokeInvitation(merchantId, invitationId),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ["merchant-invitations", merchantId],
      }),
  });

  const columns = [
    { title: "User ID", dataIndex: "userId", width: 100 },
    {
      title: "Role",
      dataIndex: "role",
      render: (role: MerchantRole, row: { userId: number }) => (
        <Select
          size="small"
          value={role}
          options={roleOptions}
          onChange={(value) =>
            updateRole.mutate({ userId: row.userId, role: value })
          }
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: MerchantUserStatus, row: { userId: number }) => (
        <Select
          size="small"
          value={status}
          options={statusOptions}
          onChange={(value) =>
            updateStatus.mutate({ userId: row.userId, status: value })
          }
        />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: "",
      key: "remove",
      align: "right" as const,
      render: (_: unknown, row: { userId: number; role: MerchantRole }) => (
        <Button
          danger
          type="link"
          onClick={() => remove.mutate(row.userId)}
          disabled={remove.isPending}
        >
          Delete
        </Button>
      ),
    },
  ];

  const pendingInvitations = (invitations.data ?? []).filter(
    (invitation) => invitation.status === "PENDING",
  );

  return (
    <div className="space-y-6">
      <Card
        title="Merchant users"
        extra={
          <Button type="primary" onClick={() => setInviteOpen(true)}>
            Invite user
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={users.isLoading}
          dataSource={users.data ?? []}
          columns={columns}
          scroll={{ x: 760 }}
          locale={{ emptyText: "No merchant users yet." }}
        />
      </Card>

      <Card
        title={
          <Space>
            <span>Pending invitations</span>
            <Tag>{pendingInvitations.length}</Tag>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={invitations.isLoading}
          dataSource={pendingInvitations}
          pagination={false}
          columns={[
            { title: "Email", dataIndex: "email" },
            { title: "Role", dataIndex: "role" },
            {
              title: "Expires",
              dataIndex: "expiresAt",
              render: (value: string) => new Date(value).toLocaleString(),
            },
            {
              title: "",
              key: "revoke",
              align: "right" as const,
              render: (_: unknown, row: { id: number }) => (
                <Button
                  danger
                  type="link"
                  onClick={() => revoke.mutate(row.id)}
                  loading={revoke.isPending}
                >
                  Revoke
                </Button>
              ),
            },
          ]}
          locale={{ emptyText: "No pending invitations." }}
        />
      </Card>

      <Modal
        title="Invite merchant user"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => invite.mutate(values)}
          initialValues={{ role: "MERCHANT_USER" }}
          className="pt-4"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input type="email" placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Typography.Text type="secondary" className="block pb-4">
            The invitation expires after 7 days and the user becomes a merchant
            member after accepting it.
          </Typography.Text>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={invite.isPending}>
              Send invitation
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
