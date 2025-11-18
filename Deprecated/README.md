# Pasta Deprecated

Esta pasta contém arquivos que foram deprecados ou não são mais utilizados no código.

## ⚠️ Atenção

**NÃO DELETE ESTES ARQUIVOS IMEDIATAMENTE!**

Eles podem ainda estar sendo referenciados em algum lugar do código. Esta pasta serve como:
- Documentação de arquivos que devem ser removidos no futuro
- Local temporário durante a migração
- Referência histórica

## Arquivos Movidos

### API Routes Deprecated
- `app-api-billing-limits-route.ts` - Deprecated, usar Server Action `getBillingLimitsAction` em vez disso
- `app-api-limits-route.ts` - Rota antiga, substituída por `/api/billing/limits` (também deprecated)

### API Antiga (Migração Subscription/Plans/Limits)
- `lib-api-plans.ts` - API antiga de plans, substituída por `lib/api/subscription.ts`
  - **Status:** ✅ Migração completa - não usar mais
  - **Substituir por:** `lib/api/subscription.ts`

## Processo de Remoção

Antes de deletar qualquer arquivo desta pasta:

1. Verifique se não há referências no código: `grep -r "nome-do-arquivo" .`
2. Verifique se não há imports: `grep -r "from.*nome-do-arquivo" .`
3. Teste a aplicação completamente
4. Remova o arquivo apenas após confirmar que não é mais necessário

## ✅ Arquivos Removidos (Migração Completa)

Estes arquivos foram removidos durante a migração para a API unificada:

- ❌ `lib/api/limits.ts` - Removido (wrapper deprecated)
- ❌ `contexts/plan-limits-context.tsx` - Removido (wrapper deprecated)
- ❌ `hooks/use-plan-limits.ts` - Removido (wrapper deprecated)
- ❌ `lib/api/plans-client.ts` - Removido (não estava sendo usado)

**Todos foram substituídos por:**
- ✅ `lib/api/subscription.ts` - API unificada
- ✅ `contexts/subscription-context.tsx` - Contexto unificado
- ✅ `hooks/use-subscription.ts` - Hook unificado

## 📚 Documentação

Para mais informações sobre a migração:
- `docs/SUBSCRIPTION_UNIFICATION.md` - Arquitetura unificada
- `docs/MIGRATION_100_PERCENT.md` - Status da migração (100% completo)
