import { apiFetch } from "@/lib/api";

export type AuthenticatedMerchantList = {
  items: Array<{ id: number }>;
};

export async function getAuthenticatedRoute(): Promise<string> {
  const merchants = await apiFetch<AuthenticatedMerchantList>("/merchants?limit=100");

  if (merchants.items.length === 0) return "/onboarding";
  if (merchants.items.length === 1) return "/dashboard";
  return "/merchants";
}
