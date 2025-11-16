-- ROLLBACK: Fix Schema Validation Issues
-- Date: 2025-01-01
-- Description: Reverte as mudanças da migração 20250101_fix_schema_validation_issues.sql
-- ⚠️ USE WITH CAUTION - This will remove constraints and revert views

-- ============================================================================
-- ROLLBACK 1: Remover constraint CHECK de HouseholdMember.status
-- ============================================================================

ALTER TABLE "public"."HouseholdMember"
  DROP CONSTRAINT IF EXISTS "HouseholdMember_status_check";

-- ============================================================================
-- ROLLBACK 2: Remover constraint CHECK de Account.type
-- ============================================================================

ALTER TABLE "public"."Account"
  DROP CONSTRAINT IF EXISTS "Account_type_check";

-- ============================================================================
-- ROLLBACK 3: Reverter índice de HouseholdMember.status
-- ============================================================================

DROP INDEX IF EXISTS "public"."idx_householdmember_memberid_status";

-- Recriar índice antigo (com 'accepted' ao invés de 'active')
CREATE INDEX IF NOT EXISTS "idx_householdmember_memberid_status" 
  ON "public"."HouseholdMember" USING "btree" ("memberId", "status") 
  WHERE ("status" = 'accepted'::"text");

-- ============================================================================
-- ROLLBACK 4: Reverter holdings_view (remover filtro de Account.type)
-- ============================================================================

-- Remover views dependentes primeiro
DROP MATERIALIZED VIEW IF EXISTS "public"."asset_allocation_view" CASCADE;
DROP MATERIALIZED VIEW IF EXISTS "public"."portfolio_summary_view" CASCADE;
DROP MATERIALIZED VIEW IF EXISTS "public"."sector_allocation_view" CASCADE;
DROP MATERIALIZED VIEW IF EXISTS "public"."holdings_view" CASCADE;

-- Recriar holdings_view sem o filtro de Account.type
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
             JOIN "public"."Account" "a_1" ON (("a_1"."id" = "it"."accountId")))
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

ALTER MATERIALIZED VIEW "public"."holdings_view" OWNER TO "postgres";
COMMENT ON MATERIALIZED VIEW "public"."holdings_view" IS 'View materializada que calcula holdings atuais de forma otimizada. Refresh automático via trigger.';

-- Recriar índices
CREATE INDEX IF NOT EXISTS "idx_holdings_view_account" ON "public"."holdings_view" USING "btree" ("account_id");
CREATE INDEX IF NOT EXISTS "idx_holdings_view_security" ON "public"."holdings_view" USING "btree" ("security_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_holdings_view_unique" ON "public"."holdings_view" USING "btree" ("user_id", "security_id", "account_id");
CREATE INDEX IF NOT EXISTS "idx_holdings_view_user" ON "public"."holdings_view" USING "btree" ("user_id");

-- Recriar views dependentes
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

-- Popular as views
REFRESH MATERIALIZED VIEW "public"."holdings_view";
REFRESH MATERIALIZED VIEW "public"."asset_allocation_view";
REFRESH MATERIALIZED VIEW "public"."portfolio_summary_view";
REFRESH MATERIALIZED VIEW "public"."sector_allocation_view";

