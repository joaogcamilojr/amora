"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, type ReactNode } from "react";

import {
  IconBank,
  IconCard,
  IconDashboard,
  IconImport,
  IconList,
  IconPlane,
  IconRepeat,
  IconSafe,
} from "@/components/ds/icons";
import { AmoraMark } from "@/components/ui/app-logo";
import { ToastProvider } from "@/components/ui/toast-provider";
import { cx } from "@/lib/cx";
import { useI18n } from "@/lib/i18n/client";
import {
  isActive,
  navigationGroups,
  type NavigationItemKey,
} from "@/lib/navigation/navigation";

import { UserMenu, type Workspaces } from "./user-menu";

const ICONS: Record<NavigationItemKey, ComponentType<{ size?: number }>> = {
  dashboard: IconDashboard,
  transactions: IconList,
  cards: IconCard,
  recurring: IconRepeat,
  accounts: IconBank,
  holdings: IconSafe,
  trips: IconPlane,
  import: IconImport,
};

export function AppShell({
  children,
  email,
  displayName,
  workspaces,
}: {
  children: ReactNode;
  email: string;
  displayName?: string | null;
  workspaces: Workspaces;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = navigationGroups.flatMap((group) => group.items);
  return (
    <ToastProvider>
      <div className="ds-app flex min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-surface focus:px-3 focus:py-2"
        >
          {t("nav.skipToContent")}
        </a>
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-neutral-950 text-neutral-300 lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5">
            <AmoraMark />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold text-white">
                Amora
              </span>
              <span className="block text-[12px] text-neutral-500">
                {t("common.tagline")}
              </span>
            </span>
          </Link>
          <nav
            aria-label={t("nav.main")}
            className="flex-1 overflow-y-auto px-3 pb-6"
          >
            {navigationGroups.map((group) => (
              <div key={group.key} className="mt-5 first:mt-2">
                <p className="px-3 pb-2 text-[11px] leading-[15px] font-medium tracking-wide text-neutral-500 uppercase">
                  {t(`nav.groups.${group.key}`)}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {group.items.map(({ href, key }) => {
                    const Icon = ICONS[key];
                    const active = isActive(pathname, href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={cx(
                            "relative flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm transition-colors duration-150",
                            active
                              ? "bg-white/8 font-medium text-white"
                              : "hover:bg-white/5 hover:text-white",
                          )}
                        >
                          {active && (
                            <span
                              className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-brand-500"
                              aria-hidden="true"
                            />
                          )}
                          <Icon size={18} />
                          {t(`nav.items.${key}`)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 px-3 py-3">
            <UserMenu
              name={displayName}
              email={email}
              workspaces={workspaces}
            />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-20 bg-neutral-950 lg:hidden">
            <div className="flex items-center justify-between gap-2 px-4 pt-3">
              <span className="flex items-center gap-2">
                <AmoraMark size={24} />
                <span className="text-sm font-semibold text-white">Amora</span>
              </span>
              <UserMenu
                name={displayName}
                email={email}
                workspaces={workspaces}
                compact
              />
            </div>
            <nav
              aria-label={t("nav.main")}
              className="flex gap-1 overflow-x-auto px-3 py-2"
            >
              {items.map(({ href, key }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className={cx(
                    "shrink-0 rounded-[var(--radius-control)] px-3 py-1.5 text-[13px]",
                    isActive(pathname, href)
                      ? "bg-white/10 text-white"
                      : "text-neutral-300",
                  )}
                >
                  {t(`nav.items.${key}`)}
                </Link>
              ))}
            </nav>
          </div>
          <main id="main-content" className="px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
