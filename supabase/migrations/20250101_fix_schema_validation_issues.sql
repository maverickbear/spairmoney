-- Migration: Fix Schema Validation Issues
-- Date: 2025-01-01
-- Description: Corrige problemas de validação identificados no schema_reference.sql
-- Reference: docs/SCHEMA_VALIDATION_REPORT.md

-- ============================================================================
-- FIX 1: Adicionar constraint CHECK para HouseholdMember.status
-- ============================================================================

DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'HouseholdMember_status_check'
  ) THEN
    ALTER TABLE "public"."HouseholdMember"
      ADD CONSTRAINT "HouseholdMember_status_check" 
      CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'declined'::"text"])));
    
    RAISE NOTICE 'Added HouseholdMember_status_check constraint';
  ELSE
    RAISE NOTICE 'HouseholdMember_status_check constraint already exists';
  END IF;
END $$;

-- ============================================================================
-- FIX 2: Adicionar constraint CHECK para Account.type
-- ============================================================================

DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'Account_type_check'
  ) THEN
    ALTER TABLE "public"."Account"
      ADD CONSTRAINT "Account_type_check" 
      CHECK (("type" = ANY (ARRAY['cash'::"text", 'checking'::"text", 'savings'::"text", 'credit'::"text", 'investment'::"text", 'other'::"text"])));
    
    RAISE NOTICE 'Added Account_type_check constraint';
  ELSE
    RAISE NOTICE 'Account_type_check constraint already exists';
  END IF;
END $$;

-- ============================================================================
-- FIX 3: Corrigir índice de HouseholdMember.status (de 'accepted' para 'active')
-- ============================================================================

DO $$
BEGIN
  -- Remover índice antigo se existir
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_householdmember_memberid_status'
  ) THEN
    DROP INDEX IF EXISTS "public"."idx_householdmember_memberid_status";
    RAISE NOTICE 'Dropped old idx_householdmember_memberid_status index';
  END IF;
  
  -- Criar novo índice com status correto
  CREATE INDEX IF NOT EXISTS "idx_householdmember_memberid_status" 
    ON "public"."HouseholdMember" USING "btree" ("memberId", "status") 
    WHERE ("status" = 'active'::"text");
  
  RAISE NOTICE 'Created idx_householdmember_memberid_status index with active status';
END $$;

-- ============================================================================
-- FIX 4: Atualizar holdings_view para filtrar apenas contas de investimento
-- ============================================================================

-- Primeiro, remover a view materializada existente
DROP MATERIALIZED VIEW IF EXISTS "public"."holdings_view" CASCADE;

