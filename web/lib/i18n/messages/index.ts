import type { Locale } from "../config";
import accounts from "./accounts";
import auth from "./auth";
import billing from "./billing";
import cards from "./cards";
import common from "./common";
import dashboard from "./dashboard";
import type { Paths } from "./define";
import ds from "./ds";
import enums from "./enums";
import errors from "./errors";
import holdings from "./holdings";
import household from "./household";
import imports from "./imports";
import landing from "./landing";
import legal from "./legal";
import nav from "./nav";
import onboarding from "./onboarding";
import privacy from "./privacy";
import recurring from "./recurring";
import settings from "./settings";
import shell from "./shell";
import transactions from "./transactions";
import trips from "./trips";
import ui from "./ui";

/** Um arquivo por namespace, com pt-BR, en e es lado a lado. Para criar um namespace, registre-o aqui. */
const namespaces = {
  common,
  enums,
  nav,
  shell,
  settings,
  errors,
  auth,
  landing,
  legal,
  dashboard,
  transactions,
  cards,
  recurring,
  accounts,
  holdings,
  household,
  billing,
  onboarding,
  privacy,
  trips,
  imports,
  ds,
  ui,
};

type Namespaces = typeof namespaces;
export type Messages = { [N in keyof Namespaces]: Namespaces[N]["pt-BR"] };
export type MessageKey = Paths<Messages>;

const cache = new Map<Locale, Messages>();

/** Catálogo completo de um idioma (serializável: pode ir do servidor para o cliente). */
export function messagesFor(locale: Locale): Messages {
  let messages = cache.get(locale);
  if (!messages) {
    messages = Object.fromEntries(
      Object.entries(namespaces).map(([name, ns]) => [name, ns[locale]]),
    ) as Messages;
    cache.set(locale, messages);
  }
  return messages;
}
