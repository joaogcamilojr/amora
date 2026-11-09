import type { Prisma } from "@prisma/client";
import { cache } from "react";
import type Stripe from "stripe";

import {
  accessState,
  entitlementsFor,
  FAMILY_MAX_MEMBERS,
  isBillingInterval,
  isPlanCode,
  PLAN_PRICES_USD,
  TRIAL_DAYS,
  trialDaysLeft,
  withInherited,
  type Entitlements,
  type SubscriptionState,
} from "@/lib/billing/plans";
import { isStripeConfigured, stripeClient } from "@/lib/billing/stripe";
import { priceIdFor, subscriptionUpdate } from "@/lib/billing/stripe-map";
import { FALLBACK_BASE_CURRENCY } from "@/lib/i18n/config";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

const APP_URL = process.env.WEB_URL || "http://localhost:3000";

const toState = (s: {
  plan: SubscriptionState["plan"];
  status: SubscriptionState["status"];
  trial_ends_at: Date | null;
  current_period_end: Date | null;
}): SubscriptionState => ({
  plan: s.plan,
  status: s.status,
  trialEndsAt: s.trial_ends_at,
  currentPeriodEnd: s.current_period_end,
});

/** Primeiro acesso (inclusive de quem já existia): começa o teste de 14 dias do Premium, sem cartão. */
export async function ensureSubscription(userId: string) {
  const existing = await prisma.subscriptions.findUnique({
    where: { user_id: userId },
  });
  if (existing) return existing;
  await prisma.subscriptions.createMany({
    data: [
      {
        user_id: userId,
        plan: "PREMIUM",
        status: "TRIALING",
        trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
      },
    ],
    skipDuplicates: true,
  });
  return prisma.subscriptions.findUniqueOrThrow({ where: { user_id: userId } });
}

/** Direitos herdados: grupo familiar ativo cujo criador (outra pessoa) tem plano Família. */
async function inheritedEntitlements(
  userId: string,
  now: Date,
): Promise<Entitlements | null> {
  const memberships = await prisma.household_members.findMany({
    where: {
      user_id: userId,
      household: { archived_at: null, created_by_user_id: { not: userId } },
    },
    select: { household: { select: { created_by_user_id: true } } },
  });
  const creatorIds = [
    ...new Set(memberships.map((m) => m.household.created_by_user_id)),
  ];
  if (creatorIds.length === 0) return null;
  const subs = await prisma.subscriptions.findMany({
    where: { user_id: { in: creatorIds } },
  });
  return (
    subs
      .map((s) => entitlementsFor(toState(s), now))
      .find((e) => e.canWrite && e.household) ?? null
  );
}

/**
 * Só em desenvolvimento: `BILLING_DISABLED=true` libera todos os recursos (Família) sem criar assinatura nem teste.
 * Em produção a variável é ignorada.
 */
export const billingDisabled = () =>
  process.env.BILLING_DISABLED === "true" &&
  process.env.NODE_ENV !== "production";

const DISABLED_ENTITLEMENTS: Entitlements = {
  canWrite: true,
  maxActiveAccounts: null,
  multiCurrency: true,
  autoFx: true,
  household: true,
  maxHouseholdMembers: FAMILY_MAX_MEMBERS,
};

async function resolve(userId: string) {
  const now = new Date();
  const subscription = await ensureSubscription(userId);
  const own = entitlementsFor(toState(subscription), now);
  const inherited =
    own.household && own.canWrite
      ? null
      : await inheritedEntitlements(userId, now);
  return {
    subscription,
    own,
    entitlements: withInherited(own, inherited),
    inherited: Boolean(
      inherited?.canWrite && inherited.household && !own.household,
    ),
  };
}

/** Direitos do usuário (plano próprio ou herdado do grupo familiar). Memorizado por requisição nas telas. */
export const getEntitlements = cache(
  async (userId: string): Promise<Entitlements> => {
    if (billingDisabled()) return DISABLED_ENTITLEMENTS;
    return (await resolve(userId)).entitlements;
  },
);

/** Somente leitura (teste acabou ou assinatura encerrada): bloqueia escritas de dados financeiros. */
export async function assertCanWrite(userId: string) {
  if (!(await getEntitlements(userId)).canWrite)
    throw new ValidationError("PLAN_REQUIRED", "errors.billing.readOnly");
}

