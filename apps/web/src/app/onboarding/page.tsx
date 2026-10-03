"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Form, Input, Space, Steps, Typography } from "antd";
import { useRequireAuth } from "@/features/auth/auth-context";
import { useCreateMerchant } from "@/features/merchants/api";
import { merchantManagementApi } from "@/features/merchants/management";

type Mode = "choose" | "create" | "join";
type CreateForm = { businessName: string; name: string; email: string; phone: string };

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, logout } = useRequireAuth();
  const createMerchant = useCreateMerchant();
  const [mode, setMode] = useState<Mode>("choose");
  const [step, setStep] = useState(0);
  const [createForm] = Form.useForm<CreateForm>();
  const [invitationToken, setInvitationToken] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => { if (user) createForm.setFieldValue("email", user.email); }, [createForm, user]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">Loading FinFlow...</div>;

  function selectMode(nextMode: Exclude<Mode, "choose">) { setMode(nextMode); setStep(1); setJoinError(null); }
  function submitCreate(values: CreateForm) { createMerchant.mutate(values, { onSuccess: () => setStep(2) }); }
  async function submitJoin() {
    setJoining(true); setJoinError(null);
    try { const result = await merchantManagementApi.acceptInvitation(invitationToken.trim()); setStep(2); window.setTimeout(() => router.replace(`/merchants/${result.merchantId}`), 500); }
    catch (error) { setJoinError(error instanceof Error ? error.message : "We couldn't accept this invitation. Please check the invitation token and try again."); }
    finally { setJoining(false); }
  }
  async function handleLogout() { await logout(); router.replace("/login"); }

  return <main className="min-h-screen overflow-hidden bg-surface"><div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-12">
    <header className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">F</div><span className="text-lg font-bold text-ink">FinFlow</span></div><Space><Typography.Text type="secondary" className="hidden sm:inline">Account setup</Typography.Text><Button onClick={handleLogout}>Logout</Button></Space></header>
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-12"><Steps current={step} items={[{ title: "Choose" }, { title: "Workspace" }, { title: "Ready" }]} className="mb-10" />
      {step === 0 && <Card><Typography.Text className="text-brand">Welcome to FinFlow</Typography.Text><Typography.Title level={2}>How would you like to get started?</Typography.Title><Typography.Paragraph type="secondary">Create your own merchant workspace or join an existing workspace using an invitation from your team.</Typography.Paragraph><div className="grid gap-4 sm:grid-cols-2"><Card hoverable title="Create a workspace" onClick={() => selectMode("create")}>Start a new merchant workspace. You&apos;ll become its merchant admin.</Card><Card hoverable title="Join a workspace" onClick={() => selectMode("join")}>Use the invitation token sent by your organization to join an existing workspace.</Card></div></Card>}
      {step === 1 && mode === "create" && <Card><Typography.Text className="text-brand">Step 2 of 3</Typography.Text><Typography.Title level={2}>Tell us about your business.</Typography.Title><Typography.Paragraph type="secondary">Creating a workspace automatically makes you its merchant admin.</Typography.Paragraph><Form form={createForm} layout="vertical" onFinish={submitCreate}><Form.Item name="businessName" label="Business name" rules={[{ required: true }]}><Input placeholder="Acme Payments" /></Form.Item><div className="grid gap-x-4 sm:grid-cols-2"><Form.Item name="name" label="Contact name" rules={[{ required: true }]}><Input placeholder="Your full name" /></Form.Item><Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input type="tel" placeholder="+91 98765 43210" /></Form.Item></div><Form.Item name="email" label="Business email" rules={[{ required: true, type: "email" }]}><Input type="email" /></Form.Item>{createMerchant.isError && <Alert className="mb-4" type="error" message="We couldn't create your workspace. Please check the details and try again." />}<Space><Button onClick={() => setStep(0)}>Back</Button><Button type="primary" htmlType="submit" loading={createMerchant.isPending}>Create workspace</Button></Space></Form></Card>}
      {step === 1 && mode === "join" && <Card><Typography.Text className="text-brand">Step 2 of 3</Typography.Text><Typography.Title level={2}>Join your workspace.</Typography.Title><Typography.Paragraph type="secondary">Paste the invitation token from the email or invitation link.</Typography.Paragraph><Form layout="vertical" onFinish={submitJoin}><Form.Item label="Invitation token" required><Input.TextArea required value={invitationToken} onChange={(event) => setInvitationToken(event.target.value)} rows={5} placeholder="Paste your invitation token" /></Form.Item>{joinError && <Alert className="mb-4" type="error" message={joinError} />}<Space><Button onClick={() => setStep(0)}>Back</Button><Button type="primary" htmlType="submit" loading={joining} disabled={!invitationToken.trim()}>Join workspace</Button></Space></Form></Card>}
      {step === 2 && <Card className="text-center"><Typography.Title level={2}>You&apos;re ready to go.</Typography.Title><Typography.Paragraph type="secondary">Your workspace access is ready. Continue to your FinFlow dashboard.</Typography.Paragraph><Button type="primary" size="large" onClick={() => router.push("/dashboard")}>Go to dashboard</Button></Card>}
    </div><Typography.Text type="secondary" className="pb-2 text-center text-xs">Secure financial operations, built for teams.</Typography.Text>
  </div></main>;
}
