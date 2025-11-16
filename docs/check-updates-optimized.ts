// ============================================================================
// File: app/api/dashboard/check-updates/route.ts (OTIMIZADO)
// Description: Versão otimizada do endpoint com cache Redis
// ============================================================================

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getCurrentUserId } from "@/lib/api/feature-guard";
import Redis from "ioredis";

// ============================================================================
// CONFIGURAÇÃO REDIS
// ============================================================================

// Singleton Redis client
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn("[Check Updates] Redis URL not configured, caching disabled");
    return null;
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redis.on("error", (err) => {
      console.error("[Check Updates] Redis error:", err);
    });

    redis.on("connect", () => {
      console.log("[Check Updates] Redis connected");
    });
  }

  return redis;
}

// ============================================================================
// TIPOS
// ============================================================================

interface UpdateCheckResult {
  hasUpdates: boolean;
  currentHash: string;
  timestamp: string | null;
  source?: "cache" | "database";
  executionTime?: number;
}

interface TableUpdate {
  tableName: string;
  lastUpdate: number;
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

const CACHE_TTL = 5; // 5 segundos
const CACHE_KEY_PREFIX = "updates:";

async function getCachedUpdates(userId: string): Promise<UpdateCheckResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return {
        ...data,
        source: "cache" as const,
      };
    }
  } catch (error) {
    console.error("[Check Updates] Cache read error:", error);
  }

  return null;
}

async function setCachedUpdates(
  userId: string,
  data: UpdateCheckResult
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    await redis.setex(
      cacheKey,
      CACHE_TTL,
      JSON.stringify({
        hasUpdates: data.hasUpdates,
        currentHash: data.currentHash,
        timestamp: data.timestamp,
      })
    );
  } catch (error) {
    console.error("[Check Updates] Cache write error:", error);
  }
}

// ============================================================================
// DATABASE QUERIES - OTIMIZADO
// ============================================================================

/**
 * Versão otimizada: usa índices compostos e query mais simples
 */
async function getLatestUpdates(userId: string): Promise<TableUpdate[]> {
  const supabase = await createServerClient();

  // Query otimizada usando CTE para melhor performance
  const { data, error } = await supabase.rpc("get_latest_updates", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[Check Updates] RPC error:", error);
    // Fallback para query individual se RPC falhar
    return await getLatestUpdatesFallback(userId);
  }

  return data || [];
}

/**
 * Fallback caso RPC não exista (usar queries individuais)
 */
