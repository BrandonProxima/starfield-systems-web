import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Starfield Systems",
  description: "Precision technology company",
  keywords: ["technology", "precision", "innovation"],
  authors: [{ name: "Starfield Systems" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Starfield Systems",
    description: "Precision technology company",
    type: "website",
    url: "https://starfieldsystems.com",
    siteName: "Starfield Systems",
    images: [
      {
        url: "https://starfieldsystems.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Starfield Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starfield Systems",
    description: "Precision technology company",
    images: ["https://starfieldsystems.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}