import { apiFetch } from "@/lib/api";

export type AuthenticatedMerchantList = {
  items: Array<{ id: number }>;
};

type AuthenticatedUser = {
  role?: string | null;
};

export async function getAuthenticatedRoute(user?: AuthenticatedUser | null): Promise<string> {
  if (user?.role === "SUPER_ADMIN") return "/admin/dashboard";

  const merchants = await apiFetch<AuthenticatedMerchantList>("/merchants?limit=100");

  if (merchants.items.length === 0) return "/onboarding";
  if (merchants.items.length === 1) return "/dashboard";
  return "/merchants";
}
