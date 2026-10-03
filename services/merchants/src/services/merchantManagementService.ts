import { and, desc, eq } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { AppError, STATUS_CODES } from "@finflow/shared";
import { db } from "../db";
import {
  merchantApiKeysTable,
  merchantAuditLogsTable,
  merchantInvitationsTable,
  merchantSettingsTable,
  merchantUsersTable,
  merchantWebhooksTable,
  merchantsTable,
} from "../db/schema";
import type { Identity } from "../types/merchant";
import type { ManagedMerchantRole } from "../schemas/management";
import { enqueueWebhookEvent } from "./webhookDeliveryService";
import { sendMerchantInvitationEmail } from "./emailDeliveryService";

const GLOBAL_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);
const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["merchant:read", "merchant:update"],
  SUPPORT: ["merchant:read"],
  MERCHANT_ADMIN: ["merchant:read", "merchant:update"],
  MERCHANT_USER: [],
  ANALYST: [],
};

export function assertPermission(
  identity: Identity,
  permission: "merchant:read" | "merchant:update",
) {
  const permissions = PERMISSIONS[identity.role] ?? [];
  if (!permissions.includes("*") && !permissions.includes(permission))
    throw new AppError(STATUS_CODES.FORBIDDEN, "Insufficient permissions");
}
export async function assertScope(merchantId: number, identity: Identity) {
  if (GLOBAL_ROLES.has(identity.role)) return;
  const [membership] = await db
    .select({ id: merchantUsersTable.id })
    .from(merchantUsersTable)
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, identity.userId),
      ),
    )
    .limit(1);
  if (!membership)
    throw new AppError(STATUS_CODES.FORBIDDEN, "Merchant access denied");
}
function secret(prefix: string) {
  const raw = `${prefix}_${randomBytes(24).toString("hex")}`;
  return {
    raw,
    prefix: raw.slice(0, 12),
    hash: createHash("sha256").update(raw).digest("hex"),
  };
}
async function audit(
  merchantId: number,
  identity: Identity,
  action: string,
  resourceType: string,
  resourceId?: number,
  metadata?: Record<string, unknown>,
) {
  await db
    .insert(merchantAuditLogsTable)
    .values({
      merchantId,
      actorUserId: identity.userId,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : undefined,
      metadata: metadata ?? {},
    });
}

export async function listMerchantUsers(
  merchantId: number,
  identity: Identity,
) {
  await assertScope(merchantId, identity);
  return db
    .select()
    .from(merchantUsersTable)
    .where(eq(merchantUsersTable.merchantId, merchantId))
    .orderBy(desc(merchantUsersTable.createdAt));
}
export async function getMerchantUser(
  merchantId: number,
  userId: number,
  identity: Identity,
) {
  await assertScope(merchantId, identity);
  const [membership] = await db
    .select()
    .from(merchantUsersTable)
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, userId),
      ),
    )
    .limit(1);
  if (!membership)
    throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant user not found");
  return membership;
}
export async function addMerchantUser(
  merchantId: number,
  identity: Identity,
  userId: number,
  role: ManagedMerchantRole,
) {
  await assertScope(merchantId, identity);
  const [existing] = await db
    .select({ id: merchantUsersTable.id })
    .from(merchantUsersTable)
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, userId),
      ),
    )
    .limit(1);
  if (existing)
    throw new AppError(
      STATUS_CODES.CONFLICT,
      "User is already a member of this merchant",
    );
  const [membership] = await db
    .insert(merchantUsersTable)
    .values({ merchantId, userId, role })
    .returning();
  await audit(
    merchantId,
    identity,
    "merchant_user.created",
    "merchant_user",
    membership.id,
    { userId, role },
  );
  return membership;
}
export async function updateMerchantUser(
  merchantId: number,
  userId: number,
  identity: Identity,
  role: ManagedMerchantRole,
) {
  const current = await getMerchantUser(merchantId, userId, identity);
  if (current.role === "MERCHANT_ADMIN" && role !== "MERCHANT_ADMIN") {
    const admins = await db
      .select({ id: merchantUsersTable.id })
      .from(merchantUsersTable)
      .where(
        and(
          eq(merchantUsersTable.merchantId, merchantId),
          eq(merchantUsersTable.role, "MERCHANT_ADMIN"),
        ),
      );
    if (admins.length <= 1)
      throw new AppError(
        STATUS_CODES.BAD_REQUEST,
        "Merchant must retain at least one merchant admin",
      );
  }
  const [updated] = await db
    .update(merchantUsersTable)
    .set({ role, modifiedAt: new Date() })
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, userId),
      ),
    )
    .returning();
  await audit(
    merchantId,
    identity,
    "merchant_user.updated",
    "merchant_user",
    updated.id,
    { userId, role },
  );
  return updated;
}
export async function removeMerchantUser(
  merchantId: number,
  userId: number,
  identity: Identity,
) {
  const current = await getMerchantUser(merchantId, userId, identity);
  if (current.role === "MERCHANT_ADMIN") {
    const admins = await db
      .select({ id: merchantUsersTable.id })
      .from(merchantUsersTable)
      .where(
        and(
          eq(merchantUsersTable.merchantId, merchantId),
          eq(merchantUsersTable.role, "MERCHANT_ADMIN"),
        ),
      );
    if (admins.length <= 1)
      throw new AppError(
        STATUS_CODES.BAD_REQUEST,
        "Merchant must retain at least one merchant admin",
      );
  }
  await db
    .delete(merchantUsersTable)
    .where(
      and(
        eq(merchantUsersTable.merchantId, merchantId),
        eq(merchantUsersTable.userId, userId),
      ),
    );
  await audit(
    merchantId,
    identity,
    "merchant_user.deleted",
    "merchant_user",
    current.id,
    { userId },
  );
}
export async function getSettings(merchantId: number, identity: Identity) {
  await assertScope(merchantId, identity);
  let [settings] = await db
    .select()
    .from(merchantSettingsTable)
    .where(eq(merchantSettingsTable.merchantId, merchantId))
    .limit(1);
  if (!settings)
    [settings] = await db
      .insert(merchantSettingsTable)
      .values({ merchantId })
      .returning();
  return settings;
}
export async function updateSettings(
  merchantId: number,
  identity: Identity,
  input: Partial<{
    timezone: string;
    currency: string;
    notificationsEnabled: boolean;
    metadata: Record<string, unknown>;
  }>,
) {
  await assertScope(merchantId, identity);
  const current = await getSettings(merchantId, identity);
  const [settings] = await db
    .update(merchantSettingsTable)
    .set({ ...input, modifiedAt: new Date() })
    .where(eq(merchantSettingsTable.id, current.id))
    .returning();
  await audit(
    merchantId,
    identity,
    "merchant_settings.updated",
    "merchant_settings",
    settings.id,
  );
  return settings;
}

