import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

import SafetyBanner from "@/components/common/SafetyBanner";
import ServiceWorkerRegister from "@/components/common/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Retina DR Screening",
  description: "Research prototype for diabetic retinopathy screening from fundus images.",
  appleWebApp: { capable: true, title: "Retina DR" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f766e" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

// Runs before first paint so a dark-mode user never sees a white flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${mono.variable} antialiased`}>
        {children}
        <SafetyBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
