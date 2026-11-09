import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCsv } from "./importers.ts";

describe("parseCsv — coluna de valor única", () => {
  it("mantém o sinal do valor", () => {
    const { rows, warnings } = parseCsv(
      "Data;Descrição;Valor\n01/03/2026;Mercado;-45,90\n02/03/2026;Salário;3.000,00",
    );
    assert.deepEqual(
      rows.map((r) => r.amount),
      [-45.9, 3000],
    );
    assert.deepEqual(warnings, []);
  });
});

describe("parseCsv — colunas de crédito e débito", () => {
  it("pt-BR: débito vira negativo e crédito positivo", () => {
    const csv =
      "Data;Histórico;Crédito;Débito\n01/03/2026;Salário;3.000,00;\n02/03/2026;Mercado;;45,90";
    const { rows, warnings } = parseCsv(csv);
    assert.deepEqual(
      rows.map((r) => [r.date, r.amount]),
      [
        ["2026-03-01", 3000],
        ["2026-03-02", -45.9],
      ],
    );
    assert.deepEqual(
      rows.map((r) => r.description),
      ["Salário", "Mercado"],
    );
    assert.deepEqual(warnings, []);
  });

  it("en: Credit/Debit com vírgula como separador", () => {
    const csv =
      "Date,Description,Debit,Credit\n2026-03-02,Coffee,4.50,\n2026-03-03,Refund,,12.00";
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => r.amount),
      [-4.5, 12],
    );
  });

  it("es: Cargo/Abono (cargo é débito, abono é crédito)", () => {
    const csv =
      "Fecha;Concepto;Cargo;Abono\n02/03/2026;Super;80,00;\n03/03/2026;Sueldo;;1.500,00";
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => r.amount),
      [-80, 1500],
    );
  });

  it("es: Débito/Crédito com acento e sufixo (R$)", () => {
    const csv =
      "Fecha;Descripción;Débito (R$);Crédito (R$)\n02/03/2026;Super;80,00;";
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => r.amount),
      [-80],
    );
  });

  it("débito já negativo no arquivo continua saindo como negativo", () => {
    const csv = "Data;Descrição;Débito;Crédito\n02/03/2026;Mercado;-45,90;";
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => r.amount),
      [-45.9],
    );
  });

  it("zero na coluna oposta não é ambíguo", () => {
    const csv =
      "Data;Descrição;Crédito;Débito\n01/03/2026;Salário;3.000,00;0,00\n02/03/2026;Mercado;0,00;45,90";
    const { rows, warnings } = parseCsv(csv);
    assert.deepEqual(
      rows.map((r) => r.amount),
      [3000, -45.9],
    );
    assert.deepEqual(warnings, []);
  });

  it("aceita arquivo só com coluna de débito", () => {
    const csv = "Data;Descrição;Débito\n02/03/2026;Mercado;45,90";
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => r.amount),
      [-45.9],
    );
  });

  it("ambas preenchidas: ignora a linha e avisa com a contagem", () => {
    const csv = [
      "Data;Descrição;Crédito;Débito",
      "01/03/2026;Salário;3.000,00;",
      "02/03/2026;Estranho;10,00;10,00",
      "03/03/2026;Outro;5,00;2,00",
    ].join("\n");
    const { rows, warnings } = parseCsv(csv);
    assert.deepEqual(
      rows.map((r) => r.amount),
      [3000],
    );
    assert.deepEqual(warnings, [
      { key: "errors.import.csvCreditAndDebit", vars: { count: 2 } },
    ]);
  });

  it("só linhas ambíguas: avisa a ambiguidade e que não há linha válida", () => {
    const { rows, warnings } = parseCsv(
      "Data;Descrição;Crédito;Débito\n02/03/2026;X;1,00;1,00",
    );
    assert.equal(rows.length, 0);
    assert.deepEqual(
      warnings.map((w) => w.key),
      ["errors.import.csvCreditAndDebit", "errors.import.noValidRows"],
    );
  });

  it("coluna de valor tem prioridade quando o arquivo traz as duas formas", () => {
    const csv = "Data;Descrição;Valor;Crédito;Débito\n02/03/2026;X;-7,00;;7,00";
    assert.deepEqual(
      parseCsv(csv).rows.map((r) => r.amount),
      [-7],
    );
  });
});

describe("parseCsv — cabeçalho", () => {
  it("sem coluna de valor nem de crédito/débito, avisa colunas ausentes", () => {
    const { rows, warnings } = parseCsv("Data;Descrição\n01/03/2026;X");
    assert.equal(rows.length, 0);
    assert.deepEqual(warnings, [{ key: "errors.import.csvMissingColumns" }]);
  });
});
