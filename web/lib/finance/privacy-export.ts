import { camelize } from "@/lib/case";
import { prisma } from "@/lib/prisma";
import { num, toCsv } from "@/lib/privacy/csv";
import {
  formatCanonicalInstantAsCivilDate as civil,
  ValidationError,
} from "@/lib/validation";

export const EXPORT_FORMATS = ["json", "csv"] as const;
export const CSV_DATASETS = ["transactions", "accounts"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type CsvDataset = (typeof CSV_DATASETS)[number];

/** Limite por hora, para a exportação não virar varredura do banco. */
const MAX_EXPORTS_PER_HOUR = 5;

/**
 * Tudo o que pertence ao usuário: perfil, contas próprias (com saldos, cartão, faturas), lançamentos delas ou criados
 * por ele (inclusive excluídos logicamente), categorias, regras, recorrentes, bens, viagens, lotes de importação,
 * cotações informadas por ele, os grupos de que participa e o plano (sem IDs do Stripe). Fora: tokens, sessões, códigos
 * de login e dados de terceiros (e-mails de convites, nomes de outros membros).
 */
async function loadUserData(userId: string) {
  const ownedAccount = { account: { owner_id: userId } };
  const [
    user,
    accounts,
    transactions,
    categories,
    rules,
    recurring,
    holdings,
    trips,
    batches,
    rates,
    memberships,
    subscription,
    consents,
  ] = await Promise.all([
    prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        display_name: true,
        locale: true,
        timezone: true,
        country_code: true,
        created_at: true,
        onboarded_at: true,
        base_asset: { select: { code: true } },
      },
    }),
    prisma.accounts.findMany({
      where: { owner_id: userId },
      orderBy: { created_at: "asc" },
      include: {
        balances: { include: { asset: { select: { code: true } } } },
        card_profile: true,
        yield_configurations: true,
        card_statements: true,
      },
    }),
    prisma.ledger_transactions.findMany({
      where: { OR: [ownedAccount, { created_by_user_id: userId }] },
      orderBy: [{ occurred_at: "asc" }, { created_at: "asc" }],
      include: {
        entries: { include: { asset: { select: { code: true } } } },
        fx_conversion: true,
        category: { select: { slug: true, name: true } },
        account: { select: { name: true } },
      },
    }),
    prisma.categories.findMany({
      where: { owner_id: userId },
      orderBy: { created_at: "asc" },
    }),
    prisma.classification_rules.findMany({
      where: { owner_id: userId },
      orderBy: { priority: "asc" },
    }),
    prisma.recurring_items.findMany({ where: { owner_id: userId } }),
    prisma.holdings.findMany({ where: { owner_id: userId } }),
    prisma.trips.findMany({ where: { owner_id: userId } }),
    prisma.import_batches.findMany({ where: { owner_id: userId } }),
    prisma.exchange_rates.findMany({
      where: { owner_id: userId },
      include: {
        from_asset: { select: { code: true } },
        to_asset: { select: { code: true } },
      },
    }),
    prisma.household_members.findMany({
      where: { user_id: userId },
      select: {
        role: true,
        created_at: true,
        household: { select: { name: true, archived_at: true } },
      },
    }),
    prisma.subscriptions.findUnique({
      where: { user_id: userId },
      select: {
        plan: true,
        status: true,
        interval: true,
        trial_ends_at: true,
        current_period_end: true,
        cancel_at_period_end: true,
        created_at: true,
      },
    }),
    prisma.consents.findMany({
      where: { user_id: userId },
      orderBy: { accepted_at: "asc" },
      select: { kind: true, version: true, locale: true, accepted_at: true },
    }),
  ]);
  return {
    user,
    accounts,
    transactions,
    categories,
    rules,
    recurring,
    holdings,
    trips,
    batches,
    rates,
    memberships,
    subscription,
    consents,
  };
}

type UserData = Awaited<ReturnType<typeof loadUserData>>;

function toJson(data: UserData) {
  const { user, ...rest } = data;
  return JSON.stringify(
    camelize({
      exportedAt: new Date().toISOString(),
      note: "Valores originais por moeda são o fato; conversões para a moeda-base são visão calculada.",
      profile: {
        ...user,
        base_asset: undefined,
        base_currency: user.base_asset?.code ?? null,
      },
      accounts: rest.accounts,
      transactions: rest.transactions,
      categories: rest.categories,
      classification_rules: rest.rules,
      recurring_items: rest.recurring,
      holdings: rest.holdings,
      trips: rest.trips,
      import_batches: rest.batches,
      exchange_rates: rest.rates,
      households: rest.memberships,
      subscription: rest.subscription,
      consents: rest.consents,
    }),
    null,
    2,
  );
}

/** Uma linha por perna do lançamento; valor com sinal na moeda da conta (crédito +, débito −). */
function transactionsCsv(data: UserData) {
  const rows = data.transactions.flatMap((tx) =>
    tx.entries.map((e) => [
      civil(tx.occurred_at),
      tx.type,
      tx.status,
      tx.description,
      tx.counterparty,
      data.accounts.find((a) => a.id === e.account_id)?.name ??
        tx.account?.name ??
        null,
      num(
        e.direction === "DEBIT"
          ? `-${e.amount.toString()}`
          : e.amount.toString(),
      ),
      e.asset.code,
      tx.category?.name ?? null,
      tx.tags.join(";"),
      tx.notes,
      tx.deleted_at,
      tx.id,
    ]),
  );
  return toCsv(
    [
      "date",
      "type",
      "status",
      "description",
      "counterparty",
      "account",
      "amount",
      "currency",
      "category",
      "tags",
      "notes",
      "deleted_at",
      "id",
    ],
    rows,
  );
}

function accountsCsv(data: UserData) {
  const rows = data.accounts.flatMap((a) =>
    a.balances.map((b) => [
      a.name,
      a.type,
      a.status,
      a.institution_name,
      a.country_code,
      b.asset.code,
      num(b.current_balance.toString()),
      a.include_in_net_worth,
      a.archived_at,
      a.id,
    ]),
  );
  return toCsv(
    [
      "account",
      "type",
      "status",
      "institution",
      "country",
      "currency",
      "balance",
      "include_in_net_worth",
      "archived_at",
      "id",
    ],
    rows,
  );
}

export async function exportUserData(
  userId: string,
  format: ExportFormat,
  dataset: CsvDataset,
) {
  const since = new Date(Date.now() - 3_600_000);
  const recent = await prisma.privacy_requests.count({
    where: { user_id: userId, type: "EXPORT", requested_at: { gte: since } },
  });
  if (recent >= MAX_EXPORTS_PER_HOUR)
    throw new ValidationError("RATE_LIMITED", "errors.privacy.exportLimit");
  const data = await loadUserData(userId);
  await prisma.privacy_requests.create({
    data: {
      user_id: userId,
      type: "EXPORT",
      status: "COMPLETED",
      processed_at: new Date(),
    },
  });
  const day = new Date().toISOString().slice(0, 10);
  if (format === "json")
    return {
      body: toJson(data),
      contentType: "application/json; charset=utf-8",
      fileName: `amora-export-${day}.json`,
    };
  return {
    body: dataset === "accounts" ? accountsCsv(data) : transactionsCsv(data),
    contentType: "text/csv; charset=utf-8",
    fileName: `amora-${dataset}-${day}.csv`,
  };
}
