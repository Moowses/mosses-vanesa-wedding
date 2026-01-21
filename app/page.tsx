// app/page.tsx
import Image from "next/image";
import AttireWomen from "@/components/AttireWomen2";
import GallerySlider from "@/components/GallerySlider";
import { Allura, Comfortaa } from "next/font/google";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const allura = Allura({
  subsets: ["latin"],
  weight: ["400"],
});

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="text-center">
      {eyebrow ? (
        <p
          className={[
            "text-[11px] uppercase tracking-[0.32em]",
            dark ? "text-white/70" : "text-[#7a7a7a]",
          ].join(" ")}
        >
          {eyebrow}
        </p>
      ) : null}

      <h2
        className={[
          "mt-2 text-2xl font-semibold tracking-[0.06em]",
          dark ? "text-white" : "text-[#2f2f2f]",
        ].join(" ")}
      >
        {title}
      </h2>

      {subtitle ? (
        <p className={["mt-2 text-sm", dark ? "text-white/70" : "text-[#616161]"].join(" ")}>
          {subtitle}
        </p>
      ) : null}

      <div className={["mx-auto mt-5 h-[1px] w-16", dark ? "bg-white/20" : "bg-black/10"].join(" ")} />
    </div>
  );
}

function InfoCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/70 p-7 ring-1 ring-black/10 shadow-[0_18px_55px_rgba(0,0,0,0.10)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl opacity-60" style={{ background: "#FADADD" }} />
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#7a7a7a]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#2f2f2f]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[#5b5b5b]">{body}</p>
    </div>
  );
}

function NavyPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-[#151B2E] px-6 py-14 md:px-16">
      {/* soft florals vibe without needing PNGs */}
      <div className="pointer-events-none absolute inset-0 opacity-100">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-35" style={{ background: "#F7B7A3" }} />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-28" style={{ background: "#D8CFE3" }} />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full blur-3xl opacity-22" style={{ background: "#D7F1F6" }} />
        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full blur-3xl opacity-22" style={{ background: "#FFF4B8" }} />
        <div className="absolute inset-6 rounded-[40px] ring-1 ring-white/10" />
        <div className="absolute inset-10 rounded-[34px] ring-1 ring-white/10" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <SectionTitle
          eyebrow="Wedding Party"
          title={title}
          subtitle={subtitle}
          dark
        />
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className={`${comfortaa.className} min-h-screen bg-[#F3EEE8] px-4 py-10 md:py-14`}>
      {/* Invitation canvas */}
      <div className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-[32px] bg-[#FBF8F1] shadow-[0_30px_90px_rgba(0,0,0,0.14)] ring-1 ring-black/5">
       {/* Header */}
          <header className="sticky top-0 z-20 bg-[#FBF8F1]/88 backdrop-blur-md border-b border-black/10">
            <div className="px-4 py-3 sm:px-6 md:px-10">
              <div className="sm:hidden text-center">
                <p className="text-[10px] uppercase tracking-[0.30em] text-[#8a8a8a]">
                  Save the Date
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.30em] text-[#8a8a8a]">
                  March 06, 2026
                </p>
              </div>

              <div className="mt-3 sm:mt-0 flex items-center justify-center sm:justify-between gap-4">
                {/* Desktop Left */}
                <div className="hidden sm:flex items-center gap-3 text-[10px] uppercase tracking-[0.30em] text-[#8a8a8a]">
                  <span className="h-[1px] w-10 bg-black/10" />
                  <span>Save the Date</span>
                </div>
             <div className="w-full flex justify-center">
                  <nav
                    className="
                      w-fit
                      flex items-center justify-center
                      gap-4
                      overflow-x-auto
                      whitespace-nowrap
                      [-webkit-overflow-scrolling:touch]
                      no-scrollbar
                      py-1
                      text-[11px] uppercase tracking-[0.24em] text-[#7a7a7a]
                    "
                  >
                    <a className="shrink-0 px-2 py-2 hover:text-[#C58E86] transition" href="#home">Home</a>
                    <a className="shrink-0 px-2 py-2 hover:text-[#C58E86] transition" href="#story">Story</a>
                    <a className="shrink-0 px-2 py-2 hover:text-[#C58E86] transition" href="#details">Details</a>
                    <a className="shrink-0 px-2 py-2 hover:text-[#C58E86] transition" href="#attire">Attire</a>
                    <a className="shrink-0 px-2 py-2 hover:text-[#C58E86] transition" href="#gallery">Gallery</a>
                  </nav>
                </div>


                {/* Desktop Right */}
                <div className="hidden sm:flex items-center gap-3 text-[10px] uppercase tracking-[0.30em] text-[#8a8a8a]">
                  <span>March 06, 2026</span>
                  <span className="h-[1px] w-10 bg-black/10" />
                </div>
              </div>
            </div>
          </header>


        {/* HERO */}
<section id="home" className="relative">
  <Image
    src="/hero-couple.jpg"
    alt="Mosses and Vanesa"
    width={1800}
    height={980}
    priority
    className="h-[430px] w-full object-cover object-[50%_20%] md:h-[600px]"
  />

  <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/65" />

  {/* TEXT AT BOTTOM */}
  <div className="absolute inset-0 flex items-end justify-center px-6 pb-12 sm:pb-16">
    <div className="w-full max-w-[850px] text-center text-white">
      <h2 className="text-[12px] sm:text-[15px] uppercase tracking-[0.30em] text-white/75">
        It’s official, we’re tying the knot.
      </h2>

      <h1
        className={`
          ${allura.className}
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



  {/* Statement block  */}
        <section className="px-6 pt-10 pb-8 text-center md:px-16 md:pt-14 md:pb-10">
  

          <SectionTitle
            title="Our Story"
            subtitle="A love story shaped by timing and faith"
          />
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


        {/* DETAILS (like your “Details” inspo but premium web layout) */}
        <section id="details" className="px-6 py-14 md:px-16">
          <SectionTitle
            eyebrow="Details"
            title="A few gentle notes"
            subtitle="Dress code, gifts, and RSVP."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <InfoCard
              label="Dress Code"
              title="Whimsical & romantic"
              body="For guests: formal or semi-formal attire in soft, harmonious tones. Please avoid loud neon colors or overly bold contrasts."
            />
            <InfoCard
              label="Gifts"
              title="Your presence is enough"
              body="Please don’t feel obliged to bring a gift. If you’d like to help us start our family, a monetary gift will be truly appreciated."
            />
            <InfoCard
              label="RSVP"
              title="Reserved seat for you"
              body="Kindly confirm your attendance via your RSVP link. If plans change, please message us so we can update our headcount."
            />
          </div>
        </section>

        {/* ATTIRE (your component redesigned) */}
        <section id="attire" className="px-6 pb-14 md:px-16">
          <SectionTitle
            eyebrow="Attire Guide"
            title="What to wear"
            subtitle="Sponsor and guest guides inside."
          />
          <div className="mt-10">
            <AttireWomen />
          </div>
        </section>

        {/* (Optional) NAVY “ENTOURAGE” PANEL — matches your inspo look */}
        <NavyPanel title="Entourage" subtitle="A special thank you to the people guiding us to this day.">
          <div className="space-y-6">

          {/* Families */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
                Bride Family
              </p>
              <div className="mt-4 space-y-1 text-white/85">
                <p>Mr. Guilbert Guillano </p>
                <p>Mrs. Marilyn Guillano</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
                Groom Family
              </p>
              <div className="mt-4 space-y-1 text-white/85">
                <p>Mr. Kristian Alex Banlasan</p>
                <p>Mrs. Pernalina Banlasan</p>
              </div>
            </div>
          </div>

          {/* Maid of Honor | Best Man */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
                Maid of Honor
              </p>
              <p className="mt-4 text-white/85">
                Thea Faith Guillano 
              </p>
            </div>

            <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
                Best Man
              </p>
              <p className="mt-4 text-white/85">
                Karl Jacob Banlasan
              </p>
            </div>
          </div>

          {/* Bridesmaids | Groomsmen */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
                Bridesmaids
              </p>
              <ul className="mt-4 space-y-1 text-white/85">
                <li>Aika Parondo</li>
                <li>Michelle Rafael</li>
                <li>Vannessa Zyndrelle Rebuelta</li>
                <li>Sofia Maris Relles</li>
                <li>Neomi Victoriano</li>
                <li>Angelica Jade Ahmann</li>
                <li>Anjoren Cajes</li>
              </ul>
            </div>

            <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10">
              <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
                Groomsmen
              </p>
              <ul className="mt-4 space-y-1 text-white/85">
                <li>Joshua Salinas</li>
                <li>Alexander Perez</li>
                <li>Dennis Dolom Jr.</li>
                <li>Eulo Batawan</li>
                <li>Nestor Antonio Guillano</li>
                <li>John Gamalong</li>
                <li>Kenneth Flores</li>
              </ul>
            </div>
          </div>

          {/* Bearers */}
          <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10 text-center">
            <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
              Bearers
            </p>
            <div className="mt-4 space-y-2 text-white/85">
              <p>Ring and Coin Bearer: Markwin Ybanez</p>
              <p>Bible Bearer: Olram Joseph Guillano</p>
            </div>
          </div>

          {/* Principal Sponsors */}
          <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10 text-center">
            <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
              Principal Sponsors
            </p>
            <div className="mt-4 space-y-2 text-white/85">
              <p>Engr. Joselito &amp; Mrs. Grace Mercado</p>
              <p>Mr. William &amp; Mrs. Gina McManus</p>
              <p>Mr. Edwin &amp; Mrs. Annie Salinas</p>
              <p>Mr. Thomas Scott &amp; Mrs. Ruby Ahmann</p>
              <p>Dr. Franklin &amp; Dr. Victoria Guillano</p>      
            </div>
          </div>

          {/* Secondary Sponsors */}
          <div className="rounded-3xl bg-white/5 p-7 ring-1 ring-white/10 text-center">
            <p className="text-[12px] uppercase tracking-[0.28em] text-white/70">
              Secondary Sponsors
            </p>
            <div className="mt-4 space-y-2 text-white/80">
              <p>Atty. Marlo &amp; Judge Rocelyn Guillano</p>
              <p>Mr. Allan &amp; Mrs. Novie Relles</p>
              <p>Mr. Nelson &amp; Mrs. Olive Victoriano</p>
              <p>Mr. Raul &amp; Mrs. Rolinda Salazar</p>
              <p>Mr. Bern &amp; Mrs. Mara Damla</p>
            </div>
          </div>

        </div>



        </NavyPanel>

        {/* GALLERY */}
        <section id="gallery" className="px-6 py-14 md:px-16">
          <SectionTitle eyebrow="Moments" title="Gallery" subtitle="A few frames from our journey." />
          <div className="mt-10">
            <GallerySlider />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-black/10 px-6 py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7a7a7a]">
            Mosses &amp; Vanesa • March 06, 2026
          </p>
          <p className="mt-2 text-xs text-[#8a8a8a]">
            More info at{" "}
            <a
              href="https://www.mossesandvanesa.com"
              className="underline decoration-black/20 underline-offset-4 hover:text-[#C58E86] transition"
              target="_blank"
              rel="noreferrer"
            >
              mossesandvanesa.com
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
