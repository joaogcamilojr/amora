-- AlterTable
ALTER TABLE "exchange_rates" ADD COLUMN     "owner_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country_code" VARCHAR(2),
ADD COLUMN     "onboarded_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "exchange_rates_source_stale_from_asset_id_to_asset_id_provi_idx" ON "exchange_rates"("source", "stale", "from_asset_id", "to_asset_id", "provider_timestamp");

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
