import type { Locale } from "../config";

/** Mensagem com plural: escolhida por `Intl.PluralRules` a partir de `{ count }`. */
export interface Plural {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export type MessageLeaf = string | Plural;
export interface MessageTree {
  [key: string]: MessageLeaf | MessageTree;
}

/** Mesmo formato do catálogo base, com textos livres (para en/es). */
export type Widen<T> = T extends string
  ? string
  : T extends Plural
    ? Plural
    : { [K in keyof T]: Widen<T[K]> };

/** Chaves com ponto ("dashboard.title") de uma árvore de mensagens. */
export type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends MessageLeaf
    ? `${P}${K}`
    : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

/**
 * Define um namespace de mensagens. pt-BR é a fonte; en e es precisam ter exatamente as mesmas chaves
 * (o typecheck acusa chave faltando ou sobrando).
 *
 * Interpolação: `{nome}`. Plural: `{ one: "{count} item", other: "{count} itens" }`.
 * Não use `one`/`other`/`zero`/`few`/`many`/`two` como nome de chave comum.
 */
export function defineMessages<const T extends MessageTree>(
  base: T,
  translations: { en: Widen<T>; es: Widen<T> },
): Record<Locale, Widen<T>> {
  return {
    "pt-BR": base as unknown as Widen<T>,
    en: translations.en,
    es: translations.es,
  };
}
