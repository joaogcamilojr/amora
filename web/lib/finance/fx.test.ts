import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildFx, toBase, type FxRateInput } from "./fx.ts";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const provider = (toCode: string, rate: number, at: string): FxRateInput => ({
  fromCode: "USD",
  toCode,
  rate,
  at: d(at),
  origin: "PROVIDER",
});
const user = (
  fromCode: string,
  toCode: string,
  rate: number,
  at: string,
): FxRateInput => ({ fromCode, toCode, rate, at: d(at), origin: "USER" });

describe("buildFx", () => {
  it("base USD: inverte USD→X do provedor", () => {
    const { table, meta } = buildFx("USD", [provider("BRL", 5, "2026-10-01")]);
    assert.equal(table.get("BRL"), 0.2);
    assert.deepEqual(meta.get("BRL"), {
      source: "PROVIDER",
      date: "2026-10-01",
      derived: false,
    });
  });

  it("base BRL: triangula EUR e UYU pelo USD e marca como derivada", () => {
    const { table, meta } = buildFx("BRL", [
      provider("BRL", 5, "2026-10-02"),
      provider("EUR", 0.5, "2026-10-01"),
      provider("UYU", 40, "2026-10-02"),
    ]);
    assert.equal(table.get("USD"), 5); // 1 USD = 5 BRL
    assert.equal(table.get("EUR"), 10); // 5 / 0.5
    assert.equal(table.get("UYU"), 0.125); // 5 / 40
    assert.deepEqual(meta.get("EUR"), {
      source: "PROVIDER",
      date: "2026-10-01",
      derived: true,
    });
  });

  it("usa a cotação mais recente do provedor", () => {
    const { table } = buildFx("USD", [
      provider("BRL", 5, "2026-10-01"),
      provider("BRL", 4, "2026-10-03"),
      provider("BRL", 6, "2026-10-02"),
    ]);
    assert.equal(table.get("BRL"), 0.25);
  });

  it("manual vence a automática mesmo sendo mais antiga", () => {
    const { table, meta } = buildFx("BRL", [
      provider("BRL", 5, "2026-10-10"),
      user("USD", "BRL", 5.4, "2026-09-01"),
    ]);
    assert.equal(table.get("USD"), 5.4);
    assert.equal(meta.get("USD")?.source, "MANUAL");
  });

  it("manual vence também no par invertido (BRL→USD informado à mão)", () => {
    const { table } = buildFx("BRL", [
      provider("BRL", 5, "2026-10-10"),
      user("BRL", "USD", 0.25, "2026-09-01"),
    ]);
    assert.equal(table.get("USD"), 4);
  });

  it("manual de uma moeda não é desfeita pela triangulação", () => {
    const { table, meta } = buildFx("BRL", [
      provider("BRL", 5, "2026-10-10"),
      provider("EUR", 0.5, "2026-10-10"),
      user("EUR", "BRL", 6, "2026-09-01"),
    ]);
    assert.equal(table.get("EUR"), 6);
    assert.equal(meta.get("EUR")?.derived, false);
  });

  it("sem cotação, a moeda fica fora da tabela (conversão nula)", () => {
    const { table } = buildFx("BRL", [provider("EUR", 0.5, "2026-10-10")]);
    assert.equal(toBase(10, "EUR", table), null);
    assert.equal(toBase(10, "BRL", table), 10);
  });

  it("ignora cotação não positiva", () => {
    const { table } = buildFx("USD", [provider("BRL", 0, "2026-10-10")]);
    assert.equal(table.has("BRL"), false);
  });
});
