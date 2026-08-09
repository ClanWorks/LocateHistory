import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { GoogleAuth } from "google-auth-library";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const keyPath = path.join(__dirname, "..", "config", "photolocation-54a1d-firebase-adminsdk-fbsvc-c654c3cd30.json");
const serviceAccount = require(keyPath);
const projectId = serviceAccount.project_id;

function get(url, token) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("REST request timed out")));
  });
}

async function main() {
  console.error("[1] authenticating as", serviceAccount.client_email, "for project", projectId);
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/datastore.readonly", "https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  console.error("[2] got access token:", tokenResponse.token ? "yes" : "no");

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/cities?pageSize=300`;
  const { status, body } = await get(url, tokenResponse.token);
  console.error("[3] Firestore REST status:", status);

  if (status !== 200) {
    console.error("[3b] body:", body.slice(0, 2000));
    process.exit(1);
  }

  const outDir = path.join(__dirname, "..", "content", "source");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "_firestore_export_raw.json"), body);
  const parsed = JSON.parse(body);
  console.error(`[4] Exported ${(parsed.documents || []).length} document(s)`);
}

main().catch((err) => {
  console.error("Export failed:", err.message || err);
  process.exit(1);
});
