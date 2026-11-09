-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('FIAT', 'CRYPTO', 'POINTS', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH_WALLET', 'BANK_ACCOUNT', 'INTERNATIONAL_ACCOUNT', 'MULTI_CURRENCY_ACCOUNT', 'BENEFIT_ACCOUNT', 'GIFT_CARD', 'DIGITAL_BALANCE', 'CRYPTO_WALLET', 'CREDIT_CARD', 'PREPAID_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AccountMemberRole" AS ENUM ('OWNER', 'VIEWER', 'TRANSACTION_MANAGER');

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('OPENING_BALANCE', 'INCOME', 'EXPENSE', 'TRANSFER', 'EXCHANGE', 'REFUND', 'ADJUSTMENT', 'FEE', 'INTEREST_INCOME', 'CARD_PAYMENT', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('POSTED', 'PENDING', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "HoldingClass" AS ENUM ('REAL_ESTATE', 'VEHICLE', 'FIXED_INCOME', 'EQUITY', 'INTERNATIONAL', 'CRYPTO', 'PENSION', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportFormat" AS ENUM ('CSV', 'OFX', 'PDF', 'IMAGE', 'MANUAL', 'LEGACY');

-- CreateEnum
CREATE TYPE "LedgerEntryDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "ExchangeRateSource" AS ENUM ('PROVIDER', 'MANUAL', 'CARD_STATEMENT', 'ACCOUNT_STATEMENT');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('CREDIT', 'DEBIT', 'PREPAID', 'BENEFIT', 'GIFT', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "YieldType" AS ENUM ('NONE', 'FIXED_RATE', 'VARIABLE_RATE', 'MANUAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "display_name" TEXT,
    "base_asset_id" TEXT,
    "active_household_id" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "replaced_by" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "decimals" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "institution_name" TEXT,
    "country_code" VARCHAR(2),
    "external_reference" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "include_in_net_worth" BOOLEAN NOT NULL DEFAULT true,
    "include_in_available_balance" BOOLEAN NOT NULL DEFAULT true,
    "holder_name" TEXT,
    "household_id" TEXT,
    "holder_member_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_balances" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "current_balance" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "available_balance" DECIMAL(38,18),
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_members" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "AccountMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_share_invitations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "invited_by_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AccountMemberRole" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token_hash" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_share_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_profiles" (
    "account_id" TEXT NOT NULL,
    "type" "CardType" NOT NULL,
    "brand" TEXT,
    "last_four" VARCHAR(4),
    "closing_day" INTEGER,
    "due_day" INTEGER,
    "credit_limit" DECIMAL(38,18),
    "limit_asset_id" TEXT,
    "cashback_rate" DECIMAL(24,12),
    "payment_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_profiles_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "yield_configurations" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" "YieldType" NOT NULL,
    "annual_rate" DECIMAL(24,12),
    "monthly_rate" DECIMAL(24,12),
    "provider_name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yield_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "type" "LedgerTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),
    "reversal_of_id" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'POSTED',
    "category_id" TEXT,
    "counterparty" TEXT,
    "original_description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "base_asset_id" TEXT,
    "base_amount" DECIMAL(38,18),
    "base_rate" DECIMAL(38,18),
    "fx_fee_base_amount" DECIMAL(38,18),
    "import_batch_id" TEXT,
    "external_id" TEXT,
    "card_statement_id" TEXT,
    "installment_group_id" TEXT,
    "installment_number" INTEGER,
    "installment_count" INTEGER,
    "purchase_date" TIMESTAMP(3),

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_balance_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "direction" "LedgerEntryDirection" NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "balance_after" DECIMAL(38,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_conversions" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "from_asset_id" TEXT NOT NULL,
    "to_asset_id" TEXT NOT NULL,
    "from_amount" DECIMAL(38,18) NOT NULL,
    "to_amount" DECIMAL(38,18) NOT NULL,
    "gross_rate" DECIMAL(38,18) NOT NULL,
    "effective_rate" DECIMAL(38,18) NOT NULL,
    "market_rate" DECIMAL(38,18),
    "spread_amount" DECIMAL(38,18),
    "spread_percentage" DECIMAL(24,12),
    "fixed_fee_amount" DECIMAL(38,18),
    "fixed_fee_asset_id" TEXT,
    "provider" TEXT,
    "source" "ExchangeRateSource" NOT NULL,
    "provider_timestamp" TIMESTAMP(3),
    "quoted_at" TIMESTAMP(3) NOT NULL,
    "settled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fx_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL,
    "account_balance_id" TEXT NOT NULL,
    "balance" DECIMAL(38,18) NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_asset_id" TEXT NOT NULL,
    "to_asset_id" TEXT NOT NULL,
    "rate" DECIMAL(38,18) NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "reference_type" VARCHAR(32) NOT NULL,
    "source" "ExchangeRateSource" NOT NULL DEFAULT 'PROVIDER',
    "provider_timestamp" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indicative" BOOLEAN NOT NULL DEFAULT true,
    "stale" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "consent_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "parent_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_rules" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "pattern" TEXT NOT NULL,
    "transaction_type" "LedgerTransactionType" NOT NULL,
    "direction" "LedgerEntryDirection",
    "category_id" TEXT,
    "counterparty" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_statements" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "reference_month" VARCHAR(7) NOT NULL,
    "closing_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "total_amount" DECIMAL(38,18),
    "asset_id" TEXT NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_items" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "account_id" TEXT,
    "category_id" TEXT,
    "asset_id" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "day_of_month" INTEGER,
    "month_of_year" INTEGER,
    "variable_day" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" "HoldingClass" NOT NULL,
    "asset_id" TEXT NOT NULL,
    "value" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18),
    "ticker" VARCHAR(32),
    "country_code" VARCHAR(2),
    "holder_name" TEXT,
    "holder_member_id" TEXT,
    "valued_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" VARCHAR(64) NOT NULL,
    "starts_on" DATE,
    "ends_on" DATE,
    "country_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "format" "ImportFormat" NOT NULL,
    "row_count" INTEGER NOT NULL,
    "imported_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT,
    "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_invitations" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "invited_by_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_hash_key" ON "auth_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_expires_at_idx" ON "auth_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_tokens_token_hash_key" ON "auth_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_user_id_expires_at_idx" ON "auth_refresh_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "auth_refresh_tokens_expires_at_idx" ON "auth_refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_expires_at_idx" ON "email_verification_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "login_codes_user_id_expires_at_idx" ON "login_codes"("user_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");

-- CreateIndex
CREATE INDEX "assets_active_type_idx" ON "assets"("active", "type");

-- CreateIndex
CREATE INDEX "accounts_owner_id_status_updated_at_idx" ON "accounts"("owner_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "accounts_owner_id_type_idx" ON "accounts"("owner_id", "type");

-- CreateIndex
CREATE INDEX "accounts_household_id_status_idx" ON "accounts"("household_id", "status");

-- CreateIndex
CREATE INDEX "accounts_holder_member_id_idx" ON "accounts"("holder_member_id");

-- CreateIndex
CREATE INDEX "account_balances_account_id_asset_id_idx" ON "account_balances"("account_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_balances_account_id_asset_id_key" ON "account_balances"("account_id", "asset_id");

-- CreateIndex
CREATE INDEX "account_members_user_id_account_id_idx" ON "account_members"("user_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_members_account_id_user_id_key" ON "account_members"("account_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_share_invitations_token_hash_key" ON "account_share_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "account_share_invitations_email_status_idx" ON "account_share_invitations"("email", "status");

-- CreateIndex
CREATE INDEX "account_share_invitations_account_id_status_idx" ON "account_share_invitations"("account_id", "status");

-- CreateIndex
CREATE INDEX "card_profiles_limit_asset_id_idx" ON "card_profiles"("limit_asset_id");

-- CreateIndex
CREATE INDEX "card_profiles_payment_account_id_idx" ON "card_profiles"("payment_account_id");

-- CreateIndex
CREATE INDEX "yield_configurations_account_id_active_idx" ON "yield_configurations"("account_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "yield_configurations_account_id_asset_id_started_at_key" ON "yield_configurations"("account_id", "asset_id", "started_at");

-- CreateIndex
CREATE INDEX "ledger_transactions_created_by_user_id_type_occurred_at_idx" ON "ledger_transactions"("created_by_user_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "ledger_transactions_account_id_occurred_at_idx" ON "ledger_transactions"("account_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ledger_transactions_category_id_occurred_at_idx" ON "ledger_transactions"("category_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ledger_transactions_account_id_external_id_idx" ON "ledger_transactions"("account_id", "external_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_card_statement_id_idx" ON "ledger_transactions"("card_statement_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_installment_group_id_idx" ON "ledger_transactions"("installment_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_created_by_user_id_idempotency_key_key" ON "ledger_transactions"("created_by_user_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "ledger_entries_account_id_asset_id_created_at_idx" ON "ledger_entries"("account_id", "asset_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_account_balance_id_created_at_idx" ON "ledger_entries"("account_balance_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_transaction_id_idx" ON "ledger_entries"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "fx_conversions_transaction_id_key" ON "fx_conversions"("transaction_id");

-- CreateIndex
CREATE INDEX "fx_conversions_from_asset_id_to_asset_id_quoted_at_idx" ON "fx_conversions"("from_asset_id", "to_asset_id", "quoted_at");

-- CreateIndex
CREATE INDEX "balance_snapshots_account_balance_id_snapshot_at_idx" ON "balance_snapshots"("account_balance_id", "snapshot_at");

-- CreateIndex
CREATE UNIQUE INDEX "balance_snapshots_account_balance_id_snapshot_at_key" ON "balance_snapshots"("account_balance_id", "snapshot_at");

-- CreateIndex
CREATE INDEX "exchange_rates_from_asset_id_to_asset_id_fetched_at_idx" ON "exchange_rates"("from_asset_id", "to_asset_id", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_asset_id_to_asset_id_provider_timestamp_key" ON "exchange_rates"("from_asset_id", "to_asset_id", "provider_timestamp", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "waitlist_entries"("email");

-- CreateIndex
CREATE INDEX "categories_owner_id_kind_idx" ON "categories"("owner_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "categories_owner_id_slug_key" ON "categories"("owner_id", "slug");

-- CreateIndex
CREATE INDEX "classification_rules_owner_id_active_priority_idx" ON "classification_rules"("owner_id", "active", "priority");

-- CreateIndex
CREATE INDEX "card_statements_account_id_due_date_idx" ON "card_statements"("account_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "card_statements_account_id_reference_month_key" ON "card_statements"("account_id", "reference_month");

-- CreateIndex
CREATE INDEX "recurring_items_owner_id_active_idx" ON "recurring_items"("owner_id", "active");

-- CreateIndex
CREATE INDEX "holdings_owner_id_class_idx" ON "holdings"("owner_id", "class");

-- CreateIndex
CREATE INDEX "holdings_holder_member_id_idx" ON "holdings"("holder_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "trips_owner_id_tag_key" ON "trips"("owner_id", "tag");

-- CreateIndex
CREATE INDEX "import_batches_owner_id_created_at_idx" ON "import_batches"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "households_created_by_user_id_idx" ON "households"("created_by_user_id");

-- CreateIndex
CREATE INDEX "household_members_user_id_household_id_idx" ON "household_members"("user_id", "household_id");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_household_id_user_id_key" ON "household_members"("household_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "household_invitations_token_hash_key" ON "household_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "household_invitations_email_status_idx" ON "household_invitations"("email", "status");

-- CreateIndex
CREATE INDEX "household_invitations_household_id_status_idx" ON "household_invitations"("household_id", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_base_asset_id_fkey" FOREIGN KEY ("base_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_active_household_id_fkey" FOREIGN KEY ("active_household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_codes" ADD CONSTRAINT "login_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_holder_member_id_fkey" FOREIGN KEY ("holder_member_id") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_share_invitations" ADD CONSTRAINT "account_share_invitations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_share_invitations" ADD CONSTRAINT "account_share_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_profiles" ADD CONSTRAINT "card_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_profiles" ADD CONSTRAINT "card_profiles_limit_asset_id_fkey" FOREIGN KEY ("limit_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_profiles" ADD CONSTRAINT "card_profiles_payment_account_id_fkey" FOREIGN KEY ("payment_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_configurations" ADD CONSTRAINT "yield_configurations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_configurations" ADD CONSTRAINT "yield_configurations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_base_asset_id_fkey" FOREIGN KEY ("base_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_card_statement_id_fkey" FOREIGN KEY ("card_statement_id") REFERENCES "card_statements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_balance_id_fkey" FOREIGN KEY ("account_balance_id") REFERENCES "account_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_conversions" ADD CONSTRAINT "fx_conversions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_conversions" ADD CONSTRAINT "fx_conversions_from_asset_id_fkey" FOREIGN KEY ("from_asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_conversions" ADD CONSTRAINT "fx_conversions_to_asset_id_fkey" FOREIGN KEY ("to_asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_conversions" ADD CONSTRAINT "fx_conversions_fixed_fee_asset_id_fkey" FOREIGN KEY ("fixed_fee_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_account_balance_id_fkey" FOREIGN KEY ("account_balance_id") REFERENCES "account_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_from_asset_id_fkey" FOREIGN KEY ("from_asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_to_asset_id_fkey" FOREIGN KEY ("to_asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_rules" ADD CONSTRAINT "classification_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_statements" ADD CONSTRAINT "card_statements_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_statements" ADD CONSTRAINT "card_statements_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_items" ADD CONSTRAINT "recurring_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_holder_member_id_fkey" FOREIGN KEY ("holder_member_id") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invitations" ADD CONSTRAINT "household_invitations_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invitations" ADD CONSTRAINT "household_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
