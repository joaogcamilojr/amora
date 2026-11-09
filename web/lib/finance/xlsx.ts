import { parseCsv } from "./importers.ts";

/** Valor de célula como a biblioteca de XLSX entrega (string, número, booleano, Date ou vazio); tratado por tipo em tempo de execução. */
export type SheetCell = unknown;
export interface SheetInput {
  sheet: string;
  data: SheetCell[][];
}

function cellText(cell: SheetCell): string {
  if (cell instanceof Date)
    return Number.isNaN(cell.getTime()) ? "" : cell.toISOString().slice(0, 10);
  // Sem ruído de ponto flutuante (45.900000000000006 → 45.9); o ponto decimal é lido por `parseNumber`.
  if (typeof cell === "number")
    return Number.isFinite(cell) ? String(Number(cell.toFixed(10))) : "";
  if (typeof cell === "string") return cell.trim();
  return "";
}

/** Uma planilha vira o mesmo CSV (`;`, campos entre aspas) que `parseCsv` já sabe ler. */
export function sheetToCsv(data: SheetCell[][]): string {
  return data
    .map((row) =>
      row
        .map(
          (cell) =>
            `"${cellText(cell)
              .replace(/"/g, '""')
              .replace(/[\r\n]+/g, " ")}"`,
        )
        .join(";"),
    )
    .filter((line) => line.replace(/[";]/g, "") !== "")
    .join("\n");
}

/**
 * Escolhe a primeira aba que o importador consegue ler (cabeçalho de data e valor, ou crédito/débito, e ao menos
 * uma linha válida). Sem nenhuma, devolve a primeira aba para o servidor explicar o problema.
 */
export function xlsxToCsv(sheets: SheetInput[]): string {
  const csvs = sheets.map((s) => sheetToCsv(s.data));
  return csvs.find((csv) => parseCsv(csv).rows.length > 0) ?? csvs[0] ?? "";
}
