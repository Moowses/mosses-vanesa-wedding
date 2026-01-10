"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = [
  "/mv.jpg",
  "/mv2.jpg",
  // add more if you have them:
  // "/mv3.jpg",
];

export default function HomePage() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (SLIDES.length <= 1) return;
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative min-h-screen bg-black">
      {/* Slideshow */}
      <div className="absolute inset-0">
        {SLIDES.map((src, i) => (
          <div
            key={src}
            className={[
              "absolute inset-0 transition-opacity duration-1000",
              i === idx ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <Image
              src={src}
              alt="Mosses and Vanesa"
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}

        {/* Soft overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/30" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen items-end px-5 py-10 sm:px-10">
        <div className="w-full max-w-3xl">
          <p className="text-xs tracking-[0.22em] text-white/75">
            M O S S E S &nbsp; &nbsp; A N D &nbsp; &nbsp; V A N E S A
          </p>

          <h1 className="mt-3 font-serif text-4xl leading-tight text-white sm:text-6xl">
            We’re getting married
          </h1>

          <p className="mt-3 text-sm text-white/85 sm:text-base">
            Save the date — March 5, 2026 • 2:00 PM
            <br />
            Saint Micheal Archangel Quasi Parish - Eden
          </p>

          {/* Under construction card */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur ring-1 ring-white/15">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/80" />
            <div>
              <p className="text-sm font-semibold text-white">
                Site under construction
              </p>
              <p className="text-xs text-white/80">
                Please try again later.
              </p>
            </div>
          </div>

          {/* Dots */}
          {SLIDES.length > 1 && (
            <div className="mt-6 flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={[
                    "h-1.5 w-8 rounded-full transition",
                    i === idx ? "bg-white/80" : "bg-white/25",
                  ].join(" ")}
                />
              ))}
            </div>
          )}

          <p className="mt-8 text-xs text-white/55">
            © {new Date().getFullYear()} Mosses & Vanesa
          </p>
        </div>
      </div>
    </main>
  );
}