/** Plano sem multimoeda só usa a moeda-base. */
export async function assertAssetsAllowed(
  userId: string,
  assetIds: (string | null | undefined)[],
) {
  if ((await getEntitlements(userId)).multiCurrency) return;
  const ids = [...new Set(assetIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return;
  const [user, assets] = await Promise.all([
    prisma.users.findUnique({
      where: { id: userId },
      select: { base_asset: { select: { code: true } } },
    }),
    prisma.assets.findMany({
      where: { id: { in: ids } },
      select: { code: true },
    }),
  ]);
  const base = user?.base_asset?.code ?? FALLBACK_BASE_CURRENCY;
  if (assets.some((a) => a.code !== base))
    throw new ValidationError("PLAN_REQUIRED", "errors.billing.multiCurrency");
}

export async function assertCanCreateAccount(userId: string) {
  const { maxActiveAccounts } = await getEntitlements(userId);
  if (maxActiveAccounts === null) return;
  const active = await prisma.accounts.count({
    where: { owner_id: userId, status: "ACTIVE" },
  });
  if (active >= maxActiveAccounts)
    throw new ValidationError("PLAN_LIMIT", "errors.billing.accountLimit", {
      max: maxActiveAccounts,
    });
}

export async function assertHouseholdAllowed(userId: string) {
  if (!(await getEntitlements(userId)).household)
    throw new ValidationError("PLAN_REQUIRED", "errors.billing.familyRequired");
}

/** Membros com login mais convites pendentes não passam do limite do plano Família. */
export async function assertHouseholdCapacity(
  householdId: string,
  options: { countPending?: boolean } = {},
) {
  const [members, invitations] = await Promise.all([
    prisma.household_members.count({
      where: { household_id: householdId, user_id: { not: null } },
    }),
    options.countPending === false
      ? 0
      : prisma.household_invitations.count({
          where: {
            household_id: householdId,
            status: "PENDING",
            expires_at: { gt: new Date() },
          },
        }),
  ]);
  if (members + invitations >= FAMILY_MAX_MEMBERS)
    throw new ValidationError("PLAN_LIMIT", "errors.billing.memberLimit", {
      max: FAMILY_MAX_MEMBERS,
    });
}

export async function getBillingStatus(userId: string) {
  const now = new Date();
  if (billingDisabled())
    return {
      plan: "FAMILY" as const,
      status: "ACTIVE" as const,
      accessState: "ACTIVE" as const,
      interval: null,
      trialEndsAt: null,
      trialDaysLeft: 0,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasCustomer: false,
      hasSubscription: false,
      inheritedFromHousehold: false,
      entitlements: DISABLED_ENTITLEMENTS,
      prices: PLAN_PRICES_USD,
      checkoutAvailable: isStripeConfigured(),
      billingDisabled: true,
    };
  const { subscription, entitlements, inherited } = await resolve(userId);
  const state = toState(subscription);
  return {
    plan: subscription.plan,
    status: subscription.status,
    accessState: accessState(state, now),
    interval: subscription.interval,
    trialEndsAt: subscription.trial_ends_at,
    trialDaysLeft: trialDaysLeft(subscription.trial_ends_at, now),
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    hasCustomer: Boolean(subscription.stripe_customer_id),
    hasSubscription: Boolean(subscription.stripe_subscription_id),
    inheritedFromHousehold: inherited,
    entitlements,
    prices: PLAN_PRICES_USD,
    checkoutAvailable: isStripeConfigured(),
    billingDisabled: false,
  };
}

async function stripeCustomerId(
  userId: string,
  subscriptionId: string,
  existing: string | null,
) {
  if (existing) return existing;
  const user = await prisma.users.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, display_name: true },
  });
  const customer = await stripeClient().customers.create({
    email: user.email,
    name: user.display_name ?? undefined,
    metadata: { user_id: userId },
  });
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: { stripe_customer_id: customer.id },
  });
  return customer.id;
}

