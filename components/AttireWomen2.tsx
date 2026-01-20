"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const WOMEN_COLORS = [
  { name: "Buttercup", hex: "#FFF4B8" },
  { name: "Soft Peach", hex: "#F7B7A3" },
  { name: "Pale Pink", hex: "#FADADD" },
  { name: "Lavender", hex: "#D8CFE3" },
  { name: "Cool Aqua", hex: "#D7F1F6" },
  { name: "Meadow Green", hex: "#D8ECCF" },
];

const WOMEN_SPONSOR_GALLERY = [
  "/attirewomanguide1.png",
  "/attirewomanguide2.png",
  "/attirewomanguide3.png",
];

const WOMEN_GUEST_GALLERY = ["/wguest1.png", "/wguest2.png", "/wguest3.png"];

const MEN_GALLERY = ["/outfitformen.png", "/outfitformen1.png", "/outfitformen2.png"];

type ModalKey = null | "womenSponsor" | "womenGuest" | "men";

const btn =
  "w-full inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/75 " +
  "px-4 py-3 text-sm font-semibold text-[#2f2f2f] ring-1 ring-white/30 " +
  "shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:bg-white active:scale-[0.99] transition";

function DotPalette() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {WOMEN_COLORS.map((c) => (
        <div key={c.name} className="flex items-center gap-2">
          <span
            className="h-9 w-9 rounded-full ring-1 ring-black/10 shadow-[0_10px_18px_rgba(0,0,0,0.08)]"
            style={{ background: c.hex }}
            aria-hidden
          />
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#7a7a7a]">
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AttireWomen() {
  const [open, setOpen] = useState<ModalKey>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };

    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const gallery = useMemo(() => {
    if (open === "womenSponsor") return WOMEN_SPONSOR_GALLERY;
    if (open === "womenGuest") return WOMEN_GUEST_GALLERY;
    if (open === "men") return MEN_GALLERY;
    return [];
  }, [open]);

  const modalTitle =
    open === "womenSponsor"
      ? "Sponsor Women"
      : open === "womenGuest"
      ? "Women Guests"
      : "Men’s Attire";

  const modalCopy = useMemo(() => {
    if (open === "womenSponsor") {
      return (
        <div className="space-y-3 text-sm leading-7 text-[#5b5b5b]">
          <p className="font-semibold text-[#2f2f2f]">For Sponsor Women</p>
          <p>
            Please wear <span className="font-semibold">plain, solid-colored</span> dresses in soft,
            romantic tones. Light, flowy silhouettes are encouraged for an elegant, cohesive, and timeless look.
          </p>
          <p className="text-xs text-[#7a7a7a]">
            Tip: Keep patterns minimal and stick to the palette.
          </p>
        </div>
      );
    }

    if (open === "womenGuest") {
      return (
        <div className="space-y-3 text-sm leading-7 text-[#5b5b5b]">
          <p className="font-semibold text-[#2f2f2f]">For Guest Women</p>
          <p>
            Printed or patterned dresses are welcome—think <span className="font-semibold">light, whimsical</span>{" "}
            styles with romantic details (florals, soft prints, delicate textures), as long as the overall colors stay
            soft and harmonious.
          </p>
          <p className="text-xs text-[#7a7a7a]">
            Tip: Choose airy prints, not bold high-contrast patterns.
          </p>
        </div>
      );
    }

    if (open === "men") {
      return (
        <div className="space-y-4 text-sm leading-7 text-[#5b5b5b]">
          <div>
            <p className="font-semibold text-[#2f2f2f]">Sponsor Men</p>
            <p>
              Barong Tagalog paired with <span className="font-semibold">black slacks</span> and{" "}
              <span className="font-semibold">black shoes</span>.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#2f2f2f]">Guest Men</p>
            <p>
              Same guide: Barong Tagalog with black slacks and black shoes for a clean, classic, coordinated look.
            </p>
          </div>
        </div>
      );
    }

    return null;
  }, [open]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* two premium cards: Women + Men */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* WOMEN */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 p-7 ring-1 ring-black/10 shadow-[0_18px_55px_rgba(0,0,0,0.10)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-60" style={{ background: "#FADADD" }} />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full blur-3xl opacity-55" style={{ background: "#D7F1F6" }} />

          <p className="text-[11px] uppercase tracking-[0.28em] text-[#7a7a7a]">Attire for Women</p>
          <p className="mt-3 text-lg font-semibold text-[#2f2f2f]">Whimsical, romantic, and light</p>
          <p className="mt-2 text-sm leading-7 text-[#5b5b5b]">
            Soft tones, delicate details, and elegant silhouettes. Use the palette below as your guide.
          </p>

          <div className="mt-6">
            <DotPalette />
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setOpen("womenSponsor")} className={btn}>
              Sponsor Women
            </button>
            <button type="button" onClick={() => setOpen("womenGuest")} className={btn}>
              Guest Women
            </button>
          </div>
        </div>

        {/* MEN */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 p-7 ring-1 ring-black/10 shadow-[0_18px_55px_rgba(0,0,0,0.10)]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-55" style={{ background: "#D8CFE3" }} />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full blur-3xl opacity-45" style={{ background: "#FFF4B8" }} />

          <p className="text-[11px] uppercase tracking-[0.28em] text-[#7a7a7a]">Attire for Men</p>
          <p className="mt-3 text-lg font-semibold text-[#2f2f2f]">Classic and coordinated</p>
          <p className="mt-2 text-sm leading-7 text-[#5b5b5b]">
            Barong Tagalog paired with black slacks and black shoes.
          </p>

          <div className="mt-7">
            <button type="button" onClick={() => setOpen("men")} className={btn}>
              View Men Attire Samples
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-black/10">
            <Image
              src="/outfitformen.png"
              alt="Men attire preview"
              width={1200}
              height={800}
              className="h-[220px] w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl bg-[#FBF8F1] ring-1 ring-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="border-b border-black/10 px-5 py-4 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 text-left">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#7a7a7a]">Attire Guide</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#2f2f2f] sm:text-2xl">
                    {modalTitle}
                  </h3>
                  {modalCopy ? <div className="mt-4">{modalCopy}</div> : null}
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="shrink-0 rounded-full bg-white/70 p-2 text-[#4a4a4a] ring-1 ring-black/10 hover:bg-white transition"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* gallery */}
            <div className="max-h-[60vh] overflow-y-auto px-5 py-6 sm:px-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((src, idx) => (
                  <div
                    key={`${src}-${idx}`}
                    className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/10 shadow-[0_14px_40px_rgba(0,0,0,0.10)]"
                  >
                    <Image
                      src={src}
                      alt={`${modalTitle} sample ${idx + 1}`}
                      width={1400}
                      height={1000}
                      className="h-[240px] w-full object-cover sm:h-[280px]"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-5 text-center text-xs text-[#7a7a7a]">
                Press <span className="font-semibold">Esc</span> to close.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
