"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Allura, Comfortaa } from "next/font/google";
import GallerySlider from "@/components/GallerySlider";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const allura = Allura({
  subsets: ["latin"],
  weight: ["400"],
});

type Guest = {
  guestId: string;
  fullName: string;
  paxAllowed: number;
  rsvpSubmitted: boolean;
  email?: string | null;
  announcementOptIn?: boolean | null;
};

type VerifyResponse = {
  ok: boolean;
  guest?: Guest;
  rsvp?: {
    attendance: "yes" | "no" | null;
    paxAttending: number;
    message: string;
  };
  deadlineIso?: string | null;
  error?: string;
};

type SubmitResponse = {
  ok: boolean;
  emailSent?: boolean;
  emailId?: string | null;
  error?: string;
};

function formatDateLong(d: Date) {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, targetMs - now);
  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, done: diff === 0 };
}

function MusicToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    if (!audio) return;

    const tryPlay = async () => {
      try {
        audio.volume = 0.35;
        await audio.play();
        setEnabled(true);
        window.removeEventListener("pointerdown", tryPlay);
        window.removeEventListener("keydown", tryPlay);
      } catch {}
    };

    window.addEventListener("pointerdown", tryPlay, { once: true });
    window.addEventListener("keydown", tryPlay, { once: true });

    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
  }, []);

  const toggle = async () => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement | null;
    if (!audio) return;

    try {
      if (audio.paused) {
        audio.volume = 0.35;
        await audio.play();
        setEnabled(true);
      } else {
        audio.pause();
        setEnabled(false);
      }
    } catch {}
  };

  return (
    <>
      <audio id="bg-music" src="/minamahal.mp3" loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 rounded-full px-4 py-2 shadow-lg ring-1 ring-black/10 backdrop-blur hover:bg-white"
      >
        <span className={`${comfortaa.className} text-sm font-semibold text-slate-800`}>
          {enabled ? "🔊" : "🔇"}
        </span>
      </button>
    </>
  );
}

function EventImageLink(props: { src: string; href: string; alt: string }) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="group block w-full overflow-hidden rounded-[32px] shadow-[0_16px_60px_rgba(0,0,0,0.10)] ring-1 ring-black/5"
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "509 / 706" }}>
        <Image
          src={props.src}
          alt={props.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
    </a>
  );
}

function FaqItem({ q, a }: { q: string; a: string | React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className={`${comfortaa.className} text-sm font-semibold text-slate-900`}>{q}</span>
        <span className="text-slate-500">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="px-5 pb-5">
          <div className={`${comfortaa.className} text-sm leading-6 text-slate-600`}>{a}</div>
        </div>
      ) : null}
    </div>
  );
}

type CachedVerify = {
  ts: number;
  data: VerifyResponse;
};

const VERIFY_CACHE_TTL_MS = 5 * 60 * 1000;
const VERIFY_MIN_INTERVAL_MS = 15 * 1000;
const SUBMIT_MIN_INTERVAL_MS = 10 * 1000;

