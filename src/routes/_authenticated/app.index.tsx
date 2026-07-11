import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { getDashboardStats, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/leads.functions";

export const Route = createFileRoute("/_authenticated/app/")({
  component: DashboardPage,
});

const COLORS: Record<string, string> = {
  base: "#94a3b8",
  abordado: "#60a5fa",
  agendado: "#4ade80",
  follow_up: "#fbbf24",
  perdido: "#f87171",
  convertido: "#a78bfa",
};

function DashboardPage() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({ queryKey: ["dash-stats"], queryFn: () => fn() });

  if (isLoading || !data) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const chartData = LEAD_STATUS_ORDER.map((s) => ({
    key: s,
    label: LEAD_STATUS_LABELS[s],
    value: data.counts[s],
    color: COLORS[s],
  }));
  const abordadosTotal = data.counts.abordado + data.counts.agendado + data.counts.follow_up + data.counts.convertido + data.counts.perdido;
  const rates = {
    conversao: pct(data.counts.convertido, data.total),
    abordagem: pct(abordadosTotal, data.total),
    agendamento: pct(data.counts.agendado + data.counts.convertido, abordadosTotal),
    followup: pct(data.counts.follow_up, abordadosTotal),
    perdidos: pct(data.counts.perdido, abordadosTotal),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua operação</p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-card/50 p-6">
        <h2 className="mb-4 font-semibold">Funil de conversão</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((d) => <Cell key={d.key} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <KpiLine color={COLORS.base} label="Taxa de conversão" formula="(Convertidos / Total)" value={rates.conversao} />
          <KpiLine color={COLORS.abordado} label="Taxa de abordagem" formula="(Abordados / Total)" value={rates.abordagem} />
          <KpiLine color={COLORS.agendado} label="Taxa de agendamento" formula="(Agendados / Abordados)" value={rates.agendamento} />
          <KpiLine color={COLORS.follow_up} label="Taxa de follow up" formula="(Follow Up / Abordados)" value={rates.followup} />
          <KpiLine color={COLORS.perdido} label="Taxa de perdidos" formula="(Perdidos / Abordados)" value={rates.perdidos} />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de leads" value={data.total} />
        <StatCard label="Com site" value={data.withSite} />
        <StatCard label="Sem site" value={data.withoutSite} accent />
      </section>
    </div>
  );
}

function pct(n: number, d: number) {
  if (!d) return "0%";
  return `${Math.round((n / d) * 100)}%`;
}
function KpiLine({ color, label, formula, value }: { color: string; label: string; formula: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="font-medium" style={{ color }}>{label}</span>
      <span className="text-xs text-muted-foreground">{formula}</span>
      <span className="ml-auto font-semibold">{value}</span>
    </div>
  );
}
function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card/50"}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
