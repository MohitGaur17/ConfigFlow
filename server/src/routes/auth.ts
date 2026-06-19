import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import axios from "axios";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { Prisma } from "@prisma/client";
import { generateToken, requireAuth, AuthRequest } from "../middleware/auth";
import { recordNotification, sendTransactionalEmail } from "../services/notification-service";

const router = Router();
const prisma = new PrismaClient();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";
const CLIENT_AUTH_CALLBACK_URL = process.env.CLIENT_AUTH_CALLBACK_URL || `${CLIENT_URL}/auth/callback`;

const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${SERVER_URL}/api/auth/google/callback`;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || `${SERVER_URL}/api/auth/github/callback`;
const VERIFICATION_TOKEN_TTL_MS = 30 * 60 * 1000;

const oauthStates = new Map<string, { provider: "google" | "github"; expiresAt: number }>();

function isUnsetOrPlaceholder(value: string | undefined) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes("placeholder") ||
    normalized.includes("your-google") ||
    normalized.includes("your-github") ||
    normalized.includes("replace")
  );
}

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || GOOGLE_REDIRECT_URI,
  };
}

function getGithubConfig() {
  return {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    redirectUri: process.env.GITHUB_REDIRECT_URI || GITHUB_REDIRECT_URI,
  };
}

function providerNotConfiguredError(provider: "google" | "github") {
  if (provider === "google") {
    return "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env.";
  }
  return "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in server/.env.";
}

function createOAuthState(provider: "google" | "github") {
  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, { provider, expiresAt: Date.now() + 10 * 60 * 1000 });
  return state;
}

function verifyOAuthState(state: string | undefined, provider: "google" | "github"): boolean {
  if (!state) return false;
  const payload = oauthStates.get(state);
  if (!payload) return false;
  oauthStates.delete(state);
  return payload.provider === provider && payload.expiresAt > Date.now();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  return { rawToken, tokenHash };
}

function buildVerificationLink(rawToken: string) {
  return `${SERVER_URL}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
}

