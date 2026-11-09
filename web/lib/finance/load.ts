import { AccountMemberRole, type Prisma } from "@prisma/client";

import {
  accountAccessWhere,
  accountRoleInclude,
  resolveAccountRole,
} from "@/lib/auth/access";
import { FALLBACK_BASE_CURRENCY } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { formatCanonicalInstantAsCivilDate as civil } from "@/lib/validation";

import { getEntitlements } from "./billing";
import {
  buildFx,
  toBase,
  type FxMeta,
  type FxRateInput,
  type FxResult,
  type FxTable,
} from "./fx";
import type {
  AccountView,
  CategoryView,
  HoldingView,
  Movement,
  RecurringView,
  StatementView,
  TripView,
} from "./types";

/** Cotação de provedor mais velha que isso (em dias) aparece como desatualizada. */
const FX_STALE_DAYS = 3;
const fxAgeDays = (date: string) =>
  (Date.now() - new Date(`${date}T00:00:00Z`).getTime()) / 86_400_000;

type NamedMember = {
  display_name: string | null;
  user: { display_name: string | null } | null;
};

/** Nome do titular: nome informado no grupo ou nome de exibição do usuário (nunca o e-mail). */
const memberName = (m: NamedMember | null) =>
  m ? (m.display_name ?? m.user?.display_name ?? null) : null;

const num = (value: Prisma.Decimal | null | undefined) =>
  value == null ? null : Number(value.toString());

/** Contas que o usuário pode ver (dono, vínculo direto ou membro do grupo familiar). */
export function accessibleAccounts(userId: string): Prisma.accountsWhereInput {
  return accountAccessWhere(userId);
}

/**
 * Workspace ativo do usuário: id do household se ele ainda for membro de um grupo não arquivado.
 * Nulo = sem filtro (todas as contas acessíveis).
 */
export async function activeHouseholdId(
  userId: string,
): Promise<string | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { active_household_id: true },
  });
  if (!user?.active_household_id) return null;
  const member = await prisma.household_members.findFirst({
    where: {
      household_id: user.active_household_id,
      user_id: userId,
      household: { archived_at: null },
    },
    select: { id: true },
  });
  return member ? user.active_household_id : null;
}

/** Moeda-base do usuário (Preferências). Sem escolha, usa a moeda neutra de fallback. */
export async function baseAsset(
  userId: string,
): Promise<{ id: string | null; code: string; countryCode: string | null }> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: { base_asset: true },
  });
  const countryCode = user?.country_code ?? null;
  return user?.base_asset
    ? { id: user.base_asset.id, code: user.base_asset.code, countryCode }
    : { id: null, code: FALLBACK_BASE_CURRENCY, countryCode };
}

export async function baseAssetCode(userId: string): Promise<string> {
  return (await baseAsset(userId)).code;
}

/** Cotações que valem para o usuário: as dele (manual/fatura/extrato) e as de provedor. Nunca as de outros usuários. */
export async function loadFx(
  baseCode: string,
  userId: string,
): Promise<FxResult> {
  const query = (where: Prisma.exchange_ratesWhereInput) =>
    prisma.exchange_rates.findMany({
      where: { stale: false, ...where },
      orderBy: { provider_timestamp: "desc" },
      distinct: ["from_asset_id", "to_asset_id"],
      include: { from_asset: true, to_asset: true },
    });
  // Cotação automática só nos planos que a incluem; a manual do usuário vale em qualquer plano.
  const { autoFx } = await getEntitlements(userId);
  const [own, provider] = await Promise.all([
    query({ source: { not: "PROVIDER" }, owner_id: userId }),
    autoFx ? query({ source: "PROVIDER" }) : Promise.resolve([]),
  ]);
  const input =
    (origin: FxRateInput["origin"]) =>
    (r: (typeof own)[number]): FxRateInput => ({
      fromCode: r.from_asset.code,
      toCode: r.to_asset.code,
      rate: Number(r.rate),
      at: r.provider_timestamp,
      origin,
    });
  return buildFx(baseCode, [
    ...provider.map(input("PROVIDER")),
    ...own.map(input("USER")),
  ]);
}

export async function loadFxTable(
  baseCode: string,
  userId: string,
): Promise<FxTable> {
  return (await loadFx(baseCode, userId)).table;
}

/**
 * Carrega tudo o que as telas financeiras precisam para um usuário.
 * Escala pessoal/familiar (milhares de lançamentos): a análise acontece em memória.
 */
export interface LoadOptions {
  /** Filtro por titular: id de um membro do grupo ou `none` (sem titular). Ids que o usuário não enxerga são ignorados. */
  holder?: string;
}

