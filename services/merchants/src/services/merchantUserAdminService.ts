import { and, desc, eq, ilike } from "drizzle-orm";
import { AppError, STATUS_CODES } from "@finflow/shared";
import { db } from "../db";
import { merchantUsersTable, merchantsTable } from "../db/schema";
import type { Identity } from "../types/merchant";

const PLATFORM_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);

export async function listPlatformMerchantUsers(
  identity: Identity,
  page: number,
  limit: number,
  search?: string,
  merchantId?: number,
) {
  if (!PLATFORM_ROLES.has(identity.role)) {
    throw new AppError(STATUS_CODES.FORBIDDEN, "Insufficient permissions");
  }

  const offset = (page - 1) * limit;
  const filters = [];

  if (search) {
    filters.push(ilike(merchantsTable.businessName, `%${search}%`));
  }

  if (merchantId) {
    filters.push(eq(merchantUsersTable.merchantId, merchantId));
  }

  const whereClause = filters.length ? and(...filters) : undefined;
  const items = await db
    .select({
      id: merchantUsersTable.id,
      merchantId: merchantUsersTable.merchantId,
      merchantName: merchantsTable.businessName,
      userId: merchantUsersTable.userId,
      role: merchantUsersTable.role,
      createdAt: merchantUsersTable.createdAt,
      modifiedAt: merchantUsersTable.modifiedAt,
    })
    .from(merchantUsersTable)
    .innerJoin(
      merchantsTable,
      eq(merchantUsersTable.merchantId, merchantsTable.id),
    )
    .where(whereClause)
    .orderBy(desc(merchantUsersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const countRows = await db
    .select({ id: merchantUsersTable.id })
    .from(merchantUsersTable)
    .innerJoin(
      merchantsTable,
      eq(merchantUsersTable.merchantId, merchantsTable.id),
    )
    .where(whereClause);

  const total = countRows.length;

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
