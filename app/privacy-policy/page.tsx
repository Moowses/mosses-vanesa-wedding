import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Mosses & Vanesa Wedding",
  description: "Privacy Policy for mossesandvanesa.com",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F3EEE8] px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FBF8F1] p-6 text-[#3a3a3a] shadow-[0_30px_90px_rgba(0,0,0,0.14)] ring-1 ring-black/5 md:p-10">
        <p className="text-[11px] uppercase tracking-[0.30em] text-[#8a8a8a]">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[0.04em] text-[#2f2f2f] md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">Effective date: February 10, 2026</p>

        <section className="mt-8 space-y-4 text-sm leading-7 text-[#565656]">
          <p>
            This Privacy Policy explains how <strong>www.mossesandvanesa.com</strong> collects and
            uses information when you browse the site or submit RSVP details.
          </p>
          <p>
            The website <strong>www.mossesandvanesa.com</strong> is owned and created by{" "}
            <strong>www.karlmosses.com</strong>.
          </p>
          <p>
            If you have any concerns, please contact the admin at{" "}
            <a
              className="underline decoration-black/30 underline-offset-4 hover:text-[#C58E86]"
              href="mailto:info@karlmosses.com"
            >
              info@karlmosses.com
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-[#565656]">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">How RSVP Links Work</h2>
          <p>
            Your RSVP link may look like <strong>www.mossesandvanesa.com/rsvp/eyJdw2ou3l...</strong> because it uses a secure
            token. This token is signed and validated by our server to help protect your RSVP
            access from tampering.
          </p>
          <p>
            The link is not meant to publicly expose your personal profile details such as your
            full name, message, or contact information.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-[#565656]">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">Information We Collect</h2>
          <p>
            We may collect RSVP-related information such as name, attendance response, guest
            details, contact details, and message content you provide through forms.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-[#565656]">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">How We Use Information</h2>
          <p>
            Information is used to manage wedding invitations, RSVP records, event planning, guest
            communication, and related site operations.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-[#565656]">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">Data Retention</h2>
          <p>
            RSVP and related data are retained only as long as needed for wedding coordination and
            reasonable record-keeping.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-7 text-[#565656]">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">Your Choices</h2>
          <p>
            You may request correction or removal of your RSVP information by contacting{" "}
            <a
              className="underline decoration-black/30 underline-offset-4 hover:text-[#C58E86]"
              href="mailto:info@karlmosses.com"
            >
              info@karlmosses.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
