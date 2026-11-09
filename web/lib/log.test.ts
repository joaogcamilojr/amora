import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { describeError } from "./log.ts";

describe("describeError", () => {
  it("nunca devolve a mensagem nem campos livres do erro", () => {
    const error = Object.assign(new Error("Unique constraint failed on email = ana@exemplo.com"), {
      code: "P2002",
      meta: { target: ["email"], value: "ana@exemplo.com" },
    });
    const out = JSON.stringify(describeError(error));
    assert.equal(out, '{"name":"Error","code":"P2002"}');
    assert.ok(!out.includes("ana@exemplo.com"));
  });

  it("aceita statusCode numérico (Resend) e ignora código com texto livre", () => {
    assert.deepEqual(describeError(Object.assign(new Error("x"), { statusCode: 422 })), { name: "Error", code: 422 });
    assert.deepEqual(describeError({ code: "falha para ana@exemplo.com" }), { name: "object" });
  });

  it("valor que não é Error vira só o tipo", () => {
    assert.deepEqual(describeError("ana@exemplo.com"), { name: "string" });
  });

  it("nome de erro com texto livre é descartado", () => {
    const error = new Error("x");
    error.name = "Erro de ana@exemplo.com";
    assert.deepEqual(describeError(error), { name: "object" });
  });
});
