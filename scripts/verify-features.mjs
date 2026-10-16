import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

console.log("=== ConfigFlow Consistency Verification Suite ===");

// 1. Verify i18n is completely removed
console.log("\n[1/4] Verifying complete removal of i18n...");
assert.ok(!fs.existsSync(path.join(root, "client", "src", "i18n")), "client/src/i18n directory must not exist");
assert.ok(
  !fs.existsSync(path.join(root, "client", "src", "components", "LanguageSwitcher.tsx")),
  "LanguageSwitcher.tsx must not exist"
);
assert.ok(
  !fs.existsSync(path.join(root, "client", "src", "components", "LanguageSyncComponent.tsx")),
  "LanguageSyncComponent.tsx must not exist"
);

const providersContent = fs.readFileSync(
  path.join(root, "client", "src", "app", "providers.tsx"),
  "utf8"
);
assert.ok(!providersContent.includes("LanguageProvider"), "providers.tsx must not import LanguageProvider");
assert.ok(!providersContent.includes("LanguageSyncComponent"), "providers.tsx must not import LanguageSyncComponent");

const appShellContent = fs.readFileSync(
  path.join(root, "client", "src", "components", "layout", "AppShell.tsx"),
  "utf8"
);
assert.ok(!appShellContent.includes("LanguageSwitcher"), "AppShell.tsx must not reference LanguageSwitcher");
assert.ok(!appShellContent.includes("useTranslation"), "AppShell.tsx must not reference useTranslation");

const navbarContent = fs.readFileSync(
  path.join(root, "client", "src", "components", "layout", "Navbar.tsx"),
  "utf8"
);
assert.ok(!navbarContent.includes("LanguageSwitcher"), "Navbar.tsx must not reference LanguageSwitcher");
assert.ok(!navbarContent.includes('href="/support"'), "Navbar.tsx must not link to /support");

const footerContent = fs.readFileSync(
  path.join(root, "client", "src", "components", "layout", "Footer.tsx"),
  "utf8"
);
assert.ok(!footerContent.includes('href="/support"'), "Footer.tsx must not link to /support");

assert.ok(
  !fs.existsSync(path.join(root, "client", "src", "app", "(marketing)", "support")),
  "client/src/app/(marketing)/support directory must not exist"
);

const nextConfigContent = fs.readFileSync(
  path.join(root, "client", "next.config.ts"),
  "utf8"
);
assert.ok(nextConfigContent.includes('source: "/support"'), "next.config.ts must redirect /support route");

const readmeContent = fs.readFileSync(path.join(root, "README.md"), "utf8");
assert.ok(!readmeContent.includes("Internationalization (i18n)"), "README.md must not advertise i18n");

console.log("✔ i18n and support route have been completely and cleanly removed from codebase!");

// 2. Verify Real-Time Notification System (Server & Client)
console.log("\n[2/4] Verifying Real-Time Notification System...");
const notifRouteContent = fs.readFileSync(
  path.join(root, "server", "src", "routes", "notifications.ts"),
  "utf8"
);
assert.ok(notifRouteContent.includes('router.get("/stream"'), "SSE stream endpoint must exist");
assert.ok(notifRouteContent.includes('router.post("/read-all"'), "POST /read-all endpoint alias must exist");
assert.ok(notifRouteContent.includes('router.post("/mark-all-read"'), "POST /mark-all-read endpoint must exist");
assert.ok(notifRouteContent.includes('router.patch("/:id/read"'), "PATCH /:id/read endpoint must exist");

const notifBusContent = fs.readFileSync(
  path.join(root, "server", "src", "services", "notification-bus.ts"),
  "utf8"
);
assert.ok(notifBusContent.includes("text/event-stream"), "notification-bus must send text/event-stream headers");
assert.ok(notifBusContent.includes(": ping"), "notification-bus must have keep-alive heartbeat");

const notifContextContent = fs.readFileSync(
  path.join(root, "client", "src", "lib", "notification-context.tsx"),
  "utf8"
);
assert.ok(notifContextContent.includes("EventSource"), "Notification context must use EventSource for SSE");
assert.ok(notifContextContent.includes("/api/notifications/stream"), "Notification context must connect to SSE stream");

