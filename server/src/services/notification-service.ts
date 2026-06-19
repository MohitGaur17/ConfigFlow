import crypto from "crypto";
import nodemailer from "nodemailer";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { publishToUser } from "./notification-bus";

const prisma = new PrismaClient();

export type NotificationType = "auth" | "app" | "entity" | "system";

export interface NotificationItem {
  id: string;
  userId: string;
  appId?: string | null;
  entityName?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface MockEmailItem {
  id: string;
  userId?: string | null;
  appId?: string | null;
  to: string;
  subject: string;
  body: string;
  eventType: NotificationType;
  provider: string;
  status: string;
  providerMessageId?: string | null;
  error?: string | null;
  createdAt: string;
  sentAt?: string | null;
}

interface NotificationInput {
  userId: string;
  appId?: string;
  entityName?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  sendEmail?: boolean;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
    from,
  };
}

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function buildEmailSubject(notification: NotificationItem) {
  return notification.title;
}

function buildEmailHtml(notification: NotificationItem): string {
  const appUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const year = new Date().getFullYear();

  let actionUrl = appUrl;
  let ctaText = "Open ConfigFlow";
  let iconColor = "#3b82f6";
  let bgColor = "#eff6ff";

  // Customize by notification type
  if (notification.type === "auth") {
    iconColor = "#10b981";
    bgColor = "#ecfdf5";
    if (notification.message.includes("created successfully")) {
      ctaText = "Get Started";
    }
  } else if (notification.type === "app") {
    iconColor = "#8b5cf6";
    bgColor = "#f3f0ff";
    ctaText = "View Application";
    if (notification.appId) {
      actionUrl = `${appUrl}/dashboard`;
    }
  } else if (notification.type === "entity") {
    iconColor = "#f59e0b";
    bgColor = "#fffbeb";
    ctaText = "View Data";
    if (notification.appId) {
      actionUrl = `${appUrl}/builder/${notification.appId}`;
    }
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 700; color: #3b82f6; margin-bottom: 10px; }
    .content { background: ${bgColor}; border-left: 4px solid ${iconColor}; padding: 24px; border-radius: 8px; margin: 20px 0; }
    .title { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 12px 0; }
    .message { color: #374151; margin: 12px 0; font-size: 15px; }
    .meta { color: #6b7280; font-size: 13px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1); }
    .cta-button { display: inline-block; background: ${iconColor}; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 20px 0; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .timestamp { color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">ConfigFlow</div>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">App Builder & Configuration Engine</p>
    </div>

    <div class="content">
      <h2 class="title">${escapeHtml(notification.title)}</h2>
      <p class="message">${escapeHtml(notification.message)}</p>
      
      ${notification.appId ? `<p class="meta">Application: <strong>${notification.appId}</strong></p>` : ''}
      ${notification.entityName ? `<p class="meta">Entity: <strong>${notification.entityName}</strong></p>` : ''}
      <p class="timestamp">${new Date(notification.createdAt).toLocaleString()}</p>
    </div>

    <div style="text-align: center;">
      <a href="${actionUrl}" class="cta-button">${ctaText}</a>
    </div>

    <div class="footer">
      <p style="margin: 0; padding: 0;">You received this email because you have an account with ConfigFlow.</p>
      <p style="margin: 8px 0 0 0; padding: 0;">© ${year} ConfigFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function buildEmailBody(notification: NotificationItem) {
  const lines = [notification.title, "", notification.message];

  if (notification.appId) {
    lines.push("", `App ID: ${notification.appId}`);
  }

  if (notification.entityName) {
    lines.push(`Entity: ${notification.entityName}`);
  }

  lines.push("", `Event type: ${notification.type}`);

  return lines.join("\n");
}

async function getUserEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user?.email || null;
}

async function createEmailDelivery(input: {
  userId?: string | null;
  appId?: string | null;
  notificationId?: string | null;
  to: string;
  subject: string;
  body: string;
  eventType: NotificationType;
  provider: string;
  status: string;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
}) {
  const delivery = await prisma.emailDelivery.create({
    data: {
      userId: input.userId || null,
      appId: input.appId || null,
      notificationId: input.notificationId || null,
      to: input.to,
      subject: input.subject,
      body: input.body,
      eventType: input.eventType,
      provider: input.provider,
      status: input.status,
      providerMessageId: input.providerMessageId || null,
      error: input.error || null,
      sentAt: input.sentAt || null,
    },
  });

  return delivery;
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  body: string;
  htmlBody?: string;
  eventType: NotificationType;
  userId?: string | null;
  appId?: string | null;
  notificationId?: string | null;
}) {
  // ── 1. Try Brevo HTTP API (works on Render / any cloud — no SMTP port needed) ──
  const brevo = getBrevoConfig();
  if (brevo) {
    try {
      // Parse "Display Name <email@domain.com>" or plain "email@domain.com"
      const fromMatch = brevo.from.match(/^(.+)<(.+)>$/);
      const senderEmail = fromMatch ? fromMatch[2].trim() : brevo.from.trim();
      const senderName = fromMatch ? fromMatch[1].trim() : "ConfigFlow";

      await withTimeout(
        axios.post(
          "https://api.brevo.com/v3/smtp/email",
          {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: params.to }],
            subject: params.subject,
            textContent: params.body,
            htmlContent: params.htmlBody || params.body.replace(/\n/g, "<br />"),
          },
          {
            headers: {
              "api-key": brevo.apiKey,
              "Content-Type": "application/json",
            },
          }
        ),
        15000,
        "Brevo API send"
      );

      return createEmailDelivery({
        userId: params.userId,
        appId: params.appId,
        notificationId: params.notificationId,
        to: params.to,
        subject: params.subject,
        body: params.body,
        eventType: params.eventType,
        provider: "brevo-api",
        status: "sent",
        providerMessageId: crypto.randomUUID(),
        sentAt: new Date(),
      });
    } catch (error: any) {
      console.error("[Mail] Brevo API send failed:", error?.response?.data || error?.message || error);
      // fall through to SMTP
    }
  }

  // ── 2. Try SMTP (works locally; blocked on some cloud hosts) ──
  const smtp = getSmtpConfig();

  if (!smtp) {
    // ── 3. Mock mode (no email config at all) ──
    return createEmailDelivery({
      userId: params.userId,
      appId: params.appId,
      notificationId: params.notificationId,
      to: params.to,
      subject: params.subject,
      body: params.body,
      eventType: params.eventType,
      provider: "mock",
      status: "mock-sent",
      providerMessageId: crypto.randomUUID(),
      sentAt: new Date(),
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    const result = await withTimeout(
      transporter.sendMail({
      from: smtp.from,
      to: params.to,
      subject: params.subject,
      text: params.body,
      html: params.htmlBody || params.body.replace(/\n/g, "<br />"),
      }),
      15000,
      "SMTP send"
    );

    return createEmailDelivery({
      userId: params.userId,
      appId: params.appId,
      notificationId: params.notificationId,
      to: params.to,
      subject: params.subject,
      body: params.body,
      eventType: params.eventType,
      provider: "smtp",
      status: "sent",
      providerMessageId: result.messageId,
      sentAt: new Date(),
    });
  } catch (error: any) {
    console.error("[Mail] SMTP send failed:", error);
    return createEmailDelivery({
      userId: params.userId,
      appId: params.appId,
      notificationId: params.notificationId,
      to: params.to,
      subject: params.subject,
      body: params.body,
      eventType: params.eventType,
      provider: "smtp",
      status: "failed",
      error: error?.message || "Failed to send email",
    });
  }
}

export async function recordNotification(input: NotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      appId: input.appId || null,
      entityName: input.entityName || null,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ? (input.metadata as any) : undefined,
    },
  });

  if (input.sendEmail) {
    // Fire-and-forget email sending (async, non-blocking)
    // This prevents email delays from blocking auth/login responses
    (async () => {
      try {
        const email = await getUserEmail(input.userId);
        if (email) {
          const notificationItem = mapNotification(notification);
          await sendTransactionalEmail({
            to: email,
            subject: buildEmailSubject(notificationItem),
            body: buildEmailBody(notificationItem),
            htmlBody: buildEmailHtml(notificationItem),
            eventType: input.type,
            userId: input.userId,
            appId: input.appId || null,
            notificationId: notification.id,
          });
        }
      } catch (error) {
        console.error("[Mail] Failed to send transactional email:", error);
      }
    })();
  }

  const mapped = mapNotification(notification);

  try {
    publishToUser(mapped.userId, "notification", mapped);
  } catch (e) {
    // non-fatal if publishing fails
    console.warn("[Notifications] Failed to publish SSE event:", e);
  }

  return mapped;

}

export async function listNotifications(userId: string, appId?: string) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(appId ? { appId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notifications.map(mapNotification);
}

export async function listMockEmails(userId: string) {
  const deliveries = await prisma.emailDelivery.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return deliveries.map(mapEmailDelivery);
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return mapNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { count: result.count };
}

function mapNotification(notification: {
  id: string;
  userId: string;
  appId: string | null;
  entityName: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: unknown;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    userId: notification.userId,
    appId: notification.appId,
    entityName: notification.entityName,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
    metadata: (notification.metadata as Record<string, unknown> | null) || null,
  } satisfies NotificationItem;
}

function mapEmailDelivery(delivery: {
  id: string;
  userId: string | null;
  appId: string | null;
  to: string;
  subject: string;
  body: string;
  eventType: string;
  provider: string;
  status: string;
  providerMessageId: string | null;
  error: string | null;
  createdAt: Date;
  sentAt: Date | null;
}) {
  return {
    id: delivery.id,
    userId: delivery.userId,
    appId: delivery.appId,
    to: delivery.to,
    subject: delivery.subject,
    body: delivery.body,
    eventType: delivery.eventType as NotificationType,
    provider: delivery.provider,
    status: delivery.status,
    providerMessageId: delivery.providerMessageId,
    error: delivery.error,
    createdAt: delivery.createdAt.toISOString(),
    sentAt: delivery.sentAt ? delivery.sentAt.toISOString() : null,
  } satisfies MockEmailItem;
}