export async function createInvitation(
  merchantId: number,
  identity: Identity,
  email: string,
  role: ManagedMerchantRole,
) {
  await assertScope(merchantId, identity);
  const pending = await db
    .select({ id: merchantInvitationsTable.id })
    .from(merchantInvitationsTable)
    .where(
      and(
        eq(merchantInvitationsTable.merchantId, merchantId),
        eq(merchantInvitationsTable.email, email),
        eq(merchantInvitationsTable.status, "PENDING"),
      ),
    );
  if (pending.length)
    throw new AppError(
      STATUS_CODES.CONFLICT,
      "A pending invitation already exists for this email",
    );
  const [merchant] = await db
    .select({ businessName: merchantsTable.businessName })
    .from(merchantsTable)
    .where(eq(merchantsTable.id, merchantId))
    .limit(1);
  if (!merchant)
    throw new AppError(STATUS_CODES.NOT_FOUND, "Merchant not found");
  const token = secret("invite");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const [invitation] = await db
    .insert(merchantInvitationsTable)
    .values({
      merchantId,
      email,
      role,
      tokenHash: token.hash,
      invitedBy: identity.userId,
      expiresAt,
    })
    .returning();
  await audit(
    merchantId,
    identity,
    "merchant_invitation.created",
    "merchant_invitation",
    invitation.id,
    { email, role },
  );
  try {
    await sendMerchantInvitationEmail({
      email,
      merchantName: merchant.businessName,
      role,
      token: token.raw,
    });
    await audit(
      merchantId,
      identity,
      "merchant_invitation.email_sent",
      "merchant_invitation",
      invitation.id,
      { email },
    );
  } catch (error) {
    await audit(
      merchantId,
      identity,
      "merchant_invitation.email_failed",
      "merchant_invitation",
      invitation.id,
      {
        email,
        error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Unknown email delivery error",
      },
    );
    throw new AppError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Invitation created but email delivery is unavailable",
    );
  }
  return { ...invitation, token: token.raw };
}

