import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { bodyFont, displayFont, monoFont } from "@/lib/fonts";

// Use configured Supabase URL for preconnect, with the hosted default as fallback.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zjzqogrrlvxavxicdcec.supabase.co";

export const metadata: Metadata = {
  title: {
    template: "%s | Judiciary Archive System",
    default: "Judiciary Archive System",
  },
  description:
    "Secure physical & digital case file archive for the Judiciary of Kenya. Track file movements, manage archive storage, scan documents, and maintain a complete audit trail for court operations.",
  keywords: [
    "judiciary",
    "archive",
    "case management",
    "document tracking",
    "Kenya courts",
    "legal document storage",
  ],
  authors: [{ name: "Judiciary of Kenya" }],
  openGraph: {
    title: "Judiciary Archive System",
    description:
      "Secure physical & digital case file archive. Track file movements, manage archive storage, and maintain a complete audit trail.",
    siteName: "Judiciary Archive System",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href={SUPABASE_URL} />
        {/* DNS prefetch for additional origins */}
        <link rel="dns-prefetch" href={SUPABASE_URL} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
