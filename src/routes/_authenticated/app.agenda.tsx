import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAppointments, createAppointment, deleteAppointment } from "@/lib/appointments.functions";
import { listLeads } from "@/lib/leads.functions";

export const Route = createFileRoute("/_authenticated/app/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  const fn = useServerFn(listAppointments);
  const delFn = useServerFn(deleteAppointment);
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(new Date());

  const { data, isLoading } = useQuery({ queryKey: ["appts"], queryFn: () => fn() });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const out: Date[] = [];
    let d = start;
    while (d <= end) { out.push(d); d = addDays(d, 1); }
    return out;
  }, [cursor]);

  const today = new Date();
  const startWeek = startOfWeek(today, { weekStartsOn: 0 });
  const endWeek = endOfWeek(today, { weekStartsOn: 0 });
  const stats = {
    hoje: (data ?? []).filter((a) => isSameDay(new Date(a.starts_at), today)).length,
    semana: (data ?? []).filter((a) => { const d = new Date(a.starts_at); return d >= startWeek && d <= endWeek; }).length,
    pendentes: (data ?? []).filter((a) => a.status === "pendente").length,
  };

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["appts"] }); },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Agendamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visualize e gerencie seus agendamentos</p>
        </div>
        <NewApptDialog />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Hoje" value={stats.hoje} />
        <Stat label="Esta semana" value={stats.semana} />
        <Stat label="Pendentes" value={stats.pendentes} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="min-w-[140px] text-center font-semibold capitalize">{format(cursor, "MMMM yyyy", { locale: ptBR })}</div>
            <Button size="icon" variant="ghost" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setCursor(new Date())} className="text-primary">Hoje</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-border/60 text-xs">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="bg-card/60 p-2 text-center font-semibold text-muted-foreground">{d}</div>
            ))}
            {days.map((d) => {
              const dayAppts = (data ?? []).filter((a) => isSameDay(new Date(a.starts_at), d));
              const inMonth = isSameMonth(d, cursor);
              const isToday = isSameDay(d, today);
              return (
                <div key={d.toISOString()} className={`min-h-[92px] bg-card/60 p-1.5 ${!inMonth ? "opacity-40" : ""}`}>
                  <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${isToday ? "bg-primary text-primary-foreground font-semibold" : ""}`}>
                    {format(d, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayAppts.slice(0, 3).map((a) => (
                      <div key={a.id} className="group flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                        <span className="truncate">{format(new Date(a.starts_at), "HH:mm")} {a.title}</span>
                        <button onClick={() => confirm(`Remover "${a.title}"?`) && delMut.mutate(a.id)}
                          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {dayAppts.length > 3 && <div className="text-[10px] text-muted-foreground">+{dayAppts.length - 3} mais</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-5">
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function NewApptDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", starts_at: "", duration_min: 30, location: "", notes: "", lead_id: "" });
  const createFn = useServerFn(createAppointment);
  const leadsFn = useServerFn(listLeads);
  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: () => leadsFn(), enabled: open });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => createFn({ data: { ...form, lead_id: form.lead_id || null, starts_at: new Date(form.starts_at).toISOString() } }),
    onSuccess: () => {
      toast.success("Agendamento criado");
      qc.invalidateQueries({ queryKey: ["appts"] });
      setOpen(false);
      setForm({ title: "", starts_at: "", duration_min: 30, location: "", notes: "", lead_id: "" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4" /> Novo agendamento</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <F label="Título *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Data e hora *"><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></F>
            <F label="Duração (min)"><Input type="number" min={5} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} /></F>
          </div>
          <F label="Lead">
            <Select value={form.lead_id || "none"} onValueChange={(v) => setForm({ ...form, lead_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {leads?.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <F label="Local"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Google Meet, telefone, endereço…" /></F>
          <F label="Notas"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></F>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={!form.title || !form.starts_at || mut.isPending} className="bg-gradient-primary text-primary-foreground">Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
