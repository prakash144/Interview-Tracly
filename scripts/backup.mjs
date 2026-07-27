import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { google } from "googleapis";
import { createReadStream, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const SERVICE_ACCOUNT_PATH = resolve(process.cwd(), "service-account.json");
const DRIVE_FOLDER_ID = "1JPqNLn7HJSnnXGj8ry-zzIKdpl6AXqmF";

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error("");
  console.error("  Missing service-account.json");
  console.error("");
  console.error("  1. Go to Firebase Console → Project Settings → Service Accounts");
  console.error("  2. Click 'Generate new private key' → download the JSON");
  console.error("  3. Save it as 'service-account.json' in this project root");
  console.error("");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApps()[0];
const db = getFirestore(app);

const USER_COLLECTIONS = [
  "tracks",
  "resources",
  "resourceProgress",
  "sprints",
  "progress",
  "activity",
  "customLists",
];

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
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  await auth.authorize();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: "application/json",
      body: createReadStream(filePath),
    },
  });

  return res.data;
}

async function main() {
  console.log("Exporting Firestore data...");
  const dump = await dumpFirestore();
  if (!dump) return;

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${ts}.json`;
  const filePath = resolve(process.cwd(), fileName);

  writeFileSync(filePath, JSON.stringify(dump, null, 2));
  const sizeKB = (Buffer.byteLength(JSON.stringify(dump)) / 1024).toFixed(1);
  console.log(`\nLocal backup: ${fileName} (${sizeKB} KB)`);

  console.log("Uploading to Google Drive...");
  try {
    const file = await uploadToDrive(filePath, fileName);
    console.log(`Drive upload: https://drive.google.com/file/d/${file.id}/view`);
  } catch (err) {
    console.error("Drive upload failed:", err.message);
    console.error("Make sure you've shared the folder with:", sa.client_email);
    console.error("  → Open the Drive folder, click Share, add", sa.client_email, "as Editor");
  }
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
