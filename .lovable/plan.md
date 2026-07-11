# Planos, Limites e Super Admin

## 1. Definição dos planos


| Plano    | Categorias | Buscas/mês | Leads salvos/mês | Busca detalhada (bairro/municípios) |
| -------- | ---------- | ---------- | ---------------- | ----------------------------------- |
| Gratuito | 5          | 70         | 100              | não                                 |
| Starter  | 15         | 300        | 1.000            | não                                 |
| Pro      | 40         | 1.500      | 5.000            | sim                                 |
| Business | Todas (56) | Ilimitado  | Ilimitado        | sim                                 |


Cada categoria fica marcada com o plano mínimo (`gratuito | starter | pro | business`). Na UI de busca, categorias acima do plano do usuário aparecem bloqueadas com badge "Disponível no Starter/Pro/Business" (igual ao print).

## 2. Banco (migração)

- `plans` (seed fixo): `id text pk`, `name`, `max_categories int`, `monthly_searches int` (`-1` = ilimitado), `monthly_saved_leads int`, `detailed_search bool`, `price_cents int`, `sort_order`.
- `categories`: `slug pk`, `label`, `min_plan text fk plans.id`, `active bool`.
- `subscriptions`: `user_id pk fk auth.users`, `plan_id fk plans.id default 'gratuito'`, `renews_at timestamptz`, `updated_at`. Trigger cria linha "gratuito" no signup.
- `usage_counters`: `user_id`, `period` (`YYYY-MM`), `searches int`, `saved_leads int`, pk `(user_id, period)`.
- `app_role` enum já usa padrão: criar `user_roles(user_id, role app_role)` + função `has_role(uuid, app_role) security definer`.
- RLS: usuário lê seu `subscriptions`/`usage_counters`; admin (via `has_role`) lê/edita tudo; `plans` e `categories` públicos para `authenticated` (SELECT).
- GRANTs em cada tabela conforme regras. Sem `anon`.

## 3. Server functions (lógica de plano)

`src/lib/plans.functions.ts`:

- `getMyPlan()` → devolve plano, uso do mês, categorias permitidas.
- `listCategories()` → todas categorias com `min_plan` (público autenticado).

`src/lib/places.functions.ts` (ajustar):

- Antes da chamada Google: carrega plano + uso do mês. Se `searches >= monthly_searches` → erro "Limite mensal atingido". Se categoria não permitida → erro "Categoria indisponível no seu plano". Incrementa `searches` após sucesso.
- `savePlacesAsLeads`: valida `saved_leads + N <= monthly_saved_leads`; incrementa contador.

`src/lib/admin.functions.ts` (novo, protegido por `has_role(admin)`):

- `adminListUsers({search, page})` → lista usuários com plano + uso + totais de leads.
- `adminSetUserPlan({userId, planId})`.
- `adminSetUserRole({userId, role, grant})`.
- `adminUpdatePlan({planId, patch})` — edita limites de um plano.
- `adminUpsertCategory({slug, label, minPlan, active})`.
- `adminStats()` — totais globais (usuários, sites, leads, buscas do mês).

## 4. UI

**Tela Buscar Leads (`app.buscar.tsx`)**

- Carrega `getMyPlan()` e `listCategories()` via `useQuery`.
- Select de categorias agrupado por plano (Disponível no seu plano / Starter / Pro / Business) com itens acima do plano desabilitados e ícone de cadeado (bate com o print).
- Linha de status: "5 de 53 categorias no plano Gratuito · 12/50 buscas usadas este mês".
- Botão "Ver todos os planos →" abre `/app/billing`.
- Trata erros de limite com toast.

**Super Admin (`/app/admin`)**

- Só visível na sidebar quando `has_role(admin)`.
- Sub-rotas em abas: Visão geral (KPIs), Usuários (tabela + trocar plano + promover admin), Planos (editar limites/preços inline), Categorias (CRUD simples com `min_plan` select).
- Guardada por `beforeLoad` que chama `getMyPlan` e redireciona se não for admin.

## 5. Regras de segurança

- Toda função admin usa `requireSupabaseAuth` + checagem `has_role(userId,'admin')` no início do handler; nunca confia no cliente.
- Contadores gravados server-side (nunca cliente).
- Promoção a admin: primeiro admin é o usuário atual, feito por SQL de seed pedindo o email dele (vou perguntar).

## 6. Entregáveis por ordem

1. Migração (plans, categories seed com as 56 categorias, subscriptions, usage_counters, user_roles + has_role, triggers, RLS, GRANTs).
2. `plans.functions.ts` + ajuste em `places.functions.ts`.
3. `admin.functions.ts`.
4. UI busca reformulada.
5. Rotas `/app/admin/*` + link condicional na sidebar.
6. Ajuste do `app.billing.tsx` para refletir os limites reais.

## Perguntas antes de rodar a migração

1. Confirma a tabela de limites acima? (posso ajustar números)
2. Qual o email da sua conta para eu promover a admin no seed?