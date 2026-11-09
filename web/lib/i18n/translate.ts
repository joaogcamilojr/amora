import type { Locale } from "./config";
import type { MessageLeaf, MessageTree, Plural } from "./messages/define";
import type { MessageKey, Messages } from "./messages";

export type MessageVars = Record<string, string | number | null | undefined>;
export type Translator = (key: MessageKey, vars?: MessageVars) => string;

function lookup(messages: Messages, key: string): MessageLeaf | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as MessageTree)[part];
  }
  if (typeof node === "string") return node;
  if (
    node &&
    typeof node === "object" &&
    typeof (node as Plural).other === "string"
  )
    return node as Plural;
  return undefined;
}

/**
 * Cria `t(key, vars)`.
 * - `{nome}` é trocado por `vars.nome` (números formatados no idioma).
 * - Mensagem plural escolhe a forma por `vars.count`.
 * - Chave inexistente devolve a própria chave (o typecheck já impede isso no código).
 */
export function createTranslator(
  locale: Locale,
  messages: Messages,
): Translator {
  const plural = new Intl.PluralRules(locale);
  const number = new Intl.NumberFormat(locale);
  return (key, vars) => {
    const value = lookup(messages, key);
    if (value === undefined) return key;
    let text: string;
    if (typeof value === "string") text = value;
    else {
      const count = Number(vars?.count ?? 0);
      const form =
        count === 0 && value.zero !== undefined ? "zero" : plural.select(count);
      text = value[form as keyof Plural] ?? value.other;
    }
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (match, name: string) => {
      const v = vars[name];
      if (v === undefined || v === null) return match;
      return typeof v === "number" ? number.format(v) : v;
    });
  };
}
