import AcceptInvitationClient from "./AcceptInvitationClient";

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <AcceptInvitationClient token={params.token ?? ""} />;
}
