import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { AppError, getIdentityHeaders, requirePermission, STATUS_CODES } from "@finflow/shared";
import { db } from "../db";
import { merchantAuditLogsTable, merchantUsersTable, merchantsTable } from "../db/schema";
import type { CreateMerchantInput, UpdateMerchantInput } from "../schemas/merchant";
import type { Identity, MerchantStatus } from "../types/merchant";
import { enqueueWebhookEvent } from "./webhookDeliveryService";

const ALL_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);

const STATUS_TRANSITIONS: Record<MerchantStatus, readonly MerchantStatus[]> = {
  PENDING: ["ACTIVE", "REJECTED"],
  ACTIVE: ["SUSPENDED", "INACTIVE"],
  SUSPENDED: ["ACTIVE", "INACTIVE"],
  INACTIVE: ["ACTIVE"],
  REJECTED: [],
};

function authorize(identity: Identity, permission: "merchant:read" | "merchant:write" | "merchant:update") {
  if (!requirePermissionFromIdentity(identity, permission)) throw new AppError(STATUS_CODES.FORBIDDEN, "Insufficient permissions");
}

function requirePermissionFromIdentity(identity: Identity, permission: "merchant:read" | "merchant:write" | "merchant:update") {
  const permissionsByRole: Record<string, readonly string[]> = {
    SUPER_ADMIN: ["*"],
    ADMIN: ["merchant:read", "merchant:update"],
    SUPPORT: ["merchant:read"],
    MERCHANT_ADMIN: ["merchant:read", "merchant:update"],
    MERCHANT_USER: ["merchant:read"],
    ANALYST: [],
  };
  const permissions = permissionsByRole[identity.role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}

async function merchantIdsForUser(userId: number) {
  const memberships = await db.select({ merchantId: merchantUsersTable.merchantId }).from(merchantUsersTable).where(eq(merchantUsersTable.userId, userId));
  return memberships.map((membership) => membership.merchantId);
}

async function assertMerchantScope(merchantId: number, identity: Identity) {
  if (ALL_ROLES.has(identity.role)) return;
  const membership = await db.select({ id: merchantUsersTable.id }).from(merchantUsersTable).where(and(eq(merchantUsersTable.merchantId, merchantId), eq(merchantUsersTable.userId, identity.userId))).limit(1);
  if (!membership.length) throw new AppError(STATUS_CODES.FORBIDDEN, "Merchant access denied");
}

export async function recordMerchantAudit(merchantId: number, identity: Identity, action: string, resourceType: string, resourceId?: number, metadata?: Record<string, unknown>) {
  await db.insert(merchantAuditLogsTable).values({ merchantId, actorUserId: identity.userId, action, resourceType, resourceId: resourceId ? String(resourceId) : undefined, metadata: metadata ?? {} });
}

async function emitMerchantWebhook(merchantId: number, event: string, payload: Record<string, unknown>) {
  try {
    await enqueueWebhookEvent(merchantId, event, payload);
  } catch {
    // Webhook delivery is asynchronous and must not roll back the merchant mutation.
  }
}

export async function createMerchant(input: CreateMerchantInput, identity: Identity) {
  try {
    const [merchant] = await db.insert(merchantsTable).values(input).returning();

    if (identity.role !== "SUPER_ADMIN") {
      await db.insert(merchantUsersTable).values({
        merchantId: merchant.id,
        userId: identity.userId,
        role: "MERCHANT_ADMIN",
      });
    }

    await recordMerchantAudit(merchant.id, identity, "merchant.created", "merchant", merchant.id, { businessName: merchant.businessName });
    await emitMerchantWebhook(merchant.id, "merchant.updated", { action: "created", merchant });
    return merchant;
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) throw new AppError(STATUS_CODES.CONFLICT, "Merchant email or phone already exists");
    throw error;
  }
}

export async function listMerchants(identity: Identity, page: number, limit: number, search?: string, status?: MerchantStatus) {
  const offset = (page - 1) * limit;
  const filters = [];
  if (search) filters.push(ilike(merchantsTable.businessName, `%${search}%`));
  if (status) filters.push(eq(merchantsTable.status, status));
  if (!ALL_ROLES.has(identity.role)) {
    const merchantIds = await merchantIdsForUser(identity.userId);
    if (!merchantIds.length) return { items: [], page, limit, total: 0, totalPages: 0 };
    filters.push(inArray(merchantsTable.id, merchantIds));
  }
  const whereClause = filters.length ? and(...filters) : undefined;
  const items = await db.select().from(merchantsTable).where(whereClause).orderBy(desc(merchantsTable.createdAt)).limit(limit).offset(offset);
  const countRows = await db.select({ id: merchantsTable.id }).from(merchantsTable).where(whereClause);
  const total = countRows.length;
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getMerchant(merchantId: number, identity: Identity) {
  await assertMerchantScope(merchantId, identity);
  const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.id, merchantId)).limit(1);
  if (!merchant) throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant not found");
  return merchant;
}

export async function updateMerchant(merchantId: number, identity: Identity, input: UpdateMerchantInput) {
  await assertMerchantScope(merchantId, identity);
  try {
    const [merchant] = await db.update(merchantsTable).set({ ...input, modifiedAt: new Date() }).where(eq(merchantsTable.id, merchantId)).returning();
    if (!merchant) throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant not found");
    await recordMerchantAudit(merchantId, identity, "merchant.updated", "merchant", merchantId, { fields: Object.keys(input) });
    await emitMerchantWebhook(merchantId, "merchant.updated", { action: "updated", merchant, fields: Object.keys(input) });
    return merchant;
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) throw new AppError(STATUS_CODES.CONFLICT, "Merchant email or phone already exists");
    throw error;
  }
}

export async function updateMerchantStatus(merchantId: number, identity: Identity, status: MerchantStatus) {
  await assertMerchantScope(merchantId, identity);
  const current = await getMerchant(merchantId, identity);
  if (current.status === status) return current;
  if (!STATUS_TRANSITIONS[current.status].includes(status)) throw new AppError(STATUS_CODES.BAD_REQUEST, `Invalid merchant status transition: ${current.status} -> ${status}`);
  const [merchant] = await db.update(merchantsTable).set({ status, modifiedAt: new Date() }).where(eq(merchantsTable.id, merchantId)).returning();
  if (!merchant) throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant not found");
  await recordMerchantAudit(merchantId, identity, "merchant.status_changed", "merchant", merchantId, { from: current.status, to: status });
  await emitMerchantWebhook(merchantId, "merchant.updated", { action: "status_changed", merchant, from: current.status, to: status });
  return merchant;
}

export function getIdentity(req: Parameters<typeof getIdentityHeaders>[0]): Identity {
  return getIdentityHeaders(req);
}

export async function authorizeMerchantCreation(identity: Identity) {
  if (["SUPER_ADMIN", "ADMIN"].includes(identity.role)) return;

  if (identity.role !== "MERCHANT_USER") {
    throw new AppError(STATUS_CODES.FORBIDDEN, "Insufficient permissions");
  }

  const memberships = await db
    .select({ id: merchantUsersTable.id })
    .from(merchantUsersTable)
    .where(eq(merchantUsersTable.userId, identity.userId))
    .limit(1);

  if (memberships.length) {
    throw new AppError(STATUS_CODES.FORBIDDEN, "Merchant creation is only available during onboarding");
  }
}

export function authorizeMerchantPermission(identity: Identity, permission: "merchant:read" | "merchant:write" | "merchant:update") {
  authorize(identity, permission);
}
