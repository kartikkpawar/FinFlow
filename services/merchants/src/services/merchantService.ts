import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { AppError, getIdentityHeaders, requirePermission, STATUS_CODES } from "@finflow/shared";
import { db } from "../db";
import { merchantUsersTable, merchantsTable } from "../db/schema";
import type { CreateMerchantInput, UpdateMerchantInput } from "../schemas/merchant";
import type { Identity } from "../types/merchant";
import type { MerchantStatus } from "../types/merchant";

const ALL_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);

const STATUS_TRANSITIONS: Record<MerchantStatus, readonly MerchantStatus[]> = {
  PENDING: ["ACTIVE", "REJECTED"],
  ACTIVE: ["SUSPENDED", "INACTIVE"],
  SUSPENDED: ["ACTIVE", "INACTIVE"],
  INACTIVE: ["ACTIVE"],
  REJECTED: [],
};

function authorize(identity: Identity, permission: "merchant:read" | "merchant:write" | "merchant:update") {
  if (!requirePermissionFromIdentity(identity, permission)) {
    throw new AppError(STATUS_CODES.FORBIDDEN, "Insufficient permissions");
  }
}

function requirePermissionFromIdentity(identity: Identity, permission: "merchant:read" | "merchant:write" | "merchant:update") {
  const permissionsByRole: Record<string, readonly string[]> = {
    SUPER_ADMIN: ["*"],
    ADMIN: ["merchant:read", "merchant:update"],
    SUPPORT: ["merchant:read"],
    MERCHANT_ADMIN: ["merchant:read", "merchant:update"],
    MERCHANT_USER: [],
    ANALYST: [],
  };
  const permissions = permissionsByRole[identity.role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}

async function merchantIdsForUser(userId: number) {
  const memberships = await db
    .select({ merchantId: merchantUsersTable.merchantId })
    .from(merchantUsersTable)
    .where(eq(merchantUsersTable.userId, userId));
  return memberships.map((membership) => membership.merchantId);
}

async function assertMerchantScope(merchantId: number, identity: Identity) {
  if (ALL_ROLES.has(identity.role)) return;

  const membership = await db
    .select({ id: merchantUsersTable.id })
    .from(merchantUsersTable)
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, identity.userId),
      ),
    )
    .limit(1);

  if (!membership.length) {
    throw new AppError(STATUS_CODES.FORBIDDEN, "Merchant access denied");
  }
}

export async function createMerchant(input: CreateMerchantInput) {
  try {
    const [merchant] = await db.insert(merchantsTable).values(input).returning();
    return merchant;
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new AppError(STATUS_CODES.CONFLICT, "Merchant email or phone already exists");
    }
    throw error;
  }
}

export async function listMerchants(identity: Identity, page: number, limit: number, search?: string, status?: MerchantStatus) {
  const offset = (page - 1) * limit;
  const filters = [];

  if (search) {
    filters.push(ilike(merchantsTable.businessName, `%${search}%`));
  }
  if (status) filters.push(eq(merchantsTable.status, status));

  if (!ALL_ROLES.has(identity.role)) {
    const merchantIds = await merchantIdsForUser(identity.userId);
    if (!merchantIds.length) return { items: [], page, limit, total: 0, totalPages: 0 };
    filters.push(inArray(merchantsTable.id, merchantIds));
  }

  const whereClause = filters.length ? and(...filters) : undefined;
  const items = await db
    .select()
    .from(merchantsTable)
    .where(whereClause)
    .orderBy(desc(merchantsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const countRows = await db
    .select({ id: merchantsTable.id })
    .from(merchantsTable)
    .where(whereClause);

  const total = countRows.length;
  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getMerchant(merchantId: number, identity: Identity) {
  await assertMerchantScope(merchantId, identity);
  const [merchant] = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.id, merchantId))
    .limit(1);

  if (!merchant) throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant not found");
  return merchant;
}

export async function updateMerchant(merchantId: number, identity: Identity, input: UpdateMerchantInput) {
  await assertMerchantScope(merchantId, identity);

  try {
    const [merchant] = await db
      .update(merchantsTable)
      .set({ ...input, modifiedAt: new Date() })
      .where(eq(merchantsTable.id, merchantId))
      .returning();

    if (!merchant) throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant not found");
    return merchant;
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new AppError(STATUS_CODES.CONFLICT, "Merchant email or phone already exists");
    }
    throw error;
  }
}

export async function updateMerchantStatus(merchantId: number, identity: Identity, status: MerchantStatus) {
  await assertMerchantScope(merchantId, identity);

  const current = await getMerchant(merchantId, identity);
  if (current.status === status) return current;

  if (!STATUS_TRANSITIONS[current.status].includes(status)) {
    throw new AppError(
      STATUS_CODES.BAD_REQUEST,
      `Invalid merchant status transition: ${current.status} -> ${status}`,
    );
  }

  const [merchant] = await db
    .update(merchantsTable)
    .set({ status, modifiedAt: new Date() })
    .where(eq(merchantsTable.id, merchantId))
    .returning();

  if (!merchant) throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant not found");
  return merchant;
}

export function getIdentity(req: Parameters<typeof getIdentityHeaders>[0]): Identity {
  return getIdentityHeaders(req);
}

export function authorizeMerchantPermission(
  identity: Identity,
  permission: "merchant:read" | "merchant:write" | "merchant:update",
) {
  authorize(identity, permission);
}
