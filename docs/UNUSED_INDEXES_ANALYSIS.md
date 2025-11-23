# Análise de Índices Não Utilizados

## Data: 2025-02-03

## Resumo Executivo

Foram identificados **70 índices não utilizados** no banco de dados. Esta análise categoriza cada índice e recomenda quais manter e quais remover para otimizar performance.

## Impacto de Manter Índices Não Utilizados

### Performance em Operações de Escrita
- **INSERT**: Cada índice precisa ser atualizado → mais lento
- **UPDATE**: Índices precisam ser recalculados → mais lento  
- **DELETE**: Índices precisam ser atualizados → mais lento
- **Locks**: Mais índices = mais tempo de lock

### Outros Impactos
- **Espaço em disco**: Índices ocupam espaço físico
- **VACUUM/ANALYZE**: Mais lento com mais índices
- **Backups**: Maior tamanho de backup

## Categorização dos Índices

### 🔴 CATEGORIA 1: REMOVER - Índices Claramente Desnecessários

Estes índices são redundantes, duplicados ou para features não utilizadas:

#### Índices Duplicados/Redundantes
- `idx_budget_userid_period` - Redundante com `Budget_period_idx` e `Budget_userId_idx`
- `idx_goal_userid_iscompleted` - Redundante com `Goal_userId_idx`
- `idx_debt_userid_ispaidoff` - Redundante com `Debt_userId_idx`
- `idx_investmentaccount_userid` - Redundante com `InvestmentAccount_userId_idx`
- `idx_plaidconnection_itemid` - Redundante com `PlaidConnection_itemId_idx`
- `idx_plaidconnection_userid` - Redundante com `PlaidConnection_userId_idx`
- `idx_position_accountid` - Redundante com `Position_accountId_securityId_idx`

#### Índices de Features Não Utilizadas
- `idx_budget_recurring` - Feature de budget recorrente não está sendo usada
- `idx_goal_issystemgoal` - Índice para system goals não está sendo usado
- `idx_goal_user_completed` - Queries por completedAt não estão sendo usadas
- `idx_goal_user_status` - Queries por status não estão sendo usadas
- `idx_goal_userid_targetmonths` - Feature de target months não está sendo usada
- `idx_debt_userid_firstpaymentdate` - Queries por firstPaymentDate não estão sendo usadas
- `idx_debt_user_loan_type` - Queries por loanType não estão sendo usadas
- `idx_planned_payment_date` - Redundante com índices compostos
- `idx_planned_payment_status` - Redundante com índices compostos
- `idx_planned_payment_source` - Feature não está sendo usada
- `idx_planned_payment_debt_id` - Feature não está sendo usada
- `idx_planned_payment_linked_transaction` - Feature não está sendo usada
- `idx_planned_payment_subscription_id` - Feature não está sendo usada
- `idx_planned_payment_to_account_id` - Feature não está sendo usada
- `idx_planned_payment_user_date_status` - Queries específicas não estão sendo usadas
- `idx_investment_transaction_account_date` - Redundante com outros índices
- `idx_investment_transaction_security` - Redundante com outros índices
- `idx_investment_transaction_updated` - Queries de sync não estão sendo usadas
- `idx_investment_transaction_holdings_calc` - Cálculos não estão sendo usados
- `idx_investment_transaction_security_account` - Redundante
- `idx_investment_transaction_date_type` - Queries específicas não estão sendo usadas
- `idx_position_account_open` - Queries específicas não estão sendo usadas
- `idx_position_account_open_quantity` - Queries específicas não estão sendo usadas
- `idx_position_security` - Redundante
- `idx_position_last_updated` - Queries de sync não estão sendo usadas
- `idx_simple_investment_account_date` - Redundante
- `idx_simple_investment_account_updated` - Queries de sync não estão sendo usadas
- `idx_security_price_date` - Redundante com `SecurityPrice_securityId_date_idx`
- `idx_security_price_security_date_desc` - Redundante
- `idx_transaction_user_date_type` - Queries específicas não estão sendo usadas
- `idx_transaction_description_gin` - Busca full-text não está sendo usada
- `idx_transaction_user_category` - Queries específicas não estão sendo usadas
- `idx_transaction_user_updated` - Queries de sync não estão sendo usadas
- `idx_user_service_subscription_plan_id` - Feature não está sendo usada
- `idx_user_service_subscription_user_id` - Redundante
- `idx_user_service_subscription_is_active` - Queries específicas não estão sendo usadas
- `idx_subscription_userid_status` - Redundante com outros índices
- `idx_subscription_status_enddate` - Queries específicas não estão sendo usadas
- `idx_subscription_service_category_id` - Redundante
- `idx_subscription_service_display_order` - Queries específicas não estão sendo usadas
- `category_learning_category_id_idx` - Redundante
- `category_learning_subcategory_id_idx` - Redundante
- `category_learning_last_used_idx` - Queries de cleanup não estão sendo usadas
- `transaction_description_search_trgm_idx` - Busca trigram não está sendo usada