/** Titulares que o usuário pode escolher: membros (com ou sem login) dos grupos ativos de que ele participa. */
export async function holderOptions(userId: string) {
  const members = await prisma.household_members.findMany({
    where: {
      household: { archived_at: null, members: { some: { user_id: userId } } },
    },
    select: {
      id: true,
      display_name: true,
      user: { select: { display_name: true } },
    },
    orderBy: { created_at: "asc" },
  });
  return members.map((m) => ({ id: m.id, name: memberName(m) }));
}

export async function loadFinance(userId: string, options: LoadOptions = {}) {
  const {
    id: baseAssetId,
    code: baseCode,
    countryCode: homeCountry,
  } = await baseAsset(userId);
  const { table: fx, meta: fxMeta } = await loadFx(baseCode, userId);
  const householdId = await activeHouseholdId(userId);
  const holders = await holderOptions(userId);
  const holder =
    options.holder === "none" || holders.some((h) => h.id === options.holder)
      ? options.holder
      : undefined;
  const holderWhere: Prisma.accountsWhereInput | null = !holder
    ? null
    : holder === "none"
      ? { holder_member_id: null }
      : { holder_member_id: holder };
  const scoped: Prisma.accountsWhereInput = {
    AND: [
      accessibleAccounts(userId),
      ...(householdId ? [{ household_id: householdId }] : []),
      ...(holderWhere ? [holderWhere] : []),
    ],
  };

  const [
    accountRows,
    transactionRows,
    categoryRows,
    statementRows,
    recurringRows,
    holdingRows,
    tripRows,
  ] = await Promise.all([
    prisma.accounts.findMany({
      where: scoped,
      include: {
        balances: { include: { asset: true } },
        card_profile: true,
        ...accountRoleInclude(userId),
        holder_member: {
          select: {
            display_name: true,
            user: { select: { display_name: true } },
          },
        },
        yield_configurations: { where: { active: true } },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.ledger_transactions.findMany({
      where: {
        deleted_at: null,
        entries: { some: { account: scoped } },
      },
      include: {
        entries: { include: { asset: true } },
        card_statement: true,
        base_asset: { select: { code: true } },
      },
      orderBy: [{ occurred_at: "desc" }, { created_at: "desc" }],
    }),
    prisma.categories.findMany({
      where: { owner_id: userId, archived_at: null },
      orderBy: { name: "asc" },
    }),
    prisma.card_statements.findMany({
      where: { account: scoped },
      orderBy: { reference_month: "asc" },
    }),
    prisma.recurring_items.findMany({
      where: { owner_id: userId },
      include: { asset: true },
    }),
    prisma.holdings.findMany({
      where: {
        owner_id: userId,
        archived_at: null,
        ...(holder
          ? { holder_member_id: holder === "none" ? null : holder }
          : {}),
      },
      include: {
        asset: true,
        holder_member: {
          select: {
            display_name: true,
            user: { select: { display_name: true } },
          },
        },
      },
    }),
    prisma.trips.findMany({
      where: { owner_id: userId },
      orderBy: { starts_on: "desc" },
    }),
  ]);

  const movements: Movement[] = [];
  for (const t of transactionRows) {
    // base_amount gravado só vale se foi gravado na moeda-base atual (o usuário pode trocar em Preferências).
    const baseAbs =
      t.base_asset_id && t.base_asset_id === baseAssetId
        ? num(t.base_amount)
        : null;
    for (const entry of t.entries) {
      const sign = entry.direction === "CREDIT" ? 1 : -1;
      const amount = sign * Number(entry.amount);
      const other = t.entries.find((e) => e.account_id !== entry.account_id);
      movements.push({
        id: entry.id,
        transactionId: t.id,
        date: civil(t.occurred_at),
        accountId: entry.account_id,
        assetCode: entry.asset.code,
        amount,
        // baseAmount gravado vale para o fato todo; em câmbio cada perna converte pela própria moeda.
        baseAmount:
          baseAbs != null && t.type !== "EXCHANGE"
            ? sign * baseAbs
            : toBase(amount, entry.asset.code, fx),
        type: t.type,
        status: t.status,
        categoryId: t.category_id,
        description: t.description,
        originalDescription: t.original_description,
        tags: t.tags,
        installment:
          t.installment_number && t.installment_count
            ? {
                number: t.installment_number,
                count: t.installment_count,
                purchaseDate: civil(t.purchase_date ?? t.occurred_at),
                groupId: t.installment_group_id,
              }
            : null,
        statementMonth: t.card_statement?.reference_month ?? null,
        counterpartAccountId: other?.account_id ?? null,
        fxFeeBase:
          t.base_asset_id === baseAssetId
            ? (num(t.fx_fee_base_amount) ?? 0)
            : t.base_asset && t.fx_fee_base_amount != null
              ? (toBase(num(t.fx_fee_base_amount)!, t.base_asset.code, fx) ?? 0)
              : 0,
      });
    }
  }

  const visibleIds = new Set(accountRows.map((a) => a.id));
  const ownMovements = movements.filter((m) => visibleIds.has(m.accountId));
  const lastByAccount = new Map<string, string>();
  for (const m of ownMovements) {
    if (m.type === "OPENING_BALANCE") continue;
    const current = lastByAccount.get(m.accountId);
    if (!current || m.date > current) lastByAccount.set(m.accountId, m.date);
  }

  const accounts: AccountView[] = accountRows.map((a) => {
    const role = resolveAccountRole(userId, a);
    const yieldConfig = a.yield_configurations[0];
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      status: a.status,
      institutionName: a.institution_name,
      countryCode: a.country_code,
      holderName: memberName(a.holder_member) ?? a.holder_name,
      householdId: a.household_id,
      holderMemberId: a.holder_member_id,
      notes: a.notes,
      includeInNetWorth: a.include_in_net_worth,
      isOwner: a.owner_id === userId,
      canPost:
        role === AccountMemberRole.OWNER ||
        role === AccountMemberRole.TRANSACTION_MANAGER,
      card: a.card_profile
        ? {
            closingDay: a.card_profile.closing_day,
            dueDay: a.card_profile.due_day,
            creditLimit: num(a.card_profile.credit_limit),
            cashbackRate: num(a.card_profile.cashback_rate) ?? 0,
            paymentAccountId: a.card_profile.payment_account_id,
            lastFour: a.card_profile.last_four,
            type: a.card_profile.type,
            brand: a.card_profile.brand,
            limitAssetId: a.card_profile.limit_asset_id,
          }
        : null,
      balances: a.balances
        .map((b) => {
          const current = Number(b.current_balance);
          return {
            id: b.id,
            asset: {
              id: b.asset.id,
              code: b.asset.code,
              symbol: b.asset.symbol,
              decimals: b.asset.decimals,
            },
            current,
            base: toBase(current, b.asset.code, fx),
          };
        })
        .sort((x, y) =>
          x.asset.code === baseCode
            ? -1
            : y.asset.code === baseCode
              ? 1
              : x.asset.code.localeCompare(y.asset.code),
        ),
      monthlyYieldRate: num(yieldConfig?.monthly_rate),
      annualYieldRate: num(yieldConfig?.annual_rate),
      lastMovementDate: lastByAccount.get(a.id) ?? null,
    };
  });

  const categories: CategoryView[] = categoryRows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    kind: c.kind,
  }));

  const statements: StatementView[] = statementRows.map((s) => ({
    id: s.id,
    accountId: s.account_id,
    month: s.reference_month,
    closingDate: civil(s.closing_date),
    dueDate: civil(s.due_date),
    total: num(s.total_amount),
    source: s.source,
  }));

  const recurring: RecurringView[] = recurringRows.map((r) => ({
    id: r.id,
    description: r.description,
    kind: r.kind,
    categoryId: r.category_id,
    accountId: r.account_id,
    assetCode: r.asset.code,
    amount: Number(r.amount),
    frequency: r.frequency,
    dayOfMonth: r.day_of_month,
    monthOfYear: r.month_of_year,
    variableDay: r.variable_day,
    active: r.active,
    notes: r.notes,
  }));

  const holdings: HoldingView[] = holdingRows.map((h) => {
    const value = Number(h.value);
    return {
      id: h.id,
      name: h.name,
      class: h.class,
      assetCode: h.asset.code,
      value,
      base: toBase(value, h.asset.code, fx),
      quantity: num(h.quantity),
      ticker: h.ticker,
      countryCode: h.country_code,
      holderName: memberName(h.holder_member) ?? h.holder_name,
      holderMemberId: h.holder_member_id,
      valuedAt: civil(h.valued_at),
    };
  });

  const trips: TripView[] = tripRows.map((t) => ({
    id: t.id,
    name: t.name,
    tag: t.tag,
    startsOn: t.starts_on ? civil(t.starts_on) : null,
    endsOn: t.ends_on ? civil(t.ends_on) : null,
    countryCodes: t.country_codes,
  }));

  const months = [
    ...new Set(ownMovements.map((m) => m.date.slice(0, 7))),
  ].sort();

  return {
    baseCode,
    homeCountry,
    holders,
    holder: holder ?? null,
    fx,
    fxSources: Object.fromEntries(
      [...fxMeta].map(([code, m]) => [
        code,
        {
          ...m,
          stale: m.source === "PROVIDER" && fxAgeDays(m.date) > FX_STALE_DAYS,
        },
      ]),
    ) as Record<string, FxMeta & { stale: boolean }>,
    accounts,
    movements: ownMovements,
    categories,
    statements,
    recurring,
    holdings,
    trips,
    months,
  };
}

export type FinanceData = Awaited<ReturnType<typeof loadFinance>>;
