import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type MerchantRole = "MERCHANT_ADMIN" | "MERCHANT_USER";
export type MerchantUserStatus = "ACTIVE" | "INACTIVE";
export type MerchantUser = { id: number; merchantId: number; userId: number; role: MerchantRole; status: MerchantUserStatus; createdAt: string; modifiedAt: string };
export type MerchantSettings = { id: number; merchantId: number; timezone: string; currency: string; notificationsEnabled: boolean; metadata: Record<string, unknown>; createdAt: string; modifiedAt: string };
export type Invitation = { id: number; merchantId: number; email: string; role: MerchantRole; status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"; expiresAt: string; createdAt: string };
export type ApiKey = { id: number; merchantId: number; name: string; prefix: string; lastUsedAt: string | null; expiresAt: string | null; revokedAt: string | null; createdAt: string };
export type Webhook = { id: number; merchantId: number; url: string; secretPrefix: string; events: string[]; enabled: boolean; createdAt: string; modifiedAt: string };
export type AuditLog = { id: number; merchantId: number; actorUserId: number; action: string; resourceType: string; resourceId: string | null; metadata: Record<string, unknown>; createdAt: string };

export const merchantManagementApi = {
  users: (id: number) => apiFetch<MerchantUser[]>(`/merchants/${id}/users`),
  addUser: (id: number, data: { userId: number; role: MerchantRole }) => apiFetch<MerchantUser>(`/merchants/${id}/users`, { method: "POST", data }),
  updateUser: (id: number, userId: number, data: { role: MerchantRole }) => apiFetch<MerchantUser>(`/merchants/${id}/users/${userId}`, { method: "PATCH", data }),
  updateUserStatus: (id: number, userId: number, status: MerchantUserStatus) => apiFetch<MerchantUser>(`/merchants/${id}/users/${userId}/status`, { method: "PATCH", data: { status } }),
  removeUser: (id: number, userId: number) => apiFetch<{ deleted: boolean }>(`/merchants/${id}/users/${userId}`, { method: "DELETE" }),
  settings: (id: number) => apiFetch<MerchantSettings>(`/merchants/${id}/settings`),
  updateSettings: (id: number, data: Record<string, unknown>) => apiFetch<MerchantSettings>(`/merchants/${id}/settings`, { method: "PATCH", data }),
  invitations: (id: number) => apiFetch<Invitation[]>(`/merchants/${id}/invitations`),
  invite: (id: number, data: { email: string; role: MerchantRole }) => apiFetch<Invitation & { token: string }>(`/merchants/${id}/invitations`, { method: "POST", data }),
  acceptInvitation: (token: string) => apiFetch<{ merchantId: number; membership: MerchantUser }>(`/merchants/invitations/accept`, { method: "POST", data: { token } }),
  revokeInvitation: (id: number, invitationId: number) => apiFetch<Invitation>(`/merchants/${id}/invitations/${invitationId}`, { method: "DELETE" }),
  apiKeys: (id: number) => apiFetch<ApiKey[]>(`/merchants/${id}/api-keys`),
  createApiKey: (id: number, data: { name: string; expiresAt?: string }) => apiFetch<ApiKey & { secret: string }>(`/merchants/${id}/api-keys`, { method: "POST", data }),
  revokeApiKey: (id: number, keyId: number) => apiFetch<{ id: number }>(`/merchants/${id}/api-keys/${keyId}`, { method: "DELETE" }),
  webhooks: (id: number) => apiFetch<Webhook[]>(`/merchants/${id}/webhooks`),
  createWebhook: (id: number, data: { url: string; events: string[]; enabled?: boolean }) => apiFetch<Webhook & { secret: string }>(`/merchants/${id}/webhooks`, { method: "POST", data }),
  updateWebhook: (id: number, webhookId: number, data: Partial<Pick<Webhook, "url" | "events" | "enabled">>) => apiFetch<Webhook>(`/merchants/${id}/webhooks/${webhookId}`, { method: "PATCH", data }),
  deleteWebhook: (id: number, webhookId: number) => apiFetch<{ id: number }>(`/merchants/${id}/webhooks/${webhookId}`, { method: "DELETE" }),
  audit: (id: number) => apiFetch<{ items: AuditLog[]; page: number; limit: number; hasMore: boolean }>(`/merchants/${id}/audit-logs?page=1&limit=50`),
};

export function useMerchantUsers(id: number) { return useQuery({ queryKey: ["merchant-users", id], queryFn: () => merchantManagementApi.users(id), enabled: !!id }); }
export function useMerchantSettings(id: number) { return useQuery({ queryKey: ["merchant-settings", id], queryFn: () => merchantManagementApi.settings(id), enabled: !!id }); }
export function useMerchantInvitations(id: number) { return useQuery({ queryKey: ["merchant-invitations", id], queryFn: () => merchantManagementApi.invitations(id), enabled: !!id }); }
export function useMerchantApiKeys(id: number) { return useQuery({ queryKey: ["merchant-api-keys", id], queryFn: () => merchantManagementApi.apiKeys(id), enabled: !!id }); }
export function useMerchantWebhooks(id: number) { return useQuery({ queryKey: ["merchant-webhooks", id], queryFn: () => merchantManagementApi.webhooks(id), enabled: !!id }); }
export function useMerchantAudit(id: number) { return useQuery({ queryKey: ["merchant-audit", id], queryFn: () => merchantManagementApi.audit(id), enabled: !!id }); }

export const useAddMerchantUser = (id: number) => { const c = useQueryClient(); return useMutation({ mutationFn: (data: { userId: number; role: MerchantRole }) => merchantManagementApi.addUser(id, data), onSuccess: () => c.invalidateQueries({ queryKey: ["merchant-users", id] }) }); };
export const useUpdateMerchantUser = (id: number) => { const c = useQueryClient(); return useMutation({ mutationFn: ({ userId, role }: { userId: number; role: MerchantRole }) => merchantManagementApi.updateUser(id, userId, { role }), onSuccess: () => c.invalidateQueries({ queryKey: ["merchant-users", id] }) }); };
export const useUpdateMerchantUserStatus = (id: number) => { const c = useQueryClient(); return useMutation({ mutationFn: ({ userId, status }: { userId: number; status: MerchantUserStatus }) => merchantManagementApi.updateUserStatus(id, userId, status), onSuccess: () => c.invalidateQueries({ queryKey: ["merchant-users", id] }) }); };
export const useRemoveMerchantUser = (id: number) => { const c = useQueryClient(); return useMutation({ mutationFn: (userId: number) => merchantManagementApi.removeUser(id, userId), onSuccess: () => c.invalidateQueries({ queryKey: ["merchant-users", id] }) }); };
