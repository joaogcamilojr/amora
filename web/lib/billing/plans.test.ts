import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  accessState,
  entitlementsFor,
  trialDaysLeft,
  withInherited,
  type SubscriptionState,
} from "./plans.ts";

const NOW = new Date("2026-10-20T12:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const sub = (over: Partial<SubscriptionState>): SubscriptionState => ({
  plan: "PREMIUM",
  status: "TRIALING",
  trialEndsAt: day(10),
  currentPeriodEnd: null,
  ...over,
});

describe("accessState", () => {
  it("teste em curso, teste vencido e assinatura", () => {
    assert.equal(accessState(sub({}), NOW), "TRIAL");
    assert.equal(accessState(sub({ trialEndsAt: day(-1) }), NOW), "EXPIRED");
    assert.equal(
      accessState(sub({ status: "ACTIVE", plan: "FAMILY" }), NOW),
      "ACTIVE",
    );
    assert.equal(accessState(sub({ status: "PAST_DUE" }), NOW), "PAST_DUE");
  });

  it("cancelada vale até o fim do período pago", () => {
    assert.equal(
      accessState(sub({ status: "CANCELED", currentPeriodEnd: day(3) }), NOW),
      "GRACE",
    );
    assert.equal(
      accessState(sub({ status: "CANCELED", currentPeriodEnd: day(-3) }), NOW),
      "EXPIRED",
    );
    assert.equal(
      accessState(sub({ status: "CANCELED", currentPeriodEnd: null }), NOW),
      "EXPIRED",
    );
  });
});

describe("entitlementsFor", () => {
  it("teste libera o Premium: multimoeda e câmbio automático, sem grupo familiar", () => {
    assert.deepEqual(entitlementsFor(sub({}), NOW), {
      canWrite: true,
      maxActiveAccounts: null,
      multiCurrency: true,
      autoFx: true,
      household: false,
      maxHouseholdMembers: 0,
    });
  });

  it("Start: 5 contas, 1 moeda, sem câmbio automático e sem grupo", () => {
    const e = entitlementsFor(sub({ plan: "START", status: "ACTIVE" }), NOW);
    assert.equal(e.maxActiveAccounts, 5);
    assert.equal(e.multiCurrency, false);
    assert.equal(e.autoFx, false);
    assert.equal(e.household, false);
  });

  it("Família: grupo com até 6 membros", () => {
    const e = entitlementsFor(sub({ plan: "FAMILY", status: "ACTIVE" }), NOW);
    assert.equal(e.household, true);
    assert.equal(e.maxHouseholdMembers, 6);
  });

  it("expirado vira somente leitura", () => {
    assert.equal(
      entitlementsFor(sub({ trialEndsAt: day(-1) }), NOW).canWrite,
      false,
    );
    assert.equal(
      entitlementsFor(
        sub({ status: "CANCELED", plan: "FAMILY", currentPeriodEnd: day(-1) }),
        NOW,
      ).canWrite,
      false,
    );
  });
});

describe("withInherited", () => {
  const family = entitlementsFor(
    sub({ plan: "FAMILY", status: "ACTIVE" }),
    NOW,
  );

  it("membro sem plano ativo herda a Família do grupo", () => {
    const own = entitlementsFor(sub({ trialEndsAt: day(-5) }), NOW);
    const merged = withInherited(own, family);
    assert.equal(merged.canWrite, true);
    assert.equal(merged.household, true);
    assert.equal(merged.multiCurrency, true);
  });

  it("plano próprio melhor que o herdado não é rebaixado", () => {
    const own = entitlementsFor(
      sub({ plan: "PREMIUM", status: "ACTIVE" }),
      NOW,
    );
    assert.equal(withInherited(own, family).maxActiveAccounts, null);
  });

  it("grupo cujo criador está só no Premium não concede nada", () => {
    const own = entitlementsFor(sub({ trialEndsAt: day(-5) }), NOW);
    const premium = entitlementsFor(
      sub({ plan: "PREMIUM", status: "ACTIVE" }),
      NOW,
    );
    assert.deepEqual(withInherited(own, premium), own);
  });

  it("grupo cuja Família expirou não concede nada", () => {
    const own = entitlementsFor(sub({ trialEndsAt: day(-5) }), NOW);
    const expired = entitlementsFor(
      sub({ plan: "FAMILY", status: "CANCELED", currentPeriodEnd: day(-1) }),
      NOW,
    );
    assert.deepEqual(withInherited(own, expired), own);
    assert.deepEqual(withInherited(own, null), own);
  });
});

describe("trialDaysLeft", () => {
  it("arredonda para cima e zera depois do fim", () => {
    assert.equal(trialDaysLeft(day(10), NOW), 10);
    assert.equal(trialDaysLeft(new Date(NOW.getTime() + 3_600_000), NOW), 1);
    assert.equal(trialDaysLeft(day(-1), NOW), 0);
    assert.equal(trialDaysLeft(null, NOW), 0);
  });
});
