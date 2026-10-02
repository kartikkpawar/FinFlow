import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type MerchantStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "REJECTED";

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
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function useMerchants(params: { page?: number; limit?: number; search?: string; status?: MerchantStatus }) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);

  return useQuery({
    queryKey: ["merchants", params],
    queryFn: () => apiFetch<MerchantList>(`/merchants?${search.toString()}`),
  });
}

export function useMerchant(merchantId: string) {
  return useQuery({
    queryKey: ["merchant", merchantId],
    queryFn: () => apiFetch<Merchant>(`/merchants/${merchantId}`),
    enabled: Boolean(merchantId),
  });
}
