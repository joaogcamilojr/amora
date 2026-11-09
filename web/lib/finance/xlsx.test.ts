import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCsv } from "./importers.ts";
import { sheetToCsv, xlsxToCsv } from "./xlsx.ts";

const date = (s: string) => new Date(`${s}T00:00:00Z`);

describe("sheetToCsv", () => {
  it("datas viram AAAA-MM-DD, números mantêm o ponto decimal e texto é escapado", () => {
    const csv = sheetToCsv([
      ["Data", "Descrição", "Valor"],
      [date("2026-03-01"), 'Mercado "Bom"', -45.900000000000006],
    ]);
    assert.equal(
      csv,
      '"Data";"Descrição";"Valor"\n"2026-03-01";"Mercado ""Bom""";"-45.9"',
    );
  });

  it("descarta linhas vazias, quebras de linha em células e células nulas", () => {
    const csv = sheetToCsv([
      ["a", null],
      [null, null],
      ["x\ny", true],
    ]);
    assert.equal(csv, '"a";""\n"x y";""');
  });
});

describe("xlsx → parseCsv", () => {
  it("valor único, com preâmbulo antes do cabeçalho", () => {
    const csv = xlsxToCsv([
      {
        sheet: "Extrato",
        data: [
          ["Banco Exemplo"],
          ["Data", "Histórico", "Valor"],
          [date("2026-03-01"), "Salário", 3000],
          [date("2026-03-02"), "Mercado", -45.9],
        ],
      },
    ]);
    const { rows, warnings } = parseCsv(csv);
    assert.deepEqual(
      rows.map((r) => [r.date, r.description, r.amount]),
      [
        ["2026-03-01", "Salário", 3000],
        ["2026-03-02", "Mercado", -45.9],
      ],
    );
    assert.deepEqual(warnings, []);
  });

  it("colunas de crédito e débito", () => {
    const csv = xlsxToCsv([
      {
        sheet: "S",
        data: [
          ["Fecha", "Concepto", "Cargo", "Abono"],
          [date("2026-03-02"), "Super", 80, null],
          [date("2026-03-03"), "Sueldo", null, 1500],
        ],
      },
    ]);
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => r.amount),
      [-80, 1500],
    );
  });

  it("datas em texto dd/mm/aaaa também funcionam", () => {
    const csv = xlsxToCsv([
      {
        sheet: "S",
        data: [
          ["Data", "Descrição", "Valor"],
          ["05/03/2026", "Café", "-4,50"],
        ],
      },
    ]);
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => [r.date, r.amount]),
      [["2026-03-05", -4.5]],
    );
  });

  it("usa a primeira aba legível, mesmo que não seja a primeira da planilha", () => {
    const csv = xlsxToCsv([
      { sheet: "Capa", data: [["Extrato mensal"]] },
      {
        sheet: "Movimentos",
        data: [
          ["Date", "Description", "Amount"],
          [date("2026-03-01"), "Coffee", -3],
        ],
      },
    ]);
    assert.equal(parseCsv(csv).rows.length, 1);
  });

  it("sem aba legível devolve a primeira e o parser avisa colunas ausentes", () => {
    const csv = xlsxToCsv([{ sheet: "Capa", data: [["Nada aqui"]] }]);
    assert.deepEqual(parseCsv(csv).warnings, [
      { key: "errors.import.csvMissingColumns" },
    ]);
  });
});
