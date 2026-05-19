import "dotenv/config";
import crypto from "crypto";
import path from "path";
import Database from "better-sqlite3";

// Read DATABASE_URL env var, fallback to dev.db
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbFile = dbUrl.replace(/^file:/, "");
const dbPath = path.isAbsolute(dbFile)
  ? dbFile
  : path.resolve(process.cwd(), dbFile);
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
