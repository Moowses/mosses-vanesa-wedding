import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // ✅ explicitly load .env.local

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type AnyRow = Record<string, any>;

function makeGuestId(fullName: string) {
  return (
    "guest_" +
    fullName
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50)
  );
}

function normKey(k: string) {
  return k.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function pick(row: AnyRow, key: string) {
  const want = key.toLowerCase();
  for (const k of Object.keys(row)) {
    if (normKey(k) === want) return row[k];
  }
  return undefined;
}

async function main() {
  // ✅ DEBUG: confirm env is loaded
  console.log("ENV CHECK", {
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
  });

  // ✅ Import firebase AFTER dotenv loaded
  const { db, admin } = await import("../lib/firebaseAdmin");

  const filePath = path.join(process.cwd(), "data", "guests.csv");
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");

  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as AnyRow[];

  console.log("Detected CSV columns:", Object.keys(rows[0] ?? {}));

  let imported = 0;

  for (const row of rows) {
    const fullName = String(pick(row, "GUEST") ?? "").trim();
    if (!fullName) continue;

    const paxRaw = Number(String(pick(row, "PAX") ?? "1").trim());
    const paxAllowed = Number.isFinite(paxRaw) ? Math.max(1, paxRaw) : 1;

    const role = String(pick(row, "Role") ?? "").trim();
    const relation = String(pick(row, "Relation") ?? "").trim();

    const guestId = makeGuestId(fullName);

    await db.collection("guests").doc(guestId).set(
      {
        fullName,
        paxAllowed,
        role,
        relation,
        rsvpSubmitted: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    imported++;
  }

  console.log(`✅ Imported/updated ${imported} guests into Firestore`);
}

main().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
