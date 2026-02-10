"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

const TOTAL_IMAGES = 19;
const pad2 = (n: number) => String(n).padStart(2, "0");

export default function GalleryCollageSlider() {
  const trackRef = useRef<HTMLDivElement>(null);

  const images = useMemo(() => {
    return Array.from({ length: TOTAL_IMAGES }, (_, i) => `/gallery/${pad2(i + 1)}.jpg`);
  }, []);
  const blocks = useMemo(() => {
    const blockSize = 5;
    const out: string[][] = [];
    for (let i = 0; i < images.length; i += blockSize) {
      out.push(images.slice(i, i + blockSize));
    }
    if (out.length && out[out.length - 1].length < blockSize) {
      const missing = blockSize - out[out.length - 1].length;
      out[out.length - 1] = out[out.length - 1].concat(images.slice(0, missing));
    }
    return out;
  }, [images]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    let x = 0;

    const speed = 0.35; // adjust speed

    const animate = () => {
      x += speed;
      const half = track.scrollWidth / 2;
      if (x >= half) x = 0;

      track.style.transform = `translateX(-${x}px)`;
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-6">
      
      <div ref={trackRef} className="flex w-max gap-6 will-change-transform">
        
        {[...blocks, ...blocks].map((block, idx) => (
          <CollageBlock key={`${idx}`} images={block} />
        ))}
      </div>

      
      <Link
        href="https://www.facebook.com/marlonguillanophotography"
        target="_blank"
        className="mt-4 inline-flex md:absolute md:bottom-4 md:left-4 md:z-10"
      >
        <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-md hover:bg-black/75 transition">
          <span className="font-medium">Captured & Sponsored by</span>
          <span className="font-semibold">Marlon Guillano Photography</span>
        </div>
      </Link>
    </div>
  );
}


function CollageBlock({ images }: { images: string[] }) {
  const [a, b, c, d, e] = images;

  return (
    <div
      className="
        grid
        grid-cols-12 grid-rows-6
        gap-3
        rounded-2xl
        overflow-hidden
        border border-white/10
        bg-white/5
        p-3
        h-[270px] w-[520px]
        md:h-[360px] md:w-[720px]
      "
    >
      <Tile src={a} className="col-span-4 row-span-2" />
      <Tile src={b} className="col-span-4 row-span-4 row-start-3 col-start-1" />
      <Tile src={c} className="col-span-8 row-span-3 col-start-5 row-start-1" />
      <Tile src={d} className="col-span-4 row-span-3 col-start-5 row-start-4" />
      <Tile src={e} className="col-span-4 row-span-3 col-start-9 row-start-4" />
    </div>
  );
}

function Tile({ src, className }: { src: string; className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <img
        src={src}
        alt="Wedding Gallery"
        className="h-full w-full object-cover"
        draggable={false}
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
    </div>
  );
}

