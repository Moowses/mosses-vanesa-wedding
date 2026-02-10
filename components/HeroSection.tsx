"use client";

import { useEffect, useRef, useState } from "react";

type HeroSectionProps = {
  alluraClassName: string;
};

export default function HeroSection({ alluraClassName }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateVisibility = () => {
      const t = video.currentTime;
      const isVisible = (t >= 5 && t < 16) || t >= 23;
      setShowText(isVisible);
    };

    updateVisibility();
    video.addEventListener("timeupdate", updateVisibility);
    video.addEventListener("seeked", updateVisibility);
    video.addEventListener("loadedmetadata", updateVisibility);
    video.addEventListener("play", updateVisibility);

    return () => {
      video.removeEventListener("timeupdate", updateVisibility);
      video.removeEventListener("seeked", updateVisibility);
      video.removeEventListener("loadedmetadata", updateVisibility);
      video.removeEventListener("play", updateVisibility);
    };
  }, []);

  return (
    <section id="home" className="relative">
      <video
        ref={videoRef}
        src="/bgvideo.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="h-[430px] w-full object-cover object-[50%_20%] md:h-[600px]"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/65" />

      <div className="absolute inset-0 flex items-end justify-center px-6 pb-12 sm:pb-16">
        <div
          className={[
            "w-full max-w-[850px] text-center text-white transition-opacity duration-700 ease-in-out",
            showText ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <h2 className="text-[12px] sm:text-[15px] uppercase tracking-[0.30em] text-white/75">
            It’s official, we’re tying the knot.
          </h2>

          <h1
            className={`
              ${alluraClassName}
              mt-6
              text-[50px]
              leading-[0.9]
              sm:mt-8
              sm:text-[105px]
              md:text-[120px]
            `}
          >
            Mosses &amp; Vanesa
          </h1>

          <div className="mx-auto mt-5 h-[1px] w-24 bg-white/35" />

          <p className="mt-4 text-[12px] uppercase tracking-[0.30em] text-white/85">
            March 6, 2026 • 2:00 PM • Eden
          </p>
        </div>
      </div>
    </section>
  );
}
