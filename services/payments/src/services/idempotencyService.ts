import { and, eq, gt } from "drizzle-orm";
import { db } from "../db";
import { idempotencyKeysTable } from "../db/schema";

export async function getIdempotencyRecord(merchantId: number, key: string) {
  const [record] = await db
    .select()
    .from(idempotencyKeysTable)
    .where(and(eq(idempotencyKeysTable.merchantId, merchantId), eq(idempotencyKeysTable.key, key), gt(idempotencyKeysTable.expiresAt, new Date())))
    .limit(1);
  return record;
}

export function assertRequestHash(existingHash: string, requestHash: string) {
  if (existingHash !== requestHash) {
    const error = new Error("Idempotency-Key was already used with a different request");
    Object.assign(error, { statusCode: 409 });
    throw error;
  }
}
