import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./globals-neomorph.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trippo.OS - Logistics Platform",
  description: "Trippo.OS - Decentralized ride-sharing and logistics platform with Neo-Industrial design and multi-language support",
  keywords: ["Trippo", "Logistics", "Ride-sharing", "OpenStreetMap", "Cash Payments", "Multi-language"],
  authors: [{ name: "Trippo Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Trippo.OS - Logistics Platform",
    description: "Decentralized logistics platform with cash payments, open-source mapping, and multi-language support",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
