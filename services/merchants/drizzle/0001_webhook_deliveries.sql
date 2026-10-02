CREATE TYPE "public"."merchant_webhook_delivery_status" AS ENUM('PENDING','DELIVERED','FAILED');

CREATE TABLE IF NOT EXISTS "merchant_webhook_deliveries" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id") ON DELETE CASCADE,
  "webhook_id" integer NOT NULL REFERENCES "merchant_webhooks"("id") ON DELETE CASCADE,
  "event" varchar(100) NOT NULL,
  "payload" jsonb NOT NULL,
  "status" "merchant_webhook_delivery_status" DEFAULT 'PENDING' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamptz DEFAULT now() NOT NULL,
  "last_status_code" integer,
  "last_error" text,
  "delivered_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "merchant_webhook_deliveries_pending_idx" ON "merchant_webhook_deliveries" ("status","next_attempt_at");
CREATE INDEX IF NOT EXISTS "merchant_webhook_deliveries_merchant_idx" ON "merchant_webhook_deliveries" ("merchant_id","created_at");
