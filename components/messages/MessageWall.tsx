"use client";

import { useEffect, useMemo, useState } from "react";

type WallMessage = {
  id: string;
  guestName: string;
  message: string;
  attendance: "yes" | "no" | null;
  submittedAt: string | null;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function maskGuestName(name: string) {
  const v = String(name || "").trim();
  if (!v) return "Gu *****";
  const prefix = v.slice(0, 2);
  return `${prefix} *****`;
}

export default function MessageWall({ messages }: { messages: WallMessage[] }) {
  const pages = useMemo(() => chunk(messages, 2), [messages]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;
    const t = window.setInterval(() => {
      setPage((p) => (p + 1) % pages.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, [pages.length]);

  const current = pages[page] || [];
  const currentIds = new Set(current.map((m) => m.id));
  const bgCards = messages.filter((m) => !currentIds.has(m.id)).slice(0, 8);

  return (
    <div className="relative rounded-3xl border border-white/50 bg-white/60 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.10)] backdrop-blur md:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        {bgCards.map((card, i) => (
          <div
            key={`${card.id}-${i}`}
            className="absolute animate-[fall_20s_linear_infinite] rounded-xl border border-[#edd7d0] bg-white/55 px-3 py-2 text-[10px] text-[#8e6d63] shadow-sm"
            style={{
              left: `${(i * 11) % 82}%`,
              top: `${-30 - i * 14}px`,
              width: `${180 + (i % 3) * 24}px`,
              animationDelay: `${(i % 8) * 1.1}s`,
              animationDuration: `${16 + (i % 5) * 2.4}s`,
            }}
          >
            <div className="truncate font-semibold">{maskGuestName(card.guestName)}</div>
            <div className="mt-1 line-clamp-2">{card.message}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 text-sm uppercase tracking-[0.22em] text-[#8c6f63]">Guest Messages</div>
      <div className="relative grid gap-4 md:grid-cols-2">
        {current.map((m) => (
          <article
            key={`${m.id}-${page}`}
            className="animate-[slideIn_700ms_ease] rounded-2xl border border-[#f0ded8] bg-white/94 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-base font-semibold text-[#4a312b]">{maskGuestName(m.guestName)}</div>
              <span
                className={[
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ring-1",
                  m.attendance === "yes"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-rose-50 text-rose-700 ring-rose-200",
                ].join(" ")}
              >
                {m.attendance || "rsvp"}
              </span>
            </div>
            <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-[15px] leading-7 text-[#594741]">{m.message}</p>
          </article>
        ))}
      </div>

      {pages.length > 1 ? (
        <div className="relative mt-4 flex items-center justify-center gap-1.5">
          {pages.map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 rounded-full transition-all",
                i === page ? "w-7 bg-[#c98e7f]" : "w-2 bg-[#e8cfc7]",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-40px) rotate(-4deg);
            opacity: 0;
          }
          20% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(780px) rotate(6deg);
            opacity: 0;
          }
        }
        @keyframes slideIn {
          0% {
            transform: translateY(14px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
