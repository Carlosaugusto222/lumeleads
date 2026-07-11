# Plataforma de Geração de Landing Pages com IA

Uma plataforma em português (BR) inspirada em useleadsite.com: o usuário descreve seu negócio, a IA gera uma landing page completa, e ele pode publicá-la em uma URL pública.

## Escopo do V1

1. **Landing page pública** (marketing) — apresenta o produto e leva ao cadastro
2. **Auth** — cadastro/login com e-mail+senha e Google
3. **Dashboard** — lista de sites gerados pelo usuário
4. **Gerador IA** — formulário → IA gera conteúdo estruturado da landing → preview
5. **Editor básico** — ajustar textos, cores e imagens do site gerado
6. **Publicação** — cada site fica acessível em `/s/{slug}` público

Domínios customizados ficam fora do V1 (complexidade de DNS/SSL); adicionamos depois com instruções específicas.

## Fluxo do usuário

```text
Landing (/) ──► Cadastro/Login (/auth)
                     │
                     ▼
              Dashboard (/app)
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    Novo site   Meus sites   Editar site
    (/app/new)              (/app/sites/$id)
        │                        │
        ▼                        ▼
   Gera com IA ──► Preview ──► Publica
                                 │
                                 ▼
                    Site público (/s/$slug)
```

## Design

Inspirado mas original — vibe SaaS moderno brasileiro, não cópia visual. Paleta escura com acento vibrante (roxo/azul elétrico), tipografia bold no hero, cards com bordas suaves e microanimações discretas. Copy 100% em PT-BR.

## Rotas

- `/` — landing marketing (hero, como funciona, exemplos, preços, CTA)
- `/auth` — login/cadastro (e-mail+senha + Google)
- `/app` — dashboard: lista de sites do usuário
- `/app/new` — formulário de briefing + geração IA
- `/app/sites/$id` — editor + preview + publicar/despublicar
- `/s/$slug` — site público gerado (SSR, indexável)

## Dados (Lovable Cloud)

- `profiles` — dados básicos do usuário (nome)
- `sites` — id, user_id, slug (único), published (bool), theme (json: cores/fonte), content (json: seções da landing gerada), created_at
- RLS: dono lê/escreve seus sites; sites com `published=true` são lidos por `anon` via política pública para renderizar `/s/$slug`

## IA

Lovable AI Gateway com structured output (Zod) — a partir do briefing (nome, setor, público, oferta, tom) retorna JSON tipado com: headline, subheadline, 3 benefícios, 3 depoimentos placeholder, seção sobre, CTA. Renderizado por um template React único no V1.

## Detalhes técnicos

- TanStack Start + Lovable Cloud (Supabase)
- Auth: e-mail+senha + Google via Cloud
- `/app/*` sob `_authenticated/` (gate gerenciado)
- `/s/$slug` é rota pública com loader que faz select em `sites` com cliente publishable server-side; head() dinâmico com título/descrição do site
- Geração IA em `createServerFn` protegido, gravando `content` em `sites`
- Editor: form simples que atualiza `content` (sem drag-and-drop no V1)
- Publicação = toggle `published` no site

## Fora do V1 (para depois)

- Domínios customizados por site
- Múltiplos templates
- Editor drag-and-drop
- Analytics dos sites publicados
- Captura de leads nos sites (formulários que salvam no Cloud)
- Planos pagos / Stripe

## Próximo passo

Ao aprovar, ativo o Lovable Cloud, crio o schema, e construo landing + auth + dashboard + gerador + rota pública nessa ordem. Confirma?