-- Recriar a view com o filtro correto
CREATE MATERIALIZED VIEW "public"."holdings_view" AS
 WITH "transaction_agg" AS (
         SELECT "it"."securityId",
            "it"."accountId",
            "a_1"."userId",
            "sum"(
                CASE
                    WHEN ("it"."type" = 'buy'::"text") THEN COALESCE("it"."quantity", (0)::double precision)
                    ELSE (0)::double precision
                END) AS "total_buy_qty",
            "sum"(
                CASE
                    WHEN ("it"."type" = 'sell'::"text") THEN COALESCE("it"."quantity", (0)::double precision)
                    ELSE (0)::double precision
                END) AS "total_sell_qty",
            "sum"(
                CASE
                    WHEN ("it"."type" = 'buy'::"text") THEN ((COALESCE("it"."quantity", (0)::double precision) * COALESCE("it"."price", (0)::double precision)) + COALESCE("it"."fees", (0)::double precision))
                    WHEN ("it"."type" = 'sell'::"text") THEN (- ((COALESCE("it"."quantity", (0)::double precision) * COALESCE("it"."price", (0)::double precision)) - COALESCE("it"."fees", (0)::double precision)))
                    ELSE (0)::double precision
                END) AS "book_value"
           FROM ("public"."InvestmentTransaction" "it"
             JOIN "public"."Account" "a_1" ON (("a_1"."id" = "it"."accountId") AND ("a_1"."type" = 'investment'::"text")))
          WHERE (("it"."securityId" IS NOT NULL) AND ("a_1"."userId" IS NOT NULL))
          GROUP BY "it"."securityId", "it"."accountId", "a_1"."userId"
        ), "security_latest_price" AS (
         SELECT DISTINCT ON ("SecurityPrice"."securityId") "SecurityPrice"."securityId",
            "SecurityPrice"."price" AS "last_price",
            "SecurityPrice"."date" AS "last_price_date"
           FROM "public"."SecurityPrice"
          ORDER BY "SecurityPrice"."securityId", "SecurityPrice"."date" DESC
        )
 SELECT "ta"."securityId" AS "security_id",
    "ta"."accountId" AS "account_id",
    "ta"."userId" AS "user_id",
    "s"."symbol",
    "s"."name",
    "s"."class" AS "asset_type",
    COALESCE("s"."sector", 'Unknown'::"text") AS "sector",
    ("ta"."total_buy_qty" - "ta"."total_sell_qty") AS "quantity",
        CASE
            WHEN (("ta"."total_buy_qty" - "ta"."total_sell_qty") > (0)::double precision) THEN ("ta"."book_value" / ("ta"."total_buy_qty" - "ta"."total_sell_qty"))
            ELSE (0)::double precision
        END AS "avg_price",
    "ta"."book_value",
    COALESCE("sp"."last_price", (0)::double precision) AS "last_price",
    (("ta"."total_buy_qty" - "ta"."total_sell_qty") * COALESCE("sp"."last_price", (0)::double precision)) AS "market_value",
    ((("ta"."total_buy_qty" - "ta"."total_sell_qty") * COALESCE("sp"."last_price", (0)::double precision)) - "ta"."book_value") AS "unrealized_pnl",
        CASE
            WHEN ("ta"."book_value" > (0)::double precision) THEN ((((("ta"."total_buy_qty" - "ta"."total_sell_qty") * COALESCE("sp"."last_price", (0)::double precision)) - "ta"."book_value") / "ta"."book_value") * (100)::double precision)
            ELSE (0)::double precision
        END AS "unrealized_pnl_percent",
    "a"."name" AS "account_name",
    "sp"."last_price_date",
    "now"() AS "last_updated"
   FROM ((("transaction_agg" "ta"
     JOIN "public"."Security" "s" ON (("s"."id" = "ta"."securityId")))
     LEFT JOIN "security_latest_price" "sp" ON (("sp"."securityId" = "ta"."securityId")))
     LEFT JOIN "public"."Account" "a" ON (("a"."id" = "ta"."accountId")))
  WHERE (("ta"."total_buy_qty" - "ta"."total_sell_qty") > (0)::double precision)
  WITH NO DATA;

-- Restaurar owner e comentário
ALTER MATERIALIZED VIEW "public"."holdings_view" OWNER TO "postgres";

COMMENT ON MATERIALIZED VIEW "public"."holdings_view" IS 'View materializada que calcula holdings atuais de forma otimizada. Refresh automático via trigger. Filtra apenas contas do tipo investment.';

