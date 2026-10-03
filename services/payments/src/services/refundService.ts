import { and, desc, eq, sql } from "drizzle-orm";
import { AppError, STATUS_CODES } from "@finflow/shared";
import { db } from "../db";
import { paymentsTable, refundsTable } from "../db/schema";
import type { CreateRefundInput } from "../schemas/payment";
import { paymentProvider } from "../providers/mock/mockPaymentProvider";
import { recordPaymentEvent } from "./paymentEventService";

export async function createRefund(input: CreateRefundInput) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT id FROM payments WHERE id = ${input.paymentId} AND merchant_id = ${input.merchantId} FOR UPDATE`,
    );
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.id, input.paymentId),
          eq(paymentsTable.merchantId, input.merchantId),
        ),
      )
      .limit(1);
    if (!payment)
      throw new AppError(STATUS_CODES.NOT_FOUND, "Payment not found");
    if (payment.status !== "SUCCEEDED")
      throw new AppError(
        STATUS_CODES.BAD_REQUEST,
        "Only succeeded payments can be refunded",
      );

    const [{ refunded }] = await tx
      .select({
        refunded: sql<number>`COALESCE(SUM(CASE WHEN ${refundsTable.status} = 'SUCCEEDED' THEN ${refundsTable.amount} ELSE 0 END), 0)`,
      })
      .from(refundsTable)
      .where(eq(refundsTable.paymentId, payment.id));
    const refundedAmount = Number(refunded ?? 0);
    const remaining = payment.amount - refundedAmount;
    if (input.amount > remaining)
      throw new AppError(
        STATUS_CODES.BAD_REQUEST,
        `Refund amount exceeds refundable amount. Remaining refundable amount: ${remaining}`,
      );

    const [refund] = await tx
      .insert(refundsTable)
      .values({
        paymentId: payment.id,
        amount: input.amount,
        reason: input.reason,
        metadata: input.metadata,
        status: "PROCESSING",
      })
      .returning();

    await recordPaymentEvent(
      payment.id,
      "refund.created",
      null,
      null,
      { refundId: refund.id, amount: refund.amount },
      tx,
    );
    const providerResult = await paymentProvider.createRefund({
      paymentId: payment.id,
      refundId: refund.id,
      amount: refund.amount,
      currency: payment.currency,
    });
    const [updatedRefund] = await tx
      .update(refundsTable)
      .set({
        status: providerResult.status,
        providerRefundId: providerResult.providerRefundId,
        metadata: {
          ...input.metadata,
          providerResponse: providerResult.response,
          failureCode: providerResult.failureCode,
        },
        processedAt:
          providerResult.status === "PROCESSING" ? undefined : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(refundsTable.id, refund.id))
      .returning();

    await recordPaymentEvent(
      payment.id,
      `refund.${providerResult.status.toLowerCase()}`,
      "PROCESSING",
      providerResult.status,
      { refundId: refund.id, failureCode: providerResult.failureCode },
      tx,
    );
    return updatedRefund;
  });
}

export async function listPaymentRefunds(
  paymentId: number,
  merchantId: number,
) {
  const [payment] = await db
    .select({ id: paymentsTable.id })
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.id, paymentId),
        eq(paymentsTable.merchantId, merchantId),
      ),
    )
    .limit(1);
  if (!payment) throw new AppError(STATUS_CODES.NOT_FOUND, "Payment not found");
  return db
    .select()
    .from(refundsTable)
    .where(eq(refundsTable.paymentId, paymentId))
    .orderBy(desc(refundsTable.createdAt));
}

export async function getRefund(refundId: number, merchantId: number) {
  const [refund] = await db
    .select({
      id: refundsTable.id,
      paymentId: refundsTable.paymentId,
      amount: refundsTable.amount,
      reason: refundsTable.reason,
      status: refundsTable.status,
      providerRefundId: refundsTable.providerRefundId,
      metadata: refundsTable.metadata,
      processedAt: refundsTable.processedAt,
      createdAt: refundsTable.createdAt,
      updatedAt: refundsTable.updatedAt,
    })
    .from(refundsTable)
    .innerJoin(paymentsTable, eq(refundsTable.paymentId, paymentsTable.id))
    .where(
      and(
        eq(refundsTable.id, refundId),
        eq(paymentsTable.merchantId, merchantId),
      ),
    )
    .limit(1);
  if (!refund) throw new AppError(STATUS_CODES.NOT_FOUND, "Refund not found");
  return refund;
}
