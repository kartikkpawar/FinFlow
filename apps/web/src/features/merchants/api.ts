import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type MerchantStatus =
  "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "REJECTED";
export type Merchant = {
  id: number;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: MerchantStatus;
  createdAt: string;
  modifiedAt: string;
};
type MerchantList = {
  items: Merchant[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type PlatformMerchantUser = {
  id: number;
  merchantId: number;
  merchantName: string;
  userId: number;
  role: "MERCHANT_ADMIN" | "MERCHANT_USER";
  createdAt: string;
  modifiedAt: string;
};
type PlatformMerchantUserList = {
  items: PlatformMerchantUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function merchantHeaders(merchantId?: number) {
  if (typeof window === "undefined") return undefined;

  const activeMerchantId = merchantId ?? Number(window.localStorage.getItem("finflow_merchant_id"));
  if (!Number.isSafeInteger(activeMerchantId) || activeMerchantId <= 0) {
    return undefined;
  }

  return { "x-merchant-id": String(activeMerchantId) };
}

export function useMerchants(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: MerchantStatus;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  return useQuery({
    queryKey: ["merchants", params],
    queryFn: () =>
      apiFetch<MerchantList>(`/merchants?${search.toString()}`, {
        headers: merchantHeaders(),
      }),
  });
}

export function useMerchant(merchantId: string) {
  return useQuery({
    queryKey: ["merchant", merchantId],
    queryFn: () =>
      apiFetch<Merchant>(`/merchants/${merchantId}`, {
        headers: merchantHeaders(Number(merchantId)),
      }),
    enabled: Boolean(merchantId),
  });
}

export function useCreateMerchant() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Merchant, "name" | "businessName" | "email" | "phone">,
    ) => apiFetch<Merchant>("/merchants", { method: "POST", data }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["merchants"] }),
  });
}

export function useUpdateMerchant(merchantId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<Merchant, "name" | "businessName" | "email" | "phone">
      >,
    ) =>
      apiFetch<Merchant>(`/merchants/${merchantId}`, {
        method: "PATCH",
        headers: merchantHeaders(merchantId),
        data,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["merchants"] });
      client.invalidateQueries({ queryKey: ["merchant", String(merchantId)] });
    },
  });
}

export function useUpdateMerchantStatus(merchantId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (status: MerchantStatus) =>
      apiFetch<Merchant>(`/merchants/${merchantId}/status`, {
        method: "PATCH",
        headers: merchantHeaders(merchantId),
        data: { status },
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["merchants"] });
      client.invalidateQueries({
        queryKey: ["merchant", String(merchantId)],
      });
    },
  });
}

export function usePlatformMerchantUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  merchantId?: number;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.merchantId) search.set("merchantId", String(params.merchantId));
  return useQuery({
    queryKey: ["platform-merchant-users", params],
    queryFn: () =>
      apiFetch<PlatformMerchantUserList>(
        `/merchant-users?${search.toString()}`,
      ),
  });
}
