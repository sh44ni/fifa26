import crypto from "crypto";
import path from "path";
import Database from "better-sqlite3";

const dbPath = path.resolve(process.cwd(), "dev.db");
console.log(`Using database at: ${dbPath}`);

const db = new Database(dbPath);

// Check if token already exists
const existing = db.prepare("SELECT * FROM AppSettings WHERE id = 1").get() as Record<string, unknown> | undefined;

if (!existing) {
  const token = crypto.randomBytes(24).toString("base64url").slice(0, 32);
  db.prepare("INSERT INTO AppSettings (id, liveDisplayActive, votingToken) VALUES (1, 0, ?)").run(token);
  console.log(`AppSettings created with token: ${token}`);
} else {
  console.log(`AppSettings already exists. Token: ${existing.votingToken}`);
}

db.close();
