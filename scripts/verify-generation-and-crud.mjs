import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testDatabaseUrl = process.env.CONFIGFLOW_TEST_DATABASE_URL;
const schema = `verify_crud_${Date.now()}`;
const databaseUrl = testDatabaseUrl ? new URL(testDatabaseUrl) : null;
databaseUrl?.searchParams.set("schema", schema);
const isolatedUrl = databaseUrl?.toString();
let tempDir;
let succeeded = false;
let generatedServer;

function run(program, args, options = {}) {
  const result = spawnSync(program, args, { cwd: options.cwd || root, env: options.env || process.env, stdio: "inherit", shell: options.shell || false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${program} ${args.join(" ")} exited with status ${result.status}`);
}

function runNpm(args, cwd, env) {
  if (process.env.npm_execpath) run(process.execPath, [process.env.npm_execpath, ...args], { cwd, env });
  else run("npm", args, { cwd, env, shell: process.platform === "win32" });
}

async function cleanup() {
  if (generatedServer && generatedServer.exitCode === null) {
    generatedServer.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => generatedServer.once("exit", resolve)), new Promise((resolve) => setTimeout(resolve, 5000))]);
    if (generatedServer.exitCode === null) generatedServer.kill("SIGKILL");
  }
  if (tempDir) {
    const resolved = path.resolve(tempDir);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("configflow-generated-")) {
      throw new Error(`Refusing to remove unexpected temporary path: ${resolved}`);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
    console.log(`Removed generated project ${resolved}`);
  }
  if (testDatabaseUrl) {
    const prisma = new PrismaClient({ datasources: { db: { url: testDatabaseUrl } } });
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      console.log(`Dropped isolated database schema ${schema}`);
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function testGeneratedApi(nextCli, cwd, env) {
  const portServer = createServer();
  await new Promise((resolve, reject) => portServer.once("error", reject).listen(0, "127.0.0.1", resolve));
  const port = portServer.address().port;
  await new Promise((resolve, reject) => portServer.close((error) => error ? reject(error) : resolve()));
  generatedServer = spawn(process.execPath, [nextCli, "start", "-H", "127.0.0.1", "-p", String(port)], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  let serverOutput = "";
  generatedServer.stdout.on("data", (chunk) => { serverOutput = (serverOutput + chunk.toString()).slice(-4000); });
  generatedServer.stderr.on("data", (chunk) => { serverOutput = (serverOutput + chunk.toString()).slice(-4000); });
  const baseUrl = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (generatedServer.exitCode !== null) throw new Error(`Generated Next server exited early. ${serverOutput}`);
    try { const response = await fetch(baseUrl); if (response.status < 500) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, `Generated Next server did not become ready. ${serverOutput}`);

  async function api(route, options = {}) {
    const headers = { ...(options.cookie ? { Cookie: options.cookie } : {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${baseUrl}${route}`, { method: options.method || "GET", headers, body: options.body });
    const text = await response.text();
    let body; try { body = JSON.parse(text); } catch { body = null; }
    const setCookie = response.headers.get("set-cookie");
    return { status: response.status, body, text, cookie: setCookie?.split(";")[0], setCookie };
  }

  const password = "StrongPassword123!";
  const emailA = `owner-${Date.now()}@generated.invalid`;
  const registerA = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email: emailA, password, name: "Owner" }) });
  assert.equal(registerA.status, 201, registerA.text);
  assert.ok(registerA.cookie?.startsWith("configflow_session="));
  assert.match(registerA.setCookie, /HttpOnly/);
  assert.match(registerA.setCookie, /SameSite=Lax/);
  assert.match(registerA.setCookie, /Secure/);
  const loginA = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: emailA, password }) });
  assert.equal(loginA.status, 200, loginA.text);
  assert.ok(loginA.cookie);
  const wrongPassword = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: emailA, password: "WrongPassword123!" }) });
  assert.equal(wrongPassword.status, 401);
  const duplicateRegister = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email: emailA, password, name: "Owner" }) });
  assert.equal(duplicateRegister.status, 409);
  const cookieA = loginA.cookie;
  const unauthenticatedList = await api("/api/task");
  assert.equal(unauthenticatedList.status, 401);
  const unauthenticatedCreate = await api("/api/task", { method: "POST", body: JSON.stringify({ title: "No session", status: "todo" }) });
  assert.equal(unauthenticatedCreate.status, 401);

  const registerB = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email: `other-${Date.now()}@generated.invalid`, password, name: "Other" }) });
  assert.equal(registerB.status, 201, registerB.text);
  const cookieB = registerB.cookie;
  const forgedOwner = await api("/api/task", { method: "POST", cookie: cookieA, body: JSON.stringify({ title: "Forged owner", status: "todo", userId: registerB.body.data.user.id }) });
  assert.equal(forgedOwner.status, 400, "Request payload must not choose the record owner");
  const badRequired = await api("/api/task", { method: "POST", cookie: cookieA, body: JSON.stringify({ status: "todo" }) });
  assert.equal(badRequired.status, 400);
  const badUnknown = await api("/api/task", { method: "POST", cookie: cookieA, body: JSON.stringify({ title: "Bad", status: "todo", unexpected: true }) });
  assert.equal(badUnknown.status, 400);
  const badEnum = await api("/api/task", { method: "POST", cookie: cookieA, body: JSON.stringify({ title: "Bad enum", status: "invalid" }) });
  assert.equal(badEnum.status, 400);
  const malformed = await api("/api/task", { method: "POST", cookie: cookieA, body: "{" });
  assert.equal(malformed.status, 400);
  assert.doesNotMatch(malformed.text, /stack|prisma|node_modules/i);

  const created = await api("/api/task", { method: "POST", cookie: cookieA, body: JSON.stringify({ title: "Owner task", status: "todo" }) });
  assert.equal(created.status, 201, created.text);
  const recordId = created.body.data.id;
  assert.equal(created.body.data.userId, registerA.body.data.user.id, "Generated API must assign the authenticated owner");
  assert.equal((await api(`/api/task/${recordId}`, { cookie: cookieB })).status, 404);
  assert.equal((await api(`/api/task/${recordId}`, { method: "PUT", cookie: cookieB, body: JSON.stringify({ title: "Tamper" }) })).status, 404);
  assert.equal((await api(`/api/task/${recordId}`, { method: "DELETE", cookie: cookieB })).status, 404);
  const otherList = await api("/api/task", { cookie: cookieB });
  assert.equal(otherList.status, 200);
  assert.equal(otherList.body.data.length, 0);

  assert.equal((await api(`/api/task/${recordId}`, { cookie: cookieA })).status, 200);
  const updated = await api(`/api/task/${recordId}`, { method: "PUT", cookie: cookieA, body: JSON.stringify({ status: "done" }) });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.status, "done");
  assert.equal((await api(`/api/task/${recordId}`, { method: "DELETE", cookie: cookieA })).status, 200);
  assert.equal((await api(`/api/task/${recordId}`, { cookie: cookieA })).status, 404);
  const logout = await api("/api/auth/logout", { method: "POST", cookie: cookieA });
  assert.equal(logout.status, 200);
  assert.equal((await api("/api/task", { cookie: logout.cookie })).status, 401);
  console.log("Generated auth endpoints, CRUD validation/statuses, safe errors, and cross-user ownership passed.");
}

