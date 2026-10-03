"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useAuth } from "@/features/auth/auth-context";
import { getAuthenticatedRoute } from "@/features/auth/auth-routing";
import { apiFetch } from "@/lib/api";

type SignupForm = { name: string; email: string; phone: string; password: string; confirmPassword: string };
type RegisterResponse = { email_verify: string };

export default function SignupPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { setCheckingSession(false); return; }
    let active = true;
    getAuthenticatedRoute().then((route) => { if (active) router.replace(route); }).catch(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, [authLoading, router, token]);

  async function handleSubmit(values: SignupForm) {
    setError("");
    if (values.password !== values.confirmPassword) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      const result = await apiFetch<RegisterResponse>("/auth/register", { method: "POST", data: { name: values.name, email: values.email, phone: values.phone, password: values.password } });
      router.replace(`/verify-email?token=${encodeURIComponent(result.email_verify)}`);
    } catch { setError("We couldn't create your account. Please check your details and try again."); }
    finally { setSubmitting(false); }
  }

  if (authLoading || (token && checkingSession)) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white">Checking your FinFlow session...</div>;

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8"><div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-2">
    <section className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between"><div><div className="text-2xl font-bold">FinFlow</div><Typography.Title level={2} className="!mt-6 !text-white">Create your financial operations workspace.</Typography.Title><Typography.Paragraph className="!text-slate-300">Start with your account, verify your email, then create your first merchant workspace.</Typography.Paragraph></div><Typography.Text className="text-xs text-slate-400">Secure access through the FinFlow API Gateway.</Typography.Text></section>
    <section className="p-8 sm:p-12"><Card bordered={false} className="mx-auto max-w-md shadow-none"><Typography.Text className="text-brand">Get started</Typography.Text><Typography.Title level={1} className="!mb-1 !mt-2">Create your FinFlow account</Typography.Title><Typography.Paragraph type="secondary">Create an account to set up your first workspace.</Typography.Paragraph>{error && <Alert className="mb-4" type="error" showIcon message={error} />}<Form layout="vertical" onFinish={handleSubmit} requiredMark="optional" className="mt-6"><Form.Item name="name" label="Full name" rules={[{ required: true, message: "Please enter your full name." }, { min: 2, message: "Name must be at least 2 characters." }]}><Input autoComplete="name" /></Form.Item><Form.Item name="email" label="Email" rules={[{ required: true, message: "Please enter your email address." }, { type: "email", message: "Please enter a valid email address." }]}><Input type="email" autoComplete="email" /></Form.Item><Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Please enter your phone number." }]}><Input type="tel" autoComplete="tel" placeholder="+91 98765 43210" /></Form.Item><div className="grid gap-4 sm:grid-cols-2"><Form.Item name="password" label="Password" rules={[{ required: true, message: "Please enter a password." }, { min: 8, message: "Password must be at least 8 characters." }]}><Input.Password autoComplete="new-password" /></Form.Item><Form.Item name="confirmPassword" label="Confirm password" rules={[{ required: true, message: "Please confirm your password." }, { min: 8, message: "Password must be at least 8 characters." }]}><Input.Password autoComplete="new-password" /></Form.Item></div><Form.Item><Button type="primary" htmlType="submit" block size="large" loading={submitting}>Create account</Button></Form.Item></Form><Typography.Paragraph className="mt-6 text-center" type="secondary">Already have an account? <Link href="/login">Sign in</Link></Typography.Paragraph></Card></section>
  </div></main>;
}
