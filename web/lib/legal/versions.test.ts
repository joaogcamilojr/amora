import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isLegalDoc, LEGAL_VERSIONS, missingConsents } from "./versions.ts";

describe("missingConsents", () => {
  it("sem aceite, falta tudo", () => {
    assert.deepEqual(missingConsents([]), ["TERMS", "PRIVACY"]);
  });

  it("aceite da versão vigente completa", () => {
    assert.deepEqual(
      missingConsents([
        { kind: "TERMS", version: LEGAL_VERSIONS.TERMS },
        { kind: "PRIVACY", version: LEGAL_VERSIONS.PRIVACY },
      ]),
      [],
    );
  });

  it("versão antiga não vale e pede novo aceite só do que mudou", () => {
    assert.deepEqual(
      missingConsents([
        { kind: "TERMS", version: "2025-01-01" },
        { kind: "PRIVACY", version: LEGAL_VERSIONS.PRIVACY },
      ]),
      ["TERMS"],
    );
  });
});

describe("isLegalDoc", () => {
  it("só termos e privacidade; ignora chaves do protótipo", () => {
    assert.equal(isLegalDoc("terms"), true);
    assert.equal(isLegalDoc("privacy"), true);
    assert.equal(isLegalDoc("toString"), false);
    assert.equal(isLegalDoc("x"), false);
  });
});
