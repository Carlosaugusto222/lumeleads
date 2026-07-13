import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Users, LayoutDashboard, Package, Tags, Shield, Loader2, Trash2, ScrollText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getMyPlan } from "@/lib/plans.functions";
import {
  adminStats, adminListUsers, adminSetUserPlan, adminSetUserRole,
  adminUpdatePlan, adminUpsertCategory, adminDeleteCategory, adminAuditLog, adminMetrics,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!rows?.some((r) => r.role === "admin")) throw redirect({ to: "/app" });
  },
  component: AdminPage,
});

type Tab = "overview" | "metrics" | "users" | "plans" | "categories" | "audit";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const planFn = useServerFn(getMyPlan);
  const planQ = useQuery({ queryKey: ["my-plan"], queryFn: () => planFn() });

  const tabs: Array<{ id: Tab; label: string; icon: typeof Users }> = [
    { id: "overview", label: "Visão geral", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "plans", label: "Planos", icon: Package },
    { id: "categories", label: "Categorias", icon: Tags },
    { id: "audit", label: "Auditoria", icon: ScrollText },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold">Super Admin</h1>
          <p className="text-sm text-muted-foreground">Gestão da plataforma</p>
        </div>
      </header>

      <div className="mb-6 flex gap-1 rounded-xl border border-border/60 bg-card/50 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "users" && <UsersTab plans={planQ.data?.plans ?? []} />}
      {tab === "plans" && <PlansTab plans={planQ.data?.plans ?? []} />}
      {tab === "categories" && <CategoriesTab plans={planQ.data?.plans ?? []} categories={planQ.data?.categories ?? []} />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

function AuditTab() {
  const fn = useServerFn(adminAuditLog);
  const q = useQuery({ queryKey: ["admin-audit"], queryFn: () => fn() });
  if (q.isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="p-3">Quando</th><th className="p-3">Ator</th><th className="p-3">Ação</th><th className="p-3">Alvo</th><th className="p-3">Detalhes</th></tr>
        </thead>
        <tbody>
          {q.data?.entries.map((e) => (
            <tr key={e.id} className="border-t border-border/40">
              <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
              <td className="p-3 text-xs">{e.actor_email}</td>
              <td className="p-3"><span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{e.action}</span></td>
              <td className="p-3 text-xs">{e.target_email ?? "—"}</td>
              <td className="p-3 text-xs text-muted-foreground font-mono">{JSON.stringify(e.metadata)}</td>
            </tr>
          ))}
          {!q.data?.entries.length && (
            <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">Nenhum registro ainda.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Overview() {
  const fn = useServerFn(adminStats);
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  if (q.isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  const s = q.data;
  if (!s) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Kpi label="Usuários" value={s.users} />
      <Kpi label="Sites" value={s.sites} />
      <Kpi label="Leads" value={s.leads} />
      <Kpi label="Buscas no mês" value={s.monthSearches} />
      <Kpi label="Leads salvos no mês" value={s.monthSaved} />
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Assinantes por plano</div>
        <div className="mt-2 space-y-1 text-sm">
          {Object.entries(s.planCounts).map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="font-semibold">{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function UsersTab({ plans }: { plans: any[] }) {
  const [search, setSearch] = useState("");
  const listFn = useServerFn(adminListUsers);
  const setPlanFn = useServerFn(adminSetUserPlan);
  const setRoleFn = useServerFn(adminSetUserRole);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-users", search], queryFn: () => listFn({ data: { search } }) });

  const planMut = useMutation({
    mutationFn: (v: { userId: string; planId: string }) => setPlanFn({ data: v }),
    onSuccess: () => { toast.success("Plano atualizado"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const roleMut = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "user"; grant: boolean }) => setRoleFn({ data: v }),
    onSuccess: () => { toast.success("Papel atualizado"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div>
      <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Usuário</th><th className="p-3">Plano</th><th className="p-3">Uso mês</th><th className="p-3">Admin</th></tr>
          </thead>
          <tbody>
            {q.data?.users.map((u) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="p-3">
                    <div className="font-medium">{u.display_name || u.email || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <Select value={u.plan_id} onValueChange={(v) => planMut.mutate({ userId: u.id, planId: v })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{u.searches} buscas · {u.saved_leads} leads</td>
                  <td className="p-3">
                    <Button size="sm" variant={isAdmin ? "default" : "outline"}
                      onClick={() => roleMut.mutate({ userId: u.id, role: "admin", grant: !isAdmin })}>
                      {isAdmin ? "Remover admin" : "Tornar admin"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlansTab({ plans }: { plans: any[] }) {
  const upd = useServerFn(adminUpdatePlan);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (v: { planId: string; patch: any }) => upd({ data: v }),
    onSuccess: () => { toast.success("Plano atualizado"); qc.invalidateQueries({ queryKey: ["my-plan"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((p) => <PlanEditor key={p.id} plan={p} onSave={(patch) => mut.mutate({ planId: p.id, patch })} saving={mut.isPending} />)}
    </div>
  );
}

function PlanEditor({ plan, onSave, saving }: { plan: any; onSave: (patch: any) => void; saving: boolean }) {
  const [f, setF] = useState({
    name: plan.name,
    max_categories: plan.max_categories,
    monthly_searches: plan.monthly_searches,
    monthly_saved_leads: plan.monthly_saved_leads,
    price_cents: plan.price_cents,
    detailed_search: plan.detailed_search,
  });
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-bold">{plan.name}</div>
        <span className="text-xs text-muted-foreground">{plan.id}</span>
      </div>
      <div className="grid gap-2 text-sm">
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Máx. categorias"><Input type="number" value={f.max_categories} onChange={(e) => setF({ ...f, max_categories: +e.target.value })} /></Field>
        <Field label="Buscas/mês (-1 = ∞)"><Input type="number" value={f.monthly_searches} onChange={(e) => setF({ ...f, monthly_searches: +e.target.value })} /></Field>
        <Field label="Leads salvos/mês (-1 = ∞)"><Input type="number" value={f.monthly_saved_leads} onChange={(e) => setF({ ...f, monthly_saved_leads: +e.target.value })} /></Field>
        <Field label="Preço (centavos)"><Input type="number" value={f.price_cents} onChange={(e) => setF({ ...f, price_cents: +e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={f.detailed_search} onChange={(e) => setF({ ...f, detailed_search: e.target.checked })} />
          Busca detalhada (bairro)
        </label>
      </div>
      <Button size="sm" className="mt-3 w-full" disabled={saving} onClick={() => onSave(f)}>Salvar</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1"><span className="text-xs text-muted-foreground">{label}</span>{children}</label>;
}

function CategoriesTab({ plans, categories }: { plans: any[]; categories: any[] }) {
  const up = useServerFn(adminUpsertCategory);
  const del = useServerFn(adminDeleteCategory);
  const qc = useQueryClient();
  const [newCat, setNewCat] = useState({ slug: "", label: "", min_plan: "gratuito", active: true, sort_order: 999 });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-plan"] });
  const upMut = useMutation({
    mutationFn: (v: any) => up({ data: v }),
    onSuccess: () => { toast.success("Categoria salva"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const delMut = useMutation({
    mutationFn: (slug: string) => del({ data: { slug } }),
    onSuccess: () => { toast.success("Categoria removida"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <div className="mb-2 text-sm font-semibold">Nova categoria</div>
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_140px_100px]">
          <Input placeholder="slug (ex: pet-shop)" value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })} />
          <Input placeholder="Nome exibido" value={newCat.label} onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} />
          <Select value={newCat.min_plan} onValueChange={(v) => setNewCat({ ...newCat, min_plan: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => upMut.mutate(newCat)} disabled={!newCat.slug || !newCat.label}>Adicionar</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Categoria</th><th className="p-3">Plano mínimo</th><th className="p-3">Ativa</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.slug} className="border-t border-border/40">
                <td className="p-3"><div className="font-medium">{c.label}</div><div className="text-xs text-muted-foreground">{c.slug}</div></td>
                <td className="p-3">
                  <Select value={c.min_plan} onValueChange={(v) => upMut.mutate({ ...c, min_plan: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-3">
                  <input type="checkbox" checked={c.active} onChange={(e) => upMut.mutate({ ...c, active: e.target.checked })} />
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => delMut.mutate(c.slug)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