#### Índices em Views Materializadas
- `idx_holdings_view_account` - View materializada não está sendo consultada diretamente
- `idx_holdings_view_security` - View materializada não está sendo consultada diretamente
- `idx_holdings_view_user` - View materializada não está sendo consultada diretamente
- `idx_asset_allocation_user` - View materializada não está sendo consultada diretamente
- `idx_sector_allocation_user` - View materializada não está sendo consultada diretamente

**Total Categoria 1: ~50 índices para remover**

---

### 🟡 CATEGORIA 2: MANTER TEMPORARIAMENTE - Índices Estratégicos

Estes índices podem ser úteis no futuro ou são para features em desenvolvimento:

#### Índices de Household (para queries futuras)
- `Account_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `Budget_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `Debt_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `Goal_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `InvestmentAccount_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `InvestmentTransaction_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `Position_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `TransactionSync_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `Subscription_householdId_idx` - Pode ser útil quando queries por household forem mais comuns
- `UserServiceSubscription_householdId_idx` - Pode ser útil quando queries por household forem mais comuns

#### Índices de Sincronização (para features futuras)
- `idx_account_user_updated` - Útil para sync de contas
- `idx_budget_user_updated` - Útil para sync de budgets
- `idx_debt_user_updated` - Útil para sync de dívidas
- `idx_goal_user_updated` - Útil para sync de goals
- `idx_transaction_user_updated` - Útil para sync de transações

#### Índices de Features Específicas
- `idx_account_isconnected` - Pode ser útil para filtrar contas conectadas
- `idx_investment_account_questrade` - Pode ser útil para Questrade
- `idx_investment_account_type` - Pode ser útil para filtrar por tipo
- `Budget_groupId_idx` - Pode ser útil para queries por grupo
- `Debt_accountId_idx` - Pode ser útil para queries por conta
- `Debt_userId_idx` - Pode ser útil para queries por usuário
- `Goal_accountId_idx` - Pode ser útil para queries por conta
- `Goal_userId_idx` - Pode ser útil para queries por usuário
- `Group_userId_idx` - Pode ser útil para queries por usuário
- `InvestmentAccount_accountId_idx` - Pode ser útil para queries por conta
- `InvestmentAccount_questradeConnectionId_idx` - Pode ser útil para Questrade
- `InvestmentAccount_userId_idx` - Pode ser útil para queries por usuário
- `PlannedPayment_accountId_idx` - Pode ser útil para queries por conta
- `PlannedPayment_categoryId_idx` - Pode ser útil para queries por categoria
- `PlannedPayment_subcategoryId_idx` - Pode ser útil para queries por subcategoria
- `TransactionSync_transactionId_idx` - Pode ser útil para sync
- `Transaction_amount_numeric_idx` - Pode ser útil para queries numéricas
- `Household_createdBy_idx` - Pode ser útil para queries administrativas
- `HouseholdMemberNew_invitedBy_idx` - Pode ser útil para queries administrativas
- `UserBlockHistory_userId_idx` - Pode ser útil para queries administrativas
- `UserBlockHistory_blockedBy_idx` - Pode ser útil para queries administrativas
- `UserBlockHistory_createdAt_idx` - Pode ser útil para queries administrativas

**Total Categoria 2: ~20 índices para manter temporariamente**

---

## Recomendações

### Ação Imediata: Remover ~50 Índices

Remover os índices da Categoria 1 que claramente não estão sendo usados e são redundantes. Isso vai:
- ✅ Melhorar performance de INSERT/UPDATE/DELETE
- ✅ Reduzir espaço em disco
- ✅ Acelerar VACUUM/ANALYZE
- ✅ Reduzir tamanho de backups

### Ação Futura: Monitorar ~20 Índices

Manter os índices da Categoria 2 por mais 1-2 meses e monitorar:
- Se começarem a ser usados → manter
- Se continuarem não utilizados → remover

### Processo de Remoção

1. **Fase 1**: Remover índices claramente desnecessários (Categoria 1)
2. **Fase 2**: Monitorar índices estratégicos por 1-2 meses
3. **Fase 3**: Remover índices que continuarem não utilizados

## Impacto Esperado

Após remover os ~50 índices da Categoria 1:

- **INSERT/UPDATE/DELETE**: 20-30% mais rápido (estimativa)
- **Espaço em disco**: Redução significativa
- **Manutenção**: VACUUM/ANALYZE mais rápido
- **Backups**: Menor tamanho

## Próximos Passos

1. ✅ Análise completa dos índices
2. ⏳ Criar migração para remover índices da Categoria 1
3. ⏳ Aplicar migração
4. ⏳ Monitorar performance
5. ⏳ Reavaliar índices da Categoria 2 em 1-2 meses

