import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createMpCheckout } from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/app/billing")({
  component: BillingPage,
});

type Plan = {
  id: "gratuito" | "starter" | "pro" | "agencia";
  name: string;
  tagline: string;
  price: { monthly: number; yearly: number };
  highlight?: boolean;
  features: Array<{ label: string; on: boolean }>;
};

const PLANS: Plan[] = [
  {
    id: "gratuito", name: "Gratuito", tagline: "Para explorar a plataforma", price: { monthly: 0, yearly: 0 },
    features: [
      { label: "60 leads/mês", on: true }, { label: "5 categorias de negócio", on: true },
      { label: "10 scripts/mês", on: true }, { label: "2 sites/mês", on: true },
      { label: "3 edições/mês", on: true }, { label: "3 versões de site", on: true },
      { label: "Exportação CSV", on: false }, { label: "Link público para clientes", on: true },
      { label: "Dashboard completo", on: false }, { label: "Busca em todos os municípios do Brasil", on: false },
      { label: "Criação livre de sites", on: false }, { label: "Baixar HTML do site", on: false },
      { label: "Documentação", on: true },
    ],
  },
  {
    id: "starter", name: "Starter", tagline: "Para freelancers que estão começando", price: { monthly: 47, yearly: 33 },
    features: [
      { label: "500 leads/mês", on: true }, { label: "10 categorias de negócio", on: true },
      { label: "80 scripts/mês", on: true }, { label: "15 sites/mês", on: true },
      { label: "30 edições/mês", on: true }, { label: "10 versões de site", on: true },
      { label: "Exportação CSV", on: true }, { label: "Link público para clientes", on: true },
      { label: "Dashboard completo", on: true }, { label: "Busca em todos os municípios do Brasil", on: false },
      { label: "Criação livre de sites", on: false }, { label: "Baixar HTML do site", on: false },
      { label: "Suporte por e-mail", on: true },
    ],
  },
  {
    id: "pro", name: "Pro", tagline: "Para freelancers ativos", price: { monthly: 97, yearly: 68 }, highlight: true,
    features: [
      { label: "1500 leads/mês", on: true }, { label: "Todas as categorias de negócio", on: true },
      { label: "250 scripts/mês", on: true }, { label: "50 sites/mês", on: true },
      { label: "100 edições/mês", on: true }, { label: "30 versões de site", on: true },
      { label: "Exportação CSV", on: true }, { label: "Link público para clientes", on: true },
      { label: "Dashboard completo", on: true }, { label: "Busca em todos os municípios do Brasil", on: true },
      { label: "Criação livre de sites", on: true }, { label: "Baixar HTML do site", on: true },
      { label: "Suporte via WhatsApp", on: true },
    ],
  },
  {
    name: "Agência", tagline: "Para agências e equipes", price: { monthly: 197, yearly: 138 },
    features: [
      { label: "3000 leads/mês", on: true }, { label: "Todas as categorias de negócio", on: true },
      { label: "500 scripts/mês", on: true }, { label: "100 sites/mês", on: true },
      { label: "200 edições/mês", on: true }, { label: "Versões ilimitadas", on: true },
      { label: "Exportação CSV", on: true }, { label: "Link público para clientes", on: true },
      { label: "Dashboard completo", on: true }, { label: "Busca em todos os municípios do Brasil", on: true },
      { label: "Criação livre de sites", on: true }, { label: "Baixar HTML do site", on: true },
      { label: "WhatsApp prioritário + onboarding", on: true },
    ],
  },
];

function BillingPage() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Planos e Cobrança</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha o plano ideal para o seu volume de trabalho</p>
      </header>

      <div className="mb-8 rounded-2xl border border-border/60 bg-card/40 p-6">
        <div className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">Plano atual</div>
        <div className="mb-4 text-2xl font-semibold">Gratuito</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Usage label="Leads este mês" current={0} max={60} />
          <Usage label="Scripts este mês" current={0} max={10} />
          <Usage label="Sites gerados" current={0} max={2} />
          <Usage label="Edições este mês" current={0} max={3} />
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <div className="flex rounded-full bg-muted/40 p-1">
          <button onClick={() => setCycle("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm ${cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Mensal</button>
          <button onClick={() => setCycle("yearly")}
            className={`rounded-full px-4 py-1.5 text-sm ${cycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Anual <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">-30%</span></button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => (
          <div key={p.name}
            className={`relative flex flex-col rounded-2xl border p-6 ${p.highlight ? "border-primary bg-primary/5" : "border-border/60 bg-card/40"}`}>
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                <Sparkles className="mr-1 inline h-3 w-3" />Mais popular
              </div>
            )}
            <div className="font-semibold">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.tagline}</div>
            <div className="mt-4">
              {p.price.monthly === 0
                ? <div className="font-display text-4xl font-bold">Grátis</div>
                : (<div><span className="font-display text-4xl font-bold">R$ {cycle === "monthly" ? p.price.monthly : p.price.yearly}</span><span className="text-sm text-muted-foreground">,00/mês</span></div>)}
            </div>
            <ul className="my-6 flex-1 space-y-2 text-sm">
              {p.features.map((f, i) => (
                <li key={i} className={`flex items-center gap-2 ${f.on ? "" : "text-muted-foreground line-through"}`}>
                  {f.on ? <Check className="h-4 w-4 text-emerald-400" /> : <Minus className="h-4 w-4" />}
                  {f.label}
                </li>
              ))}
            </ul>
            <Button className={p.highlight ? "bg-gradient-primary text-primary-foreground" : ""} variant={p.highlight ? "default" : "outline"} disabled={p.price.monthly === 0}>
              {p.price.monthly === 0 ? "Plano atual" : "Fazer upgrade"}
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Pagamento seguro via Stripe · Cancele a qualquer momento · Suporte via WhatsApp</p>
    </div>
  );
}

function Usage({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{current}/{max}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/50"><div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
