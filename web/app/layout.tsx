import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { messagesFor } from "@/lib/i18n";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(process.env.WEB_URL || "http://localhost:3000"),
    title: { default: "Amora", template: "%s · Amora" },
    description: t("landing.meta.description"),
    other: {
      "codex-preview": "development",
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: "Amora",
      description: t("landing.meta.description"),
      siteName: "Amora",
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: "Amora" },
      ],
    },
    twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  };
}

/** Uma só cor de tema, sem variação claro/escuro. */
export const viewport: Viewport = { themeColor: "#4a6cd8" };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, timeZone, baseCurrency } = await getI18n();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="antialiased">
        <I18nProvider
          locale={locale}
          timeZone={timeZone}
          baseCurrency={baseCurrency}
          messages={messagesFor(locale)}
        >
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
