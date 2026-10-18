import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

const apiBase = process.env.CONFIGFLOW_DOCKER_API_URL || "http://127.0.0.1:4000";
const email = `docker-smoke-${randomUUID()}@configflow.invalid`;
const emailSql = `'${email.replaceAll("'", "''")}'`;

function runPsql(sql) {
  const result = spawnSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "psql", "-v", "ON_ERROR_STOP=1", "-U", "appuser", "-d", "configflow", "-tA", "-c", sql],
    { encoding: "utf8", timeout: 20_000 },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Docker smoke SQL failed: ${result.stderr || result.stdout}`);
  }

  return result.stdout.trim();
}

async function request(path, options) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: response.status, body, text };
}

async function waitForReady() {
  let lastError = "no response";

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await request("/api/ready");
      if (response.status === 200) return response;
      lastError = `${response.status}: ${response.text}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(`Database readiness did not succeed: ${lastError}`);
}

let testError;

try {
  const health = await request("/api/health");
  assert.equal(health.status, 200, `HTTP health endpoint failed: ${health.text}`);
  assert.equal(health.body?.status, "ok", "HTTP health endpoint returned an unexpected body");

  const readiness = await waitForReady();
  assert.equal(readiness.body?.status, "ready", "Database readiness endpoint returned an unexpected body");
  assert.equal(readiness.body?.checks?.database, "ok", "Database readiness check did not report success");

  const registration = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: `Docker-${randomUUID()}`, name: "Docker smoke test" }),
  });
  assert.equal(registration.status, 201, `Database-backed registration failed: ${registration.text}`);
  assert.equal(registration.body?.data?.user?.email, email, "Registration returned an unexpected test account");

  const userId = registration.body.data.user.id;
  assert.match(userId, /^[a-f0-9-]{36}$/i, "Registration did not return a UUID user id");
  assert.equal(runPsql(`SELECT COUNT(*) FROM "User" WHERE email = ${emailSql}`), "1", "Test account was not persisted");
  assert.equal(
    runPsql(`SELECT COUNT(*) FROM "EmailVerificationToken" WHERE "userId" = '${userId}'`),
    "1",
    "Registration did not persist its verification token",
  );

  const repeatedInit = spawnSync("docker", ["compose", "run", "--rm", "--no-deps", "db-init"], {
    encoding: "utf8",
    timeout: 120_000,
  });
  if (repeatedInit.error) throw repeatedInit.error;
  assert.equal(repeatedInit.status, 0, `Repeated Prisma schema initialization failed: ${repeatedInit.stderr || repeatedInit.stdout}`);
  assert.equal(runPsql(`SELECT COUNT(*) FROM "User" WHERE email = ${emailSql}`), "1", "Schema re-initialization did not preserve existing database data");

  console.log("Docker smoke passed: HTTP health, database readiness, registration, and repeatable schema initialization with persisted data");
} catch (error) {
  testError = error;
  throw error;
} finally {
  try {
    runPsql(`BEGIN; DELETE FROM "EmailDelivery" WHERE "to" = ${emailSql}; DELETE FROM "User" WHERE email = ${emailSql}; COMMIT;`);
    const remaining = runPsql(
      `SELECT (SELECT COUNT(*) FROM "User" WHERE email = ${emailSql}) + (SELECT COUNT(*) FROM "EmailDelivery" WHERE "to" = ${emailSql})`,
    );
    assert.equal(remaining, "0", "Docker smoke test data cleanup was incomplete");
    console.log("Docker smoke cleanup passed: test account, verification token, and email delivery removed");
  } catch (cleanupError) {
    if (testError) console.error("Docker smoke cleanup also failed:", cleanupError);
    else throw cleanupError;
  }
}
