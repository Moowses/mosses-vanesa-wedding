"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Guest = {
  guestId: string;
  fullName: string;
  paxAllowed: number;
  role: string;
  relation: string;
  rsvpSubmitted: boolean;

  // NEW (optional): your /api/rsvp/verify should return this if it exists in Firestore
  email?: string;

  // OPTIONAL: if you want to persist consent
  announcementOptIn?: boolean;
};

const CONTACT_EMAIL = "info@mossesandvanesa.com";
const CONTACT_PHONE = "09261142143";

// If your files are actually .jpg/.png, update these paths.
const SLIDES = ["/mv.jpg", "/mv2.jpg"];

type Step = "welcome" | "form" | "done";
type Attendance = "yes" | "no" | null;

function isValidEmail(email: string) {
  const v = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function RsvpClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [deadlineIso, setDeadlineIso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("welcome");
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [paxAttending, setPaxAttending] = useState<number>(1);
  const [message, setMessage] = useState("");

  // NEW: email + announcements consent
  const [email, setEmail] = useState("");
  const [announcementOptIn, setAnnouncementOptIn] = useState(true);

  // NEW: prevent double submit + show status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Slideshow state
  const [slideIdx, setSlideIdx] = useState(0);

  const deadlineMs = useMemo(
    () => (deadlineIso ? new Date(deadlineIso).getTime() : null),
    [deadlineIso]
  );
  const isClosed = useMemo(
    () => (deadlineMs ? Date.now() > deadlineMs : false),
    [deadlineMs]
  );

  const needsEmail = useMemo(() => !guest?.email, [guest?.email]);
  const emailOk = useMemo(() => {
    if (!needsEmail) return true;
    return isValidEmail(email);
  }, [needsEmail, email]);

  // Load guest from token
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/rsvp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!data.ok) {
          setError(data.error || "INVALID");
          setGuest(null);
          return;
        }

        const g: Guest = data.guest;
        setGuest(g);
        setDeadlineIso(data.deadlineIso || null);

        // default pax attending to 1 (dropdown later limits to paxAllowed)
        const allowed = g?.paxAllowed ?? 1;
        setPaxAttending(Math.min(1, allowed));

        // NEW: prefill email if already stored
        setEmail(g.email || "");

        // OPTIONAL: prefill opt-in if stored
        setAnnouncementOptIn(g.announcementOptIn ?? true);
      } catch {
        setError("NETWORK_ERROR");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Slideshow timer
  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcut: Enter to continue on welcome step
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key === "Enter" &&
        step === "welcome" &&
        !loading &&
        !error &&
        guest &&
        !isClosed
      ) {
        setStep("form");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, loading, error, guest, isClosed]);

  const paxOptions = useMemo(() => {
    const max = Math.max(1, guest?.paxAllowed ?? 1);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [guest?.paxAllowed]);

  async function submit() {
    if (!guest) return;

    setSubmitError(null);

    if (!attendance) {
      alert("Please select Yes or No.");
      return;
    }

    // NEW: if email is missing on record, require it now
    if (needsEmail && !emailOk) {
      alert("Please enter a valid email so we can send your RSVP confirmation.");
      return;
    }

    // Validate pax if attending yes
    let pax = 0;
    if (attendance === "yes") {
      const max = guest.paxAllowed ?? 1;
      pax = Number(paxAttending);

      if (!Number.isFinite(pax) || pax < 1 || pax > max) {
        alert(`Pax must be between 1 and ${max}`);
        return;
      }
    } else {
      pax = 0;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          paxAttending: pax,
          attendance,
          message,

          // NEW: capture email/opt-in for confirmation + announcements
          email: email.trim() || undefined,
          announcementOptIn,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "RSVP_CLOSED") {
          alert(`RSVP is closed. Contact: ${CONTACT_EMAIL} / ${CONTACT_PHONE}`);
        } else {
          alert("Unable to submit RSVP. Please contact the couple.");
        }
        return;
      }

      // Update local guest state so UI reflects email saved + submitted
      setGuest((prev) =>
        prev
          ? {
              ...prev,
              rsvpSubmitted: true,
              email: prev.email || email.trim() || prev.email,
              announcementOptIn,
            }
          : prev
      );

      setStep("done");
    } catch {
      setSubmitError("NETWORK_ERROR");
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white/70 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT: RSVP FORM */}
          <div className="order-2 lg:order-1 p-6 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.18em] text-black/60">
                  M O S S E S & V A N E S A
                </p>
                <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-black/90">
                  Wedding Invitation
                </h1>
              </div>

              {deadlineIso && (
                <div className="flex flex-col items-start sm:items-end">
                  <div className="mt-3 sm:mt-0 rounded-xl bg-black/5 px-4 py-2 sm:px-4 sm:py-3">
                    <p className="text-[10px] uppercase tracking-wide text-black/60">
                      RSVP closes
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-black/80">
                      {new Date(deadlineIso).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              {loading && (
                <div className="rounded-2xl bg-black/5 p-5 text-center">
                  <p className="text-sm text-black/70">Loading your invitation…</p>
                </div>
              )}

              {!loading && error && (
                <div className="rounded-2xl bg-red-50 p-5">
                  <p className="font-medium text-red-900">
                    This RSVP link is invalid or expired.
                  </p>
                  <p className="mt-2 text-sm text-red-900/70">
                    Contact: <span className="font-medium">{CONTACT_EMAIL}</span> /{" "}
                    <span className="font-medium">{CONTACT_PHONE}</span>
                  </p>
                </div>
              )}

              {!loading && guest && (
                <>
                  {/* Guest header */}
                  <div className="rounded-2xl bg-black/5 p-5">
                    <p className="text-xs tracking-[0.14em] text-black/60">
                      YOU ARE INVITED
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-black/90">
                      {guest.fullName}
                    </p>
                    <p className="mt-2 text-sm text-black/70">
                      We reserved up to{" "}
                      <span className="font-semibold">{guest.paxAllowed}</span>{" "}
                      seat{guest.paxAllowed > 1 ? "s" : ""} for you.
                    </p>

                    <div className="mt-4 text-sm text-black/70">
                      <p className="font-medium">Save the date</p>
                      <p className="mt-1">March 6, 2026, 2:00 PM</p>
                      <p className="mt-1">
                        Saint Micheal Archangel Quasi Parish - Eden
                      </p>
                    </div>
                  </div>

                  {isClosed ? (
                    <div className="mt-5 rounded-2xl bg-yellow-50 p-5 text-sm text-yellow-900">
                      RSVP is closed. For changes, contact{" "}
                      <span className="font-medium">{CONTACT_EMAIL}</span> /{" "}
                      <span className="font-medium">{CONTACT_PHONE}</span>.
                    </div>
                  ) : (
                    <>
                      {guest.rsvpSubmitted && (
                        <div className="mt-5 rounded-2xl bg-green-50 p-5 text-sm text-green-900">
                          ✅ RSVP already submitted. You can still update it before the
                          deadline.
                        </div>
                      )}

                      {/* Step content */}
                      {step === "welcome" && (
                        <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-black/10">
                          <h2 className="text-xl font-semibold text-black/90">
                            We hope you can join us!
                          </h2>
                          <p className="mt-2 text-sm text-black/70">
                            Press <span className="font-medium">Enter</span> or click
                            continue to begin your RSVP.
                          </p>

                          <button
                            onClick={() => setStep("form")}
                            className="mt-5 w-full rounded-2xl bg-[#f3b6a6] px-4 py-3 font-medium text-black hover:opacity-90"
                          >
                            Continue
                          </button>

                          <p className="mt-3 text-center text-xs text-black/60">
                            Need help? {CONTACT_EMAIL} / {CONTACT_PHONE}
                          </p>
                        </div>
                      )}

                      {step === "form" && (
                        <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-black/10">
                          <h2 className="text-xl font-semibold text-black/90">
                            Will you attend?
                          </h2>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setAttendance("yes")}
                              className={[
                                "rounded-2xl px-4 py-3 text-left ring-1 transition",
                                attendance === "yes"
                                  ? "bg-black text-white ring-black"
                                  : "bg-white text-black ring-black/10 hover:ring-black/20",
                              ].join(" ")}
                            >
                              <p className="text-sm font-semibold">Yes, I will attend</p>
                              <p className="mt-1 text-xs opacity-80">
                                Confirm your seat(s).
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAttendance("no")}
                              className={[
                                "rounded-2xl px-4 py-3 text-left ring-1 transition",
                                attendance === "no"
                                  ? "bg-black text-white ring-black"
                                  : "bg-white text-black ring-black/10 hover:ring-black/20",
                              ].join(" ")}
                            >
                              <p className="text-sm font-semibold">No, I can’t attend</p>
                              <p className="mt-1 text-xs opacity-80">We’ll miss you.</p>
                            </button>
                          </div>

                          {attendance === "yes" && (
                            <div className="mt-5">
                              <label className="text-sm font-medium text-black/80">
                                Number attending
                              </label>
                              <select
                                className="mt-2 w-full rounded-2xl border border-black/20 bg-white px-4 py-3
                                            text-sm font-medium text-black
                                            appearance-none
                                            focus:outline-none focus:ring-2 focus:ring-black/30"
                                value={paxAttending}
                                onChange={(e) => setPaxAttending(Number(e.target.value))}
                              >
                                {paxOptions.map((n) => (
                                  <option key={n} value={n}>
                                    {n} {n === 1 ? "person" : "people"}
                                  </option>
                                ))}
                              </select>

                              <p className="mt-2 text-xs text-black/60">
                                You can select up to {guest.paxAllowed} seat
                                {guest.paxAllowed > 1 ? "s" : ""}.
                              </p>
                            </div>
                          )}

                          {/* NEW: Email capture when missing */}
                          {needsEmail && (
                            <div className="mt-5">
                              <label className="text-sm font-medium text-black/80">
                                Email (required for confirmation)
                              </label>
                              <input
                                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                inputMode="email"
                                autoComplete="email"
                              />
                              {!emailOk && email.length > 0 && (
                                <p className="mt-2 text-xs text-red-700">
                                  Please enter a valid email address.
                                </p>
                              )}

                              <label className="mt-3 flex items-start gap-3 text-xs text-black/70">
                                <input
                                  type="checkbox"
                                  className="mt-0.5"
                                  checked={announcementOptIn}
                                  onChange={(e) => setAnnouncementOptIn(e.target.checked)}
                                />
                                <span>
                                  You may send me wedding updates (optional).
                                </span>
                              </label>
                            </div>
                          )}

                          <div className="mt-5">
                            <label className="text-sm font-medium text-black/80">
                              Message (optional)
                            </label>
                            <textarea
                              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                              rows={3}
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Leave a short note for the couple…"
                            />
                          </div>

                          <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={() => setStep("welcome")}
                              disabled={submitting}
                              className={[
                                "w-full rounded-2xl bg-black/5 px-4 py-3 text-sm font-medium text-black",
                                submitting ? "opacity-60" : "hover:bg-black/10",
                              ].join(" ")}
                            >
                              Back
                            </button>

                            <button
                              type="button"
                              onClick={submit}
                              disabled={submitting || !emailOk}
                              className={[
                                "w-full rounded-2xl bg-[#f3b6a6] px-4 py-3 text-sm font-semibold text-black",
                                submitting || !emailOk ? "opacity-60" : "hover:opacity-90",
                              ].join(" ")}
                            >
                              {submitting
                                ? "Saving…"
                                : guest.rsvpSubmitted
                                ? "Update RSVP"
                                : "Submit RSVP"}
                            </button>
                          </div>

                          {submitError && (
                            <p className="mt-3 text-center text-xs text-red-700">
                              Something went wrong. Please try again.
                            </p>
                          )}

                          <p className="mt-4 text-center text-xs text-black/60">
                            Need help? {CONTACT_EMAIL} / {CONTACT_PHONE}
                          </p>
                        </div>
                      )}

                      {step === "done" && (
                        <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-black/10">
                          <h2 className="text-xl font-semibold text-black/90">Thank you!</h2>
                          <p className="mt-2 text-sm text-black/70">
                            Your RSVP has been saved.
                          </p>

                          <div className="mt-4 rounded-2xl bg-black/5 p-4 text-sm text-black/70">
                            <p className="font-medium text-black/80">
                              Confirmation email
                            </p>
                            <p className="mt-1 text-xs">
                              We’ll send a confirmation email to{" "}
                              <span className="font-medium">
                                {(guest.email || email || "").trim() || "your email"}
                              </span>{" "}
                              (if provided).
                            </p>
                          </div>

                          <button
                            onClick={() => setStep("form")}
                            className="mt-5 w-full rounded-2xl bg-black/5 px-4 py-3 text-sm font-medium text-black hover:bg-black/10"
                          >
                            Update again
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: IMAGE SLIDESHOW */}
          <div className="order-1 lg:order-2 relative min-h-[360px] lg:min-h-full">
            <div className="absolute inset-0">
              {SLIDES.map((src, idx) => (
                <div
                  key={src}
                  className={[
                    "absolute inset-0 transition-opacity duration-700",
                    idx === slideIdx ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                >
                  <Image
                    src={src}
                    alt="Mosses and Vanesa"
                    fill
                    priority={idx === 0}
                    className="object-cover"
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-10">
              <p className="text-xs tracking-[0.18em] text-white/80">
                M O S S E S & V A N E S A
              </p>
              <h3 className="mt-2 font-serif text-3xl sm:text-4xl text-white">
                We’re getting married
              </h3>
              <p className="mt-2 text-sm text-white/90">
                Save the date • March 6, 2026 • 2:00 PM
              </p>
              <p className="mt-1 text-sm text-white/80">
                Saint Micheal Archangel Quasi Parish - Eden
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-6xl text-center text-xs text-black/50">
        © {new Date().getFullYear()} Mosses & Vanesa
      </div>
    </div>
  );
}