-- Recriar índices da view
CREATE INDEX IF NOT EXISTS "idx_holdings_view_account" ON "public"."holdings_view" USING "btree" ("account_id");
CREATE INDEX IF NOT EXISTS "idx_holdings_view_security" ON "public"."holdings_view" USING "btree" ("security_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_holdings_view_unique" ON "public"."holdings_view" USING "btree" ("user_id", "security_id", "account_id");
CREATE INDEX IF NOT EXISTS "idx_holdings_view_user" ON "public"."holdings_view" USING "btree" ("user_id");

-- Recriar dependências (as outras views que dependem de holdings_view)
-- asset_allocation_view
DROP MATERIALIZED VIEW IF EXISTS "public"."asset_allocation_view" CASCADE;
CREATE MATERIALIZED VIEW "public"."asset_allocation_view" AS
 WITH "user_totals" AS (
         SELECT "holdings_view"."user_id",
            "sum"("holdings_view"."market_value") AS "total_portfolio_value"
           FROM "public"."holdings_view"
          GROUP BY "holdings_view"."user_id"
        )
 SELECT "h"."user_id",
    "h"."asset_type",
    "count"(*) AS "holdings_count",
    "sum"("h"."market_value") AS "total_value",
    "sum"("h"."unrealized_pnl") AS "total_pnl",
        CASE
            WHEN ("ut"."total_portfolio_value" > (0)::double precision) THEN (("sum"("h"."market_value") / "ut"."total_portfolio_value") * (100)::double precision)
            ELSE (0)::double precision
        END AS "allocation_percent",
    "now"() AS "last_updated"
   FROM ("public"."holdings_view" "h"
     JOIN "user_totals" "ut" ON (("ut"."user_id" = "h"."user_id")))
  GROUP BY "h"."user_id", "h"."asset_type", "ut"."total_portfolio_value"
  WITH NO DATA;

ALTER MATERIALIZED VIEW "public"."asset_allocation_view" OWNER TO "postgres";
COMMENT ON MATERIALIZED VIEW "public"."asset_allocation_view" IS 'Distribuição de portfolio por tipo de ativo (Stock, ETF, etc)';

CREATE INDEX IF NOT EXISTS "idx_asset_allocation_user" ON "public"."asset_allocation_view" USING "btree" ("user_id");

-- portfolio_summary_view
DROP MATERIALIZED VIEW IF EXISTS "public"."portfolio_summary_view" CASCADE;
CREATE MATERIALIZED VIEW "public"."portfolio_summary_view" AS
 SELECT "user_id",
    "count"(*) AS "holdings_count",
    "sum"("market_value") AS "total_value",
    "sum"("book_value") AS "total_cost",
    "sum"("unrealized_pnl") AS "total_return",
        CASE
            WHEN ("sum"("book_value") > (0)::double precision) THEN (("sum"("unrealized_pnl") / "sum"("book_value")) * (100)::double precision)
            ELSE (0)::double precision
        END AS "total_return_percent",
    "now"() AS "last_updated"
   FROM "public"."holdings_view"
  GROUP BY "user_id"
  WITH NO DATA;

ALTER MATERIALIZED VIEW "public"."portfolio_summary_view" OWNER TO "postgres";
COMMENT ON MATERIALIZED VIEW "public"."portfolio_summary_view" IS 'Resumo agregado do portfolio por usuário';

CREATE UNIQUE INDEX IF NOT EXISTS "idx_portfolio_summary_user" ON "public"."portfolio_summary_view" USING "btree" ("user_id");

-- sector_allocation_view
DROP MATERIALIZED VIEW IF EXISTS "public"."sector_allocation_view" CASCADE;
CREATE MATERIALIZED VIEW "public"."sector_allocation_view" AS
 WITH "user_totals" AS (
         SELECT "holdings_view"."user_id",
            "sum"("holdings_view"."market_value") AS "total_portfolio_value"
           FROM "public"."holdings_view"
          GROUP BY "holdings_view"."user_id"
        )
 SELECT "h"."user_id",
    "h"."sector",
    "count"(*) AS "holdings_count",
    "sum"("h"."market_value") AS "total_value",
    "sum"("h"."unrealized_pnl") AS "total_pnl",
        CASE
            WHEN ("ut"."total_portfolio_value" > (0)::double precision) THEN (("sum"("h"."market_value") / "ut"."total_portfolio_value") * (100)::double precision)
            ELSE (0)::double precision
        END AS "allocation_percent",
    "now"() AS "last_updated"
   FROM ("public"."holdings_view" "h"
     JOIN "user_totals" "ut" ON (("ut"."user_id" = "h"."user_id")))
  GROUP BY "h"."user_id", "h"."sector", "ut"."total_portfolio_value"
  WITH NO DATA;

ALTER MATERIALIZED VIEW "public"."sector_allocation_view" OWNER TO "postgres";
COMMENT ON MATERIALIZED VIEW "public"."sector_allocation_view" IS 'Distribuição de portfolio por setor';

CREATE INDEX IF NOT EXISTS "idx_sector_allocation_user" ON "public"."sector_allocation_view" USING "btree" ("user_id");

-- ============================================================================
-- POPULAR AS VIEWS MATERIALIZADAS
-- ============================================================================

-- Popular holdings_view primeiro (as outras dependem dela)
REFRESH MATERIALIZED VIEW "public"."holdings_view";

-- Popular as outras views
REFRESH MATERIALIZED VIEW "public"."asset_allocation_view";
REFRESH MATERIALIZED VIEW "public"."portfolio_summary_view";
REFRESH MATERIALIZED VIEW "public"."sector_allocation_view";

-- ============================================================================
-- VERIFICAÇÕES FINAIS
-- ============================================================================

DO $$
DECLARE
  constraint_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verificar constraints
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint 
  WHERE conname IN ('HouseholdMember_status_check', 'Account_type_check');
  
  IF constraint_count = 2 THEN
    RAISE NOTICE '✓ All constraints created successfully';
  ELSE
    RAISE WARNING 'Only % constraints found (expected 2)', constraint_count;
  END IF;
  
  -- Verificar índice
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE indexname = 'idx_householdmember_memberid_status';
  
  IF index_count = 1 THEN
    RAISE NOTICE '✓ Index created successfully';
  ELSE
    RAISE WARNING 'Index not found';
  END IF;
  
  -- Verificar views
  SELECT COUNT(*) INTO index_count
  FROM pg_matviews 
  WHERE matviewname IN ('holdings_view', 'asset_allocation_view', 'portfolio_summary_view', 'sector_allocation_view');
  
  IF index_count = 4 THEN
    RAISE NOTICE '✓ All materialized views recreated successfully';
  ELSE
    RAISE WARNING 'Only % views found (expected 4)', index_count;
  END IF;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '============================================';
END $$;

