import { db } from "@/lib/firebaseAdmin";
import MessageWall from "@/components/messages/MessageWall";
import RouteMap from "@/components/messages/RouteMap";
import { unstable_cache } from "next/cache";

type WallMessage = {
  id: string;
  guestName: string;
  message: string;
  attendance: "yes" | "no" | null;
  submittedAt: string | null;
};

function timestampToIso(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate !== "function") return null;
  const d = maybe.toDate();
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function loadMessages(): Promise<WallMessage[]> {
  const snap = await db.collection("rsvps").orderBy("submittedAt", "desc").limit(500).get();

  const base = snap.docs
    .map((doc) => {
      const x = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        guestId: String(x.guestId ?? doc.id),
        message: String(x.message ?? "").trim(),
        attendance: (x.attendance ?? null) as "yes" | "no" | null,
        submittedAt: timestampToIso(x.submittedAt),
      };
    })
    .filter((m) => m.message.length > 0);

  const guestIds = Array.from(new Set(base.map((m) => m.guestId))).filter(Boolean);
  const nameMap = new Map<string, string>();

  for (let i = 0; i < guestIds.length; i += 250) {
    const chunk = guestIds.slice(i, i + 250);
    if (!chunk.length) continue;
    const refs = chunk.map((id) => db.collection("guests").doc(id));
    const docs = await db.getAll(...refs);
    for (const d of docs) {
      const g = d.data() as Record<string, unknown> | undefined;
      nameMap.set(d.id, String(g?.fullName || "Guest"));
    }
  }

  return base.map((m) => ({
    id: m.id,
    guestName: nameMap.get(m.guestId) || "Guest",
    message: m.message,
    attendance: m.attendance,
    submittedAt: m.submittedAt,
  }));
}

const loadMessagesCached = unstable_cache(loadMessages, ["live-messages-v1"], {
  revalidate: 600,
});

export default async function LiveMessagesSection({ showHeader = false }: { showHeader?: boolean }) {
  const messages = await loadMessagesCached();

  return (
    <div className="w-full">
      {showHeader ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-white/50 bg-white/60 px-6 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.10)] backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#8c6f63]">Live Event Wall</div>
            <h1 className="mt-1 text-3xl font-semibold text-[#3e2c28] md:text-4xl">Messages For Mosses & Vanesa</h1>
          </div>
          <div className="rounded-full bg-[#fff7f4] px-4 py-2 text-sm text-[#6a4a41] ring-1 ring-[#ecdcd6]">
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </div>
        </div>
      ) : null}

      <section className="grid gap-6">
        <RouteMap />
        <MessageWall messages={messages} />
      </section>
    </div>
  );
}
