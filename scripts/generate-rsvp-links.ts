import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { signToken, verifyToken } from "../lib/guestToken";

async function main() {
  const { db } = await import("../lib/firebaseAdmin");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  console.log("ENV CHECK", {
    hasSecret: !!process.env.RSVP_TOKEN_SECRET,
    baseUrl,
  });

  const snap = await db.collection("guests").orderBy("fullName").limit(5).get();

  if (snap.empty) {
    console.log("No guests found in Firestore.");
    return;
  }

  console.log("\n=== SAMPLE RSVP LINKS (first 5 guests) ===");
  for (const doc of snap.docs) {
    const guestId = doc.id;
    const guest = doc.data() as any;

    const exp = new Date(process.env.RSVP_DEADLINE_ISO!).getTime();
    const token = signToken({ guestId, exp });


    // quick self-check: verify should succeed
    const verified = verifyToken(token);

    const link = `${baseUrl}/rsvp/${token}`;

    console.log(`\nGuest: ${guest.fullName}`);
    console.log(`guestId: ${guestId}`);
    console.log(`paxAllowed: ${guest.paxAllowed}`);
    console.log(`token ok?: ${verified?.guestId === guestId ? "YES" : "NO"}`);
    console.log(`link: ${link}`);
  }

  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
