// ============================================================
// ConfigFlow — Automated Security & Authorization Verification
// ============================================================
import assert from "assert";

process.env.NODE_ENV = "test";
process.env.PORT = "4099";
if (!process.env.CONFIGFLOW_TEST_DATABASE_URL) {
  throw new Error("Set CONFIGFLOW_TEST_DATABASE_URL to a disposable PostgreSQL database before running this suite.");
}
process.env.DATABASE_URL = process.env.CONFIGFLOW_TEST_DATABASE_URL;
process.env.JWT_SECRET ||= "configflow-security-suite-secret-change-me";

const { app } = await import("../server/dist/index.js");
const { getJwtSecret } = await import("../server/dist/middleware/auth.js");

const PORT = 4099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function verifyProductionJwtSecretConfiguration() {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  try {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /Production requires JWT_SECRET/);

    process.env.JWT_SECRET = "too-short";
    assert.throws(() => getJwtSecret(), /at least 32 characters/);

    process.env.JWT_SECRET = "configflow-local-demo-secret-not-for-production-change-me";
    assert.throws(() => getJwtSecret(), /local-demo secrets are not allowed/);

    const productionSecret = `${Date.now()}-${Math.random()}-${Math.random()}`.padEnd(32, "x");
    process.env.JWT_SECRET = productionSecret;
    assert.strictEqual(getJwtSecret(), productionSecret);
    console.log("Production JWT configuration rejects missing and local-demo secrets");
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, body: json, text };
}

