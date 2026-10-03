"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Typography } from "antd";
import { useAuth } from "@/features/auth/auth-context";
import { getAuthenticatedRoute } from "@/features/auth/auth-routing";
import { safeApiRequest } from "@/lib/api";

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const { login, token, user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setCheckingSession(false);
      return;
    }
    let active = true;
    getAuthenticatedRoute(user)
      .then((route) => {
        if (active) router.replace(route);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, router, token, user]);

  async function handleSubmit(values: LoginForm) {
    setSubmitting(true);
    const route = await safeApiRequest(async () => {
      await login(values.email, values.password);
      return getAuthenticatedRoute();
    });
    if (route) router.replace(route);
    setSubmitting(false);
  }

  if (authLoading || (token && checkingSession))
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white">
        Checking your FinFlow session...
      </div>
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-2">
        <section className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="text-2xl font-bold">FinFlow</div>
            <Typography.Title level={2} className="!mt-6 !text-white">
              One workspace for your financial operations.
            </Typography.Title>
            <Typography.Paragraph className="!text-slate-300">
              Manage merchants, tasks, payments and operational reporting from a
              single portal.
            </Typography.Paragraph>
          </div>
          <Typography.Text className="text-xs text-slate-400">
            Secure access through the FinFlow API Gateway.
          </Typography.Text>
        </section>
        <section className="p-8 sm:p-12">
          <Card bordered={false} className="mx-auto max-w-md shadow-none">
            <Typography.Text className="text-brand">
              Welcome back
            </Typography.Text>
            <Typography.Title level={1} className="!mb-1 !mt-2">
              Sign in to FinFlow
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              Use your FinFlow account credentials.
            </Typography.Paragraph>
            <Form
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark="optional"
              className="mt-8"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    required: true,
                    message: "Please enter your email address.",
                  },
                  {
                    type: "email",
                    message: "Please enter a valid email address.",
                  },
                ]}
              >
                <Input type="email" autoComplete="email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please enter your password." },
                ]}
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={submitting}
                >
                  Sign in
                </Button>
              </Form.Item>
            </Form>
            <Typography.Paragraph className="mt-6 text-center" type="secondary">
              New to FinFlow? <Link href="/signup">Create an account</Link>
            </Typography.Paragraph>
          </Card>
        </section>
      </div>
    </main>
  );
}
