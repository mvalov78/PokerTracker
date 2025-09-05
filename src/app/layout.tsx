import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PokerTracker Pro",
  description: "Профессиональный трекер результатов турнирного покера с автоматическим распознаванием билетов и детальной аналитикой",
  keywords: ["покер", "турниры", "трекер", "ROI", "банкролл", "статистика", "poker", "tournaments"],
  authors: [{ name: "PokerTracker Pro Team" }],
  creator: "PokerTracker Pro",
  publisher: "PokerTracker Pro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "PokerTracker Pro",
    description: "Профессиональный трекер результатов турнирного покера",
    url: "/",
    siteName: "PokerTracker Pro",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PokerTracker Pro",
    description: "Профессиональный трекер результатов турнирного покера",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
