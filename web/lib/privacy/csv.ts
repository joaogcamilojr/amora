/** Número já formatado (string decimal): não recebe a proteção contra fórmulas aplicada a texto. */
export interface CsvNumber {
  number: string;
}
export type CsvCell = string | number | boolean | Date | CsvNumber | null | undefined;

export const num = (value: string | { toString(): string }): CsvNumber => ({ number: value.toString() });

const isNumber = (cell: CsvCell): cell is CsvNumber => typeof cell === "object" && cell !== null && "number" in cell;

function cellText(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString();
  if (isNumber(cell)) return cell.number;
  if (typeof cell === "number" || typeof cell === "boolean") return String(cell);
  // Planilhas executam texto que começa com = + - @ (CSV injection): o apóstrofo neutraliza.
  return /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
}

function field(cell: CsvCell): string {
  const text = cellText(cell);
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV RFC 4180 (vírgula, CRLF) com BOM UTF-8 para o Excel reconhecer acentos. */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return `﻿${[headers, ...rows].map((row) => row.map(field).join(",")).join("\r\n")}\r\n`;
}
