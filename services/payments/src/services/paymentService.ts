import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { AppError, getIdentityHeaders, requirePermission, STATUS_CODES } from "@finflow/shared";
import { db } from "../db";
import { idempotencyKeysTable, paymentAttemptsTable, paymentsTable } from "../db/schema";
import type { CreatePaymentInput, ListPaymentsInput } from "../schemas/payment";
import { paymentProvider } from "../providers/mock/mockPaymentProvider";
import { recordPaymentEvent } from "./paymentEventService";
import { assertRequestHash } from "./idempotencyService";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export function getIdentity(req: Parameters<typeof getIdentityHeaders>[0]) {
  return getIdentityHeaders(req);
}

export function getMerchantId(req: Parameters<typeof getIdentityHeaders>[0]) {
  const raw = req.header("x-merchant-id");
  const merchantId = Number(raw);
  if (!raw || !Number.isSafeInteger(merchantId) || merchantId <= 0) {
    throw new AppError(STATUS_CODES.BAD_REQUEST, "x-merchant-id header is required");
  }
  return merchantId;
}

export function authorizePayment(identity: ReturnType<typeof getIdentity>, permission: "payment:create" | "payment:read" | "payment:update" | "refund:create" | "refund:read") {
  if (!requirePermissionFromRole(identity.role, permission)) {
    throw new AppError(STATUS_CODES.FORBIDDEN, "Insufficient permissions");
  }
}

function requirePermissionFromRole(role: string, permission: string) {
  const permissions: Record<string, readonly string[]> = {
    SUPER_ADMIN: ["*"],
    ADMIN: ["payment:read", "refund:manage"],
    MERCHANT_ADMIN: ["payment:read", "payment:create", "payment:update", "refund:read", "refund:create"],
    MERCHANT_USER: ["payment:read", "payment:create", "refund:read"],
    ANALYST: ["payment:read"],
    SUPPORT: ["payment:read", "refund:read"],
  };
  const allowed = permissions[role] ?? [];
  return allowed.includes("*") || allowed.includes(permission) || (permission === "refund:create" && allowed.includes("refund:manage"));
}

export async function createPayment(input: CreatePaymentInput, idempotencyKey: string, requestHash: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(idempotencyKeysTable)
      .where(and(eq(idempotencyKeysTable.merchantId, input.merchantId), eq(idempotencyKeysTable.key, idempotencyKey), sql`${idempotencyKeysTable.expiresAt} > NOW()`))
      .limit(1);

    if (existing) {
      assertRequestHash(existing.requestHash, requestHash);
      return { replayed: true, statusCode: existing.statusCode, response: existing.response };
    }

    const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);
    const [idempotencyRecord] = await tx
      .insert(idempotencyKeysTable)
      .values({ merchantId: input.merchantId, key: idempotencyKey, requestHash, response: {}, statusCode: STATUS_CODES.CREATED, expiresAt })
      .onConflictDoNothing({ target: [idempotencyKeysTable.merchantId, idempotencyKeysTable.key] })
      .returning();

    if (!idempotencyRecord) {
      const [conflict] = await tx.select().from(idempotencyKeysTable).where(and(eq(idempotencyKeysTable.merchantId, input.merchantId), eq(idempotencyKeysTable.key, idempotencyKey))).limit(1);
      if (!conflict) throw new AppError(STATUS_CODES.CONFLICT, "Unable to acquire idempotency key");
      assertRequestHash(conflict.requestHash, requestHash);
      return { replayed: true, statusCode: conflict.statusCode, response: conflict.response };
    }

    const [payment] = await tx.insert(paymentsTable).values({
      merchantId: input.merchantId,
      reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      status: "PROCESSING",
      description: input.description,
      customerId: input.customerId,
      metadata: input.metadata,
    }).returning();

    await recordPaymentEvent(payment.id, "payment.created", "PENDING", "PROCESSING", {}, tx);

    const attemptNumber = 1;
    const [attempt] = await tx.insert(paymentAttemptsTable).values({
      paymentId: payment.id,
      attemptNumber,
      provider: paymentProvider.name,
      status: "PROCESSING",
      amount: payment.amount,
    }).returning();

    const providerResult = await paymentProvider.createPayment({ paymentId: payment.id, amount: payment.amount, currency: payment.currency, attemptNumber });
    const attemptStatus = providerResult.status === "SUCCEEDED" ? "SUCCEEDED" : providerResult.status === "FAILED" ? "FAILED" : "PROCESSING";
    await tx.update(paymentAttemptsTable).set({
      status: attemptStatus,
      providerPaymentId: providerResult.providerPaymentId,
      failureCode: providerResult.failureCode,
      failureMessage: providerResult.failureMessage,
      providerResponse: providerResult.response,
      processedAt: providerResult.status === "PROCESSING" ? undefined : new Date(),
      updatedAt: new Date(),
    }).where(eq(paymentAttemptsTable.id, attempt.id));

    const nextStatus = providerResult.status;
    const [updatedPayment] = await tx.update(paymentsTable).set({
      status: nextStatus,
      succeededAt: nextStatus === "SUCCEEDED" ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(paymentsTable.id, payment.id)).returning();

    await recordPaymentEvent(payment.id, `payment.${nextStatus.toLowerCase()}`, "PROCESSING", nextStatus, {
      attemptId: attempt.id,
      failureCode: providerResult.failureCode,
    }, tx);

    const response = { ...updatedPayment, attempt: { ...attempt, status: attemptStatus, providerPaymentId: providerResult.providerPaymentId, failureCode: providerResult.failureCode, failureMessage: providerResult.failureMessage, providerResponse: providerResult.response } };
    await tx.update(idempotencyKeysTable).set({ response }).where(eq(idempotencyKeysTable.id, idempotencyRecord.id));

    return { replayed: false, statusCode: STATUS_CODES.CREATED, response };
  });
}

export async function getPayment(paymentId: number, merchantId: number) {
  const [payment] = await db.select().from(paymentsTable).where(and(eq(paymentsTable.id, paymentId), eq(paymentsTable.merchantId, merchantId))).limit(1);
  if (!payment) throw new AppError(STATUS_CODES.NOT_FOUND, "Payment not found");
  const attempts = await db.select().from(paymentAttemptsTable).where(eq(paymentAttemptsTable.paymentId, paymentId)).orderBy(paymentAttemptsTable.attemptNumber);
  return { ...payment, attempts };
}

export async function listPayments(input: ListPaymentsInput) {
  const offset = (input.page - 1) * input.limit;
  const filters = [eq(paymentsTable.merchantId, input.merchantId)];
  if (input.status) filters.push(eq(paymentsTable.status, input.status));
  if (input.customerId) filters.push(eq(paymentsTable.customerId, input.customerId));
  if (input.reference) filters.push(ilike(paymentsTable.reference, `%${input.reference}%`));

  const where = and(...filters);
  const items = await db.select().from(paymentsTable).where(where).orderBy(desc(paymentsTable.createdAt)).limit(input.limit).offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(paymentsTable).where(where);
  const totalNumber = Number(total);
  return { items, page: input.page, limit: input.limit, total: totalNumber, totalPages: Math.ceil(totalNumber / input.limit) };
}
