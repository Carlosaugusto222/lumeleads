import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Loader2, PenLine, Users } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateSite } from "@/lib/sites.functions";
import { listLeads } from "@/lib/leads.functions";

const newSiteSearchSchema = z.object({
  businessName: z.string().optional(),
  sector: z.string().optional(),
  audience: z.string().optional(),
  offer: z.string().optional(),
  leadId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/app/new")({
  validateSearch: newSiteSearchSchema,
  component: NewSite,
});

function NewSite() {
  const navigate = useNavigate();
  const gen = useServerFn(generateSite);
  const listLeadsFn = useServerFn(listLeads);
  const search = Route.useSearch();

  const [mode, setMode] = useState<"lead" | "manual">(
    search.businessName || search.leadId ? "lead" : "lead",
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string>(search.leadId ?? "");
  const [businessName, setBusinessName] = useState(search.businessName ?? "");
  const [sector, setSector] = useState(search.sector ?? "");
  const [audience, setAudience] = useState(search.audience ?? "");
  const [offer, setOffer] = useState(search.offer ?? "");
  const [tone, setTone] = useState<"profissional" | "descontraido" | "premium" | "amigavel">(
    "profissional",
  );

  const { data: leads, isLoading: loadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: () => listLeadsFn(),
  });

  const selectedLead = useMemo(
    () => leads?.find((l) => l.id === selectedLeadId),
    [leads, selectedLeadId],
  );

  // Auto-prefill fields when a lead is chosen
  useEffect(() => {
    if (mode !== "lead" || !selectedLead) return;
    setBusinessName(selectedLead.name);
    setSector(selectedLead.category ?? "");
    setAudience(selectedLead.city ? `Clientes em ${selectedLead.city}` : "");
    setOffer(`Site profissional para ${selectedLead.name}`);
  }, [selectedLead, mode]);

  const mut = useMutation({
    mutationFn: () =>
      gen({ data: { businessName, sector, audience, offer, tone } }),
    onSuccess: ({ id }) => {
      toast.success("Landing gerada!");
      navigate({ to: "/app/sites/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro na geração"),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Novo site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um lead do seu CRM ou preencha manualmente.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-card/40 p-1">
        <Button
          type="button"
          variant={mode === "lead" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("lead")}
          className="justify-center"
        >
          <Users className="h-4 w-4" /> Usar um lead do CRM
        </Button>
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("manual")}
          className="justify-center"
        >
          <PenLine className="h-4 w-4" /> Preencher manualmente
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!businessName || !sector || !audience || !offer) {
            toast.error("Preencha todos os campos");
            return;
          }
          mut.mutate();
        }}
        className="space-y-5 rounded-2xl border border-border/60 bg-card/60 p-6"
      >
        {mode === "lead" && (
          <div className="space-y-2">
            <Label>Escolha um lead *</Label>
            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingLeads ? "Carregando leads..." : "Selecione um lead"}
                />
              </SelectTrigger>
              <SelectContent>
                {(leads ?? []).length === 0 && !loadingLeads ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    Nenhum lead salvo ainda. Vá em Buscar Leads.
                  </div>
                ) : (
                  (leads ?? []).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                      {l.city ? ` — ${l.city}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedLead && (
              <p className="text-xs text-muted-foreground">
                Categoria: {selectedLead.category ?? "—"} · Cidade: {selectedLead.city ?? "—"}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="bn">Nome do negócio *</Label>
          <Input
            id="bn"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Ex: Café da Ana"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sc">Setor / o que faz *</Label>
          <Input
            id="sc"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Ex: Cafeteria artesanal com grãos especiais"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="au">Público-alvo *</Label>
          <Input
            id="au"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Ex: Profissionais criativos entre 25 e 45 anos"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="of">Sua oferta principal *</Label>
          <Textarea
            id="of"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Ex: Assinatura mensal de café especial entregue em casa"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Tom de voz</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profissional">Profissional</SelectItem>
              <SelectItem value="descontraido">Descontraído</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="amigavel">Amigável</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={mut.isPending}
          className="w-full bg-gradient-primary text-primary-foreground"
          size="lg"
        >
          {mut.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando sua landing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Gerar com IA
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          A geração leva cerca de 10 a 20 segundos.
        </p>
      </form>
    </div>
  );
}
