import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Rocket, CheckCircle2, Circle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/docs")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: rows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    if (!rows?.some((r) => r.role === "admin")) throw redirect({ to: "/app" });
  },
  component: DocsPage,
});

type Tab = "docs" | "roadmap" | "changelog";

const CHANGELOG: Array<{ date: string; title: string; items: string[] }> = [
  {
    date: "2026-07-13",
    title: "Documentação interna + Roadmap",
    items: [
      "Nova página /app/docs restrita a super admins",
      "Documentação completa da arquitetura e módulos",
      "Roadmap de melhorias versionado no código",
    ],
  },
  {
    date: "2026-07-12",
    title: "Onboarding em vídeo",
    items: [
      "Dialog de boas-vindas com tutorial de 20s (Remotion)",
      "Flag em localStorage: sitelume:onboarding-seen",
    ],
  },
  {
    date: "2026-07-11",
    title: "Configurações da conta + Instagram scraping",
    items: [
      "Tela /app/settings (perfil, segurança, dispositivos, excluir conta)",
      "Firecrawl como fonte de fotos do Instagram público no wizard",
    ],
  },
];

const ROADMAP: Array<{
  status: "done" | "doing" | "todo";
  phase: string;
  title: string;
  desc: string;
}> = [
  { status: "done", phase: "Core", title: "Busca Google Places + CRM Kanban", desc: "56 categorias, planos, limites por período." },
  { status: "done", phase: "Core", title: "Wizard de sites em 5 passos", desc: "Lead → Cores → Fotos → Redes → Gerar (IA)." },
  { status: "done", phase: "Admin", title: "Painel Super Admin", desc: "Usuários, planos, categorias, estatísticas." },
  { status: "done", phase: "Conta", title: "Configurações e onboarding", desc: "Perfil, segurança, delete account, vídeo tutorial." },
  { status: "doing", phase: "Sites", title: "Pexels + Unsplash como fontes extras", desc: "Complementar fotos do Google Places e Instagram." },
  { status: "doing", phase: "Sites", title: "Templates de tema", desc: "3–5 layouts distintos (moderno, clássico, bold, minimal)." },
  { status: "todo", phase: "Sites", title: "Analytics do site publicado", desc: "Views, cliques em WhatsApp, formulário, mapa." },
  { status: "todo", phase: "Sites", title: "Domínio próprio por site", desc: "CNAME + verificação + SSL automático." },
  { status: "todo", phase: "CRM", title: "Automação de follow-up", desc: "Sequências por status do lead (WhatsApp/email)." },
  { status: "todo", phase: "CRM", title: "Integração WhatsApp Business API", desc: "Envio direto do CRM, templates aprovados." },
  { status: "todo", phase: "IA", title: "Copywriting por segmento", desc: "Prompts específicos para 56 categorias." },
  { status: "todo", phase: "IA", title: "Geração de logotipo", desc: "Logo simples via IA quando o lead não tem." },
  { status: "todo", phase: "Conta", title: "Dispositivos ativos reais", desc: "Listagem de sessões Supabase + revogar." },
  { status: "todo", phase: "Billing", title: "Stripe checkout + webhooks", desc: "Assinatura recorrente com upgrade/downgrade." },
  { status: "todo", phase: "Growth", title: "Programa de indicação", desc: "Créditos por indicação convertida." },
  { status: "todo", phase: "Qualidade", title: "Testes e2e do wizard", desc: "Playwright cobrindo o fluxo completo." },
];