export async function acceptInvitation(identity: Identity, rawToken: string) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select()
      .from(merchantInvitationsTable)
      .where(eq(merchantInvitationsTable.tokenHash, tokenHash))
      .limit(1);
    if (!invitation)
      throw new AppError(STATUS_CODES.NOT_FOUND, "Invitation not found");
    if (invitation.status !== "PENDING")
      throw new AppError(
        STATUS_CODES.BAD_REQUEST,
        "Invitation is no longer active",
      );
    if (invitation.expiresAt <= new Date()) {
      await tx
        .update(merchantInvitationsTable)
        .set({ status: "EXPIRED" })
        .where(eq(merchantInvitationsTable.id, invitation.id));
      throw new AppError(STATUS_CODES.BAD_REQUEST, "Invitation has expired");
    }
    if (invitation.email.toLowerCase() !== identity.email.toLowerCase())
      throw new AppError(
        STATUS_CODES.FORBIDDEN,
        "Invitation email does not match the authenticated user",
      );
    const [existing] = await tx
      .select({ id: merchantUsersTable.id })
      .from(merchantUsersTable)
      .where(
        and(
          eq(merchantUsersTable.merchantId, invitation.merchantId),
          eq(merchantUsersTable.userId, identity.userId),
        ),
      )
      .limit(1);
    if (existing)
      throw new AppError(
        STATUS_CODES.CONFLICT,
        "User is already a member of this merchant",
      );
    const [membership] = await tx
      .insert(merchantUsersTable)
      .values({
        merchantId: invitation.merchantId,
        userId: identity.userId,
        role: invitation.role,
      })
      .returning();
    await tx
      .update(merchantInvitationsTable)
      .set({ status: "ACCEPTED", acceptedAt: new Date() })
      .where(eq(merchantInvitationsTable.id, invitation.id));
    await tx
      .insert(merchantAuditLogsTable)
      .values({
        merchantId: invitation.merchantId,
        actorUserId: identity.userId,
        action: "merchant_invitation.accepted",
        resourceType: "merchant_invitation",
        resourceId: String(invitation.id),
        metadata: { role: invitation.role },
      });
    return { merchantId: invitation.merchantId, membership };
  });
}

