


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Account" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Budget" (
    "id" "text" NOT NULL,
    "period" timestamp(3) without time zone NOT NULL,
    "categoryId" "text" NOT NULL,
    "amount" double precision NOT NULL,
    "note" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Budget" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Category" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "macroId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."InvestmentAccount" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "accountId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."InvestmentAccount" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."InvestmentTransaction" (
    "id" "text" NOT NULL,
    "date" timestamp(3) without time zone NOT NULL,
    "accountId" "text" NOT NULL,
    "securityId" "text",
    "type" "text" NOT NULL,
    "quantity" double precision,
    "price" double precision,
    "fees" double precision DEFAULT 0 NOT NULL,
    "notes" "text",
    "transferToId" "text",
    "transferFromId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."InvestmentTransaction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Macro" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Macro" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Security" (
    "id" "text" NOT NULL,
    "symbol" "text" NOT NULL,
    "name" "text" NOT NULL,
    "class" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Security" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SecurityPrice" (
    "id" "text" NOT NULL,
    "securityId" "text" NOT NULL,
    "date" timestamp(3) without time zone NOT NULL,
    "price" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."SecurityPrice" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Subcategory" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "categoryId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Subcategory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Transaction" (
    "id" "text" NOT NULL,
    "date" timestamp(3) without time zone NOT NULL,
    "type" "text" NOT NULL,
    "amount" double precision NOT NULL,
    "accountId" "text" NOT NULL,
    "categoryId" "text",
    "subcategoryId" "text",
    "description" "text",
    "tags" "text" DEFAULT ''::"text" NOT NULL,
    "transferToId" "text",
    "transferFromId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Transaction" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."InvestmentAccount"
    ADD CONSTRAINT "InvestmentAccount_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."InvestmentTransaction"
    ADD CONSTRAINT "InvestmentTransaction_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Macro"
    ADD CONSTRAINT "Macro_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SecurityPrice"
    ADD CONSTRAINT "SecurityPrice_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Security"
    ADD CONSTRAINT "Security_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Subcategory"
    ADD CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id");



CREATE INDEX "Account_type_idx" ON "public"."Account" USING "btree" ("type");



CREATE INDEX "Budget_categoryId_period_idx" ON "public"."Budget" USING "btree" ("categoryId", "period");



CREATE UNIQUE INDEX "Budget_period_categoryId_key" ON "public"."Budget" USING "btree" ("period", "categoryId");



CREATE INDEX "Budget_period_idx" ON "public"."Budget" USING "btree" ("period");



CREATE INDEX "Category_macroId_idx" ON "public"."Category" USING "btree" ("macroId");



CREATE INDEX "Category_name_idx" ON "public"."Category" USING "btree" ("name");



CREATE INDEX "InvestmentAccount_type_idx" ON "public"."InvestmentAccount" USING "btree" ("type");



CREATE INDEX "InvestmentTransaction_accountId_idx" ON "public"."InvestmentTransaction" USING "btree" ("accountId");



CREATE INDEX "InvestmentTransaction_date_idx" ON "public"."InvestmentTransaction" USING "btree" ("date");



CREATE INDEX "InvestmentTransaction_securityId_idx" ON "public"."InvestmentTransaction" USING "btree" ("securityId");



CREATE INDEX "InvestmentTransaction_type_idx" ON "public"."InvestmentTransaction" USING "btree" ("type");



CREATE INDEX "Macro_name_idx" ON "public"."Macro" USING "btree" ("name");



CREATE UNIQUE INDEX "Macro_name_key" ON "public"."Macro" USING "btree" ("name");



CREATE INDEX "SecurityPrice_securityId_date_idx" ON "public"."SecurityPrice" USING "btree" ("securityId", "date");



CREATE UNIQUE INDEX "SecurityPrice_securityId_date_key" ON "public"."SecurityPrice" USING "btree" ("securityId", "date");



CREATE INDEX "Security_class_idx" ON "public"."Security" USING "btree" ("class");



CREATE INDEX "Security_symbol_idx" ON "public"."Security" USING "btree" ("symbol");



CREATE UNIQUE INDEX "Security_symbol_key" ON "public"."Security" USING "btree" ("symbol");



CREATE INDEX "Subcategory_categoryId_idx" ON "public"."Subcategory" USING "btree" ("categoryId");



CREATE INDEX "Subcategory_name_idx" ON "public"."Subcategory" USING "btree" ("name");



CREATE INDEX "Transaction_accountId_idx" ON "public"."Transaction" USING "btree" ("accountId");



CREATE INDEX "Transaction_categoryId_date_idx" ON "public"."Transaction" USING "btree" ("categoryId", "date");



CREATE INDEX "Transaction_date_idx" ON "public"."Transaction" USING "btree" ("date");



CREATE INDEX "Transaction_date_type_idx" ON "public"."Transaction" USING "btree" ("date", "type");



CREATE INDEX "Transaction_type_idx" ON "public"."Transaction" USING "btree" ("type");



ALTER TABLE ONLY "public"."Budget"
    ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Category"
    ADD CONSTRAINT "Category_macroId_fkey" FOREIGN KEY ("macroId") REFERENCES "public"."Macro"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."InvestmentAccount"
    ADD CONSTRAINT "InvestmentAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."InvestmentTransaction"
    ADD CONSTRAINT "InvestmentTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."InvestmentAccount"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."InvestmentTransaction"
    ADD CONSTRAINT "InvestmentTransaction_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "public"."Security"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."SecurityPrice"
    ADD CONSTRAINT "SecurityPrice_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "public"."Security"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Subcategory"
    ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Transaction"
    ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Transaction"
    ADD CONSTRAINT "Transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON UPDATE CASCADE ON DELETE SET NULL;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."Account" TO "anon";
GRANT ALL ON TABLE "public"."Account" TO "authenticated";
GRANT ALL ON TABLE "public"."Account" TO "service_role";



GRANT ALL ON TABLE "public"."Budget" TO "anon";
GRANT ALL ON TABLE "public"."Budget" TO "authenticated";
GRANT ALL ON TABLE "public"."Budget" TO "service_role";



GRANT ALL ON TABLE "public"."Category" TO "anon";
GRANT ALL ON TABLE "public"."Category" TO "authenticated";
GRANT ALL ON TABLE "public"."Category" TO "service_role";



GRANT ALL ON TABLE "public"."InvestmentAccount" TO "anon";
GRANT ALL ON TABLE "public"."InvestmentAccount" TO "authenticated";
GRANT ALL ON TABLE "public"."InvestmentAccount" TO "service_role";



GRANT ALL ON TABLE "public"."InvestmentTransaction" TO "anon";
GRANT ALL ON TABLE "public"."InvestmentTransaction" TO "authenticated";
GRANT ALL ON TABLE "public"."InvestmentTransaction" TO "service_role";



GRANT ALL ON TABLE "public"."Macro" TO "anon";
GRANT ALL ON TABLE "public"."Macro" TO "authenticated";
GRANT ALL ON TABLE "public"."Macro" TO "service_role";



GRANT ALL ON TABLE "public"."Security" TO "anon";
GRANT ALL ON TABLE "public"."Security" TO "authenticated";
GRANT ALL ON TABLE "public"."Security" TO "service_role";



GRANT ALL ON TABLE "public"."SecurityPrice" TO "anon";
GRANT ALL ON TABLE "public"."SecurityPrice" TO "authenticated";
GRANT ALL ON TABLE "public"."SecurityPrice" TO "service_role";



GRANT ALL ON TABLE "public"."Subcategory" TO "anon";
GRANT ALL ON TABLE "public"."Subcategory" TO "authenticated";
GRANT ALL ON TABLE "public"."Subcategory" TO "service_role";



GRANT ALL ON TABLE "public"."Transaction" TO "anon";
GRANT ALL ON TABLE "public"."Transaction" TO "authenticated";
GRANT ALL ON TABLE "public"."Transaction" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







