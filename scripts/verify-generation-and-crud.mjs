// ============================================================
// ConfigFlow — Automated Generation & CRUD Verification Suite
// ============================================================
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const ROOT_DIR = process.cwd();
const TEMP_APP_DIR = path.join(ROOT_DIR, ".test-generated-app");
const ISOLATED_SCHEMA = `test_crud_${Date.now()}`;

async function main() {
  console.log("=== ConfigFlow Generation & Standalone CRUD Suite ===");

  // 1. Load sample configuration
  console.log("\n[1/5] Loading sample configuration from configs/task-manager.json...");
  const configRaw = fs.readFileSync(path.join(ROOT_DIR, "configs", "task-manager.json"), "utf8");
  const config = JSON.parse(configRaw);
  console.log(`✔ Config loaded: ${config.app.name} (${Object.keys(config.entities).length} entities, ${config.pages.length} pages)`);

  // 2. Generate codebase virtual file system
  console.log("\n[2/5] Synthesizing codebase with code-generator...");
  const { generateCodebase } = await import("../server/dist/services/code-generator.js");
  const vfs = generateCodebase(config);
  console.log(`✔ Generated ${vfs.size} virtual files`);

  // Verify critical files
  const expectedFiles = [
    "package.json",
    "tsconfig.json",
    "prisma/schema.prisma",
    "prisma/seed.js",
    "src/app/layout.tsx",
    "src/app/manifest.ts",
    "src/app/api/task/route.ts",
    "src/app/api/task/[id]/route.ts",
    "src/app/(pages)/tasks/page.tsx",
    "src/app/(pages)/dashboard/page.tsx",
  ];
  for (const file of expectedFiles) {
    if (!vfs.has(file)) {
      throw new Error(`Missing expected generated file: ${file}`);
    }
  }
  console.log("✔ All critical route and component files synthesized in VFS");

  // 3. Write files to isolated temporary directory
  console.log(`\n[3/5] Writing files to ${TEMP_APP_DIR}...`);
  if (fs.existsSync(TEMP_APP_DIR)) {
    fs.rmSync(TEMP_APP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_APP_DIR, { recursive: true });

  for (const [filePath, content] of vfs.entries()) {
    const fullPath = path.join(TEMP_APP_DIR, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");
  }

  // Read server .env for base DATABASE_URL
  const serverEnv = fs.readFileSync(path.join(ROOT_DIR, "server", ".env"), "utf8");
  const dbMatch = serverEnv.match(/DATABASE_URL="?([^"\n]+)"?/);
  if (!dbMatch) throw new Error("Could not find DATABASE_URL in server/.env");
  const baseDbUrl = dbMatch[1];
  const urlObj = new URL(baseDbUrl);
  urlObj.searchParams.set("schema", ISOLATED_SCHEMA);
  const isolatedDbUrl = urlObj.toString();

  fs.writeFileSync(
    path.join(TEMP_APP_DIR, ".env"),
    `DATABASE_URL="${isolatedDbUrl}"\nNEXTAUTH_SECRET="test-secret"\n`,
    "utf8"
  );
  console.log(`✔ Files written; configured isolated DB schema: ${ISOLATED_SCHEMA}`);

  // Link node_modules from monorepo for instant dependencies
  const symlinkTarget = path.join(ROOT_DIR, "node_modules");
  const appNodeModules = path.join(TEMP_APP_DIR, "node_modules");
  try {
    execSync(`cmd /c mklink /J "${appNodeModules}" "${symlinkTarget}"`, { stdio: "ignore" });
    console.log("✔ Linked workspace node_modules");
  } catch (e) {
    console.log("Installing dependencies via npm...");
    execSync("npm.cmd install", { cwd: TEMP_APP_DIR, stdio: "inherit" });
  }

  try {
    // 4. Database push and CRUD operations
    console.log("\n[4/5] Running prisma db push and verifying standalone CRUD...");
  const childEnv = { ...process.env, DATABASE_URL: isolatedDbUrl };
  execSync("npx.cmd prisma db push --skip-generate", { cwd: TEMP_APP_DIR, env: childEnv, stdio: "inherit" });
  execSync("npx.cmd prisma generate", { cwd: TEMP_APP_DIR, env: childEnv, stdio: "inherit" });
  execSync("node prisma/seed.js", { cwd: TEMP_APP_DIR, env: childEnv, stdio: "inherit" });

  // Run standalone CRUD verification script in child process
  const crudTestScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const initialTasks = await prisma.task.findMany();
  console.log("✔ Read " + initialTasks.length + " seeded tasks from database");
  if (initialTasks.length === 0) throw new Error("Seeded tasks not found");

  const newTask = await prisma.task.create({
    data: {
      title: "Generated Standalone Task",
      priority: "high",
      status: "todo",
      dueDate: new Date(),
    },
  });
  console.log("✔ Created task: " + newTask.id + " (" + newTask.title + ")");

  const fetched = await prisma.task.findUnique({ where: { id: newTask.id } });
  if (!fetched || fetched.title !== "Generated Standalone Task") {
    throw new Error("Failed to read created task");
  }
  console.log("✔ Fetched task by ID: " + fetched.id);

  const updated = await prisma.task.update({
    where: { id: newTask.id },
    data: { status: "done", priority: "critical" },
  });
  if (updated.status !== "done" || updated.priority !== "critical") {
    throw new Error("Failed to update task");
  }
  console.log("✔ Updated task: status = " + updated.status + ", priority = " + updated.priority);

  await prisma.task.delete({ where: { id: newTask.id } });
  const afterDelete = await prisma.task.findUnique({ where: { id: newTask.id } });
  if (afterDelete !== null) throw new Error("Task was not deleted");
  console.log("✔ Deleted task successfully");
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
`;
  fs.writeFileSync(path.join(TEMP_APP_DIR, "test-crud.js"), crudTestScript, "utf8");
  execSync("node test-crud.js", { cwd: TEMP_APP_DIR, env: childEnv, stdio: "inherit" });

  // 5. Next.js production build of the generated application
  console.log("\n[5/5] Executing Next.js production build of the generated application...");
  execSync("npx.cmd next build", {
    cwd: TEMP_APP_DIR,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "production" },
  });
  console.log("✔ Standalone generated application completed production build with 0 errors!");

  } finally {
    // Clean up temporary directory
    if (fs.existsSync(TEMP_APP_DIR)) {
      fs.rmSync(TEMP_APP_DIR, { recursive: true, force: true });
      console.log("✔ Cleaned up temporary build directory");
    }

    // Drop isolated test schema from PostgreSQL
    try {
      const cleanupPrisma = new PrismaClient({
        datasources: { db: { url: baseDbUrl } },
      });
      await cleanupPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${ISOLATED_SCHEMA}" CASCADE;`);
      await cleanupPrisma.$disconnect();
      console.log(`✔ Dropped isolated database schema ${ISOLATED_SCHEMA}`);
    } catch (e) {
      // Ignore if database cleanup fails
    }

    // Always restore server Prisma Client bindings
    try {
      execSync("cmd /c npx.cmd prisma generate", {
        cwd: path.join(ROOT_DIR, "server"),
        env: { ...process.env, DATABASE_URL: baseDbUrl },
        stdio: "inherit",
        shell: true,
      });
      console.log("✔ Restored server Prisma Client bindings");
    } catch (e) {
      console.warn("Notice: could not restore server Prisma Client:", e?.message);
    }
  }

  console.log("\n========================================================");
  console.log("🎉 GENERATION & CRUD VERIFICATION SUITE PASSED! 🎉");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("❌ Generation and CRUD suite failed:", err);
  process.exit(1);
});
