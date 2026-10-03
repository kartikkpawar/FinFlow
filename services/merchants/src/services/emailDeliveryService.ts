import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM;
const WEB_APP_URL = process.env.WEB_APP_URL;

function getTransporter() {
  if (!SMTP_HOST || !SMTP_FROM) {
    throw new Error(
      "SMTP_HOST and SMTP_FROM must be configured for invitation email delivery",
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth:
      SMTP_USER && SMTP_PASSWORD
        ? { user: SMTP_USER, pass: SMTP_PASSWORD }
        : undefined,
  });
}

export async function sendMerchantInvitationEmail(input: {
  email: string;
  merchantName: string;
  role: string;
  token: string;
}) {
  if (!WEB_APP_URL)
    throw new Error(
      "WEB_APP_URL must be configured for invitation email delivery",
    );

  const invitationUrl = `${WEB_APP_URL.replace(/\/$/, "")}/accept-invitation?token=${encodeURIComponent(input.token)}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: SMTP_FROM,
    to: input.email,
    subject: `You're invited to join ${input.merchantName} on FinFlow`,
    text: [
      `You have been invited to join ${input.merchantName} as ${input.role}.`,
      "",
      `Accept the invitation: ${invitationUrl}`,
      "",
      "This invitation expires in 7 days.",
    ].join("\n"),
    html: `<!doctype html><html><body><h2>You're invited to FinFlow</h2><p>You have been invited to join <strong>${escapeHtml(input.merchantName)}</strong> as <strong>${escapeHtml(input.role)}</strong>.</p><p><a href="${escapeHtml(invitationUrl)}">Accept invitation</a></p><p>This invitation expires in 7 days.</p></body></html>`,
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}