function safeParseCachedVerify(raw: string | null): CachedVerify | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedVerify;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.ts !== "number") return null;
    if (!parsed.data || typeof parsed.data !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function nowMs() {
  return Date.now();
}

export default function RsvpClient({ token }: { token: string }) {
  const weddingDate = useMemo(() => new Date("2026-03-06T14:00:00+08:00"), []);
  const countdown = useCountdown(weddingDate.getTime());

  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [deadlineIso, setDeadlineIso] = useState<string | null>(null);

  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  const [paxAttending, setPaxAttending] = useState<number>(1);
  const [message, setMessage] = useState<string>("");

  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const lastVerifyAtRef = useRef<number>(0);
  const lastSubmitAtRef = useRef<number>(0);

  const needsEmail = useMemo(() => !guest?.email, [guest]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const cacheKey = `rsvp_verify:${token}`;
    const cooldownKey = `rsvp_verify_cd:${token}`;

    const applyVerifyData = (data: VerifyResponse) => {
      if (!mounted) return;
      if (!data.ok || !data.guest) throw new Error(data.error || "Invalid RSVP link");

      setGuest(data.guest);
      setDeadlineIso(data.deadlineIso ?? null);
      setEmail(data.guest.email || "");
      setOptIn(data.guest.announcementOptIn ?? true);

      if (data.rsvp) {
        setAttendance(data.rsvp.attendance ?? null);
        setPaxAttending(data.rsvp.paxAttending || 1);
        setMessage(data.rsvp.message || "");
      } else {
        setPaxAttending(data.guest.paxAllowed ? 1 : 1);
      }
    };

    const readCache = () => {
      if (typeof window === "undefined") return null;
      return safeParseCachedVerify(sessionStorage.getItem(cacheKey));
    };

    const writeCache = (data: VerifyResponse) => {
      if (typeof window === "undefined") return;
      const payload: CachedVerify = { ts: nowMs(), data };
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch {}
    };

    const canVerifyNow = () => {
      const t = nowMs();
      if (t - lastVerifyAtRef.current < VERIFY_MIN_INTERVAL_MS) return false;

      try {
        const raw = sessionStorage.getItem(cooldownKey);
        const last = raw ? Number(raw) : 0;
        if (Number.isFinite(last) && last > 0 && t - last < VERIFY_MIN_INTERVAL_MS) return false;
        sessionStorage.setItem(cooldownKey, String(t));
      } catch {}

      lastVerifyAtRef.current = t;
      return true;
    };

    (async () => {
      try {
        setLoading(true);
        setBanner(null);

        const cached = readCache();
        if (cached && nowMs() - cached.ts <= VERIFY_CACHE_TTL_MS && cached.data?.ok && cached.data?.guest) {
          applyVerifyData(cached.data);
          return;
        }

        if (!canVerifyNow()) {
          if (cached && cached.data?.ok && cached.data?.guest) {
            applyVerifyData(cached.data);
            return;
          }
          throw new Error("Please wait a moment and try again.");
        }

        const res = await fetch("/api/rsvp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
          cache: "no-store",
        });

        const data = (await res.json()) as VerifyResponse;
        if (!data.ok || !data.guest) throw new Error(data.error || "Invalid RSVP link");
        writeCache(data);
        applyVerifyData(data);
      } catch (e: any) {
        if (!mounted) return;
        if (e?.name === "AbortError") return;
        setBanner({ type: "error", text: e?.message || "Invalid RSVP link" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [token]);

  const rsvpDeadlineText = useMemo(() => {
    if (!deadlineIso) return "RSVP closes February 13, 2026";
    const d = new Date(deadlineIso);
    if (Number.isNaN(d.getTime())) return "RSVP closes February 13, 2026";
    return `RSVP closes ${formatDateLong(d)}`;
  }, [deadlineIso]);

  const submitDisabled = useMemo(() => {
    if (!guest) return true;
    if (!attendance) return true;
    if (attendance === "yes" && (paxAttending < 1 || paxAttending > guest.paxAllowed)) return true;

    if (needsEmail) {
      const v = email.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!ok) return true;
    }
    return false;
  }, [guest, attendance, paxAttending, needsEmail, email]);

  async function onSubmit() {
    if (!guest) return;

    const t = nowMs();
    if (t - lastSubmitAtRef.current < SUBMIT_MIN_INTERVAL_MS) {
      setBanner({ type: "error", text: "Please wait a moment before submitting again." });
      return;
    }
    lastSubmitAtRef.current = t;

    setBanner(null);

    if (!attendance) {
      setBanner({ type: "error", text: "Please select Yes or No." });
      return;
    }

    if (attendance === "yes") {
      const p = clamp(paxAttending, 1, guest.paxAllowed);
      if (p !== paxAttending) setPaxAttending(p);
    }

    if (needsEmail) {
      const v = email.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!ok) {
        setBanner({ type: "error", text: "Please enter a valid email address." });
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          attendance,
          paxAttending: attendance === "yes" ? paxAttending : 0,
          message,
          email: needsEmail ? email.trim() : undefined,
          announcementOptIn: optIn,
        }),
      });

      const data = (await res.json()) as SubmitResponse;

      if (!res.ok || !data.ok) {
        setBanner({ type: "error", text: data.error || "Submission failed. Please try again." });
        return;
      }

      setBanner({
        type: "success",
        text: data.emailSent ? "RSVP saved. Confirmation email sent." : "RSVP saved successfully.",
      });

      setGuest((g) =>
        g
          ? {
              ...g,
              rsvpSubmitted: true,
              email: g.email || (needsEmail ? email.trim() : g.email),
              announcementOptIn: optIn,
            }
          : g
      );

      try {
        sessionStorage.removeItem(`rsvp_verify:${token}`);
      } catch {}
    } catch {
      setBanner({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const displayDate = useMemo(() => {
    const d = weddingDate;
    return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    })}`;
  }, [weddingDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <div className={`${comfortaa.className} text-sm text-slate-600`}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${comfortaa.className}`}>
      <MusicToggle />

      <section className="relative h-[520px] w-full overflow-hidden">
        <Image src="/hero.jpg" alt="Mosses & Vanesa" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div className="max-w-3xl text-white">
            <h2 className="text-[20px] font-bold  sm:text-[40px]">It’s official, we’re tying the knot.</h2>
            <h1 className={`${allura.className} mt-3 text-[50px] leading-[0.99] sm:text-[100px]`}>
              Mosses &amp; Vanesa
            </h1>
            <h3 className="mt-4 text-[26px] font-light sm:text-[40px]">06 March 2026</h3>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-20 px-6 pb-14">
        <div className="mx-auto max-w-3xl rounded-[28px] bg-white/95 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur sm:p-8">
          <div className="text-center">
            <div className="text-[13px] tracking-[0.25em] text-slate-500 uppercase">You are invited</div>

            <h1 className="mt-3 text-[30px] sm:text-[54px] font-semibold text-slate-900 leading-[2.05]">
              {guest?.fullName ?? "Guest"}
            </h1>

            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px w-10 bg-[#FFE5B4]" />
              <div className="text-sm text-slate-600">
                We reserved up to <span className="font-semibold text-slate-900">{guest?.paxAllowed ?? 1}</span> seat
                {(guest?.paxAllowed ?? 1) > 1 ? "s" : ""} for you
              </div>
              <div className="h-px w-10 bg-[#FFE5B4]" />
            </div>
          </div>

          {guest?.rsvpSubmitted ? (
            <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              RSVP already submitted. You can still update it before the deadline.
            </div>
          ) : null}

          {banner ? (
            <div
              className={[
                "mt-6 rounded-2xl px-4 py-3 text-sm ring-1",
                banner.type === "success"
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-rose-50 text-rose-800 ring-rose-200",
              ].join(" ")}
            >
              {banner.text}
            </div>
          ) : null}

          <div className="mt-7 rounded-3xl bg-white p-6 ring-1 ring-black/5">
            <div className="text-left text-base font-semibold text-slate-900">Will you attend?</div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setAttendance("yes");
                  setPaxAttending((p) => (p < 1 ? 1 : p));
                }}
                className={[
                  "rounded-2xl px-4 py-3 text-left ring-1 transition",
                  attendance === "yes"
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-900 ring-black/10 hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="font-semibold">Yes, I will attend</div>
                <div className={attendance === "yes" ? "text-white/80" : "text-slate-600"}>Confirm your seat(s).</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttendance("no");
                  setPaxAttending(0);
                }}
                className={[
                  "rounded-2xl px-4 py-3 text-left ring-1 transition",
                  attendance === "no"
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-900 ring-black/10 hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="font-semibold">No, I can’t attend</div>
                <div className={attendance === "no" ? "text-white/80" : "text-slate-600"}>We’ll miss you.</div>
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold text-slate-800">Number of seats</div>
                <select
                  value={attendance === "yes" ? paxAttending : 0}
                  onChange={(e) => setPaxAttending(Number(e.target.value))}
                  disabled={attendance !== "yes" || !guest}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-[#FFE5B4] disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {attendance !== "yes" ? (
                    <option value={0}>0</option>
                  ) : (
                    Array.from({ length: guest?.paxAllowed || 1 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                {needsEmail ? (
                  <>
                    <div className="text-sm font-semibold text-slate-800">Email</div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email (for confirmation)"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-[#FFE5B4]"
                    />
                  </>
                ) : (
                  <div className="text-sm font-semibold text-slate-800">Email</div>
                )}

                <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={optIn}
                    onChange={(e) => setOptIn(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Send me wedding updates (optional).
                </label>
              </div>

              <div className="md:col-span-2">
                <div className="text-sm font-semibold text-slate-800">Message (optional)</div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a short note for the couple."
                  className="mt-2 min-h-[90px] w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-[#FFE5B4]"
                />
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">{rsvpDeadlineText}</div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || submitDisabled}
              className={[
                "mt-4 w-full rounded-2xl px-5 py-3 font-semibold shadow-sm transition",
                submitting || submitDisabled ? "bg-slate-200 text-slate-500" : "bg-[#f3b6a6] text-slate-900 hover:brightness-95",
              ].join(" ")}
            >
              {submitting ? "Saving…" : guest?.rsvpSubmitted ? "Update RSVP" : "Submit RSVP"}
            </button>

            <div className="mt-4 text-center text-xs text-slate-500">Need help? info@mossesandvanesa.com / 09261142143</div>
            <div className="mt-2 text-center text-xs text-slate-500">
              This RSVP URL uses a secure signed token to protect your RSVP access.
            </div>
            <div className="mt-4 text-center text-base font-semibold text-slate-700">
              More info at{" "}
              <a
                href="https://www.mossesandvanesa.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-700 transition"
              >
                www.mossesandvanesa.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto w-full max-w-[1040px] text-center">
          <Image src="/divider.png" alt="divider" width={1040} height={160} className="mx-auto h-auto w-full max-w-[1040px]" />
          <div className="mt-4 text-[28px] font-light text-[#808080] sm:text-[40px]">{displayDate}</div>

          <div className="mt-7 grid grid-cols-4 gap-5 max-w-[520px] mx-auto">
            {[
              { label: "D", value: countdown.days },
              { label: "H", value: countdown.hours },
              { label: "M", value: countdown.minutes },
              { label: "S", value: countdown.seconds },
            ].map((b) => (
              <div
                key={b.label}
                className="rounded-2xl bg-white h-[110px] sm:h-[120px] flex flex-col items-center justify-center shadow-[0_0_26px_rgba(255,229,180,0.55)] ring-1 ring-[#FFE5B4]/70"
              >
                <div className="text-[34px] sm:text-[38px] font-medium text-[#FFE5B4] leading-none">
                  {String(b.value).padStart(2, "0")}
                </div>
                <div className="mt-3 text-[14px] font-medium text-[#FFCF73] leading-none">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-[1040px]">
          <div className="grid gap-8 md:grid-cols-2">
            <EventImageLink src="/weddingparty.png" alt="Wedding Reception" href="https://share.google/YyCPriAO23vJrkzqP" />
            <EventImageLink src="/weddingceremony.png" alt="Wedding Ceremony" href="https://maps.app.goo.gl/mCK6jo7yczmKfyT28" />
          </div>
        </div>
      </section>

      <section id="gallery" className="px-6 pb-13 md:px-16">
        <div className="text-center">
          <h2 className={`${comfortaa.className} text-2xl font-bold text-slate-900`}>Gallery</h2>
          <GallerySlider />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className={`${comfortaa.className} text-2xl font-bold text-slate-900`}>FAQs</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We can’t wait to share our special day with you! If you have any questions, chances are they are answered
              here. If not, please reach out to us and we can answer whatever questions you have.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <FaqItem
              q="When is the RSVP deadline?"
              a={
                <>
                  Kindly RSVP by <b>Feb 13, 2026</b>, so we can plan accordingly. If we haven’t heard from you by then,
                  we’ll assume you can’t make it.
                </>
              }
            />

            <FaqItem
              q="What if I don’t RSVP in time?"
              a="We will miss celebrating with you. We need to provide our venue with the exact number of guests by a certain date, so please don’t RSVP late."
            />

            <FaqItem
              q="What should I do if I said yes but later realize I can't make it?"
              a="We know things come up! If your plans change and you can no longer make it, please drop us a message so we can update our headcount."
            />

            <FaqItem
              q="Can I bring a plus one?"
              a="As much as we’d love to include everyone, our venue has limited space and we’re only able to invite those listed on the invitation. Thank you for your understanding—we’re so excited to celebrate with you!"
            />

            <FaqItem q="Are the kids invited?" a="We’re giving the grown-ups a well-deserved break. This celebration is just for the adults." />

            <FaqItem
              q="What time should I arrive at the ceremony?"
              a="The ceremony will start at 1:30 in the afternoon, but we recommend arriving about thirty minutes early to ensure you are seated as we begin."
            />

            <FaqItem
              q="Can I take pictures during the ceremony?"
              a="We are having an unplugged ceremony. Once the ceremony begins, we kindly ask that all phones be put away and silenced. We want everyone to be fully present with us, and our photographer will capture the moments, which we will absolutely share with you."
            />

            <FaqItem
              q="What kind of gift would you prefer?"
              a="Your love and presence are more than enough. However, if you would like to give something, a monetary gift would be truly appreciated. It will help us begin our life together and create meaningful memories along the way."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
