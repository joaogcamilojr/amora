/** Planos, preços de referência e regras de acesso (puro, sem Prisma). Regras definidas pelo produto: ver docs/product.md. */
export const PLAN_CODES = ["START", "PREMIUM", "FAMILY"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];
export const BILLING_INTERVALS = ["MONTH", "YEAR"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED";

export const TRIAL_DAYS = 14;
/** Plano liberado durante o teste. */
export const TRIAL_PLAN: PlanCode = "PREMIUM";
export const START_MAX_ACTIVE_ACCOUNTS = 5;
export const FAMILY_MAX_MEMBERS = 6;

/**
 * Preços em USD só para exibir. O valor cobrado vem do preço do Stripe (IDs em variáveis de ambiente);
 * mantenha os dois iguais. Anual = 10 × mensal (2 meses grátis).
 */
export const PLAN_PRICES_USD: Record<
  PlanCode,
  Record<BillingInterval, number>
> = {
  START: { MONTH: 4, YEAR: 40 },
  PREMIUM: { MONTH: 8, YEAR: 80 },
  FAMILY: { MONTH: 14, YEAR: 140 },
};

export interface SubscriptionState {
  plan: PlanCode;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
}

/**
 * TRIAL: teste em curso. ACTIVE/PAST_DUE: assinatura (PAST_DUE segue com acesso enquanto o Stripe tenta cobrar de novo).
 * GRACE: cancelada, mas paga até o fim do período. EXPIRED: teste acabou ou assinatura encerrada (somente leitura).
 */
export type AccessState = "TRIAL" | "ACTIVE" | "PAST_DUE" | "GRACE" | "EXPIRED";

export function accessState(s: SubscriptionState, now: Date): AccessState {
  if (s.status === "ACTIVE") return "ACTIVE";
  if (s.status === "PAST_DUE") return "PAST_DUE";
  if (s.status === "TRIALING")
    return s.trialEndsAt && s.trialEndsAt > now ? "TRIAL" : "EXPIRED";
  return s.currentPeriodEnd && s.currentPeriodEnd > now ? "GRACE" : "EXPIRED";
}

export interface Entitlements {
  /** Sem isto o app é somente leitura (exportação, preferências, cobrança e exclusão continuam). */
  canWrite: boolean;
  /** `null` = sem limite. */
  maxActiveAccounts: number | null;
  /** Mais de uma moeda (contas, bens e lançamentos fora da moeda-base). */
  multiCurrency: boolean;
  /** Cotações automáticas do provedor; cotação manual vale em qualquer plano. */
  autoFx: boolean;
  /** Criar e administrar grupo familiar. */
  household: boolean;
  maxHouseholdMembers: number;
}

const BY_PLAN: Record<PlanCode, Omit<Entitlements, "canWrite">> = {
  START: {
    maxActiveAccounts: START_MAX_ACTIVE_ACCOUNTS,
    multiCurrency: false,
    autoFx: false,
    household: false,
    maxHouseholdMembers: 0,
  },
  PREMIUM: {
    maxActiveAccounts: null,
    multiCurrency: true,
    autoFx: true,
    household: false,
    maxHouseholdMembers: 0,
  },
  FAMILY: {
    maxActiveAccounts: null,
    multiCurrency: true,
    autoFx: true,
    household: true,
    maxHouseholdMembers: FAMILY_MAX_MEMBERS,
  },
};

export function entitlementsFor(s: SubscriptionState, now: Date): Entitlements {
  const state = accessState(s, now);
  const plan = state === "TRIAL" ? TRIAL_PLAN : s.plan;
  return { ...BY_PLAN[plan], canWrite: state !== "EXPIRED" };
}

const RANK: Record<PlanCode, number> = { START: 0, PREMIUM: 1, FAMILY: 2 };

/** Quem está num grupo familiar cujo criador tem a Família ativa herda os benefícios dela; vale o melhor dos dois. */
export function withInherited(
  own: Entitlements,
  inherited: Entitlements | null,
): Entitlements {
  if (!inherited?.canWrite || !inherited.household) return own;
  const family = BY_PLAN.FAMILY;
  return {
    canWrite: true,
    maxActiveAccounts:
      own.canWrite && own.maxActiveAccounts === null
        ? null
        : family.maxActiveAccounts,
    multiCurrency: own.multiCurrency || family.multiCurrency,
    autoFx: own.autoFx || family.autoFx,
    household: own.household || family.household,
    maxHouseholdMembers: Math.max(
      own.maxHouseholdMembers,
      family.maxHouseholdMembers,
    ),
  };
}

export function isPlanCode(value: unknown): value is PlanCode {
  return (
    typeof value === "string" &&
    (PLAN_CODES as readonly string[]).includes(value)
  );
}
export function isBillingInterval(value: unknown): value is BillingInterval {
  return (
    typeof value === "string" &&
    (BILLING_INTERVALS as readonly string[]).includes(value)
  );
}
export const planRank = (plan: PlanCode) => RANK[plan];

export function trialDaysLeft(trialEndsAt: Date | null, now: Date) {
  if (!trialEndsAt || trialEndsAt <= now) return 0;
  return Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000);
}