try {
  console.log("=== ConfigFlow Generated Project and CRUD Verification ===");
  const config = JSON.parse(fs.readFileSync(path.join(root, "configs", "task-manager.json"), "utf8"));
  const { generateCodebase } = await import("../server/dist/services/code-generator.js");
  const vfs = generateCodebase(config);
  for (const file of [
    "package.json", "prisma/schema.prisma", "src/app/api/task/route.ts", "src/app/api/task/[id]/route.ts",
    "src/app/api/auth/[action]/route.ts", "src/lib/api-auth.ts", "src/lib/api-validation.ts",
    "src/app/(pages)/dashboard/page.tsx",
  ]) assert.ok(vfs.has(file), `Missing generated file ${file}`);
  const schemaText = vfs.get("prisma/schema.prisma");
  const collectionRoute = vfs.get("src/app/api/task/route.ts");
  const itemRoute = vfs.get("src/app/api/task/[id]/route.ts");
  const authPage = vfs.get("src/app/auth/page.tsx");
  const authRoute = vfs.get("src/app/api/auth/[action]/route.ts");
  assert.match(schemaText, /userId String/);
  assert.match(collectionRoute, /userId: actor\.userId/);
  assert.match(itemRoute, /userId: actor\.userId/);
  assert.match(collectionRoute, /validatePayload/);
  assert.match(itemRoute, /validatePayload/);
  assert.match(authPage, /fetch\("\/api\/auth\/" \+ mode/);
  assert.match(authRoute, /bcrypt\.hash/);
  assert.match(authRoute, /Set-Cookie/);
  assert.match(authRoute, /issueSession\(user, 201\)/, "Generated registration must return 201 Created");
  assert.match(vfs.get("src/app/(pages)/dashboard/page.tsx"), /ResponsiveContainer/);
  assert.doesNotMatch(vfs.get("src/app/(pages)/dashboard/page.tsx"), /Chart widgets are driven/);
  assert.throws(() => generateCodebase({ ...config, app: { ...config.app, auth: { enabled: true, providers: { google: true } } } }), /email\/password authentication only/);
  assert.throws(() => generateCodebase({
    app: { name: "User Model Collision", auth: { enabled: true } },
    entities: { user: { fields: { email: { type: "email", required: true } } } },
    pages: [{ type: "table", name: "Users", path: "/users", entity: "user", actions: [] }],
  }), /conflicts with the generated authentication User model/);
  const publicConfig = {
    app: { name: "Public Read Only", auth: { enabled: false } },
    entities: { notice: { publicAccess: true, fields: { title: { type: "string", required: true } } } },
    pages: [{ type: "table", name: "Notices", path: "/notices", entity: "notice", actions: [] }],
  };
  const publicVfs = generateCodebase(publicConfig);
  assert.match(publicVfs.get("src/app/api/notice/route.ts"), /publicRead = true/);
  assert.match(publicVfs.get("src/app/api/notice/route.ts"), /Writes require configured authentication/);
  assert.match(publicVfs.get("src/app/auth/page.tsx"), /public and read-only/);
  assert.doesNotMatch(publicVfs.get("src/app/auth/page.tsx"), /<form/);
  assert.throws(() => generateCodebase({ ...publicConfig, entities: { notice: { fields: { title: { type: "string" } } } } }), /public read-only apps/);
  console.log(`Generated ${vfs.size} files and checked auth, owner scoping, validation, and charts.`);

  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "configflow-generated-"));
  for (const [relative, contents] of vfs) {
    const target = path.join(tempDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents, "utf8");
  }
  const buildOnlyUrl = isolatedUrl || "postgresql://configflow:build-only@127.0.0.1:5432/configflow_build";
  fs.writeFileSync(path.join(tempDir, ".env"), `DATABASE_URL="${buildOnlyUrl}"\nAUTH_SECRET="${"a".repeat(64)}"\n`, "utf8");

  console.log("Installing generated project dependencies...");
  runNpm(["install", "--no-audit", "--no-fund"], tempDir, { ...process.env, DATABASE_URL: isolatedUrl });
  const nodeModules = path.join(tempDir, "node_modules");
  const prismaCli = path.join(nodeModules, "prisma", "build", "index.js");
  const nextCli = path.join(nodeModules, "next", "dist", "bin", "next");
  const childEnv = { ...process.env, DATABASE_URL: buildOnlyUrl, AUTH_SECRET: "a".repeat(64), NEXT_TELEMETRY_DISABLED: "1" };
  run(process.execPath, [prismaCli, "generate"], { cwd: tempDir, env: childEnv });
  if (testDatabaseUrl) {
    run(process.execPath, [prismaCli, "db", "push", "--skip-generate"], { cwd: tempDir, env: childEnv });
    run(process.execPath, ["prisma/seed.js"], { cwd: tempDir, env: childEnv });
  }

  const crudScript = `const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const owner = await prisma.user.create({ data: { email: "owner-" + Date.now() + "@test.invalid", passwordHash: "test-only" } });
  const other = await prisma.user.create({ data: { email: "other-" + Date.now() + "@test.invalid", passwordHash: "test-only" } });
  const task = await prisma.task.create({ data: { userId: owner.id, title: "Generated CRUD task", status: "todo" } });
  const ownRead = await prisma.task.findFirst({ where: { id: task.id, userId: owner.id } });
  const crossUserRead = await prisma.task.findFirst({ where: { id: task.id, userId: other.id } });
  assert.equal(ownRead.title, "Generated CRUD task"); assert.equal(crossUserRead, null);
  const updated = await prisma.task.update({ where: { id: task.id }, data: { status: "done" } });
  assert.equal(updated.status, "done");
  const ownedCount = await prisma.task.count({ where: { userId: owner.id } }); assert.equal(ownedCount, 1);
  const deleted = await prisma.task.deleteMany({ where: { id: task.id, userId: owner.id } }); assert.equal(deleted.count, 1);
  assert.equal(await prisma.task.findUnique({ where: { id: task.id } }), null);
  await prisma.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } });
  console.log("Generated database CRUD and user isolation passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());`;
  fs.writeFileSync(path.join(tempDir, "verify-crud.cjs"), crudScript, "utf8");
  if (testDatabaseUrl) {
    run(process.execPath, ["verify-crud.cjs"], { cwd: tempDir, env: childEnv });
  } else {
    console.log("Skipping Prisma database CRUD checks: CONFIGFLOW_TEST_DATABASE_URL is unset.");
  }
  console.log("Building generated Next.js project...");
  run(process.execPath, [nextCli, "build"], { cwd: tempDir, env: { ...childEnv, NODE_ENV: "production" } });
  if (testDatabaseUrl) await testGeneratedApi(nextCli, tempDir, { ...childEnv, NODE_ENV: "production" });
  succeeded = true;
} finally {
  await cleanup();
}

if (!succeeded) process.exitCode = 1;
console.log(testDatabaseUrl
  ? "Generated project install, Prisma CRUD/isolation, and production build passed."
  : "Generated project installation and production build passed; database CRUD/isolation checks were not run.");