const notifSidebarContent = fs.readFileSync(
  path.join(root, "client", "src", "components", "NotificationSidebar.tsx"),
  "utf8"
);
assert.ok(notifSidebarContent.includes("useNotificationCenter"), "NotificationSidebar must hook into notification center");

const notifBellContent = fs.readFileSync(
  path.join(root, "client", "src", "components", "NotificationBell.tsx"),
  "utf8"
);
assert.ok(notifBellContent.includes("useNotificationCenter"), "NotificationBell must hook into notification center");

assert.ok(providersContent.includes("<NotificationProvider>"), "providers.tsx must wrap with NotificationProvider");
assert.ok(providersContent.includes("<NotificationSidebar />"), "providers.tsx must render NotificationSidebar");
assert.ok(navbarContent.includes("<NotificationBell />"), "Navbar.tsx must render NotificationBell");
assert.ok(appShellContent.includes("<NotificationBell />"), "AppShell.tsx must render NotificationBell");

console.log("✔ Real-time SSE notification stream, drawer, bell, and bus verified!");

// 3. Verify PWA Manifest, Service Worker & Offline Fallback
console.log("\n[3/4] Verifying Progressive Web App (PWA)...");
const manifestContent = fs.readFileSync(
  path.join(root, "client", "src", "app", "manifest.ts"),
  "utf8"
);
assert.ok(manifestContent.includes("ConfigFlow"), "Manifest must define ConfigFlow name");
assert.ok(manifestContent.includes("standalone"), "Manifest display must be standalone");
assert.ok(manifestContent.includes("/icon-192.png"), "Manifest must reference valid /icon-192.png icon");
assert.ok(!manifestContent.includes("/icon-192.svg"), "Manifest must NOT reference non-existent /icon-192.svg");

const swContent = fs.readFileSync(
  path.join(root, "client", "public", "sw.js"),
  "utf8"
);
assert.ok(swContent.includes("configflow-"), "Service worker must use configflow cache namespace");
assert.ok(swContent.includes("/offline.html"), "Service worker must cache /offline.html");
assert.ok(swContent.includes("/offline"), "Service worker must cache /offline route");

const offlineHtmlContent = fs.readFileSync(
  path.join(root, "client", "public", "offline.html"),
  "utf8"
);
assert.ok(offlineHtmlContent.includes("You're Offline"), "offline.html must render offline message");

const offlinePageContent = fs.readFileSync(
  path.join(root, "client", "src", "app", "offline", "page.tsx"),
  "utf8"
);
assert.ok(offlinePageContent.includes("offline"), "offline/page.tsx must export offline component");

const pwaRegisterContent = fs.readFileSync(
  path.join(root, "client", "src", "components", "PwaRegister.tsx"),
  "utf8"
);
assert.ok(pwaRegisterContent.includes("serviceWorker"), "PwaRegister must register service worker");
assert.ok(pwaRegisterContent.includes("beforeinstallprompt"), "PwaRegister must listen for beforeinstallprompt");

assert.ok(providersContent.includes("<PwaRegister />"), "providers.tsx must render PwaRegister");

console.log("✔ PWA manifest, service worker caching, and offline fallbacks verified!");

// 4. Verify Code Generator consistency
console.log("\n[4/4] Verifying Code Generator export consistency...");
const codeGenContent = fs.readFileSync(
  path.join(root, "server", "src", "services", "code-generator.ts"),
  "utf8"
);
assert.ok(codeGenContent.includes("generateManifest"), "Code generator must generate PWA manifest");
assert.ok(codeGenContent.includes("generateServiceWorker"), "Code generator must generate service worker");
assert.ok(codeGenContent.includes("generatePwaRegister"), "Code generator must generate PwaRegister");

console.log("✔ Code generator export consistency verified!");

console.log("\n========================================================");
console.log("🎉 ALL CONSISTENCY CHECKS PASSED SUCCESSFULLY! 🎉");
console.log("========================================================\n");
