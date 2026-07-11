import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import { Phone, MessageCircle, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listLeads, setLeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadStatus, type LeadTier } from "@/lib/leads.functions";

export const Route = createFileRoute("/_authenticated/app/crm")({
  component: CrmPage,
});

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data, isLoading } = useQuery({ queryKey: ["leads"], queryFn: () => listFn() });

  const grouped = useMemo(() => {
    const g: Record<LeadStatus, typeof data extends infer T ? (T extends Array<infer U> ? U[] : never) : never> = {
      base: [], abordado: [], agendado: [], follow_up: [], convertido: [], perdido: [],
    } as never;
    for (const l of data ?? []) {
      if (filter === "sem_site" && l.has_website) continue;
      if (filter === "com_telefone" && !l.phone) continue;
      if (filter === "quente" && l.tier !== "quente") continue;
      if (q && !`${l.name} ${l.category ?? ""} ${l.city ?? ""} ${l.phone ?? ""}`.toLowerCase().includes(q.toLowerCase())) continue;
      (g[l.status as LeadStatus] ??= []).push(l);
    }
    return g;
  }, [data, q, filter]);

  const moveMut = useMutation({
    mutationFn: (v: { id: string; status: LeadStatus }) => moveFn({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData<typeof data>(["leads"]);
      qc.setQueryData<typeof data>(["leads"], (old) => old?.map((l) => l.id === v.id ? { ...l, status: v.status } : l) ?? old);
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

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">CRM</h1>
        <p className="mt-1 text-sm text-muted-foreground">Arraste os leads entre as colunas para atualizar o status</p>
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
                  <LeadCard key={l.id} lead={l} />
                ))}
              </Column>
            ))}
          </div>
        </DndContext>
      )}
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

type Lead = { id: string; name: string; category: string | null; city: string | null; phone: string | null; score: number; tier: string; has_website: boolean };

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`cursor-grab rounded-lg border border-border/50 bg-background/60 p-3 shadow-sm transition-shadow hover:shadow-md ${isDragging ? "opacity-50" : ""}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">{lead.score}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TIER_STYLES[lead.tier as LeadTier] ?? ""}`}>{lead.tier}</span>
      </div>
      <div className="truncate text-sm font-semibold">{lead.name}</div>
      <div className="truncate text-xs text-muted-foreground">{[lead.category, lead.city].filter(Boolean).join(" · ")}</div>
      {lead.phone && (
        <div className="mt-2 flex gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <a href={`tel:${lead.phone}`} className="flex-1 rounded-md bg-muted/60 px-2 py-1 text-center text-[11px] hover:bg-muted"><Phone className="mr-1 inline h-3 w-3" />Ligar</a>
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
             className="flex-1 rounded-md bg-muted/60 px-2 py-1 text-center text-[11px] hover:bg-muted"><MessageCircle className="mr-1 inline h-3 w-3" />WhatsApp</a>
        </div>
      )}
    </div>
  );
}
