import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { messagesFor } from "@/lib/i18n";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "Amora", template: "%s · Amora" },
    description: t("landing.meta.description"),
    other: {
      "codex-preview": "development",
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
  };
}

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
