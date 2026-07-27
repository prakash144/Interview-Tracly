import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { google } from "googleapis";
import { createReadStream, readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { createInterface } from "readline";
import { execSync } from "child_process";

const SERVICE_ACCOUNT_PATH = resolve(process.cwd(), "service-account.json");
const OAUTH_CLIENT_PATH = resolve(process.cwd(), "oauth-client.json");
const TOKEN_PATH = resolve(process.cwd(), "drive-token.json");
const DRIVE_FOLDER_ID = "1JPqNLn7HJSnnXGj8ry-zzIKdpl6AXqmF";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("Missing service-account.json — download from Firebase Console → Project Settings → Service Accounts");
  process.exit(1);
}

if (!existsSync(OAUTH_CLIENT_PATH)) {
  console.error("Missing oauth-client.json");
  console.error("");
  console.error("  1. Go to https://console.cloud.google.com/apis/credentials");
  console.error("  2. Create OAuth 2.0 Client ID → Desktop app → download JSON");
  console.error("  3. Save it as 'oauth-client.json' in this project root");
  console.error("");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApps()[0];
const db = getFirestore(app);

const USER_COLLECTIONS = [
  "tracks", "resources", "resourceProgress", "sprints", "progress", "activity", "customLists",
];

function getOAuthClient() {
  const { client_id, client_secret, redirect_uris } = JSON.parse(readFileSync(OAUTH_CLIENT_PATH, "utf-8")).installed || JSON.parse(readFileSync(OAUTH_CLIENT_PATH, "utf-8")).web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0] || "http://localhost");
}

async function loadSavedToken(client) {
  if (!existsSync(TOKEN_PATH)) return false;
  const token = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
  client.setCredentials(token);
  const expiryDate = client.credentials.expiry_date;
  if (expiryDate && Date.now() >= expiryDate) {
    try {
      const { credentials } = await client.refreshAccessToken();
      writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
      console.log("  Access token refreshed.");
    } catch {
      console.log("  Token expired — reauthorizing.");
      return false;
    }
  }
  return true;
}

async function authorizeNewToken(client) {
  const url = client.generateAuthUrl({ access_type: "offline", scope: SCOPES });
  console.log("\n  Open this URL in your browser:\n");
  console.log("  " + url + "\n");

  try {
    execSync(`open "${url}"`, { stdio: "ignore" });
  } catch {
    try { execSync(`xdg-open "${url}"`, { stdio: "ignore" }); } catch {}
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) => rl.question("  Paste the authorization code here: ", resolve));
  rl.close();

  const { tokens } = await client.getToken(code.trim());
  client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("  Token saved to drive-token.json");
}

async function dumpFirestore() {
  const dump = { exportedAt: new Date().toISOString(), users: {} };
  const usersSnap = await db.collection("users").get();
  if (usersSnap.empty) {
    console.log("No users found in Firestore.");
    return null;
  }
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = { profile: { id: uid, ...userDoc.data() } };
    let totalDocs = 0;
    for (const colName of USER_COLLECTIONS) {
      const colRef = db.collection("users").doc(uid).collection(colName);
      const snap = await colRef.get();
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      userData[colName] = docs;
      totalDocs += docs.length;
      if (colName === "sprints") {
        for (const sprintDoc of snap.docs) {
          const tasksSnap = await sprintDoc.ref.collection("tasks").get();
          const entry = userData[colName].find((e) => e.id === sprintDoc.id);
          if (entry) {
            entry.tasks = tasksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            totalDocs += entry.tasks.length;
          }
        }
      }
    }
    dump.users[uid] = userData;
    console.log(`  ${uid}: ${totalDocs} documents`);
  }
  return dump;
}

async function uploadToDrive(filePath, fileName) {
  const client = getOAuthClient();
  const hasToken = await loadSavedToken(client);
  if (!hasToken) await authorizeNewToken(client);

  const drive = google.drive({ version: "v3", auth: client });
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [DRIVE_FOLDER_ID] },
    media: { mimeType: "application/json", body: createReadStream(filePath) },
  });
  return res.data;
}

async function main() {
  console.log("Exporting Firestore data...");
  const dump = await dumpFirestore();
  if (!dump) return;

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${ts}.json`;
  const bkpDir = resolve(process.cwd(), "firebase-bkp");
  mkdirSync(bkpDir, { recursive: true });
  const filePath = resolve(bkpDir, fileName);

  writeFileSync(filePath, JSON.stringify(dump, null, 2));
  const sizeKB = (Buffer.byteLength(JSON.stringify(dump)) / 1024).toFixed(1);
  console.log(`\nLocal backup: ${fileName} (${sizeKB} KB)`);

  console.log("Uploading to Google Drive...\n");
  try {
    const file = await uploadToDrive(filePath, fileName);
    console.log(`\nDrive upload: https://drive.google.com/file/d/${file.id}/view`);
  } catch (err) {
    console.error("\nDrive upload failed:", err.message);
    console.error("Make sure you:");
    console.error("  1. Created an OAuth 2.0 Client ID (Desktop app) at https://console.cloud.google.com/apis/credentials");
    console.error("  2. Saved it as oauth-client.json in the project root");
    console.error("  3. The folder exists and the auth email has access");
  }
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