async function getLatestUpdatesFallback(userId: string): Promise<TableUpdate[]> {
  const supabase = await createServerClient();

  // Executar queries em paralelo com limite de 1 resultado cada
  const results = await Promise.allSettled([
    // Transaction
    supabase
      .from("Transaction")
      .select("updatedAt, createdAt")
      .eq("user_id", userId)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Account
    supabase
      .from("Account")
      .select("updatedAt, createdAt")
      .eq("user_id", userId)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Budget
    supabase
      .from("Budget")
      .select("updatedAt, createdAt")
      .eq("user_id", userId)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Goal
    supabase
      .from("Goal")
      .select("updatedAt, createdAt")
      .eq("user_id", userId)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Debt
    supabase
      .from("Debt")
      .select("updatedAt, createdAt")
      .eq("user_id", userId)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // SimpleInvestmentEntry
    supabase
      .from("SimpleInvestmentEntry")
      .select("updatedAt, createdAt")
      .eq("user_id", userId)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const tableNames = [
    "Transaction",
    "Account",
    "Budget",
    "Goal",
    "Debt",
    "SimpleInvestmentEntry",
  ];

  return results
    .map((result, index) => {
      if (result.status === "rejected") return null;

      const { data } = result.value;
      if (!data) return null;

      const updated = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
      const created = data.createdAt ? new Date(data.createdAt).getTime() : 0;
      const lastUpdate = Math.max(updated, created);

      return {
        tableName: tableNames[index],
        lastUpdate,
      };
    })
    .filter((item): item is TableUpdate => item !== null);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // 1. Autenticação
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Tentar cache primeiro
    const cached = await getCachedUpdates(userId);
    if (cached) {
      cached.executionTime = Date.now() - startTime;
      return NextResponse.json(cached);
    }

    // 3. Parse de parâmetros
    const { searchParams } = new URL(request.url);
    const lastCheck = searchParams.get("lastCheck");

    // 4. Buscar atualizações do banco
    const updates = await getLatestUpdates(userId);

    // 5. Calcular hash baseado na última atualização
    const timestamps = updates.map((u) => u.lastUpdate).filter((t) => t > 0);
    const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
    const currentHash = maxTimestamp.toString();

    // 6. Verificar se há atualizações
    let hasUpdates = false;
    if (lastCheck) {
      const lastCheckTime = new Date(lastCheck).getTime();
      hasUpdates = maxTimestamp > lastCheckTime;
    }

    // 7. Preparar resposta
    const result: UpdateCheckResult = {
      hasUpdates,
      currentHash,
      timestamp: maxTimestamp > 0 ? new Date(maxTimestamp).toISOString() : null,
      source: "database" as const,
      executionTime: Date.now() - startTime,
    };

    // 8. Salvar no cache
    await setCachedUpdates(userId, result);

    // 9. Log de performance (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Check Updates] User ${userId.slice(0, 8)}... - ${result.executionTime}ms - ${result.source}`
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[Check Updates] Error after ${executionTime}ms:`, error);

    return NextResponse.json(
      {
        error: "Failed to check updates",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// SUPABASE RPC FUNCTION (Executar no Supabase SQL Editor)
// ============================================================================

/*
-- Criar função RPC para buscar atualizações de forma otimizada
CREATE OR REPLACE FUNCTION get_latest_updates(p_user_id UUID)
RETURNS TABLE (
  table_name TEXT,
  last_update BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH updates AS (
    -- Transaction
    SELECT 
      'Transaction' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST(updated_at, created_at))) * 1000 as last_update
    FROM "Transaction"
    WHERE user_id = p_user_id
      AND (updated_at IS NOT NULL OR created_at IS NOT NULL)
    
    UNION ALL
    
    -- Account
    SELECT 
      'Account' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST(updated_at, created_at))) * 1000
    FROM "Account"
    WHERE user_id = p_user_id
      AND (updated_at IS NOT NULL OR created_at IS NOT NULL)
    
    UNION ALL
    
    -- Budget
    SELECT 
      'Budget' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST(updated_at, created_at))) * 1000
    FROM "Budget"
    WHERE user_id = p_user_id
      AND (updated_at IS NOT NULL OR created_at IS NOT NULL)
    
    UNION ALL
    
    -- Goal
    SELECT 
      'Goal' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST(updated_at, created_at))) * 1000
    FROM "Goal"
    WHERE user_id = p_user_id
      AND (updated_at IS NOT NULL OR created_at IS NOT NULL)
    
    UNION ALL
    
    -- Debt
    SELECT 
      'Debt' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST(updated_at, created_at))) * 1000
    FROM "Debt"
    WHERE user_id = p_user_id
      AND (updated_at IS NOT NULL OR created_at IS NOT NULL)
    
    UNION ALL
    
    -- SimpleInvestmentEntry
    SELECT 
      'SimpleInvestmentEntry' as table_name,
      EXTRACT(EPOCH FROM MAX(GREATEST(updated_at, created_at))) * 1000
    FROM "SimpleInvestmentEntry"
    WHERE user_id = p_user_id
      AND (updated_at IS NOT NULL OR created_at IS NOT NULL)
  )
  SELECT * FROM updates WHERE last_update IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Adicionar comentário
COMMENT ON FUNCTION get_latest_updates(UUID) IS
  'Retorna timestamp da última atualização de cada tabela para um usuário. Usado pelo endpoint check-updates.';
*/

// ============================================================================
// TESTES
// ============================================================================

/*
// Para testar localmente:

import { GET } from './route';

async function test() {
  const request = new Request('http://localhost:3000/api/dashboard/check-updates');
  const response = await GET(request);
  const data = await response.json();
  console.log('Response:', data);
  console.log('Execution time:', data.executionTime, 'ms');
  console.log('Source:', data.source);
}

test();
*/

// ============================================================================
// MONITORAMENTO
// ============================================================================

// Para monitorar performance em produção, adicione ao Sentry/DataDog:
/*
import * as Sentry from '@sentry/nextjs';

// No handler:
Sentry.addBreadcrumb({
  category: 'api',
  message: 'Check updates',
  level: 'info',
  data: {
    userId: userId.slice(0, 8),
    executionTime: result.executionTime,
    source: result.source,
  },
});

// Se executionTime > 1000ms (1 segundo):
if (result.executionTime > 1000) {
  Sentry.captureMessage('Slow check-updates query', {
    level: 'warning',
    extra: {
      userId,
      executionTime: result.executionTime,
      source: result.source,
    },
  });
}
*/