function DocsPage() {
  const [tab, setTab] = useState<Tab>("docs");
  const tabs: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
    { id: "docs", label: "Documentação", icon: BookOpen },
    { id: "roadmap", label: "Roadmap", icon: Rocket },
    { id: "changelog", label: "Changelog", icon: Clock },
  ];
  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Documentação interna</h1>
        <p className="text-sm text-muted-foreground">
          Restrito a super admins. Atualize sempre que algo mudar no sistema.
        </p>
      </header>

      <div className="mb-6 flex gap-1 rounded-lg border border-border/50 bg-card/40 p-1 backdrop-blur-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "docs" && <DocsContent />}
      {tab === "roadmap" && <RoadmapContent />}
      {tab === "changelog" && <ChangelogContent />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-xl">
      <h2 className="mb-3 font-display text-xl font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function DocsContent() {
  return (
    <div>
      <Section title="Visão geral">
        <p>
          <strong className="text-foreground">Sitelume</strong> é um SaaS para pequenos negócios que integra
          prospecção de leads via Google Places, CRM Kanban, agenda e geração de mini-sites com IA.
          Modelo freemium com 4 planos e painel Super Admin.
        </p>
      </Section>

      <Section title="Stack técnica">
        <ul className="ml-4 list-disc space-y-1">
          <li>TanStack Start v1 (React 19, Vite 7, SSR + server functions)</li>
          <li>Tailwind v4 + shadcn/ui, tokens semânticos em <code>src/styles.css</code></li>
          <li>Lovable Cloud (Supabase) para banco, auth e RLS</li>
          <li>Lovable AI Gateway para geração de conteúdo</li>
          <li>Firecrawl (Instagram), Google Places, futura Pexels/Unsplash</li>
          <li>Remotion para vídeos de onboarding</li>
        </ul>
      </Section>

      <Section title="Estrutura de rotas">
        <ul className="ml-4 list-disc space-y-1">
          <li><code>/</code>, <code>/auth</code>, <code>/s/$slug</code> — públicas</li>
          <li><code>/app</code> — dashboard (gate <code>_authenticated</code>)</li>
          <li><code>/app/buscar</code>, <code>/app/leads</code>, <code>/app/crm</code>, <code>/app/agenda</code></li>
          <li><code>/app/sites</code>, <code>/app/sites/$id</code>, <code>/app/new</code> (wizard)</li>
          <li><code>/app/billing</code>, <code>/app/settings</code></li>
          <li><code>/app/admin</code>, <code>/app/docs</code> — só admins</li>
        </ul>
      </Section>

      <Section title="Banco de dados (public)">
        <ul className="ml-4 list-disc space-y-1">
          <li><code>profiles</code>, <code>user_roles</code> (enum app_role), <code>subscriptions</code></li>
          <li><code>plans</code>, <code>categories</code>, <code>usage_counters</code></li>
          <li><code>leads</code>, <code>appointments</code></li>
          <li><code>sites</code>, <code>site_submissions</code></li>
        </ul>
        <p>Todas com RLS ativado e GRANTs explícitos. Roles em tabela separada + <code>has_role()</code> SECURITY DEFINER.</p>
      </Section>

      <Section title="Server functions">
        <ul className="ml-4 list-disc space-y-1">
          <li><code>plans.functions.ts</code> — <code>getMyPlan</code> (plano, categorias permitidas, usage, isAdmin)</li>
          <li><code>places.functions.ts</code> — busca Google Places, <code>fetchPlacePhotos</code></li>
          <li><code>leads.functions.ts</code>, <code>appointments.functions.ts</code></li>
          <li><code>sites.functions.ts</code>, <code>site-wizard.functions.ts</code> — geração via AI Gateway</li>
          <li><code>submissions.functions.ts</code> — formulário público do site</li>
          <li><code>admin.functions.ts</code> — stats, users, plans, categorias</li>
          <li><code>account.functions.ts</code> — perfil, senha, delete account</li>
        </ul>
      </Section>

      <Section title="Auth e segurança">
        <p>
          Gate managed em <code>src/routes/_authenticated/route.tsx</code>. Middleware <code>requireSupabaseAuth</code> em
          todas as server fns de negócio. <code>supabaseAdmin</code> só dentro de handlers server-only, após
          checar <code>has_role('admin')</code>. Nunca armazenar roles no profile.
        </p>
      </Section>

      <Section title="Integrações externas">
        <ul className="ml-4 list-disc space-y-1">
          <li><strong>Google Places</strong> — busca de leads e fotos</li>
          <li><strong>Firecrawl</strong> — scraping de perfis públicos do Instagram</li>
          <li><strong>Lovable AI Gateway</strong> — geração de copy do site</li>
          <li><strong>Pexels / Unsplash</strong> — planejado, fontes extras de fotos</li>
        </ul>
      </Section>

      <Section title="Convenções de código">
        <ul className="ml-4 list-disc space-y-1">
          <li>Sem cores hardcoded — usar tokens semânticos</li>
          <li>Server fns em <code>*.functions.ts</code>; helpers server-only em <code>*.server.ts</code></li>
          <li>Novas tabelas em <code>public</code> exigem GRANT + RLS + policies na mesma migração</li>
          <li>Atualizar esta página a cada release relevante</li>
        </ul>
      </Section>
    </div>
  );
}

function RoadmapContent() {
  const groups = Array.from(new Set(ROADMAP.map((r) => r.phase)));
  const iconFor = (s: (typeof ROADMAP)[number]["status"]) =>
    s === "done" ? CheckCircle2 : s === "doing" ? Clock : Circle;
  const colorFor = (s: (typeof ROADMAP)[number]["status"]) =>
    s === "done" ? "text-emerald-500" : s === "doing" ? "text-amber-500" : "text-muted-foreground";

  return (
    <div>
      <Section title="Visão do produto">
        <p>
          Ser o SaaS de aquisição + presença digital mais completo para pequenos negócios no Brasil:
          encontrar clientes, organizar o funil e publicar um site profissional em minutos — tudo no
          mesmo lugar, com IA e preço acessível.
        </p>
      </Section>

      {groups.map((phase) => (
        <section key={phase} className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{phase}</h3>
          <div className="space-y-2">
            {ROADMAP.filter((r) => r.phase === phase).map((r, i) => {
              const Icon = iconFor(r.status);
              return (
                <div key={i} className="flex gap-3 rounded-lg border border-border/50 bg-card/40 p-3 backdrop-blur-xl">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${colorFor(r.status)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function ChangelogContent() {
  return (
    <div className="space-y-3">
      {CHANGELOG.map((c) => (
        <section key={c.date} className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-xl">
          <div className="mb-2 flex items-baseline gap-3">
            <span className="text-xs font-mono text-muted-foreground">{c.date}</span>
            <h3 className="font-display text-base font-semibold">{c.title}</h3>
          </div>
          <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
            {c.items.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
