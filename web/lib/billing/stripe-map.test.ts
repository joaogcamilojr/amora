import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapStripeStatus,
  planFromPriceId,
  priceIdFor,
  subscriptionUpdate,
  type StripeSubscriptionLike,
} from "./stripe-map.ts";

const env = {
  STRIPE_PRICE_START_MONTH: "price_s_m",
  STRIPE_PRICE_PREMIUM_YEAR: "price_p_y",
  STRIPE_PRICE_FAMILY_MONTH: " price_f_m ",
};

const sub = (
  over: Partial<StripeSubscriptionLike> = {},
): StripeSubscriptionLike => ({
  id: "sub_1",
  customer: "cus_1",
  status: "active",
  cancel_at_period_end: false,
  items: {
    data: [{ price: { id: "price_p_y" }, current_period_end: 1_800_000_000 }],
  },
  ...over,
});

describe("preços", () => {
  it("lê o ID do ambiente (com trim) e devolve null quando falta", () => {
    assert.equal(priceIdFor("FAMILY", "MONTH", env), "price_f_m");
    assert.equal(priceIdFor("START", "YEAR", env), null);
  });

  it("acha plano e ciclo pelo ID do preço", () => {
    assert.deepEqual(planFromPriceId("price_p_y", env), {
      plan: "PREMIUM",
      interval: "YEAR",
    });
    assert.equal(planFromPriceId("price_desconhecido", env), null);
  });
});

describe("mapStripeStatus", () => {
  it("traduz os estados do Stripe", () => {
    assert.equal(mapStripeStatus("active"), "ACTIVE");
    assert.equal(mapStripeStatus("past_due"), "PAST_DUE");
    for (const s of ["canceled", "unpaid", "incomplete_expired", "paused"])
      assert.equal(mapStripeStatus(s), "CANCELED");
    assert.equal(mapStripeStatus("incomplete"), null);
  });
});

describe("subscriptionUpdate", () => {
  it("monta plano, ciclo, status e fim do período", () => {
    assert.deepEqual(subscriptionUpdate(sub(), env), {
      plan: "PREMIUM",
      interval: "YEAR",
      status: "ACTIVE",
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
      cancelAtPeriodEnd: false,
      customerId: "cus_1",
      subscriptionId: "sub_1",
    });
  });

  it("cliente como objeto e cancelamento ao fim do período", () => {
    const u = subscriptionUpdate(
      sub({ customer: { id: "cus_9" }, cancel_at_period_end: true }),
      env,
    );
    assert.equal(u?.customerId, "cus_9");
    assert.equal(u?.cancelAtPeriodEnd, true);
  });

  it("ignora preço desconhecido e estado sem efeito", () => {
    assert.equal(
      subscriptionUpdate(
        sub({ items: { data: [{ price: { id: "x" } }] } }),
        env,
      ),
      null,
    );
    assert.equal(subscriptionUpdate(sub({ status: "incomplete" }), env), null);
  });
});
