import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isCalendarDate } from "./fx-date.ts";

describe("isCalendarDate", () => {
  it("aceita datas reais, inclusive bissexta", () => {
    assert.equal(isCalendarDate("2026-10-17"), true);
    assert.equal(isCalendarDate("2028-02-29"), true);
  });

  it("rejeita formato errado e datas impossíveis", () => {
    for (const bad of [
      "2026-13-45",
      "2026-02-30",
      "2027-02-29",
      "26-10-17",
      "2026-1-1",
      "",
      "2026-10-17T00:00:00Z",
    ])
      assert.equal(isCalendarDate(bad), false, bad);
  });
});
