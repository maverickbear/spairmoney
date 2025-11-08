/**
 * Script de Diagnóstico: Por que Monthly Income/Expenses aparecem como 0?
 * 
 * Este script verifica:
 * 1. Se há transações no banco
 * 2. Se as transações têm userId correto
 * 3. Se as contas têm userId correto
 * 4. Se o RLS está bloqueando
 * 5. Se os filtros de data estão corretos
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Iniciando diagnóstico de transações...\n');

  // 1. Verificar se há transações no banco (sem RLS)
  console.log('1️⃣ Verificando transações no banco (sem RLS)...');
  const { data: allTransactions, error: allError } = await supabase
    .from('Transaction')
    .select('id, date, type, amount, accountId, userId')
    .limit(10)
    .order('date', { ascending: false });

  if (allError) {
    console.error('❌ Erro ao buscar transações:', allError);
  } else {
    console.log(`✅ Total de transações encontradas: ${allTransactions?.length || 0}`);
    if (allTransactions && allTransactions.length > 0) {
      console.log('📋 Primeiras 5 transações:');
      allTransactions.forEach((t, i) => {
        console.log(`   ${i + 1}. ID: ${t.id}`);
        console.log(`      Data: ${t.date}`);
        console.log(`      Tipo: ${t.type}`);
        console.log(`      Valor: ${t.amount}`);
        console.log(`      AccountId: ${t.accountId}`);
        console.log(`      UserId: ${t.userId || 'NULL ⚠️'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ Nenhuma transação encontrada no banco!');
    }
  }

  // 2. Verificar contas
  console.log('\n2️⃣ Verificando contas...');
  const { data: accounts, error: accountsError } = await supabase
    .from('Account')
    .select('id, name, userId, type')
    .limit(10);

  if (accountsError) {
    console.error('❌ Erro ao buscar contas:', accountsError);
  } else {
    console.log(`✅ Total de contas encontradas: ${accounts?.length || 0}`);
    if (accounts && accounts.length > 0) {
      console.log('📋 Contas:');
      accounts.forEach((acc, i) => {
        console.log(`   ${i + 1}. ID: ${acc.id}`);
        console.log(`      Nome: ${acc.name}`);
        console.log(`      Tipo: ${acc.type}`);
        console.log(`      UserId: ${acc.userId || 'NULL ⚠️'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ Nenhuma conta encontrada!');
    }
  }

  // 3. Verificar AccountOwner
  console.log('\n3️⃣ Verificando AccountOwner...');
  const { data: accountOwners, error: ownersError } = await supabase
    .from('AccountOwner')
    .select('accountId, ownerId')
    .limit(10);

  if (ownersError) {
    console.error('❌ Erro ao buscar AccountOwner:', ownersError);
  } else {
    console.log(`✅ Total de AccountOwner encontrados: ${accountOwners?.length || 0}`);
    if (accountOwners && accountOwners.length > 0) {
      console.log('📋 AccountOwner:');
      accountOwners.forEach((ao, i) => {
        console.log(`   ${i + 1}. AccountId: ${ao.accountId}`);
        console.log(`      OwnerId: ${ao.ownerId}`);
        console.log('');
      });
    }
  }

  // 4. Verificar usuários autenticados
  console.log('\n4️⃣ Verificando usuários...');
  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, email, name')
    .limit(10);

  if (usersError) {
    console.error('❌ Erro ao buscar usuários:', usersError);
  } else {
    console.log(`✅ Total de usuários encontrados: ${users?.length || 0}`);
    if (users && users.length > 0) {
      console.log('📋 Usuários:');
      users.forEach((u, i) => {
        console.log(`   ${i + 1}. ID: ${u.id}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      Nome: ${u.name || 'N/A'}`);
        console.log('');
      });
    }
  }

  // 5. Verificar transações por mês atual
  console.log('\n5️⃣ Verificando transações do mês atual...');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  console.log(`   Período: ${startOfMonth.toISOString()} até ${endOfMonth.toISOString()}`);

  const { data: monthTransactions, error: monthError } = await supabase
    .from('Transaction')
    .select('id, date, type, amount, accountId, userId')
    .gte('date', startOfMonth.toISOString())
    .lte('date', endOfMonth.toISOString())
    .order('date', { ascending: false });

  if (monthError) {
    console.error('❌ Erro ao buscar transações do mês:', monthError);
  } else {
    console.log(`✅ Transações do mês atual: ${monthTransactions?.length || 0}`);
    
    if (monthTransactions && monthTransactions.length > 0) {
      const income = monthTransactions.filter(t => t.type === 'income');
      const expenses = monthTransactions.filter(t => t.type === 'expense');
      
      const incomeTotal = income.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const expensesTotal = expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      console.log(`   💰 Income: ${income.length} transações = $${incomeTotal.toFixed(2)}`);
      console.log(`   💸 Expenses: ${expenses.length} transações = $${expensesTotal.toFixed(2)}`);
      
      console.log('\n   📋 Detalhes das transações:');
      monthTransactions.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.type.toUpperCase()}: $${t.amount} (${t.date})`);
        console.log(`      AccountId: ${t.accountId}, UserId: ${t.userId || 'NULL ⚠️'}`);
      });
    } else {
      console.log('⚠️ Nenhuma transação encontrada no mês atual!');
    }
  }

  // 6. Verificar RLS status
  console.log('\n6️⃣ Verificando status do RLS...');
  let rlsStatus: any = null;
  let rlsError: any = null;
  try {
    const result = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          tablename,
          rowsecurity as "RLS Enabled"
        FROM pg_tables
        WHERE schemaname = 'public' 
        AND tablename = 'Transaction';
      `
    });
    rlsStatus = result.data;
    rlsError = result.error;
  } catch (error) {
    rlsError = error;
  }

  if (rlsError) {
    console.log('⚠️ Não foi possível verificar RLS (normal se não tiver função exec_sql)');
  } else {
    console.log('✅ RLS Status:', rlsStatus);
  }

  // 7. Verificar políticas RLS
  console.log('\n7️⃣ Verificando políticas RLS...');
  let policies: any = null;
  let policiesError: any = null;
  try {
    const result = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          policyname,
          cmd,
          qual
        FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename = 'Transaction';
      `
    });
    policies = result.data;
    policiesError = result.error;
  } catch (error) {
    policiesError = error;
  }

  if (policiesError) {
    console.log('⚠️ Não foi possível verificar políticas (normal se não tiver função exec_sql)');
  } else {
    console.log('✅ Políticas RLS:', policies);
  }

  console.log('\n✅ Diagnóstico completo!');
}

diagnose().catch(console.error);

