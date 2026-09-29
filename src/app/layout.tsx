import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopBar } from "@/components/top-bar";
import { Sahaayak } from "@/components/sahaayak";
import { GoogleTranslate } from "@/components/google-translate";
import { AppShell } from "@/components/app-shell";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva-src", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Sewa Setu Next — Chhattisgarh",
  description: "AI-powered government service orchestration and governance intelligence layer for Chhattisgarh Sewa Setu. Hackathon prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${deva.variable}`}>
        <Providers>
          <GoogleTranslate />
          <TopBar />
          <AppShell>{children}</AppShell>
          <Sahaayak />
        </Providers>
      </body>
    </html>
  );
}
