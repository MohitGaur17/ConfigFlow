import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { listNotifications, markNotificationRead } from "../services/notification-service";
import { subscribe as subscribeNotifications } from "../services/notification-bus";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const appId = typeof req.query.appId === "string" ? req.query.appId : undefined;
    const notifications = await listNotifications(req.userId!, appId);

    res.json({
      success: true,
      data: {
        notifications: notifications.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("[Notifications] List error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/stream", (req: AuthRequest, res: Response) => {
  try {
    // Allow token via query for EventSource clients: /api/notifications/stream?token=...
    const tokenFromQuery = typeof req.query.token === "string" ? req.query.token : undefined;
    const authHeader = req.headers.authorization;
    const token = tokenFromQuery || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined);

    if (!token) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const userId = decoded.userId;

    // keep the response open and register for SSE
    subscribeNotifications(userId, res);
  } catch (error) {
    console.error("[Notifications] SSE subscribe error:", error);
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
});

router.post("/mark-all-read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { markAllNotificationsRead } = await import("../services/notification-service");
    const result = await markAllNotificationsRead(req.userId!);

    res.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    console.error("[Notifications] Mark all read error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.patch("/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.userId!);

    if (!notification) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error("[Notifications] Mark read error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
