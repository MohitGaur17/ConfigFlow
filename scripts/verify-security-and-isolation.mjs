// ============================================================
// ConfigFlow — Automated Security & Authorization Verification
// ============================================================
import assert from "assert";

process.env.NODE_ENV = "test";
process.env.PORT = "4099";

const { app } = await import("../server/dist/index.js");

const PORT = 4099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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
  const server = app.listen(PORT);

  try {
    const timestamp = Date.now();
    const userA_Email = `alice_${timestamp}@configflow-test.io`;
    const userB_Email = `bob_${timestamp}@configflow-test.io`;
    const password = "Password123!";

    // 1. Register User A (Alice)
    console.log("\n[1/12] Registering User A (Alice)...");
    const regA = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: userA_Email, password, name: "Alice" }),
    });
    assert.strictEqual(regA.status, 201, `Failed to register Alice: ${regA.text}`);
    const userA_Id = regA.body.data.user.id;

    // Verify Alice email and login
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
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
    console.log("\n[2/12] Registering User B (Bob)...");
    const regB = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: userB_Email, password, name: "Bob" }),
    });
    assert.strictEqual(regB.status, 201, `Failed to register Bob: ${regB.text}`);
    const userB_Id = regB.body.data.user.id;

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
    console.log("\n[3/12] User A creates private Application with userScoped entity...");
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
    const appId = createAppRes.body.data.id;
    console.log(`✔ App created by Alice: ${appId}`);

    // 4. User A creates a secret record
    console.log("\n[4/12] User A creates a user-scoped record...");
    const createRecRes = await request(`/api/entities/${appId}/secrets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: "Alice Bank Credentials", note: "SuperSecretKey123" }),
    });
    assert.strictEqual(createRecRes.status, 201, `Failed to create record: ${createRecRes.text}`);
    const recordId = createRecRes.body.data.id;
    console.log(`✔ Record created by Alice: ${recordId}`);

    // 5. Test: Unauthenticated user cannot read App A config or files
    console.log("\n[5/12] Verifying unauthenticated access to App metadata/files is blocked...");
    const unauthApp = await request(`/api/apps/${appId}`);
    assert.strictEqual(unauthApp.status, 401, "Expected 401 for unauthenticated app get");
    const unauthFiles = await request(`/api/apps/${appId}/files`);
    assert.strictEqual(unauthFiles.status, 401, "Expected 401 for unauthenticated files get");
    console.log("✔ Unauthenticated app access returned 401 Unauthorized");

    // 6. Test: User B cannot read User A's App
    console.log("\n[6/12] Verifying User B cannot read User A's application or files...");
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
    console.log("\n[7/12] Verifying User B cannot read User A's record by ID...");
    const bobRecGet = await request(`/api/entities/${appId}/secrets/${recordId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobRecGet.status, 404, "Expected 404 for User B reading User A's record");
    console.log("✔ Cross-user record read returned 404 Not Found");

    // 8. Test: User B cannot update User A's record
    console.log("\n[8/12] Verifying User B cannot modify User A's record...");
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
    console.log("\n[9/12] Verifying User B cannot delete User A's record...");
    const bobRecDel = await request(`/api/entities/${appId}/secrets/${recordId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobRecDel.status, 404, "Expected 404 for User B deleting User A's record");
    console.log("✔ Cross-user record deletion returned 404 Not Found");

    // 10. Test: User B list and stats do not expose User A's records
    console.log("\n[10/12] Verifying list and aggregation isolation across users...");
    const bobList = await request(`/api/entities/${appId}/secrets`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobList.status, 200);
    assert.strictEqual(bobList.body.data.length, 0, "User B should see 0 records");

    const bobStats = await request(`/api/entities/${appId}/secrets/stats`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(bobStats.status, 200);
    assert.strictEqual(bobStats.body.data.value, 0, "User B stats count should be 0");
    console.log("✔ User B sees 0 records and stats count is 0 in multi-tenant isolation");

    // 11. Test: Path traversal / Zip Slip rejection in config validation
    console.log("\n[11/12] Verifying rejection of malicious path-traversal configurations...");
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
    console.log("\n[12/12] User A deletes App A and cleans up test data...");
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
    server.close();
  }
}

runSecuritySuite().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
