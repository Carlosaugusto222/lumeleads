import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { Phone, MessageCircle, Loader2, Search, X, ChevronLeft, ChevronRight, ArrowLeft, Star, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { listLeads, setLeadStatus, updateLead, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadStatus, type LeadTier } from "@/lib/leads.functions";
import { createAppointment } from "@/lib/appointments.functions";

export const Route = createFileRoute("/_authenticated/app/crm")({
  component: CrmPage,
});

type LeadRow = NonNullable<Awaited<ReturnType<typeof listLeads>>>[number];

const COLUMN_DOTS: Record<LeadStatus, string> = {
  base: "bg-slate-400", abordado: "bg-sky-400", agendado: "bg-emerald-400",
  follow_up: "bg-amber-400", convertido: "bg-violet-400", perdido: "bg-rose-400",
};
const TIER_STYLES: Record<LeadTier, string> = {
  frio: "bg-sky-500/15 text-sky-400", morno: "bg-amber-500/15 text-amber-400", quente: "bg-rose-500/15 text-rose-400",
};

function CrmPage() {
  const listFn = useServerFn(listLeads);
  const moveFn = useServerFn(setLeadStatus);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "sem_site" | "com_telefone" | "quente">("todos");
  const [openId, setOpenId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data, isLoading } = useQuery({ queryKey: ["leads"], queryFn: () => listFn() });

  const filtered = useMemo(() => {
    return (data ?? []).filter((l) => {
      if (filter === "sem_site" && l.has_website) return false;
      if (filter === "com_telefone" && !l.phone) return false;
      if (filter === "quente" && l.tier !== "quente") return false;
      if (q && !`${l.name} ${l.category ?? ""} ${l.city ?? ""} ${l.phone ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, filter]);

  const grouped = useMemo(() => {
    const g: Record<LeadStatus, LeadRow[]> = {
      base: [], abordado: [], agendado: [], follow_up: [], convertido: [], perdido: [],
    };
    for (const l of filtered) g[l.status as LeadStatus]?.push(l);
    return g;
  }, [filtered]);

  const moveMut = useMutation({
    mutationFn: (v: { id: string; status: LeadStatus }) => moveFn({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData<LeadRow[]>(["leads"]);
      qc.setQueryData<LeadRow[]>(["leads"], (old) => old?.map((l) => l.id === v.id ? { ...l, status: v.status } : l) ?? old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["leads"], ctx.prev); toast.error("Não consegui mover"); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["dash-stats"] }); },
  });

  function handleDragEnd(e: DragEndEvent) {
    const id = e.active.id as string;
    const to = e.over?.id as LeadStatus | undefined;
    if (!to) return;
    const lead = data?.find((l) => l.id === id);
    if (!lead || lead.status === to) return;
    moveMut.mutate({ id, status: to });
  }

  const openIndex = openId ? filtered.findIndex((l) => l.id === openId) : -1;
  const openLead = openIndex >= 0 ? filtered[openIndex] : null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">Arraste os leads entre as colunas — clique em um card para ver os detalhes</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, categoria, cidade ou telefone…" className="pl-9" />
          {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
          {(["todos", "sem_site", "com_telefone", "quente"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {f === "sem_site" ? "Sem site" : f === "com_telefone" ? "Com telefone" : f === "quente" ? "Quentes" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid gap-3 overflow-x-auto pb-4 [grid-template-columns:repeat(6,minmax(240px,1fr))]">
            {LEAD_STATUS_ORDER.map((status) => (
              <Column key={status} status={status} count={grouped[status]?.length ?? 0}>
                {(grouped[status] ?? []).map((l) => (
                  <LeadCard key={l.id} lead={l} onOpen={() => setOpenId(l.id)} />
                ))}
              </Column>
            ))}
          </div>
        </DndContext>
      )}

      <LeadDetailDialog
        lead={openLead}
        index={openIndex}
        total={filtered.length}
        onClose={() => setOpenId(null)}
        onPrev={() => openIndex > 0 && setOpenId(filtered[openIndex - 1].id)}
        onNext={() => openIndex >= 0 && openIndex < filtered.length - 1 && setOpenId(filtered[openIndex + 1].id)}
      />
    </div>
  );
}

function Column({ status, count, children }: { status: LeadStatus; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef}
      className={`flex min-h-[420px] flex-col rounded-xl border p-3 transition-colors ${isOver ? "border-primary bg-primary/5" : "border-border/60 bg-card/40"}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className={`inline-block h-2 w-2 rounded-full ${COLUMN_DOTS[status]}`} />
          {LEAD_STATUS_LABELS[status]}
        </div>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="flex-1 space-y-2">{children}</div>
      {count === 0 && <div className="pt-6 text-center text-xs text-muted-foreground">Sem leads</div>}
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: LeadRow; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onOpen}
      className={`cursor-pointer rounded-lg border border-border/50 bg-background/60 p-3 shadow-sm transition-shadow hover:shadow-md ${isDragging ? "opacity-50" : ""}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">{lead.score}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TIER_STYLES[lead.tier as LeadTier] ?? ""}`}>{lead.tier}</span>
      </div>
      <div className="truncate text-sm font-semibold">{lead.name}</div>
      <div className="truncate text-xs text-muted-foreground">{[lead.category, lead.city].filter(Boolean).join(" · ")}</div>
      {lead.phone && (
        <div className="mt-2 flex gap-1.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <a href={`tel:${lead.phone}`} className="flex-1 rounded-md bg-muted/60 px-2 py-1 text-center text-[11px] hover:bg-muted"><Phone className="mr-1 inline h-3 w-3" />Ligar</a>
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
             className="flex-1 rounded-md bg-muted/60 px-2 py-1 text-center text-[11px] hover:bg-muted"><MessageCircle className="mr-1 inline h-3 w-3" />WhatsApp</a>
        </div>
      )}
    </div>
  );
}

// ---------- Detail dialog ----------

const ETAPAS: LeadStatus[] = ["base", "abordado", "agendado", "follow_up", "convertido", "perdido"];
const RESULTADOS: { key: "aberto" | "ganho" | "perdido"; label: string; map: LeadStatus | null }[] = [
  { key: "aberto", label: "Em aberto", map: null },
  { key: "ganho", label: "Ganho", map: "convertido" },
  { key: "perdido", label: "Perdido", map: "perdido" },
];

function LeadDetailDialog({ lead, index, total, onClose, onPrev, onNext }: {
  lead: LeadRow | null; index: number; total: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const qc = useQueryClient();
  const moveFn = useServerFn(setLeadStatus);
  const updateFn = useServerFn(updateLead);

  const moveMut = useMutation({
    mutationFn: (v: { id: string; status: LeadStatus }) => moveFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: Record<string, unknown> }) => updateFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        {lead && (
          <>
            <div className="flex items-center justify-between border-b px-5 py-3 text-sm text-muted-foreground">
              <button onClick={onClose} className="flex items-center gap-1.5 hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> CRM <span className="mx-1">/</span> <span className="text-foreground">{lead.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <span>{index + 1} / {total}</span>
                <button onClick={onPrev} disabled={index <= 0} className="rounded p-1 hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={onNext} disabled={index >= total - 1} className="rounded p-1 hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="px-6 pt-5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">{lead.score}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TIER_STYLES[lead.tier as LeadTier] ?? ""}`}>{lead.tier}</span>
                <h2 className="text-xl font-semibold">{lead.name}</h2>
              </div>
            </div>

            <Tabs defaultValue="info" className="mt-3">
              <TabsList className="mx-6 h-auto justify-start gap-4 rounded-none border-b bg-transparent p-0">
                {[
                  ["info", "Informações"], ["scripts", "Scripts"], ["objecoes", "Objeções"],
                  ["site", "Site"], ["venda", "Venda"], ["agendar", "Agendar"],
                ].map(([v, l]) => (
                  <TabsTrigger key={v} value={v}
                    className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                <TabsContent value="info" className="mt-0 space-y-1">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Informações</div>
                  <InfoRow label="Categoria" value={lead.category} />
                  <InfoRow label="Cidade" value={[lead.city, lead.state].filter(Boolean).join(", ")} />
                  <InfoRow label="Telefone" value={lead.phone ? (
                    <span className="flex items-center gap-2">{lead.phone}
                      <a href={`tel:${lead.phone}`} className="text-primary text-xs hover:underline">Ligar</a>
                    </span>
                  ) : null} />
                  <InfoRow label="Endereço" value={lead.address} />
                  <InfoRow label="Avaliação" value={lead.rating ? (
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{lead.rating}/5 · {lead.reviews_count ?? 0} avaliações</span>
                  ) : null} />

                  <div className="pt-3">
                    <InfoRow label="Etapa" value={
                      <div className="flex flex-wrap gap-1.5">
                        {ETAPAS.map((s) => (
                          <button key={s} onClick={() => moveMut.mutate({ id: lead.id, status: s })}
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] ${lead.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                            {LEAD_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    } />
                    <InfoRow label="Status" value={
                      <div className="flex flex-wrap gap-1.5">
                        {RESULTADOS.map((r) => {
                          const active = r.key === "aberto" ? !["convertido", "perdido"].includes(lead.status) : lead.status === r.map;
                          return (
                            <button key={r.key} onClick={() => r.map && moveMut.mutate({ id: lead.id, status: r.map })}
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                              {r.label}
                            </button>
                          );
                        })}
                      </div>
                    } />
                    <InfoRow label="Site" value={lead.website ? (
                      <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <Globe className="h-3 w-3" />{lead.website}
                      </a>
                    ) : <span className="text-muted-foreground">Sem site</span>} />
                  </div>
                </TabsContent>

                <TabsContent value="scripts" className="mt-0 space-y-3 text-sm">
                  <ScriptBlock title="Abertura (WhatsApp)" text={`Olá! Aqui é da LeadSite. Vi que a ${lead.name} atende em ${lead.city ?? "sua cidade"} — passo rápido: criamos um site profissional pra vocês aparecerem melhor no Google e receberem mais clientes. Posso te mostrar em 2 minutos?`} />
                  <ScriptBlock title="Follow-up" text={`Oi! Voltando aqui rapidinho sobre o site da ${lead.name}. Consegui separar um modelo pronto pra vocês — quer que eu te envie o link?`} />
                  <ScriptBlock title="Fechamento" text={`Ótimo! Consigo publicar seu site ainda hoje. Posso avançar com o plano de R$ __/mês? Já deixo tudo no ar com seu domínio e WhatsApp.`} />
                </TabsContent>

                <TabsContent value="objecoes" className="mt-0 space-y-3 text-sm">
                  <ScriptBlock title="“Já tenho site”" text="Legal! Posso dar uma olhada pra te dizer se ele está aparecendo no Google e convertendo. Muitas vezes o site existe mas não gera cliente — a gente resolve isso." />
                  <ScriptBlock title="“Está caro”" text="Entendo. Nosso plano começa a partir de R$ __/mês, sem taxa de setup, e o retorno vem já no primeiro cliente que fecha pelo site. Posso te mostrar casos parecidos?" />
                  <ScriptBlock title="“Não tenho tempo”" text="Sem problema — a gente faz tudo pra você. Você só me envia logo, fotos e telefone. Em 24h está no ar." />
                </TabsContent>

                <TabsContent value="site" className="mt-0 space-y-3">
                  {lead.has_website ? (
                    <div className="rounded-lg border p-4 text-sm">
                      <div className="mb-1 font-medium">Site atual do lead</div>
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{lead.website}</a>
                      ) : <div className="text-muted-foreground">Marcado como “tem site”, sem URL cadastrada.</div>}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Esse lead ainda não tem site — ótima oportunidade de venda.</div>
                  )}
                  <Button asChild size="sm"><Link to="/app/new">Criar site para este lead</Link></Button>
                </TabsContent>

                <TabsContent value="venda" className="mt-0 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button variant="outline" onClick={() => moveMut.mutate({ id: lead.id, status: "convertido" })}>Marcar como Ganho</Button>
                    <Button variant="outline" onClick={() => moveMut.mutate({ id: lead.id, status: "perdido" })}>Marcar como Perdido</Button>
                    <Button variant="outline" onClick={() => moveMut.mutate({ id: lead.id, status: "follow_up" })}>Follow up</Button>
                  </div>
                  <NotesEditor lead={lead} onSave={(notes) => updateMut.mutate({ id: lead.id, patch: { notes } })} />
                </TabsContent>

                <TabsContent value="agendar" className="mt-0">
                  <AgendarForm leadId={lead.id} leadName={lead.name} onDone={onClose} />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

function ScriptBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 text-xs font-semibold text-muted-foreground">{title}</div>
      <p className="whitespace-pre-wrap">{text}</p>
      <button onClick={() => { navigator.clipboard.writeText(text); toast.success("Copiado"); }}
        className="mt-2 text-xs text-primary hover:underline">Copiar</button>
    </div>
  );
}

function NotesEditor({ lead, onSave }: { lead: LeadRow; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">Anotações</div>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Anotações sobre a venda…" />
      <Button size="sm" onClick={() => onSave(notes)}>Salvar</Button>
    </div>
  );
}

function AgendarForm({ leadId, leadName, onDone }: { leadId: string; leadName: string; onDone: () => void }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createAppointment);
  const [title, setTitle] = useState(`Contato com ${leadName}`);
  const [when, setWhen] = useState(() => new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const mut = useMutation({
    mutationFn: () => createFn({ data: { lead_id: leadId, title, starts_at: new Date(when).toISOString(), notes, duration_min: 30 } }),
    onSuccess: () => { toast.success("Agendado"); qc.invalidateQueries({ queryKey: ["appointments"] }); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Título</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Data e hora</label>
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Observações</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>
      <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Agendando…" : "Agendar"}</Button>
    </div>
  );
}
