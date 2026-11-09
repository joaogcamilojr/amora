import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeFrankfurter } from "./fx-frankfurter.ts";

const row = (
  base: string,
  quote: string,
  rate: number,
  date = "2026-11-09",
) => ({
  date,
  base,
  quote,
  rate,
});

describe("normalizeFrankfurter", () => {
  it("base USD: usa as cotações como vieram", () => {
    const out = normalizeFrankfurter(
      [row("USD", "BRL", 5.5), row("USD", "UYU", 40.3)],
      ["BRL", "UYU"],
    );
    assert.deepEqual(out, {
      date: "2026-11-09",
      rates: { BRL: 5.5, UYU: 40.3 },
    });
  });

  it("base EUR: triangula pelo USD e inclui o próprio EUR", () => {
    const out = normalizeFrankfurter(
      [
        row("EUR", "USD", 1.12),
        row("EUR", "BRL", 6.16),
        row("EUR", "UYU", 45.12),
      ],
      ["BRL", "UYU", "EUR"],
    );
    assert.ok(out);
    assert.ok(Math.abs(out.rates.BRL - 6.16 / 1.12) < 1e-9);
    assert.ok(Math.abs(out.rates.UYU - 45.12 / 1.12) < 1e-9);
    assert.ok(Math.abs(out.rates.EUR - 1 / 1.12) < 1e-9);
  });

  it("base não-USD sem cotação USD: não dá para triangular", () => {
    assert.equal(
      normalizeFrankfurter([row("EUR", "BRL", 6.16)], ["BRL"]),
      null,
    );
  });

  it("ignora moedas ausentes, USD pedido e linhas inválidas; data = mais recente", () => {
    const out = normalizeFrankfurter(
      [
        row("USD", "BRL", 5.5, "2026-11-06"),
        row("USD", "UYU", 40.3, "2026-11-09"),
        { date: "2026-11-09", base: "USD", quote: "XXX", rate: -1 },
        null,
      ],
      ["USD", "BRL", "UYU", "ARS"],
    );
    assert.deepEqual(out, {
      date: "2026-11-09",
      rates: { BRL: 5.5, UYU: 40.3 },
    });
  });

  it("resposta fora do formato esperado devolve null", () => {
    assert.equal(normalizeFrankfurter({ rates: { BRL: 5 } }, ["BRL"]), null);
    assert.equal(normalizeFrankfurter([], ["BRL"]), null);
  });
});
