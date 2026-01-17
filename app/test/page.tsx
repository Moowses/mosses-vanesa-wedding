// app/page.tsx
import Image from "next/image";
import AttireWomen from "@/components/AttireWomen";
import GallerySlider from "@/components/GallerySlider";
import { Allura, Comfortaa } from "next/font/google";
const ATTIRE_COLORS = [
  { name: "Buttercup", hex: "#FFF4B8" },
  { name: "Soft Peach", hex: "#F7B7A3" },
  { name: "Pale Pink", hex: "#FADADD" },
  { name: "Lavender", hex: "#D8CFE3" },
  { name: "Cool Aqua", hex: "#D7F1F6" },
  { name: "Meadow Green", hex: "#D8ECCF" },
];

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const allura = Allura({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6EFE9] px-4 py-10 md:py-14">
      {/* Centered editorial canvas */}
      <div className="mx-auto w-full max-w-[1100px] bg-[#FBF8F1] shadow-[0_25px_80px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
        {/* Header (matches reference: thin bar + centered title + nav) */}
        <header className="border-b border-black/10">
          <div className="flex items-center justify-between px-6 py-2 text-[10px] uppercase tracking-[0.25em] text-[#787878]">
            
            <span className="hidden md:inline-flex items-center gap-3">
              <span aria-hidden>•</span>
              <span> </span>
              <span aria-hidden>•</span>
            </span>
          </div>

          <div className="px-6 py-3">
            <h1 className="text-center text-3xl font-light tracking-[0.12em] text-[#3a3a3a]">
              WE'RE GETTING MARRIED
            </h1>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 border-t border-black/10 px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-[#787878]">
            <a href="#home" className="hover:text-[#C3937C]">
              Home
            </a>
            <a href="#story" className="hover:text-[#C3937C]">
              Story
            </a>
            <a href="#ceremony" className="hover:text-[#C3937C]">
              Ceremony
            </a>
            <a href="#attire" className="hover:text-[#C3937C]">
              Attire
            </a>
            <a href="#gallery" className="hover:text-[#C3937C]">
              Gallery
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section id="home" className="relative">
          <Image
            src="/hero-couple.jpg" 
            alt="Wedding couple"
            width={1700}
            height={850}
            priority
            className="h-[340px] w-full object-cover md:h-[420px]"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              
               <h1 className={`${allura.className} mt-3 text-[56px] leading-[0.95] sm:text-[110px]`}>
              Mosses &amp; Vanesa
              </h1>
              <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/80">
                March 06, 2026 • Eden
              </p>
            </div>
          </div>
        </section>

        {/* Statement block  */}
        <section className="px-6 pt-10 pb-8 text-center md:px-16 md:pt-14 md:pb-10">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto mb-5 h-[1px] w-20 bg-black/20" />
            <p className="text-2xl font-light tracking-[0.08em] text-[#3a3a3a] md:text-3xl">
              Our Story
            </p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-[#787878]">
              A love story shaped by timing and faith
            </p>
           
          </div>
        </section>

        {/* Story (2-column like reference) */}
        
        <section id="story" className="px-6 pb-14 md:px-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div className="relative w-full">
                <Image
                  src="/01.png"
                  alt="Wedding couple"
                  width={1000}
                  height={750}
                  priority
                  className="
                    w-full object-cover rounded-2xl
                    h-[320px]
                    md:h-[720px]
                    lg:h-[400px]
                  "
                />
              </div>

            <div className="text-[#3a3a3a]">
              <div className="space-y-5">
                <p className="text-sm leading-7 text-[#5b5b5b]">
                  Mosses and Vanesa were schoolmates once upon a time. Mosses had a crush
                  on Vanesa, quietly. Extremely quietly. Convinced she was way out of his
                  league, life moved on, graduation happened, and they went their separate
                  ways, thinking that was the end of the story.
                </p>

                <p className="text-sm leading-7 text-[#5b5b5b]">
                  Three years later, destiny did what it does best and slid into Instagram.
                  One follow, one message, and one surprising realization later,
                  <span className="italic">{" "}“Wait… you liked me too back then?”</span>{" "}
                  Suddenly, everything clicked.
                </p>

                <p className="text-sm leading-7 text-[#5b5b5b]">
                  The problem was never the feelings. It was the timing.
                </p>

                <p className="text-sm leading-7 text-[#5b5b5b]">
                  And now, here we are. Proof that when the time is right, love finds its
                  way.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Award / separator banner (thin + clean like reference) */}
        <section className="border-y border-black/10 bg-[#EAD9C9]/35 px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] uppercase tracking-[0.22em] text-[#787878]">
            <span>Wedding Ceremony</span>
            <span className="hidden md:inline">•</span>
            <span>Reception</span>
            <span className="hidden md:inline">•</span>
            <span>Gallery</span>
          </div>
        </section>

        {/* Ceremony (structured, calm) */}
        <section id="ceremony" className="px-6 py-14 md:px-16">
          <div className="text-center">
            <h3 className="text-lg font-light uppercase tracking-[0.22em] text-[#3a3a3a]">
              Ceremony
            </h3>
            <div className="mx-auto my-5 h-[1px] w-16 bg-black/15" />
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { title: "Date & Time", body: "March 06, 2026 • 2:00 PM" },
              { title: "Church", body: "Saint Michael Archangel Quasi Parish – Eden" },
              { title: "Note", body: "Please arrive 15–30 minutes early." },
            ].map((c) => (
              <div
                key={c.title}
                className="border border-black/10 bg-white/60 p-6 text-center"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#787878]">
                  {c.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#3a3a3a]">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
      {/* Attire */}
      <section>
              <AttireWomen />
      </section>

        {/* Gallery grid (inside canvas) */}
        <section id="gallery" className="px-6 pb-14 md:px-16">
          <div className="text-center">
            <h3 className="text-lg font-light uppercase tracking-[0.22em] text-[#3a3a3a]">
              Gallery
            </h3>
             <GallerySlider />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-black/10 px-6 py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#787878]">
            Mosses &amp; Vanesa • March 06, 2026
          </p>
        </footer>
      </div>
    </main>
  );
}
