-- ============================================================================
-- Fix Permissions Security - Remove Overly Permissive Grants
-- ============================================================================
-- Data: 2025-01-27
-- Descrição: Remove GRANT ALL e aplica permissões mínimas necessárias
--            Remove acesso de anon a dados sensíveis
-- ============================================================================

-- ============================================================================
-- 1. REVOGAR TODOS OS GRANTS ALL
-- ============================================================================

-- Revogar ALL de anon e authenticated de todas as tabelas sensíveis
-- Manter apenas service_role com ALL (necessário para operações administrativas)

-- Tabelas de dados do usuário (SENSÍVEIS - anon NÃO deve ter acesso)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
            'Transaction', 'Account', 'Budget', 'Category', 'Subcategory',
            'Debt', 'Goal', 'PlannedPayment', 'UserServiceSubscription',
            'AccountInvestmentValue', 'AccountOwner', 'BudgetCategory',
            'ContactForm', 'Feedback', 'HouseholdMember', 'InvestmentAccount',
            'InvestmentTransaction', 'Order', 'Execution', 'Position',
            'PlaidConnection', 'PlaidLiability', 'QuestradeConnection',
            'SimpleInvestmentEntry', 'Subscription', 'User',
            'category_learning', 'user_monthly_usage'
        )
    LOOP
        -- Revogar ALL de anon
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "anon"', r.tablename);
        RAISE NOTICE 'Revoked ALL from anon on table: %', r.tablename;
        
        -- Revogar ALL de authenticated (vamos dar permissões específicas depois)
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "authenticated"', r.tablename);
        RAISE NOTICE 'Revoked ALL from authenticated on table: %', r.tablename;
    END LOOP;
END $$;

-- Tabelas públicas (podem ter SELECT para anon)
-- Plan, PromoCode, Security, SecurityPrice são públicas para leitura
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('Plan', 'PromoCode', 'Security', 'SecurityPrice')
    LOOP
        -- Revogar ALL de anon
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "anon"', r.tablename);
        RAISE NOTICE 'Revoked ALL from anon on public table: %', r.tablename;
        
        -- Revogar ALL de authenticated
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "authenticated"', r.tablename);
        RAISE NOTICE 'Revoked ALL from authenticated on public table: %', r.tablename;
    END LOOP;
END $$;

-- Views materializadas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "anon"', r.matviewname);
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "authenticated"', r.matviewname);
        RAISE NOTICE 'Revoked ALL from anon/authenticated on materialized view: %', r.matviewname;
    END LOOP;
END $$;

-- Views normais
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "anon"', r.viewname);
        EXECUTE format('REVOKE ALL ON TABLE "public"."%s" FROM "authenticated"', r.viewname);
        RAISE NOTICE 'Revoked ALL from anon/authenticated on view: %', r.viewname;
    END LOOP;
END $$;

-- ============================================================================
-- 2. CONCEDER PERMISSÕES ESPECÍFICAS PARA authenticated
-- ============================================================================

-- Tabelas de dados do usuário: authenticated pode SELECT, INSERT, UPDATE, DELETE
-- (RLS garante que só vê seus próprios dados)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
            'Transaction', 'Account', 'Budget', 'Category', 'Subcategory',
            'Debt', 'Goal', 'PlannedPayment', 'UserServiceSubscription',
            'AccountInvestmentValue', 'AccountOwner', 'BudgetCategory',
            'ContactForm', 'Feedback', 'HouseholdMember', 'InvestmentAccount',
            'InvestmentTransaction', 'Order', 'Execution', 'Position',
            'PlaidConnection', 'PlaidLiability', 'QuestradeConnection',
            'SimpleInvestmentEntry', 'Subscription', 'User',
            'category_learning', 'user_monthly_usage', 'Candle',
            'SystemSettings'
        )
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."%s" TO "authenticated"', r.tablename);
        RAISE NOTICE 'Granted SELECT, INSERT, UPDATE, DELETE to authenticated on table: %', r.tablename;
    END LOOP;
END $$;

-- Tabelas públicas: authenticated pode SELECT, INSERT, UPDATE, DELETE
-- (RLS e policies controlam o acesso)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('Plan', 'PromoCode', 'Security', 'SecurityPrice', 'Group')
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."%s" TO "authenticated"', r.tablename);
        RAISE NOTICE 'Granted SELECT, INSERT, UPDATE, DELETE to authenticated on public table: %', r.tablename;
    END LOOP;
END $$;

-- Views materializadas: authenticated pode SELECT
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT ON TABLE "public"."%s" TO "authenticated"', r.matviewname);
        RAISE NOTICE 'Granted SELECT to authenticated on materialized view: %', r.matviewname;
    END LOOP;
END $$;

-- Views normais: authenticated pode SELECT
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT ON TABLE "public"."%s" TO "authenticated"', r.viewname);
        RAISE NOTICE 'Granted SELECT to authenticated on view: %', r.viewname;
    END LOOP;
