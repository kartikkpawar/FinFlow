import { createHmac } from "node:crypto";
import { and, eq, lte } from "drizzle-orm";
import { db } from "../db";
import { merchantWebhookDeliveriesTable, merchantWebhooksTable } from "../db/schema";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;
const RETRY_DELAYS_MS = [30_000, 60_000, 5 * 60_000, 15 * 60_000];

export async function enqueueWebhookEvent(merchantId: number, event: string, payload: Record<string, unknown>) {
  const webhooks = await db.select({ id: merchantWebhooksTable.id, events: merchantWebhooksTable.events }).from(merchantWebhooksTable).where(and(eq(merchantWebhooksTable.merchantId, merchantId), eq(merchantWebhooksTable.enabled, true)));
  const matching = webhooks.filter((webhook) => webhook.events.includes(event) || webhook.events.includes("*"));
  for (const webhook of matching) await db.insert(merchantWebhookDeliveriesTable).values({ merchantId, webhookId: webhook.id, event, payload });
  return matching.length;
}

async function deliver(id: number) {
  const [delivery] = await db.select({ id: merchantWebhookDeliveriesTable.id, webhookId: merchantWebhookDeliveriesTable.webhookId, event: merchantWebhookDeliveriesTable.event, payload: merchantWebhookDeliveriesTable.payload, attempts: merchantWebhookDeliveriesTable.attempts, url: merchantWebhooksTable.url, secretHash: merchantWebhooksTable.secretHash }).from(merchantWebhookDeliveriesTable).innerJoin(merchantWebhooksTable, eq(merchantWebhooksTable.id, merchantWebhookDeliveriesTable.webhookId)).where(eq(merchantWebhookDeliveriesTable.id, id)).limit(1);
  if (!delivery) return;

  const body = JSON.stringify({ id: delivery.id, event: delivery.event, data: delivery.payload });
  const signature = createHmac("sha256", delivery.secretHash).update(body).digest("hex");
  const attempts = delivery.attempts + 1;

  try {
    const response = await fetch(delivery.url, { method: "POST", headers: { "content-type": "application/json", "user-agent": "FinFlow-Webhooks/1.0", "x-finflow-event": delivery.event, "x-finflow-delivery-id": String(delivery.id), "x-finflow-signature": `sha256=${signature}` }, body, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
    await db.update(merchantWebhookDeliveriesTable).set({ status: "DELIVERED", attempts, lastStatusCode: response.status, lastError: null, deliveredAt: new Date() }).where(eq(merchantWebhookDeliveriesTable.id, id));
  } catch (error) {
    const failed = attempts >= MAX_ATTEMPTS;
    await db.update(merchantWebhookDeliveriesTable).set({ status: failed ? "FAILED" : "PENDING", attempts, lastStatusCode: null, lastError: error instanceof Error ? error.message.slice(0, 1000) : "Webhook delivery failed", nextAttemptAt: failed ? new Date() : new Date(Date.now() + RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)]) }).where(eq(merchantWebhookDeliveriesTable.id, id));
  }
}

export async function processWebhookDeliveries() {
  const deliveries = await db.select({ id: merchantWebhookDeliveriesTable.id }).from(merchantWebhookDeliveriesTable).where(and(eq(merchantWebhookDeliveriesTable.status, "PENDING"), lte(merchantWebhookDeliveriesTable.nextAttemptAt, new Date()))).limit(BATCH_SIZE);
  for (const delivery of deliveries) await deliver(delivery.id);
}
