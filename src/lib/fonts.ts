import { DM_Sans, Instrument_Serif, Space_Mono } from "next/font/google";

export const displayFont = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
  display: "optional",
});

export const bodyFont = DM_Sans({
  subsets: ["latin"],
  // 500 (medium) maps gracefully to 400, 700 (bold) maps gracefully to 600 —
  // browsers pick the closest available weight. Saves ~60 KB in font downloads.
  weight: ["400", "600"],
  variable: "--font-dm-sans",
  display: "optional",
});

export const monoFont = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "optional",
});
