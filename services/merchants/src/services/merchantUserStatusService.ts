import { and, eq } from "drizzle-orm";
import { AppError, STATUS_CODES } from "@finflow/shared";
import { db } from "../db";
import { merchantAuditLogsTable, merchantUsersTable } from "../db/schema";
import { assertScope } from "./merchantManagementService";
import type { Identity } from "../types/merchant";
import type { ManagedMerchantUserStatus } from "../schemas/management";

export async function updateMerchantUserStatus(
  merchantId: number,
  userId: number,
  identity: Identity,
  status: ManagedMerchantUserStatus,
) {
  await assertScope(merchantId, identity);
  const [current] = await db
    .select()
    .from(merchantUsersTable)
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, userId),
      ),
    )
    .limit(1);
  if (!current)
    throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant user not found");

  const [updated] = await db
    .update(merchantUsersTable)
    .set({ status, modifiedAt: new Date() })
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, userId),
      ),
    )
    .returning();
  await db.insert(merchantAuditLogsTable).values({
    merchantId,
    actorUserId: identity.userId,
    action: "merchant_user.status_updated",
    resourceType: "merchant_user",
    resourceId: String(current.id),
    metadata: { userId, previousStatus: current.status, status },
  });
  return updated;
}
