import { db } from "../db";
import { paymentEventsTable } from "../db/schema";

export async function recordPaymentEvent(
  paymentId: number,
  eventType: string,
  previousStatus: string | null,
  newStatus: string | null,
  metadata: Record<string, unknown> = {},
  tx = db,
) {
  await tx.insert(paymentEventsTable).values({
    paymentId,
    eventType,
    previousStatus: previousStatus ?? undefined,
    newStatus: newStatus ?? undefined,
    metadata,
  });
}
