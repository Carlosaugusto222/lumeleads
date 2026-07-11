import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Plus, Upload, Download, Search, Trash2, Phone, MessageCircle, Loader2, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listLeads, createLead, deleteLead, bulkImportLeads, type LeadTier } from "@/lib/leads.functions";

export const Route = createFileRoute("/_authenticated/app/leads")({
  component: LeadsPage,
});

const TIER_STYLES: Record<LeadTier, string> = {
  frio: "bg-sky-500/15 text-sky-400",
  morno: "bg-amber-500/15 text-amber-400",
  quente: "bg-rose-500/15 text-rose-400",
};

function LeadsPage() {
  const listFn = useServerFn(listLeads);
  const delFn = useServerFn(deleteLead);
  const importFn = useServerFn(bulkImportLeads);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "sem_site" | "com_telefone" | "quente">("todos");

  const { data, isLoading } = useQuery({ queryKey: ["leads"], queryFn: () => listFn() });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((l) => {
      if (filter === "sem_site" && l.has_website) return false;
      if (filter === "com_telefone" && !l.phone) return false;
      if (filter === "quente" && l.tier !== "quente") return false;
      if (!q) return true;
      const t = `${l.name} ${l.category ?? ""} ${l.city ?? ""} ${l.phone ?? ""}`.toLowerCase();
      return t.includes(q.toLowerCase());
    });
  }, [data, q, filter]);

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Lead excluído"); qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["dash-stats"] }); },
  });

  function exportCsv() {
    const rows = (data ?? []).map((l) => ({
      name: l.name, category: l.category, city: l.city, state: l.state,
      phone: l.phone, email: l.email, website: l.website, has_website: l.has_website,
      tier: l.tier, status: l.status, score: l.score,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvUpload(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: async (r) => {
        const leads = r.data.filter((row) => row.name).map((row) => ({
          name: row.name,
          category: row.category || null,
          city: row.city || null,
          state: row.state || null,
          phone: row.phone || null,
          email: row.email || null,
          website: row.website || null,
          has_website: row.website ? true : row.has_website === "true",
          notes: row.notes || null,
        }));
        if (!leads.length) return toast.error("CSV vazio ou sem coluna 'name'");
        try {
          const res = await importFn({ data: { leads } });
          toast.success(`${res.inserted} leads importados`);
          qc.invalidateQueries({ queryKey: ["leads"] });
          qc.invalidateQueries({ queryKey: ["dash-stats"] });
        } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
      },
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Encontre e organize os negócios locais que quer prospectar</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, categoria, cidade ou telefone…" className="pl-9" />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
          {(["todos", "sem_site", "com_telefone", "quente"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {f === "sem_site" ? "Sem site" : f === "com_telefone" ? "Com telefone" : f === "quente" ? "Quentes" : "Todos"}
            </button>
          ))}
        </div>
        <label>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])} />
          <Button size="sm" variant="outline" asChild><span><Upload className="h-4 w-4" /> Importar CSV</span></Button>
        </label>
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Exportar</Button>
        <NewLeadDialog />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total" value={data?.length ?? 0} />
        <Stat label="Sem site" value={(data ?? []).filter((l) => !l.has_website).length} accent />
        <Stat label="Quentes" value={(data ?? []).filter((l) => l.tier === "quente").length} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          Nenhum lead. Cadastre manualmente ou importe um CSV com as colunas: name, category, city, state, phone, email, website.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <div key={l.id} className="rounded-xl border border-border/60 bg-card/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.category ?? "—"}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TIER_STYLES[l.tier as LeadTier]}`}>{l.tier}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className={l.has_website ? "text-emerald-400" : "text-rose-400"}>{l.has_website ? "Tem site" : "Sem site"}</span>
                {l.rating != null && (<><Star className="ml-2 h-3 w-3 text-amber-400" />{l.rating}</>)}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{[l.city, l.state].filter(Boolean).join(", ")}</div>
              {l.phone && <div className="mt-1 text-xs">{l.phone}</div>}
              <div className="mt-3 flex flex-wrap gap-2">
                {l.phone && (
                  <>
                    <a href={`tel:${l.phone}`}><Button size="sm" variant="outline"><Phone className="h-3 w-3" />Ligar</Button></a>
                    <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline"><MessageCircle className="h-3 w-3" />WhatsApp</Button>
                    </a>
                  </>
                )}
                <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => confirm(`Excluir ${l.name}?`) && delMut.mutate(l.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card/50"}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function NewLeadDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", city: "", state: "", phone: "", website: "", notes: "", tier: "frio" as LeadTier });
  const createFn = useServerFn(createLead);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => createFn({ data: { ...form, has_website: !!form.website } }),
    onSuccess: () => {
      toast.success("Lead criado");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["dash-stats"] });
      setOpen(false);
      setForm({ name: "", category: "", city: "", state: "", phone: "", website: "", notes: "", tier: "frio" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" /> Novo lead</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Nome *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Tier">
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as LeadTier })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="frio">Frio</SelectItem><SelectItem value="morno">Morno</SelectItem><SelectItem value="quente">Quente</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Estado"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Website"><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="opcional" /></Field>
          </div>
          <Field label="Notas"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={!form.name || mut.isPending} className="bg-gradient-primary text-primary-foreground">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
