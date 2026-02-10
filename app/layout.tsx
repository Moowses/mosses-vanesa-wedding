import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mossesandvanesa.com"),
  alternates: { canonical: "https://www.mossesandvanesa.com" },

  title: "Mosses & Vanesa Wedding",
  description:
    "Mosses and Vanesa are getting married on March 06, 2026 in Davao City, Philippines.",

  openGraph: {
    title: "Mosses & Vanesa Wedding",
    description:
      "Mosses and Vanesa are getting married on March 06, 2026 in Davao City, Philippines.",
    url: "https://www.mossesandvanesa.com/",
    type: "website",
    images: [
      {
        url: "https://www.mossesandvanesa.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mosses & Vanesa Wedding",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    images: ["https://www.mossesandvanesa.com/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <footer className="border-t border-black/10 bg-white/90 px-4 py-3 text-center text-xs text-slate-600">
          <a href="/privacy-policy" className="underline underline-offset-2 hover:text-slate-900">
            Privacy Policy
          </a>
        </footer>
      </body>
    </html>
  );
}

