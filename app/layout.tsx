import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});
const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nedyway — fresh groceries, delivered",
  description:
    "Order groceries and daily essentials from shops near you, delivered fast.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
