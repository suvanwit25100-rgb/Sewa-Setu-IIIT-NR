import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopBar } from "@/components/top-bar";
import { Sahaayak } from "@/components/sahaayak";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva-src", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "SewaSetu Sahaayak — Chhattisgarh",
  description: "Proactive, assisted, last-mile digital governance for Chhattisgarh. Hackathon prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${deva.variable}`}>
        <Providers>
          <TopBar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5">{children}</main>
          <Sahaayak />
        </Providers>
      </body>
    </html>
  );
}
