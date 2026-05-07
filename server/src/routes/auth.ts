import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import axios from "axios";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { generateToken, requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";
const CLIENT_AUTH_CALLBACK_URL = process.env.CLIENT_AUTH_CALLBACK_URL || `${CLIENT_URL}/auth/callback`;

const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${SERVER_URL}/api/auth/google/callback`;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || `${SERVER_URL}/api/auth/github/callback`;

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

async function findOrCreateOAuthUser(email: string, name?: string | null) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return existing;

  const randomPassword = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPassword, 12);
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || null,
      password: hashedPassword,
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

    // Validate input
    if (!email || !password) {
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: "Email already registered",
      });
      return;
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name || null },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (error: any) {
    console.error("[Auth] Register error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
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

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid email or password",
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
