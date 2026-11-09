import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { num, toCsv } from "./csv.ts";

describe("toCsv", () => {
  it("escapa aspas, vírgulas e quebras de linha", () => {
    const csv = toCsv(["a", "b"], [['Mercado "Bom", Centro', "linha1\nlinha2"]]);
    assert.equal(csv, '﻿a,b\r\n"Mercado ""Bom"", Centro","linha1\nlinha2"\r\n');
  });

  it("neutraliza fórmulas em texto, mas não em números", () => {
    const csv = toCsv(["d", "v"], [["=HYPERLINK(\"x\")", num("-45.9")], ["@cmd", 3], ["+1", null]]);
    assert.ok(csv.includes("'=HYPERLINK"));
    assert.ok(csv.includes(",-45.9\r\n"));
    assert.ok(csv.includes("'@cmd,3"));
    assert.ok(csv.includes("'+1,\r\n"));
  });

  it("datas saem em ISO e vazio é vazio", () => {
    assert.equal(toCsv(["d", "e"], [[new Date("2026-03-01T12:00:00Z"), undefined]]), "﻿d,e\r\n2026-03-01T12:00:00.000Z,\r\n");
  });
});
