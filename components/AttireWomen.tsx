"use client";

import { useEffect, useMemo, useState } from "react";

const WOMEN_COLORS = [
  { name: "Buttercup", hex: "#FFF4B8" },
  { name: "Soft Peach", hex: "#F7B7A3" },
  { name: "Pale Pink", hex: "#FADADD" },
  { name: "Lavender", hex: "#D8CFE3" },
  { name: "Cool Aqua", hex: "#D7F1F6" },
  { name: "Meadow Green", hex: "#D8ECCF" },
];

const WOMEN_GALLERY = [
  "/attirewomanguide1.png",
  "/attirewomanguide2.png",
  "/attirewomanguide3.png",
];
const WOMEN_GALLERY1 = [
  "/wguest1.png",
  "/wguest2.png",
  "/wguest3.png",
];

type ModalKey = null | "womenSponsor" | "womenGuest" | "men";

export default function AttireGuide() {
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
  if (open === "womenSponsor") return WOMEN_GALLERY;
  if (open === "womenGuest") return WOMEN_GALLERY1;
  if (open === "men") return ["/outfitformen.png", "/outfitformen1.png"];
  return [];
}, [open]);

  const modalTitle =
    open === "womenSponsor"
      ? "Outfits for Sponsor Women"
      : open === "womenGuest"
      ? "Outfits for Women Guests"
      : "Men’s Attire";

  const modalDescription = useMemo(() => {
    if (open === "womenSponsor") {
      return (
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <div className="text-base font-semibold text-slate-900">For Sponsor Women</div>
          <p>
            Kindly wear <span className="font-semibold">plain, solid-colored</span> dresses in soft,
            romantic tones. Light, flowy silhouettes are encouraged for an elegant, cohesive, and
            timeless look.
          </p>
          <p className="text-xs text-slate-500">
            Tip: Use the palette as your guide and keep patterns minimal.
          </p>
        </div>
      );
    }

    if (open === "womenGuest") {
      return (
        <div className="space-y-3 text-sm leading-7 text-slate-600">
          <div className="text-base font-semibold text-slate-900">For Guest Women</div>
          <p>
            Printed or patterned dresses are welcome—think <span className="font-semibold">light, whimsical</span>
            styles with romantic details (florals, soft prints, delicate textures), as long as the overall
            colors stay within a soft and harmonious theme.
          </p>
          <p className="text-xs text-slate-500">
            Tip: Choose prints that feel airy and romantic rather than bold or high-contrast.
          </p>
        </div>
      );
    }

    if (open === "men") {
      return (
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <div>
            <div className="text-base font-semibold text-slate-900">For Sponsor Men</div>
            <p>
              Please wear a <span className="font-semibold">Barong Tagalog</span> paired with black slacks
              and black shoes for a clean and formal look.
            </p>
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">For Guest Men</div>
            <p>
              Guest men are also encouraged to wear a <span className="font-semibold">Barong Tagalog</span>
              with black slacks and black shoes, keeping the overall look classic and coordinated.
            </p>
          </div>
        </div>
      );
    }

    return null;
  }, [open]);
  const btnClass =
    "w-full inline-flex items-center justify-center rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm font-medium text-slate-700 " +
    "shadow-[0_10px_26px_rgba(0,0,0,0.06)] hover:bg-white/80 active:scale-[0.99] transition";

  return (
    <section id="attire" className="px-6 pb-20 text-center md:px-16">
      <h3 className="text-lg font-light uppercase tracking-[0.22em] text-[#3a3a3a]">Attire Guide</h3>
      <div className="mx-auto my-5 h-[1px] w-16 bg-black/15" />

      <div className="mx-auto mt-10 max-w-3xl">
        
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#787878]">Attire for Women</p>

        
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5b5b5b]">
          For our women guests, we invite you to choose a whimsical dress light, romantic, and flowy
          silhouettes that move beautifully. Please use the palette below as your guide.
        </p>

        
        <div className="mt-7 mx-auto grid max-w-[560px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {WOMEN_COLORS.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3"
            >
              <span
                className="h-10 w-10 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: c.hex }}
                aria-hidden="true"
              />
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#777777] leading-tight text-left">
                {c.name}
              </span>
            </div>
          ))}
        </div>

        
        <div className="mt-8 mx-auto grid max-w-[560px] grid-cols-2 gap-3">
          <button type="button" onClick={() => setOpen("womenSponsor")} className={btnClass}>
            Sponsor Women
          </button>
          <button type="button" onClick={() => setOpen("womenGuest")} className={btnClass}>
            Guest Women
          </button>
        </div>

        
        <div className="mx-auto my-10 h-[1px] w-16 bg-black/15" />

        
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#787878]">Attire for Men</p>

        
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5b5b5b]">
          Barong Tagalog paired with black slacks and black shoes for a clean, classic, and coordinated
          look.
        </p>

        <div className="mt-7 mx-auto max-w-[560px]">
          <button type="button" onClick={() => setOpen("men")} className={btnClass}>
            View Men Attire Details
          </button>
        </div>
      </div>

      
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4 sm:px-6">
              <div className="min-w-0 text-left">
                <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{modalTitle}</h3>
                {modalDescription ? <div className="mt-3">{modalDescription}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((src, idx) => (
                  <img
                    key={`${src}-${idx}`}
                    src={src}
                    className="w-full rounded-2xl object-cover h-[220px] sm:h-[260px]"
                    alt={`${modalTitle} sample ${idx + 1}`}
                    loading="lazy"
                  />
                ))}
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
}

