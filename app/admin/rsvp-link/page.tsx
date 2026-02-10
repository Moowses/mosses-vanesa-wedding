import { db } from "@/lib/firebaseAdmin";
import { signToken } from "@/lib/guestToken";
import RsvpAdminClient from "./rsvp-admin-client";

export const dynamic = "force-dynamic";

const ROLE_PRIORITY: Record<string, number> = { entourage: 1, sponsor: 2, guest: 3 };

export default async function AdminRsvpLinksPage() {
  const snap = await db.collection("guests").get();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const expMs = process.env.RSVP_DEADLINE_ISO ? new Date(process.env.RSVP_DEADLINE_ISO).getTime() : undefined;

  const rows = snap.docs.map((doc) => {
    const g = doc.data() as any;

    const role = String(g.role ?? g.Role ?? "guest").trim().toLowerCase();
    const relation = String(g.relation ?? g.Relation ?? "").trim().toLowerCase();
    const paxAllowed = Math.max(1, Number(g.paxAllowed ?? g.PAX ?? 1));

    const token = signToken({ guestId: doc.id, exp: expMs });
    const link = `${baseUrl}/rsvp/${token}`;

    return {
      id: doc.id,
      name: String(g.fullName ?? g.GUEST ?? ""),
      paxAllowed,
      role,
      relation,
      rsvpSubmitted: !!g.rsvpSubmitted,
      link,
      roleOrder: ROLE_PRIORITY[role] ?? 99,
    };
  });
  rows.sort((a, b) => {
    if (a.roleOrder !== b.roleOrder) return a.roleOrder - b.roleOrder;
    const rel = a.relation.localeCompare(b.relation);
    if (rel !== 0) return rel;
    return a.name.localeCompare(b.name);
  });

  return <RsvpAdminClient initialRows={rows} />;
}