END $$;

-- ============================================================================
-- 3. CONCEDER PERMISSÕES MÍNIMAS PARA anon (APENAS LEITURA PÚBLICA)
-- ============================================================================

-- Tabelas públicas: anon pode apenas SELECT (leitura)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('Plan', 'PromoCode', 'Security', 'SecurityPrice', 'Group')
    LOOP
        EXECUTE format('GRANT SELECT ON TABLE "public"."%s" TO "anon"', r.tablename);
        RAISE NOTICE 'Granted SELECT to anon on public table: %', r.tablename;
    END LOOP;
END $$;

-- Views materializadas: anon pode SELECT (se necessário)
-- Comentado por padrão - descomente apenas se precisar acesso público
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN 
--         SELECT matviewname 
--         FROM pg_matviews 
--         WHERE schemaname = 'public'
--     LOOP
--         EXECUTE format('GRANT SELECT ON TABLE "public"."%s" TO "anon"', r.matviewname);
--         RAISE NOTICE 'Granted SELECT to anon on materialized view: %', r.matviewname;
--     END LOOP;
-- END $$;

-- Views normais: anon pode SELECT (se necessário)
-- Comentado por padrão - descomente apenas se precisar acesso público
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN 
--         SELECT viewname 
--         FROM pg_views 
--         WHERE schemaname = 'public'
--     LOOP
--         EXECUTE format('GRANT SELECT ON TABLE "public"."%s" TO "anon"', r.viewname);
--         RAISE NOTICE 'Granted SELECT to anon on view: %', r.viewname;
--     END LOOP;
-- END $$;

-- ============================================================================
-- 4. REVOGAR E RECONCEDER PERMISSÕES DE FUNÇÕES
-- ============================================================================

-- Revogar ALL de funções
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION "public"."%s" FROM "anon"', r.routine_name);
        EXECUTE format('REVOKE ALL ON FUNCTION "public"."%s" FROM "authenticated"', r.routine_name);
        RAISE NOTICE 'Revoked ALL from anon/authenticated on function: %', r.routine_name;
    END LOOP;
END $$;

-- Funções que authenticated pode executar (ajuste conforme necessário)
-- Funções SECURITY DEFINER que verificam auth.uid() internamente
DO $$
DECLARE
    func_list TEXT[] := ARRAY[
        'check_invitation_email_match',
        'convert_planned_payment_to_transaction',
        'create_transaction_with_limit',
        'create_transfer_with_limit',
        'get_latest_updates',
        'increment_transaction_count',
        'is_account_owner_by_userid',
        'is_account_owner_via_accountowner',
        'is_current_user_admin',
        'notify_refresh_holdings',
        'refresh_portfolio_views',
        'update_updated_at_column'
    ];
    func_name TEXT;
BEGIN
    FOREACH func_name IN ARRAY func_list
    LOOP
        -- Verificar se a função existe antes de conceder
        IF EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = func_name
        ) THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION "public"."%s" TO "authenticated"', func_name);
            RAISE NOTICE 'Granted EXECUTE to authenticated on function: %', func_name;
        END IF;
    END LOOP;
END $$;

-- Funções que anon pode executar (mínimas - apenas se necessário)
-- Normalmente anon não precisa executar funções, mas se precisar, adicione aqui
-- Exemplo: funções de validação pública, etc.

-- ============================================================================
-- 5. ATUALIZAR DEFAULT PRIVILEGES (PREVENIR FUTUROS GRANTS ALL)
-- ============================================================================

-- Remover DEFAULT PRIVILEGES que concedem ALL
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
    REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
    REVOKE ALL ON TABLES FROM "authenticated";

-- Definir DEFAULT PRIVILEGES mais restritivos
-- authenticated: SELECT, INSERT, UPDATE, DELETE em tabelas
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "authenticated";

-- anon: nenhum acesso por padrão (conceda explicitamente quando necessário)
-- Não definimos DEFAULT PRIVILEGES para anon - deve ser explícito

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- Esta migration:
-- 1. Remove GRANT ALL de anon e authenticated em todas as tabelas
-- 2. Concede apenas permissões específicas necessárias:
--    - authenticated: SELECT, INSERT, UPDATE, DELETE (RLS garante isolamento)
--    - anon: apenas SELECT em tabelas públicas (Plan, PromoCode, Security, etc.)
-- 3. Remove acesso de anon a dados sensíveis do usuário
-- 4. Atualiza DEFAULT PRIVILEGES para prevenir futuros GRANT ALL
--
-- IMPORTANTE: RLS (Row Level Security) já está habilitado e garante que:
-- - authenticated só vê seus próprios dados
-- - anon não tem acesso a dados de usuários (sem permissões)
--
-- Se precisar de acesso público a alguma view/materialized view, descomente
-- as seções correspondentes acima.

