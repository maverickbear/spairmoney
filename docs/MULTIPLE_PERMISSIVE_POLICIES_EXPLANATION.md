# Explicação: Multiple Permissive Policies Warning

## O Problema

O warning `multiple_permissive_policies` ocorre quando você tem **múltiplas políticas permissivas** (permissive policies) para a mesma **role** e **action** em uma tabela.

### O que são políticas permissivas?

No PostgreSQL RLS, existem dois tipos de políticas:
- **Permissive (Permissivas)**: Permitem acesso se a condição for verdadeira (padrão)
- **Restrictive (Restritivas)**: Negam acesso mesmo se outras políticas permitirem

### Por que é um problema de performance?

Quando você tem múltiplas políticas permissivas para a mesma role e action, o PostgreSQL precisa **avaliar TODAS elas** para cada query. Isso significa:

1. **Múltiplas avaliações**: Para cada linha, todas as políticas são verificadas
2. **Overhead desnecessário**: Se uma política já permite acesso, as outras ainda são avaliadas
3. **Queries mais lentas**: Especialmente em tabelas com muitas linhas

### Exemplo do Problema

**ANTES (Ineficiente):**
```sql
-- Política 1: Super admin pode deletar categorias do sistema
CREATE POLICY "Super admin can delete system categories" 
ON "public"."Category" 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = auth.uid()
        AND "User"."role" = 'super_admin'
    )
);

-- Política 2: Usuários podem deletar suas próprias categorias
CREATE POLICY "Users can delete own categories" 
ON "public"."Category" 
FOR DELETE 
USING ("userId" = auth.uid());
```

**Problema**: Para cada DELETE, o PostgreSQL avalia AMBAS as políticas, mesmo que apenas uma seja necessária.

**DEPOIS (Eficiente):**
```sql
-- Política única combinada
CREATE POLICY "Users and super admins can delete categories" 
ON "public"."Category" 
FOR DELETE 
USING (
    "userId" = auth.uid()
    OR EXISTS (
        SELECT 1 FROM "public"."User"
        WHERE "User"."id" = auth.uid()
        AND "User"."role" = 'super_admin'
    )
);
```

**Benefício**: Apenas UMA política é avaliada, com condições combinadas usando OR.

## Tabelas Afetadas

Baseado nos warnings, as seguintes tabelas têm múltiplas políticas permissivas:

1. **Category** - INSERT, UPDATE, DELETE
2. **Subcategory** - INSERT, UPDATE, DELETE
3. **Group** - INSERT, UPDATE, DELETE
4. **ContactForm** - SELECT
5. **Feedback** - SELECT
6. **PromoCode** - SELECT
7. **Subscription** - INSERT, UPDATE, DELETE
8. **SubscriptionService** - SELECT
9. **SubscriptionServiceCategory** - SELECT
10. **SubscriptionServicePlan** - SELECT
11. **UserActiveHousehold** - SELECT
12. **UserBlockHistory** - SELECT

## Solução

A migração `20250203000013_consolidate_multiple_permissive_policies.sql` combina todas essas políticas duplicadas em políticas únicas usando condições OR.

### Padrão de Consolidação

**Para políticas de usuário vs super admin:**
```sql
-- Antes: 2 políticas separadas
CREATE POLICY "Users can *" ... USING ("userId" = auth.uid());
CREATE POLICY "Super admin can *" ... USING (is_super_admin());

-- Depois: 1 política combinada
CREATE POLICY "Users and super admins can *" 
USING (
    "userId" = auth.uid()
    OR is_super_admin()
);
```

**Para políticas públicas vs admin:**
```sql
-- Antes: 2 políticas separadas
CREATE POLICY "Public can view active" ... USING ("isActive" = true);
CREATE POLICY "Super admin can manage" ... USING (is_super_admin());

-- Depois: 1 política combinada
CREATE POLICY "Public and super admins can access" 
USING (
    ("isActive" = true)
    OR is_super_admin()
);
```

## Impacto Esperado

Após aplicar a migração:

1. ✅ **Performance melhorada**: Menos avaliações de políticas por query
2. ✅ **Warnings resolvidos**: O linter não reportará mais esses warnings
3. ✅ **Funcionalidade preservada**: O comportamento de segurança permanece o mesmo
4. ✅ **Código mais limpo**: Menos políticas para manter

## Verificação

Após aplicar a migração, execute o linter novamente:

```bash
supabase db lint
```

Todos os warnings de `multiple_permissive_policies` devem desaparecer.

## Notas Importantes

1. **Segurança**: A consolidação não altera a segurança - apenas combina condições que já existiam
2. **Compatibilidade**: O comportamento funcional permanece idêntico
3. **Service Role**: Políticas de service_role foram mantidas separadas quando necessário, pois verificam `auth.role()` em vez de `auth.uid()`

## Referências

- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