export async function listInvitations(merchantId: number, identity: Identity) {
  await assertScope(merchantId, identity);
  const invitations = await db
    .select()
    .from(merchantInvitationsTable)
    .where(eq(merchantInvitationsTable.merchantId, merchantId))
    .orderBy(desc(merchantInvitationsTable.createdAt));
  const now = new Date();
  return invitations.map((invitation) =>
    invitation.status === "PENDING" && invitation.expiresAt < now
      ? { ...invitation, status: "EXPIRED" as const }
      : invitation,
  );
}
export async function revokeInvitation(
  merchantId: number,
  invitationId: number,
  identity: Identity,
) {
  await assertScope(merchantId, identity);
  const [invitation] = await db
    .select()
    .from(merchantInvitationsTable)
    .where(
      and(
        eq(merchantInvitationsTable.id, invitationId),
        eq(merchantInvitationsTable.merchantId, merchantId),
      ),
    )
    .limit(1);
  if (!invitation)
    throw new AppError(STATUS_CODES.NOT_FOUND, "Invitation not found");
  if (invitation.status !== "PENDING")
    throw new AppError(
      STATUS_CODES.BAD_REQUEST,
      "Only pending invitations can be revoked",
    );
  const [updated] = await db
    .update(merchantInvitationsTable)
    .set({ status: "REVOKED" })
    .where(eq(merchantInvitationsTable.id, invitationId))
    .returning();
  await audit(
    merchantId,
    identity,
    "merchant_invitation.revoked",
    "merchant_invitation",
    invitationId,
  );
  return updated;
}
export async function createApiKey(
  merchantId: number,
  identity: Identity,
  name: string,
  expiresAt?: Date,
) {
  await assertScope(merchantId, identity);
  const value = secret("ff_live");
  const [key] = await db
    .insert(merchantApiKeysTable)
    .values({
      merchantId,
      name,
      prefix: value.prefix,
      keyHash: value.hash,
      createdBy: identity.userId,
      expiresAt,
    })
    .returning({
      id: merchantApiKeysTable.id,
      merchantId: merchantApiKeysTable.merchantId,
      name: merchantApiKeysTable.name,
      prefix: merchantApiKeysTable.prefix,
      expiresAt: merchantApiKeysTable.expiresAt,
      createdAt: merchantApiKeysTable.createdAt,
    });
  await audit(
    merchantId,
    identity,
    "merchant_api_key.created",
    "merchant_api_key",
    key.id,
    { name },
  );
  return { ...key, secret: value.raw };
}
export async function listApiKeys(merchantId: number, identity: Identity) {
  await assertScope(merchantId, identity);
  return db
    .select({
      id: merchantApiKeysTable.id,
      merchantId: merchantApiKeysTable.merchantId,
      name: merchantApiKeysTable.name,
      prefix: merchantApiKeysTable.prefix,
      lastUsedAt: merchantApiKeysTable.lastUsedAt,
      expiresAt: merchantApiKeysTable.expiresAt,
      revokedAt: merchantApiKeysTable.revokedAt,
      createdAt: merchantApiKeysTable.createdAt,
    })
    .from(merchantApiKeysTable)
    .where(eq(merchantApiKeysTable.merchantId, merchantId))
    .orderBy(desc(merchantApiKeysTable.createdAt));
}
export async function revokeApiKey(
  merchantId: number,
  keyId: number,
  identity: Identity,
) {
  await assertScope(merchantId, identity);
  const [key] = await db
    .update(merchantApiKeysTable)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(merchantApiKeysTable.id, keyId),
        eq(merchantApiKeysTable.merchantId, merchantId),
      ),
    )
    .returning({ id: merchantApiKeysTable.id });
  if (!key) throw new AppError(STATUS_CODES.NOT_FOUND, "API key not found");
  await audit(
    merchantId,
    identity,
    "merchant_api_key.revoked",
    "merchant_api_key",
    keyId,
  );
  return key;
}
export async function createWebhook(
  merchantId: number,
  identity: Identity,
  input: { url: string; events: string[]; enabled: boolean },
) {
  await assertScope(merchantId, identity);
  const value = secret("whsec");
  const [webhook] = await db
    .insert(merchantWebhooksTable)
    .values({
      merchantId,
      url: input.url,
      events: input.events,
      enabled: input.enabled,
      secretPrefix: value.prefix,
      secretHash: value.hash,
      createdBy: identity.userId,
    })
    .returning({
      id: merchantWebhooksTable.id,
      merchantId: merchantWebhooksTable.merchantId,
      url: merchantWebhooksTable.url,
      secretPrefix: merchantWebhooksTable.secretPrefix,
      events: merchantWebhooksTable.events,
      enabled: merchantWebhooksTable.enabled,
      createdAt: merchantWebhooksTable.createdAt,
      modifiedAt: merchantWebhooksTable.modifiedAt,
    });
  await audit(
    merchantId,
    identity,
    "merchant_webhook.created",
    "merchant_webhook",
    webhook.id,
    { url: input.url },
  );
  return { ...webhook, secret: value.raw };
}
export async function listWebhooks(merchantId: number, identity: Identity) {
  await assertScope(merchantId, identity);
  return db
    .select({
      id: merchantWebhooksTable.id,
      merchantId: merchantWebhooksTable.merchantId,
      url: merchantWebhooksTable.url,
      secretPrefix: merchantWebhooksTable.secretPrefix,
      events: merchantWebhooksTable.events,
      enabled: merchantWebhooksTable.enabled,
      createdAt: merchantWebhooksTable.createdAt,
      modifiedAt: merchantWebhooksTable.modifiedAt,
    })
    .from(merchantWebhooksTable)
    .where(eq(merchantWebhooksTable.merchantId, merchantId))
    .orderBy(desc(merchantWebhooksTable.createdAt));
}
export async function updateWebhook(
  merchantId: number,
  webhookId: number,
  identity: Identity,
  input: Partial<{ url: string; events: string[]; enabled: boolean }>,
) {
  await assertScope(merchantId, identity);
  const [webhook] = await db
    .update(merchantWebhooksTable)
    .set({ ...input, modifiedAt: new Date() })
    .where(
      and(
        eq(merchantWebhooksTable.id, webhookId),
        eq(merchantWebhooksTable.merchantId, merchantId),
      ),
    )
    .returning({
      id: merchantWebhooksTable.id,
      merchantId: merchantWebhooksTable.merchantId,
      url: merchantWebhooksTable.url,
      secretPrefix: merchantWebhooksTable.secretPrefix,
      events: merchantWebhooksTable.events,
      enabled: merchantWebhooksTable.enabled,
      createdAt: merchantWebhooksTable.createdAt,
      modifiedAt: merchantWebhooksTable.modifiedAt,
    });
  if (!webhook) throw new AppError(STATUS_CODES.NOT_FOUND, "Webhook not found");
  await audit(
    merchantId,
    identity,
    "merchant_webhook.updated",
    "merchant_webhook",
    webhookId,
  );
  return webhook;
}
export async function deleteWebhook(
  merchantId: number,
  webhookId: number,
  identity: Identity,
) {
  await assertScope(merchantId, identity);
  const [webhook] = await db
    .delete(merchantWebhooksTable)
    .where(
      and(
        eq(merchantWebhooksTable.id, webhookId),
        eq(merchantWebhooksTable.merchantId, merchantId),
      ),
    )
    .returning({ id: merchantWebhooksTable.id });
  if (!webhook) throw new AppError(STATUS_CODES.NOT_FOUND, "Webhook not found");
  await audit(
    merchantId,
    identity,
    "merchant_webhook.deleted",
    "merchant_webhook",
    webhookId,
  );
  return webhook;
}
export async function listAuditLogs(
  merchantId: number,
  identity: Identity,
  page: number,
  limit: number,
) {
  await assertScope(merchantId, identity);
  const rows = await db
    .select()
    .from(merchantAuditLogsTable)
    .where(eq(merchantAuditLogsTable.merchantId, merchantId))
    .orderBy(desc(merchantAuditLogsTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  return { items: rows, page, limit, hasMore: rows.length === limit };
}

export { enqueueWebhookEvent };
