import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/guestToken";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

type CacheEntry = { exp: number; value: any };
type RateEntry = { resetAt: number; count: number };

const VERIFY_CACHE_TTL_MS = 5 * 60 * 1000;
const RL_WINDOW_MS = 60 * 1000;
const RL_MAX_PER_WINDOW = 12;

const cache = new Map<string, CacheEntry>();
const rate = new Map<string, RateEntry>();

function now() {
  return Date.now();
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff && xff.trim().length > 0) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return realIp.trim();
  return "unknown";
}

function cacheGet(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (e.exp <= now()) {
    cache.delete(key);
    return null;
  }
  return e.value;
}

function cacheSet(key: string, value: any, ttlMs: number) {
  cache.set(key, { exp: now() + ttlMs, value });
  if (cache.size > 2000) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
}

function checkRateLimit(key: string) {
  const t = now();
  const e = rate.get(key);
  if (!e || e.resetAt <= t) {
    rate.set(key, { resetAt: t + RL_WINDOW_MS, count: 1 });
    return { ok: true, retryAfterSec: 0 };
  }
  if (e.count >= RL_MAX_PER_WINDOW) {
    const retryAfterSec = Math.max(1, Math.ceil((e.resetAt - t) / 1000));
    return { ok: false, retryAfterSec };
  }
  e.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    const body = await req.json().catch(() => ({}));
    const token = body?.token;

    const tokenStr = typeof token === "string" ? token : "";
    const rlKey = `verify:${ip}:${tokenStr || "no-token"}`;
    const rl = checkRateLimit(rlKey);

    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    if (!tokenStr) {
      return NextResponse.json({ ok: false, error: "MISSING_TOKEN" }, { status: 400 });
    }

    const cached = cacheGet(`verify:${tokenStr}`);
    if (cached) {
      return NextResponse.json(cached);
    }

    let payload: { guestId: string; exp?: number | null } | null = null;
    try {
      payload = verifyToken(tokenStr);
    } catch {
      payload = null;
    }

    if (!payload?.guestId) {
      return NextResponse.json({ ok: false, error: "INVALID_OR_EXPIRED" }, { status: 401 });
    }

    const guestRef = db.collection("guests").doc(payload.guestId);
    const rsvpRef = db.collection("rsvps").doc(payload.guestId);

    const [guestDoc, rsvpDoc] = await Promise.all([guestRef.get(), rsvpRef.get()]);

    if (!guestDoc.exists) {
      return NextResponse.json({ ok: false, error: "GUEST_NOT_FOUND" }, { status: 404 });
    }

    const g = guestDoc.data() as any;
    const r = rsvpDoc.exists ? (rsvpDoc.data() as any) : null;

    const paxAllowed = Number(g.paxAllowed ?? g.PAX ?? 1);
    const email = typeof g.email === "string" ? g.email : null;
    const announcementOptIn =
      typeof g.announcementOptIn === "boolean" ? g.announcementOptIn : null;

    const rsvp = r
      ? {
          attendance: r.attendance ?? null,
          paxAttending: Number(r.paxAttending ?? 0),
          message: typeof r.message === "string" ? r.message : "",
          submittedAt: r.submittedAt ?? null,
          updatedAt: r.updatedAt ?? null,
        }
      : {
          attendance: null,
          paxAttending: 0,
          message: "",
          submittedAt: null,
          updatedAt: null,
        };

    const response = {
      ok: true,
      guest: {
        guestId: guestDoc.id,
        fullName: g.fullName ?? g.GUEST ?? "",
        paxAllowed,
        role: g.role ?? g.Role ?? "",
        relation: g.relation ?? g.Relation ?? "",
        rsvpSubmitted: !!g.rsvpSubmitted,
        email,
        announcementOptIn,
      },
      rsvp,
      deadlineIso: process.env.RSVP_DEADLINE_ISO ?? null,
    };

    cacheSet(`verify:${tokenStr}`, response, VERIFY_CACHE_TTL_MS);

    return NextResponse.json(response);
  } catch (err) {
    console.error("RSVP verify error:", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