async function createAndSendVerificationEmail(user: { id: string; email: string; name: string | null }) {
  const { rawToken, tokenHash } = createVerificationToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const verificationLink = buildVerificationLink(rawToken);
  const subject = "Verify your ConfigFlow email address";
  const body = [
    "Welcome to ConfigFlow.",
    "",
    `Verify your email address by opening this link: ${verificationLink}`,
    "",
    "This link expires in 30 minutes and can only be used once.",
    "If you did not create this account, you can ignore this message.",
  ].join("\n");
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 16px;">Verify your ConfigFlow email address</h2>
      <p style="margin: 0 0 16px;">Welcome to ConfigFlow${user.name ? `, ${user.name}` : ""}. Confirm this email address to finish creating your account.</p>
      <p style="margin: 0 0 24px;">
        <a href="${verificationLink}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Verify email</a>
      </p>
      <p style="margin: 0 0 8px;">Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #4f46e5; margin: 0 0 16px;">${verificationLink}</p>
      <p style="margin: 0; color: #6b7280;">This link expires in 30 minutes and can only be used once.</p>
    </div>
  `;

  const delivery = await sendTransactionalEmail({
    to: user.email,
    subject,
    body,
    htmlBody,
    eventType: "auth",
    userId: user.id,
  });

  return delivery.status !== "failed";
}

async function issueVerifiedSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const token = generateToken(user.id, user.email);
  return { token, user };
}

async function findOrCreateOAuthUser(email: string, name?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    if (!existing.emailVerifiedAt) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    return existing;
  }

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPassword, 12);
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || null,
      password: hashedPassword,
      emailVerifiedAt: new Date(),
    },
  });
}

function redirectToClientAuthSuccess(res: Response, token: string, user: { id: string; email: string; name: string | null }) {
  const userPayload = encodeURIComponent(JSON.stringify(user));
  const tokenPayload = encodeURIComponent(token);
  res.redirect(`${CLIENT_AUTH_CALLBACK_URL}?token=${tokenPayload}&user=${userPayload}`);
}

function redirectToClientAuthError(res: Response, message: string) {
  const encoded = encodeURIComponent(message);
  res.redirect(`${CLIENT_AUTH_CALLBACK_URL}?error=${encoded}`);
}

function isProviderConfigured(provider: "google" | "github") {
  if (provider === "google") {
    const cfg = getGoogleConfig();
    return !isUnsetOrPlaceholder(cfg.clientId) && !isUnsetOrPlaceholder(cfg.clientSecret);
  }
  const cfg = getGithubConfig();
  return !isUnsetOrPlaceholder(cfg.clientId) && !isUnsetOrPlaceholder(cfg.clientSecret);
}

function buildGoogleAuthUrl(state: string) {
  const cfg = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildGithubAuthUrl(state: string) {
  const cfg = getGithubConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// ============================================================
// Auth Routes — Register, Login, Get Current User
// ============================================================

/**
 * POST /api/auth/register
 * Create a new user account.
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";

    // Validate input
    if (!normalizedEmail || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: existingUser.emailVerifiedAt ? "Email already registered" : "Email already registered. Please verify your inbox or request a new verification link.",
      });
      return;
    }

    // Hash password and create an unverified user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashedPassword, name: name || null, emailVerifiedAt: null },
    });

    const verificationEmailSent = await createAndSendVerificationEmail(user);

    res.status(201).json({
      success: true,
      data: {
        verificationEmailSent,
        user: { id: user.id, email: user.email, name: user.name },
      },
      message: "Check your email to verify your account.",
    });
  } catch (error: any) {
    console.error("[Auth] Register error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/auth/verify-email
 * Verify a newly created email/password account using a one-time link.
 */
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
      res.redirect(`${CLIENT_AUTH_CALLBACK_URL}?verifyError=invalid`);
      return;
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, name: true, emailVerifiedAt: true },
        },
      },
    });

    if (!verificationToken) {
      res.redirect(`${CLIENT_AUTH_CALLBACK_URL}?verifyError=invalid`);
      return;
    }

    // Already verified — just issue a session (idempotent)
    if (verificationToken.user.emailVerifiedAt) {
      const session = await issueVerifiedSession(verificationToken.userId);
      res.redirect(
        `${CLIENT_AUTH_CALLBACK_URL}?token=${encodeURIComponent(session.token)}&user=${encodeURIComponent(JSON.stringify(session.user))}`
      );
      return;
    }

    if (verificationToken.usedAt) {
      res.redirect(
        `${CLIENT_AUTH_CALLBACK_URL}?verifyError=used&email=${encodeURIComponent(verificationToken.user.email)}`
      );
      return;
    }

    if (verificationToken.expiresAt <= now) {
      res.redirect(
        `${CLIENT_AUTH_CALLBACK_URL}?verifyError=expired&email=${encodeURIComponent(verificationToken.user.email)}`
      );
      return;
    }

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const consumed = await tx.emailVerificationToken.updateMany({
        where: { id: verificationToken.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });

      if (consumed.count !== 1) {
        throw new Error("link-race");
      }

      return tx.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: now },
        select: { id: true, email: true, name: true },
      });
    });

    const session = await issueVerifiedSession(user.id);

    res.redirect(
      `${CLIENT_AUTH_CALLBACK_URL}?token=${encodeURIComponent(session.token)}&user=${encodeURIComponent(JSON.stringify(session.user))}`
    );
  } catch (error: any) {
    console.error("[Auth] Email verification error:", error);
    redirectToClientAuthError(res, error?.message || "Verification failed");
  }
});

/**
 * GET /api/auth/oauth/providers
 * Returns OAuth provider configuration state for the UI.
 */
router.get("/oauth/providers", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      google: isProviderConfigured("google"),
      github: isProviderConfigured("github"),
    },
  });
});

/**
 * GET /api/auth/google/start
 * Start Google OAuth flow.
 */
router.get("/google/start", (_req: Request, res: Response) => {
  const mode = _req.query.mode === "json" ? "json" : "redirect";

  if (!isProviderConfigured("google")) {
    res.status(500).json({ success: false, error: providerNotConfiguredError("google") });
    return;
  }

  const state = createOAuthState("google");
  const authUrl = buildGoogleAuthUrl(state);

  if (mode === "json") {
    res.json({ success: true, data: { url: authUrl } });
    return;
  }

  res.redirect(authUrl);
});

/**
 * GET /api/auth/google/callback
 * Complete Google OAuth flow.
 */
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const cfg = getGoogleConfig();

    if (!isProviderConfigured("google")) {
      redirectToClientAuthError(res, providerNotConfiguredError("google"));
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;

    if (!verifyOAuthState(state, "google")) {
      redirectToClientAuthError(res, "Google login failed: invalid state");
      return;
    }

    if (!code) {
      redirectToClientAuthError(res, "Google login failed: missing code");
      return;
    }

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const idToken = tokenRes.data?.id_token as string | undefined;
    if (!idToken) {
      redirectToClientAuthError(res, "Google login failed: missing id token");
      return;
    }

    const googleOAuthClient = new OAuth2Client(cfg.clientId);
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken,
      audience: cfg.clientId,
    });
    const payload = ticket.getPayload();

    const email = payload?.email;
    if (!email) {
      redirectToClientAuthError(res, "Google login failed: no email available");
      return;
    }

    const user = await findOrCreateOAuthUser(email, payload?.name || null);
    const token = generateToken(user.id, user.email);

    await recordNotification({
      userId: user.id,
      type: "auth",
      title: "Google sign-in complete",
      message: "You signed in with Google.",
      sendEmail: true,
      metadata: { action: "google_oauth" },
    });

    redirectToClientAuthSuccess(res, token, { id: user.id, email: user.email, name: user.name });
  } catch (error: any) {
    console.error("[Auth] Google callback error:", error?.response?.data || error);
    redirectToClientAuthError(res, "Google login failed");
  }
});

/**
 * GET /api/auth/github/start
 * Start GitHub OAuth flow.
 */
router.get("/github/start", (_req: Request, res: Response) => {
  const mode = _req.query.mode === "json" ? "json" : "redirect";

  if (!isProviderConfigured("github")) {
    res.status(500).json({ success: false, error: providerNotConfiguredError("github") });
    return;
  }

  const state = createOAuthState("github");
  const authUrl = buildGithubAuthUrl(state);

  if (mode === "json") {
    res.json({ success: true, data: { url: authUrl } });
    return;
  }

  res.redirect(authUrl);
});

/**
 * GET /api/auth/github/callback
 * Complete GitHub OAuth flow.
 */
router.get("/github/callback", async (req: Request, res: Response) => {
  try {
    const cfg = getGithubConfig();

    if (!isProviderConfigured("github")) {
      redirectToClientAuthError(res, providerNotConfiguredError("github"));
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;

    if (!verifyOAuthState(state, "github")) {
      redirectToClientAuthError(res, "GitHub login failed: invalid state");
      return;
    }

    if (!code) {
      redirectToClientAuthError(res, "GitHub login failed: missing code");
      return;
    }

    const accessTokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: cfg.redirectUri,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const accessToken = accessTokenRes.data?.access_token as string | undefined;
    if (!accessToken) {
      redirectToClientAuthError(res, "GitHub login failed: missing access token");
      return;
    }

    const [profileRes, emailsRes] = await Promise.all([
      axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "ConfigFlow-App",
        },
      }),
      axios.get("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "ConfigFlow-App",
        },
      }),
    ]);

    const primaryEmail = (emailsRes.data as Array<{ email: string; primary: boolean; verified: boolean }>).find(
      (e) => e.primary && e.verified
    ) || (emailsRes.data as Array<{ email: string; primary: boolean; verified: boolean }>).find((e) => e.verified);

    if (!primaryEmail?.email) {
      redirectToClientAuthError(res, "GitHub login failed: no verified email found");
      return;
    }

    const user = await findOrCreateOAuthUser(primaryEmail.email, profileRes.data?.name || profileRes.data?.login || null);
    const token = generateToken(user.id, user.email);

    await recordNotification({
      userId: user.id,
      type: "auth",
      title: "GitHub sign-in complete",
      message: "You signed in with GitHub.",
      sendEmail: true,
      metadata: { action: "github_oauth" },
    });

    redirectToClientAuthSuccess(res, token, { id: user.id, email: user.email, name: user.name });
  } catch (error: any) {
    console.error("[Auth] GitHub callback error:", error?.response?.data || error);
    redirectToClientAuthError(res, "GitHub login failed");
  }
});

/**
 * POST /api/auth/login
 * Authenticate and return a JWT token.
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";

    if (!normalizedEmail || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    if (!user.emailVerifiedAt) {
      res.status(403).json({
        success: false,
        error: "Please verify your email address before signing in",
      });
      return;
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    await recordNotification({
      userId: user.id,
      type: "auth",
      title: "Signed in successfully",
      message: "Your email and password login was successful.",
      sendEmail: true,
      metadata: { action: "login" },
    });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (error: any) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});


/**
 * POST /api/auth/resend-verification
 * Re-issue a verification link for an unverified account.
 */
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";

    if (!normalizedEmail) {
      res.status(400).json({ success: false, error: "Email is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.emailVerifiedAt) {
      res.json({ success: true, data: { sent: true } });
      return;
    }

    const verificationEmailSent = await createAndSendVerificationEmail(user);

    res.json({
      success: true,
      data: { sent: true, verificationEmailSent },
    });
  } catch (error: any) {
    console.error("[Auth] Resend verification error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
/**
 * GET /api/auth/me
 * Get the current authenticated user.
 */
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error("[Auth] Me error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
