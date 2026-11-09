import {
  BILLING_INTERVALS,
  PLAN_CODES,
  type BillingInterval,
  type PlanCode,
  type SubscriptionStatus,
} from "./plans.ts";

type Env = Record<string, string | undefined>;

/** Nome da variável de ambiente com o ID do preço no Stripe: `STRIPE_PRICE_FAMILY_YEAR`. */
export const priceEnvName = (plan: PlanCode, interval: BillingInterval) =>
  `STRIPE_PRICE_${plan}_${interval}`;

export function priceIdFor(
  plan: PlanCode,
  interval: BillingInterval,
  env: Env = process.env,
): string | null {
  return env[priceEnvName(plan, interval)]?.trim() || null;
}

export function planFromPriceId(
  priceId: string,
  env: Env = process.env,
): { plan: PlanCode; interval: BillingInterval } | null {
  for (const plan of PLAN_CODES)
    for (const interval of BILLING_INTERVALS)
      if (priceIdFor(plan, interval, env) === priceId)
        return { plan, interval };
  return null;
}

/** `null` = estado sem efeito no acesso (ex.: `incomplete`, pagamento inicial ainda em andamento). */
export function mapStripeStatus(status: string): SubscriptionStatus | null {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
    case "paused":
      return "CANCELED";
    default:
      return null;
  }
}

/** Parte do objeto Subscription do Stripe de que precisamos (o fim do período fica em cada item). */
export interface StripeSubscriptionLike {
  id: string;
  customer: string | { id: string };
  status: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, string> | null;
  items: { data: { price: { id: string }; current_period_end?: number }[] };
}

export interface SubscriptionUpdate {
  plan: PlanCode;
  interval: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  customerId: string;
  subscriptionId: string;
}

export function subscriptionUpdate(
  sub: StripeSubscriptionLike,
  env: Env = process.env,
): SubscriptionUpdate | null {
  const status = mapStripeStatus(sub.status);
  const item = sub.items.data[0];
  const price = item ? planFromPriceId(item.price.id, env) : null;
  if (!status || !price) return null;
  const end = sub.items.data
    .map((i) => i.current_period_end ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return {
    ...price,
    status,
    currentPeriodEnd: end > 0 ? new Date(end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    customerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    subscriptionId: sub.id,
  };
}
