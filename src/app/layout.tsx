import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Roofing in Winnipeg, MB`,
    template: `%s | ${site.shortName}`,
  },
  description: `Residential roofing, gutters, chimney removal, and renovations in ${site.serviceArea}. Request a free quote from ${site.name}.`,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_CA",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