async function runSecuritySuite() {
  console.log("=== ConfigFlow Security & Authorization Test Suite ===");
  verifyProductionJwtSecretConfiguration();
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const server = app.listen(PORT);
  let userA_Id;
  let userB_Id;
  let appId;
  let publicAppId;

  try {
    const timestamp = Date.now();
    const userA_Email = `alice_${timestamp}@configflow-test.io`;
    const userB_Email = `bob_${timestamp}@configflow-test.io`;
    const password = "Password123!";

    // 1. Register User A (Alice)
    console.log("\nRegistering User A (Alice)...");
    const regA = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: userA_Email, password, name: "Alice" }),
    });
    assert.strictEqual(regA.status, 201, `Failed to register Alice: ${regA.text}`);
    userA_Id = regA.body.data.user.id;

    // Verify Alice email and login
    await prisma.user.update({
      where: { id: userA_Id },
      data: { emailVerifiedAt: new Date() },
    });

    const loginA = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: userA_Email, password }),
    });
    assert.strictEqual(loginA.status, 200, `Failed to login Alice: ${loginA.text}`);
    const tokenA = loginA.body.data.token;
    console.log(`✔ User A registered and logged in: ${userA_Id}`);

    // 2. Register User B (Bob)
    console.log("\nRegistering User B (Bob)...");
    const regB = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: userB_Email, password, name: "Bob" }),
    });
    assert.strictEqual(regB.status, 201, `Failed to register Bob: ${regB.text}`);
    userB_Id = regB.body.data.user.id;

    await prisma.user.update({
      where: { id: userB_Id },
      data: { emailVerifiedAt: new Date() },
    });

    const loginB = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: userB_Email, password }),
    });
    assert.strictEqual(loginB.status, 200, `Failed to login Bob: ${loginB.text}`);
    const tokenB = loginB.body.data.token;
    console.log(`✔ User B registered and logged in: ${userB_Id}`);

    // 3. User A creates private App A with userScoped entity
    console.log("\nUser A creates private Application with userScoped entity...");
    const appConfig = {
      app: {
        name: "Alice Secret App",
        theme: { mode: "dark", primaryColor: "#6366f1" },
        auth: { enabled: true, providers: { email: true } },
      },
      entities: {
        secrets: {
          userScoped: true,
          fields: {
            title: { type: "string", required: true },
            note: { type: "text", required: false },
          },
        },
      },
      pages: [
        {
          type: "table",
          name: "Secrets Table",
          path: "/secrets",
          entity: "secrets",
          columns: ["title", "note"],
          actions: ["create", "edit", "delete"],
        },
      ],
    };

    const createAppRes = await request("/api/apps", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify(appConfig),
    });
    assert.strictEqual(createAppRes.status, 201, `Failed to create app: ${createAppRes.text}`);
    appId = createAppRes.body.data.id;
    console.log(`✔ App created by Alice: ${appId}`);

    // 4. User A creates a secret record
    console.log("\nUser A creates a user-scoped record...");
    const createRecRes = await request(`/api/entities/${appId}/secrets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: "Alice Bank Credentials", note: "SuperSecretKey123", userId: userB_Id }),
    });
    assert.strictEqual(createRecRes.status, 201, `Failed to create record: ${createRecRes.text}`);
    const recordId = createRecRes.body.data.id;
    const persistedRecord = await prisma.record.findUnique({ where: { id: recordId } });
    assert.strictEqual(persistedRecord.userId, userA_Id, "Record owner must come from authenticated identity, never the request body");
    assert.strictEqual(persistedRecord.data.userId, undefined, "Client owner field must not be persisted as record data");

    const invalidFilters = await request(`/api/entities/${appId}/secrets?filters=%7B`, { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.strictEqual(invalidFilters.status, 400, "Malformed filter JSON must be a client error");
    const invalidSort = await request(`/api/entities/${appId}/secrets?sortBy=unknown`, { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.strictEqual(invalidSort.status, 400, "Unknown sort fields must be rejected");
    const invalidStats = await request(`/api/entities/${appId}/secrets/stats?operation=drop`, { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.strictEqual(invalidStats.status, 400, "Unknown stats operations must be rejected");
    const malformedBody = await request(`/api/entities/${appId}/secrets`, {
      method: "POST", headers: { Authorization: `Bearer ${tokenA}` }, body: "{",
    });
    assert.strictEqual(malformedBody.status, 400, "Malformed JSON bodies must be a client error");
    assert.strictEqual(malformedBody.body.error, "Malformed JSON request body", "Malformed body errors must not reveal parser internals");

    console.log("\nVerifying unauthenticated entity operations are rejected...");
    for (const [method, suffix, body] of [
      ["GET", "", undefined], ["GET", `/${recordId}`, undefined], ["GET", "/stats", undefined], ["GET", "/recent", undefined],
      ["POST", "", { title: "Anonymous write" }], ["PUT", `/${recordId}`, { title: "Anonymous update" }], ["DELETE", `/${recordId}`, undefined],
    ]) {
      const result = await request(`/api/entities/${appId}/secrets${suffix}`, { method, body: body && JSON.stringify(body) });
      assert.strictEqual(result.status, 401, `Expected unauthenticated ${method} ${suffix || "collection"} to return 401; got ${result.status}`);
    }
    console.log("Unauthenticated entity list/read/stats/recent/create/update/delete requests returned 401");

    console.log("\nVerifying cross-application entity access is denied...");
    for (const [method, suffix, body] of [
      ["GET", "", undefined], ["GET", `/${recordId}`, undefined], ["GET", "/stats", undefined], ["GET", "/recent", undefined],
      ["POST", "", { title: "Cross-app write" }], ["PUT", `/${recordId}`, { title: "Cross-app update" }], ["DELETE", `/${recordId}`, undefined],
    ]) {
      const result = await request(`/api/entities/${appId}/secrets${suffix}`, {
        method,
        headers: { Authorization: `Bearer ${tokenB}` },
        body: body && JSON.stringify(body),
      });
      assert.strictEqual(result.status, 404, `Expected cross-app ${method} ${suffix || "collection"} to return 404; got ${result.status}`);
    }
    console.log("Cross-app entity list/read/stats/recent/create/update/delete requests returned 404");

    console.log("\nVerifying user-scoped service reads, statistics, updates, and deletes...");
    const { getRecord, listRecords, getEntityStats, getRecentRecords, updateRecord, deleteRecord, NotFoundError } = await import("../server/dist/services/entity-service.js");
    assert.strictEqual(await getRecord(appId, "secrets", recordId, userB_Id, true), null);
    assert.strictEqual((await listRecords(appId, "secrets", { userId: userB_Id, userScoped: true })).data.length, 0);
    assert.strictEqual((await getEntityStats(appId, "secrets", "count", undefined, undefined, userB_Id, true)).value, 0);
    assert.strictEqual((await getRecentRecords(appId, "secrets", 10, userB_Id, true)).length, 0);
    await assert.rejects(updateRecord(appId, "secrets", recordId, { title: "Cross-user update" }, userB_Id, true), NotFoundError);
    await assert.rejects(deleteRecord(appId, "secrets", recordId, userB_Id, true), NotFoundError);
    console.log("Cross-user record reads and aggregates are empty; updates and deletes return not found");
    console.log(`✔ Record created by Alice: ${recordId}`);

    // 5. Test: Unauthenticated user cannot read App A config or files
    console.log("\nVerifying unauthenticated access to App metadata/files is blocked...");
    const unauthApp = await request(`/api/apps/${appId}`);
    assert.strictEqual(unauthApp.status, 401, "Expected 401 for unauthenticated app get");
    const unauthFiles = await request(`/api/apps/${appId}/files`);
    assert.strictEqual(unauthFiles.status, 401, "Expected 401 for unauthenticated files get");
    console.log("✔ Unauthenticated app access returned 401 Unauthorized");

    // 6. Test: User B cannot read User A's App
    console.log("\nVerifying User B cannot read User A's application or files...");
    const bobApp = await request(`/api/apps/${appId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobApp.status, 404, "Expected 404 for cross-user app access");
    const bobFiles = await request(`/api/apps/${appId}/files`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobFiles.status, 404, "Expected 404 for cross-user files access");
    const bobExport = await request(`/api/apps/${appId}/export`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobExport.status, 404, "Expected 404 for cross-user export access");
    console.log("✔ Cross-user app read and export returned 404 Not Found");

    // 7. Test: User B cannot read User A's record by tampering record ID
    console.log("\nVerifying User B cannot read User A's record by ID...");
    const bobRecGet = await request(`/api/entities/${appId}/secrets/${recordId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobRecGet.status, 404, "Expected 404 for User B reading User A's record");
    console.log("✔ Cross-user record read returned 404 Not Found");

    // 8. Test: User B cannot update User A's record
    console.log("\nVerifying User B cannot modify User A's record...");
    const bobRecPut = await request(`/api/entities/${appId}/secrets/${recordId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ title: "Tampered by Bob", note: "Hacked" }),
    });
    assert.strictEqual(bobRecPut.status, 404, "Expected 404 for User B modifying User A's record");

    // Verify record was untouched
    const verifyAliceRec = await request(`/api/entities/${appId}/secrets/${recordId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(verifyAliceRec.status, 200);
    assert.strictEqual(verifyAliceRec.body.data.data.title, "Alice Bank Credentials");
    console.log("✔ Cross-user record update returned 404; data was not modified");

    // 9. Test: User B cannot delete User A's record
    console.log("\nVerifying User B cannot delete User A's record...");
    const bobRecDel = await request(`/api/entities/${appId}/secrets/${recordId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobRecDel.status, 404, "Expected 404 for User B deleting User A's record");
    console.log("✔ Cross-user record deletion returned 404 Not Found");

    // 10. App ownership blocks another user's list and aggregate requests.
    // Service-level assertions above verify userScoped filtering independently.
    console.log("\nVerifying User B cannot list or aggregate User A's app data...");
    const bobList = await request(`/api/entities/${appId}/secrets`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobList.status, 404, "A non-owner must not list another user's app records");

    const bobStats = await request(`/api/entities/${appId}/secrets/stats`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobStats.status, 404, "A non-owner must not aggregate another user's app records");
    console.log("Non-owner list and statistics requests returned 404; userScoped isolation is covered by service-level assertions");

    // 11. Test: Path traversal / Zip Slip rejection in config validation
    console.log("\nVerifying explicit public-read policy...");
    const publicApp = await request("/api/apps", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        app: { name: "Public Read App", auth: { enabled: false } },
        entities: { notices: { publicAccess: true, fields: { title: { type: "string", required: true } } } },
        pages: [{ type: "table", name: "Notices", path: "/notices", entity: "notices", actions: [] }],
      }),
    });
    assert.strictEqual(publicApp.status, 201, `Failed to create public-read app: ${publicApp.text}`);
    publicAppId = publicApp.body.data.id;
    const publicRecord = await request(`/api/entities/${publicAppId}/notices`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: "Public notice" }),
    });
    assert.strictEqual(publicRecord.status, 201, `App owner should retain write access: ${publicRecord.text}`);
    const publicRecordId = publicRecord.body.data.id;
    const publicReadPaths = ["", `/${publicRecordId}`, "/stats", "/recent"];
    for (const suffix of publicReadPaths) {
      const anonymousRead = await request(`/api/entities/${publicAppId}/notices${suffix}`);
      assert.strictEqual(anonymousRead.status, 200, `Explicit publicAccess should allow anonymous GET ${suffix || "collection"}`);
      const crossUserRead = await request(`/api/entities/${publicAppId}/notices${suffix}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(crossUserRead.status, 200, `Explicit publicAccess should allow cross-user GET ${suffix || "collection"}`);
    }

    for (const [method, suffix, body] of [
      ["POST", "", { title: "Anonymous write" }],
      ["PUT", `/${publicRecordId}`, { title: "Anonymous update" }],
      ["DELETE", `/${publicRecordId}`, undefined],
    ]) {
      const anonymousWrite = await request(`/api/entities/${publicAppId}/notices${suffix}`, {
        method,
        body: body && JSON.stringify(body),
      });
      assert.strictEqual(anonymousWrite.status, 401, `Public reads must not permit anonymous ${method}`);
    }
    for (const [method, suffix, body] of [
      ["POST", "", { title: "Cross-user write" }],
      ["PUT", `/${publicRecordId}`, { title: "Cross-user update" }],
      ["DELETE", `/${publicRecordId}`, undefined],
    ]) {
      const crossUserWrite = await request(`/api/entities/${publicAppId}/notices${suffix}`, {
        method,
        headers: { Authorization: `Bearer ${tokenB}` },
        body: body && JSON.stringify(body),
      });
      assert.strictEqual(crossUserWrite.status, 404, `Public reads must not permit non-owner ${method}`);
    }
    console.log("Explicit publicAccess permits anonymous and cross-user GET collection/item/stats/recent only; writes require the app owner");

    console.log("\nVerifying rejection of malicious path-traversal configurations...");
    const maliciousConfig = {
      app: { name: "Traverse App" },
      entities: {
        "../../etc": {
          fields: { name: { type: "string" } },
        },
      },
      pages: [{ type: "table", name: "Evil", path: "/../../etc/passwd", entity: "evil" }],
    };
    const malRes = await request("/api/apps", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify(maliciousConfig),
    });
    assert.strictEqual(malRes.status, 400, "Malicious config must be rejected with 400");
    console.log("✔ Malicious config rejected with 400 Bad Request");

    // 12. User A cleans up App A
    console.log("\nUser A deletes App A and cleans up test data...");
    const delApp = await request(`/api/apps/${appId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(delApp.status, 200);
    console.log("✔ App A deleted successfully");

    console.log("\n========================================================");
    console.log("🎉 ALL SECURITY & AUTHORIZATION TESTS PASSED! 🎉");
    console.log("========================================================\n");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (prisma) {
      try {
        const appIds = [appId, publicAppId].filter(Boolean);
        if (appIds.length) await prisma.app.deleteMany({ where: { id: { in: appIds } } });
        const userIds = [userA_Id, userB_Id].filter(Boolean);
        if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      } finally {
        await prisma.$disconnect();
      }
    }
  }
}

runSecuritySuite().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