/** Cria a sessão de pagamento do Stripe Checkout para assinar um plano. Devolve `{ url }` para redirecionar. */
export async function createCheckout(
  userId: string,
  body: Record<string, unknown>,
) {
  if (!isPlanCode(body.plan))
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", {
      field: "plan",
    });
  const interval = body.interval ?? "MONTH";
  if (!isBillingInterval(interval))
    throw new ValidationError("VALIDATION_ERROR", "errors.invalidField", {
      field: "interval",
    });
  const price = priceIdFor(body.plan, interval);
  if (!price)
    throw new ValidationError("NOT_CONFIGURED", "errors.billing.notConfigured");
  const subscription = await ensureSubscription(userId);
  if (subscription.stripe_subscription_id && subscription.status !== "CANCELED")
    throw new ValidationError("CONFLICT", "errors.billing.useCustomerPortal");
  const customer = await stripeCustomerId(
    userId,
    subscription.id,
    subscription.stripe_customer_id,
  );
  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: userId,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { user_id: userId } },
    allow_promotion_codes: true,
    success_url: `${APP_URL}/settings?billing=success#billing`,
    cancel_url: `${APP_URL}/settings?billing=canceled#billing`,
  });
  if (!session.url)
    throw new ValidationError(
      "INTERNAL_ERROR",
      "errors.billing.checkoutFailed",
    );
  return { url: session.url };
}

/** Portal do cliente do Stripe: trocar plano e cartão, ver faturas, cancelar. */
export async function createPortal(userId: string) {
  const subscription = await ensureSubscription(userId);
  if (!subscription.stripe_customer_id)
    throw new ValidationError(
      "RESOURCE_NOT_FOUND",
      "errors.billing.noCustomer",
    );
  const session = await stripeClient().billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${APP_URL}/settings#billing`,
  });
  return { url: session.url };
}

/** Atualiza a assinatura local a partir do objeto do Stripe. Dono: `metadata.user_id`, senão cliente ou assinatura já gravados. */
export async function syncStripeSubscription(sub: Stripe.Subscription) {
  const update = subscriptionUpdate(sub);
  if (!update) return false;
  const metaUser = sub.metadata?.user_id;
  const row = await prisma.subscriptions.findFirst({
    where: {
      OR: [
        ...(metaUser ? [{ user_id: metaUser }] : []),
        { stripe_customer_id: update.customerId },
        { stripe_subscription_id: update.subscriptionId },
      ],
    },
    select: { id: true },
  });
  if (!row) return false;
  await prisma.subscriptions.update({
    where: { id: row.id },
    data: {
      plan: update.plan,
      interval: update.interval,
      status: update.status,
      current_period_end: update.currentPeriodEnd,
      cancel_at_period_end: update.cancelAtPeriodEnd,
      stripe_customer_id: update.customerId,
      stripe_subscription_id: update.subscriptionId,
    },
  });
  return true;
}

/**
 * Webhook do Stripe (já verificado pela assinatura). Idempotente por `event.id`; se o processamento falha, o registro é
 * removido para o Stripe poder reenviar.
 */
export async function handleStripeEvent(event: Stripe.Event) {
  try {
    await prisma.billing_events.create({
      data: { stripe_event_id: event.id, type: event.type.slice(0, 80) },
    });
  } catch (error) {
    if ((error as Prisma.PrismaClientKnownRequestError).code === "P2002")
      return { duplicate: true };
    throw error;
  }
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subscriptionId)
          await syncStripeSubscription(
            await stripeClient().subscriptions.retrieve(subscriptionId),
          );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    await prisma.billing_events.deleteMany({
      where: { stripe_event_id: event.id },
    });
    throw error;
  }
  return { duplicate: false };
}

/** Exclusão de conta: encerra a assinatura e apaga o cliente no Stripe (melhor esforço; falha não trava a anonimização). */
export async function cancelBillingForDeletion(userId: string) {
  const subscription = await prisma.subscriptions.findUnique({
    where: { user_id: userId },
  });
  if (!subscription || !isStripeConfigured()) return;
  try {
    const stripe = stripeClient();
    if (subscription.stripe_subscription_id)
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    if (subscription.stripe_customer_id)
      await stripe.customers.del(subscription.stripe_customer_id);
  } catch (error) {
    logError("billing-deletion", error);
  }
}
