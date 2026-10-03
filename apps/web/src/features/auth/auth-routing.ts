import { apiFetch } from "@/lib/api";

export type AuthenticatedMerchantList = {
  items: Array<{ id: number }>;
};

type AuthenticatedUser = {
  role?: string | null;
};

function getStoredUser(): AuthenticatedUser | null {
  if (typeof window === "undefined") return null;

  try {
    const rawUser = localStorage.getItem("finflow_user");
    return rawUser ? (JSON.parse(rawUser) as AuthenticatedUser) : null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedRoute(
  user?: AuthenticatedUser | null,
): Promise<string> {
  const authenticatedUser = user ?? getStoredUser();

  if (authenticatedUser?.role === "SUPER_ADMIN") return "/admin/dashboard";

  const merchants = await apiFetch<AuthenticatedMerchantList>(
    "/merchants?limit=100",
  );

  if (merchants.items.length === 0) return "/onboarding";
  if (merchants.items.length === 1) return "/dashboard";
  return "/merchants";
}
