import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://starfieldsystems.com'),
  title: "Starfield Systems",
  description: "Precision technology company",
  keywords: ["technology", "precision", "innovation"],
  authors: [{ name: "Starfield Systems" }],
  // Next.js 15 automatically handles favicon.ico in the app directory
  // Safari needs explicit apple-touch-icon
  icons: {
    apple: [
      { url: "/apple-touch-icon.png" }
    ]
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}