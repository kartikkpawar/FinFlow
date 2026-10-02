CREATE TYPE "public"."merchant_status" AS ENUM('PENDING','ACTIVE','SUSPENDED','INACTIVE','REJECTED');
CREATE TYPE "public"."merchant_role" AS ENUM('MERCHANT_ADMIN','MERCHANT_USER');
CREATE TYPE "public"."merchant_invitation_status" AS ENUM('PENDING','ACCEPTED','EXPIRED','REVOKED');

CREATE TABLE IF NOT EXISTS "merchants" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "business_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "phone" varchar(15) NOT NULL UNIQUE,
  "status" "merchant_status" DEFAULT 'PENDING' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "modified_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "merchant_users" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL,
  "role" "merchant_role" DEFAULT 'MERCHANT_USER' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "modified_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_users_merchant_user_unique" ON "merchant_users" ("merchant_id","user_id");
CREATE INDEX IF NOT EXISTS "merchant_users_user_id_idx" ON "merchant_users" ("user_id");

CREATE TABLE IF NOT EXISTS "merchant_settings" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "merchant_id" integer NOT NULL UNIQUE REFERENCES "merchants"("id") ON DELETE CASCADE,
  "timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
  "currency" varchar(3) DEFAULT 'USD' NOT NULL,
  "notifications_enabled" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "modified_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "merchant_invitations" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "role" "merchant_role" DEFAULT 'MERCHANT_USER' NOT NULL,
  "status" "merchant_invitation_status" DEFAULT 'PENDING' NOT NULL,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "invited_by" integer NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "accepted_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "merchant_invitations_merchant_email_idx" ON "merchant_invitations" ("merchant_id","email");
CREATE TABLE IF NOT EXISTS "merchant_api_keys" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "prefix" varchar(24) NOT NULL,
  "key_hash" varchar(64) NOT NULL UNIQUE,
  "created_by" integer NOT NULL,
  "last_used_at" timestamptz,
  "expires_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "merchant_api_keys_merchant_idx" ON "merchant_api_keys" ("merchant_id");
CREATE TABLE IF NOT EXISTS "merchant_webhooks" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id") ON DELETE CASCADE,
  "url" varchar(2048) NOT NULL,
  "secret_prefix" varchar(24) NOT NULL,
  "secret_hash" varchar(64) NOT NULL,
  "events" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_by" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "modified_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "merchant_webhooks_merchant_idx" ON "merchant_webhooks" ("merchant_id");
CREATE TABLE IF NOT EXISTS "merchant_audit_logs" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "merchant_id" integer NOT NULL REFERENCES "merchants"("id") ON DELETE CASCADE,
  "actor_user_id" integer NOT NULL,
  "action" varchar(100) NOT NULL,
  "resource_type" varchar(100) NOT NULL,
  "resource_id" varchar(100),
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "ip_address" varchar(64),
  "user_agent" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "merchant_audit_logs_merchant_created_idx" ON "merchant_audit_logs" ("merchant_id","created_at");
