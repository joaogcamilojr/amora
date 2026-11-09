import type { MessageKey } from "@/lib/i18n";

export interface ImportedRow {
  date: string;
  /** Vazio quando o arquivo não traz descrição (o serviço preenche no idioma do usuário). */
  description: string;
  amount: number;
  externalId?: string;
}

/** Aviso do parser: chave do catálogo (`errors.import.*`) e variáveis de interpolação, se houver. */
export interface ImportWarning {
  key: MessageKey;
  vars?: Record<string, string | number>;
}

export interface ParseResult {
  format: "ofx" | "csv";
  rows: ImportedRow[];
  /** O serviço traduz antes de responder. */
  warnings: ImportWarning[];
}

export function parseStatement(fileName: string, content: string): ParseResult {
  const name = fileName.toLowerCase();
  if (name.endsWith(".ofx") || name.endsWith(".qfx") || /<OFX>/i.test(content))
    return parseOfx(content);
  return parseCsv(content);
}

// ---------- OFX ----------

function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"));
  return m?.[1]?.trim();
}

function ofxDate(amount: string): string {
  return `${amount.slice(0, 4)}-${amount.slice(4, 6)}-${amount.slice(6, 8)}`;
}

export function parseOfx(content: string): ParseResult {
  const blocks = content.split(/<STMTTRN>/i).slice(1);
  const rows: ImportedRow[] = [];
  const warnings: ImportWarning[] = [];
  for (const raw of blocks) {
    const block = raw.split(/<\/STMTTRN>/i)[0];
    const date = tag(block, "DTPOSTED");
    const amount = tag(block, "TRNAMT");
    if (!date || !amount) {
      warnings.push({ key: "errors.import.ofxMissingDateOrAmount" });
      continue;
    }
    const description = [tag(block, "NAME"), tag(block, "MEMO")]
      .filter(Boolean)
      .join(" — ");
    rows.push({
      date: ofxDate(date),
      description,
      amount: Number(amount.replace(",", ".")),
      externalId: tag(block, "FITID"),
    });
  }
  return { format: "ofx", rows, warnings };
}

// ---------- CSV ----------

function detectSeparator(line: string): string {
  const candidates = [";", ",", "\t"];
  return candidates.sort(
    (a, b) => line.split(b).length - line.split(a).length,
  )[0];
}

function splitLine(line: string, sep: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      fields.push(current.trim());
      current = "";
    } else current += ch;
  }
  fields.push(current.trim());
  return fields;
}

/** Aceita "1.234,56", "-1234.56", "R$ 10,00", "(10,00)" e "−R$ 35,00" (sinal unicode do PicPay). */
export function parseNumber(text: string): number | null {
  let t = text
    .replace(/\u2212/g, "-")
    .replace(/[R$\s\u00a0+]|US\$|USD|BRL/gi, "");
  const negativeParens = /^\(.*\)$/.test(t);
  t = t.replace(/[()]/g, "");
  if (t.includes(",") && t.lastIndexOf(",") > t.lastIndexOf("."))
    t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(/,/g, "");
  const n = Number(t);
  if (!Number.isFinite(n) || t === "") return null;
  return negativeParens ? -n : n;
}

/** Aceita dd/mm/aaaa, dd/mm/aa, aaaa-mm-dd. */
export function parseDateText(text: string): string | null {
  const t = text.trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

const HEADER_DATE =
  /^(data( lan[cç]amento| movimento| da transa[cç][aã]o)?|date|fecha)$/i;
const HEADER_DESC =
  /^(tipo|descri[cç][aã]o|hist[oó]rico|description|memo|lan[cç]amento|estabelecimento|concepto|origem \/ destino)$/i;
const HEADER_AMOUNT = /^(valor( \(r\$\))?|amount|quantia|importe|monto)$/i;
/** Colunas separadas: crédito entra (+), débito sai (−). Cargo/abono (es): cargo = débito, abono = crédito. */
const HEADER_CREDIT =
  /^(cr[eé]ditos?( \(r\$\))?|credits?|entradas?|abonos?|ingresos?)$/i;
const HEADER_DEBIT =
  /^(d[eé]bitos?( \(r\$\))?|debits?|sa[ií]das?|cargos?|egresos?)$/i;

export function parseCsv(content: string): ParseResult {
  const textLines = content
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  const warnings: ImportWarning[] = [];
  const headerIndex = textLines.findIndex((l) => {
    const sep = detectSeparator(l);
    const fields = splitLine(l, sep).map((c) => c.replace(/"/g, ""));
    return (
      fields.some((c) => HEADER_DATE.test(c)) &&
      fields.some(
        (c) =>
          HEADER_AMOUNT.test(c) ||
          HEADER_CREDIT.test(c) ||
          HEADER_DEBIT.test(c),
      )
    );
  });
  if (headerIndex < 0) {
    return {
      format: "csv",
      rows: [],
      warnings: [{ key: "errors.import.csvMissingColumns" }],
    };
  }
  const sep = detectSeparator(textLines[headerIndex]);
  const header = splitLine(textLines[headerIndex], sep).map((c) =>
    c.replace(/"/g, ""),
  );
  const iDate = header.findIndex((c) => HEADER_DATE.test(c));
  const iAmount = header.findIndex((c) => HEADER_AMOUNT.test(c));
  const iCredit = header.findIndex((c) => HEADER_CREDIT.test(c));
  const iDebit = header.findIndex((c) => HEADER_DEBIT.test(c));
  const iDescs = header
    .map((c, i) => (HEADER_DESC.test(c) ? i : -1))
    .filter((i) => i >= 0);

  const rows: ImportedRow[] = [];
  let ambiguous = 0;
  for (const text of textLines.slice(headerIndex + 1)) {
    const fields = splitLine(text, sep);
    const date = parseDateText(fields[iDate] ?? "");
    let amount: number | null;
    if (iAmount >= 0) amount = parseNumber(fields[iAmount] ?? "");
    else {
      // Zero e vazio contam como "não preenchida": muitos bancos exportam 0,00 na coluna oposta.
      const credit = iCredit >= 0 ? parseNumber(fields[iCredit] ?? "") : null;
      const debit = iDebit >= 0 ? parseNumber(fields[iDebit] ?? "") : null;
      const hasCredit = credit !== null && credit !== 0;
      const hasDebit = debit !== null && debit !== 0;
      if (hasCredit && hasDebit) {
        // Não adivinha o sentido: a linha fica de fora e o usuário é avisado.
        if (date) ambiguous++;
        continue;
      }
      amount = hasCredit
        ? Math.abs(credit)
        : hasDebit
          ? -Math.abs(debit)
          : (credit ?? debit);
    }
    if (!date || amount === null) continue;
    const description = iDescs
      .map((i) => fields[i])
      .filter(Boolean)
      .join(" — ");
    rows.push({ date, description, amount });
  }
  if (ambiguous > 0)
    warnings.push({
      key: "errors.import.csvCreditAndDebit",
      vars: { count: ambiguous },
    });
  if (rows.length === 0) warnings.push({ key: "errors.import.noValidRows" });
  return { format: "csv", rows, warnings };
}
