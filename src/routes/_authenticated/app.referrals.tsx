import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Gift, Users, Sparkles, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyReferrals, applyReferralCode } from "@/lib/referrals.functions";

export const Route = createFileRoute("/_authenticated/app/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyReferrals);
  const applyFn = useServerFn(applyReferralCode);
  const q = useQuery({ queryKey: ["my-referrals"], queryFn: () => getFn() });
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined" && q.data?.code
      ? `${window.location.origin}/auth?mode=signup&ref=${q.data.code}`
      : "";

  // Auto-apply code saved during signup
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!q.data) return;
    if (q.data.appliedReferrerId) return;
    const saved = window.localStorage.getItem("lumeleads:ref");
    if (!saved) return;
    applyFn({ data: { code: saved } })
      .then(() => {
        window.localStorage.removeItem("lumeleads:ref");
        qc.invalidateQueries({ queryKey: ["my-referrals"] });
      })
      .catch(() => window.localStorage.removeItem("lumeleads:ref"));
  }, [q.data, applyFn, qc]);

  const apply = useMutation({
    mutationFn: () => applyFn({ data: { code } }),
    onSuccess: () => {
      toast.success("Código aplicado!");
      setCode("");
      qc.invalidateQueries({ queryKey: ["my-referrals"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Link copiado");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Programa de indicação</h1>
        <p className="text-sm text-muted-foreground">
          Compartilhe seu link e ganhe créditos quando seus indicados assinarem um plano pago.
        </p>
      </header>

      {q.isLoading ? (
        <div className="rounded-xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi icon={Users} label="Indicados" value={q.data?.totals.total ?? 0} />
            <Kpi icon={Sparkles} label="Convertidos" value={q.data?.totals.converted ?? 0} />
            <Kpi icon={Gift} label="Créditos ganhos" value={q.data?.totals.credits ?? 0} />
          </div>

          <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="mb-2 text-sm font-semibold">Seu código</div>
            <div className="mb-4 font-mono text-2xl font-bold tracking-widest">{q.data?.code}</div>
            <div className="flex gap-2">
              <Input readOnly value={link} className="font-mono text-xs" />
              <Button type="button" onClick={copyLink} variant="secondary">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="mb-2 text-sm font-semibold">Fui indicado por alguém</div>
            {q.data?.appliedReferrerId ? (
              <p className="text-sm text-muted-foreground">
                Você já aplicou um código de indicação. Obrigado!
              </p>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.trim()) apply.mutate();
                }}
              >
                <Input
                  placeholder="Cole o código aqui"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={16}
                  className="font-mono"
                />
                <Button type="submit" disabled={apply.isPending || !code.trim()}>
                  Aplicar
                </Button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="mb-3 text-sm font-semibold">Suas indicações</div>
            {q.data?.referrals.length ? (
              <div className="divide-y divide-border/60">
                {q.data.referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma indicação ainda. Compartilhe seu link para começar.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-500" },
    converted: { label: "Convertido", cls: "bg-emerald-500/15 text-emerald-500" },
    rejected: { label: "Rejeitado", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? map.pending;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
