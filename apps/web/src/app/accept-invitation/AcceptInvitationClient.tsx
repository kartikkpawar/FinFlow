"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Typography } from "antd";
import { merchantManagementApi } from "@/features/merchants/management";

export default function AcceptInvitationClient({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function accept() {
    if (!token) {
      setMessage("This invitation link is missing its token.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await merchantManagementApi.acceptInvitation(token);
      setSuccess(true);
      setMessage(
        "Invitation accepted. Redirecting to the merchant workspace...",
      );
      window.setTimeout(
        () => router.replace(`/merchants/${result.merchantId}`),
        800,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to accept this invitation.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md" title="FinFlow">
        <Typography.Title level={2}>Join merchant workspace</Typography.Title>
        <Typography.Paragraph type="secondary">
          Accept the invitation to add your authenticated FinFlow account to
          this merchant.
        </Typography.Paragraph>
        {message && (
          <Alert
            className="mb-6"
            type={success ? "success" : "error"}
            showIcon
            message={message}
          />
        )}
        <Button
          type="primary"
          block
          size="large"
          loading={loading}
          disabled={success || !token}
          onClick={accept}
        >
          {loading
            ? "Accepting..."
            : success
              ? "Accepted"
              : "Accept invitation"}
        </Button>
      </Card>
    </main>
  );
}
