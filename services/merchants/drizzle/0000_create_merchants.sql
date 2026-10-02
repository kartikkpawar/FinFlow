CREATE TYPE "public"."merchant_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."merchant_role" AS ENUM ('MERCHANT_ADMIN', 'MERCHANT_USER');--> statement-breakpoint
CREATE TABLE "merchants" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "business_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(15) NOT NULL,
  "status" "merchant_status" DEFAULT 'PENDING' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "modified_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "merchants_email_unique" UNIQUE("email"),
  CONSTRAINT "merchants_phone_unique" UNIQUE("phone")
);--> statement-breakpoint
CREATE TABLE "merchant_users" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY NOT NULL,
  "merchant_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" "merchant_role" DEFAULT 'MERCHANT_USER' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "modified_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "merchant_users_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE
);--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_users_merchant_user_unique" ON "merchant_users" ("merchant_id", "user_id");--> statement-breakpoint
CREATE INDEX "merchant_users_user_id_idx" ON "merchant_users" ("user_id");
