export type IconName =
  | "dashboard"
  | "accounts"
  | "plus"
  | "menu"
  | "close"
  | "collapse"
  | "expand"
  | "user"
  | "logout"
  | "back"
  | "chevron"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "refresh";

export type NavigationItemKey =
  | "dashboard"
  | "transactions"
  | "cards"
  | "recurring"
  | "accounts"
  | "holdings"
  | "trips"
  | "import";

export type NavigationItem = {
  href: string;
  key: NavigationItemKey;
};

export type NavigationGroup = {
  key: "track" | "wealth" | "data";
  items: NavigationItem[];
};

/** Rótulos vêm do catálogo: `nav.groups.<group.key>` e `nav.items.<item.key>`. */
export const navigationGroups: NavigationGroup[] = [
  {
    key: "track",
    items: [
      { href: "/dashboard", key: "dashboard" },
      { href: "/transactions", key: "transactions" },
      { href: "/cards", key: "cards" },
      { href: "/recurring", key: "recurring" },
    ],
  },
  {
    key: "wealth",
    items: [
      { href: "/accounts", key: "accounts" },
      { href: "/holdings", key: "holdings" },
      { href: "/trips", key: "trips" },
    ],
  },
  {
    key: "data",
    items: [{ href: "/import", key: "import" }],
  },
];

/** Rotas privadas fora do menu principal (acessadas pelo menu do usuário). */
export const accountRoutes = [
  { href: "/household", key: "household" as const },
  { href: "/settings", key: "settings" as const },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Rotas privadas (usadas pelo proxy). */
export const privatePrefixes = [
  ...navigationGroups.flatMap((group) => group.items.map((item) => item.href)),
  ...accountRoutes.map((route) => route.href),
  // Primeiro acesso: fora do menu; o layout autenticado redireciona para cá quando falta configurar.
  "/onboarding",
  "/consent",
];
