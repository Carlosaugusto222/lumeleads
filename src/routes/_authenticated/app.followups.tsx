import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, MessageCircle, Mail, Send, X, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadStatus } from "@/lib/leads.functions";
import {
  createFollowupTemplate,
  deleteFollowupTemplate,
  deleteFollowupTask,
  listFollowupTasks,
  listFollowupTemplates,
  setFollowupTaskStatus,
  updateFollowupTemplate,
  type FollowupChannel,
} from "@/lib/followups.functions";

export const Route = createFileRoute("/_authenticated/app/followups")({
  component: FollowupsPage,
});

const CHANNEL_LABELS: Record<FollowupChannel, string> = { whatsapp: "WhatsApp", email: "E-mail" };

function FollowupsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Automação de follow-up</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modelos disparados automaticamente quando um lead muda de etapa no CRM.
          Use <code className="rounded bg-muted px-1">{"{{nome}}"}</code>, <code className="rounded bg-muted px-1">{"{{cidade}}"}</code>, <code className="rounded bg-muted px-1">{"{{categoria}}"}</code> nas mensagens.
        </p>
      </header>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Agendadas</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4"><TasksPanel /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- Templates ----------

function TemplatesPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFollowupTemplates);
  const delFn = useServerFn(deleteFollowupTemplate);
  const updFn = useServerFn(updateFollowupTemplate);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["fu-templates"], queryFn: () => listFn() });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fu-templates"] }); toast.success("Modelo removido"); },
  });
  const toggleMut = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => updFn({ data: { id: v.id, patch: { enabled: v.enabled } } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fu-templates"] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Novo modelo</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum modelo ainda. Crie um para que ele seja disparado sempre que um lead entrar na etapa escolhida.
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((t) => (
            <li key={t.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      {CHANNEL_LABELS[t.channel]}
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      Etapa: {LEAD_STATUS_LABELS[t.trigger_status as LeadStatus]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">após {t.delay_hours}h</span>
                  </div>
                  <div className="mt-1 truncate font-semibold">{t.name}</div>
                  {t.subject && <div className="truncate text-xs text-muted-foreground">Assunto: {t.subject}</div>}
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground line-clamp-3">{t.body}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    checked={t.enabled}
                    onCheckedChange={(v) => toggleMut.mutate({ id: t.id, enabled: v })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Remover este modelo?")) delMut.mutate(t.id); }}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TemplateDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function TemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createFollowupTemplate);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<FollowupChannel>("whatsapp");
  const [triggerStatus, setTriggerStatus] = useState<LeadStatus>("follow_up");
  const [delayHours, setDelayHours] = useState(24);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          name: name.trim(),
          channel,
          trigger_status: triggerStatus,
          delay_hours: delayHours,
          subject: channel === "email" ? subject : null,
          body: body.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Modelo criado");
      qc.invalidateQueries({ queryKey: ["fu-templates"] });
      setName(""); setSubject(""); setBody(""); setDelayHours(24);
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo modelo de follow-up</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Lembrete 24h" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as FollowupChannel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa gatilho</Label>
              <Select value={triggerStatus} onValueChange={(v) => setTriggerStatus(v as LeadStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{LEAD_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Disparar após (horas)</Label>
            <Input type="number" min={0} max={2160} value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value) || 0)} />
          </div>
          {channel === "email" && (
            <div className="space-y-1.5">
              <Label>Assunto</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Mensagem</Label>
            <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder={"Olá {{nome}}! Passando pra saber se você viu a proposta..."} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!name.trim() || !body.trim() || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar modelo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Tasks ----------

function TasksPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFollowupTasks);
  const setStatusFn = useServerFn(setFollowupTaskStatus);
  const delFn = useServerFn(deleteFollowupTask);
  const [filter, setFilter] = useState<"pending" | "sent" | "cancelled" | undefined>("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["fu-tasks", filter],
    queryFn: () => listFn({ data: filter ? { status: filter } : {} }),
  });

  const setMut = useMutation({
    mutationFn: (v: { id: string; status: "sent" | "cancelled" | "pending" }) => setStatusFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fu-tasks"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fu-tasks"] }); toast.success("Removido"); },
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-muted/40 p-1 w-fit">
        {(["pending", "sent", "cancelled"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {f === "pending" ? "Pendentes" : f === "sent" ? "Enviadas" : "Canceladas"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma tarefa {filter === "pending" ? "pendente" : filter === "sent" ? "enviada" : "cancelada"}.
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((task) => {
            const lead = (task as unknown as { leads: { name: string; phone: string | null; email: string | null } }).leads;
            const phone = lead?.phone?.replace(/\D/g, "");
            const overdue = new Date(task.scheduled_for).getTime() < Date.now();
            return (
              <li key={task.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {task.channel === "whatsapp" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-500">
                          <Mail className="h-3 w-3" /> E-mail
                        </span>
                      )}
                      <span className="font-semibold">{lead?.name ?? "Lead"}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] ${overdue && task.status === "pending" ? "text-amber-500" : "text-muted-foreground"}`}>
                        <Clock className="h-3 w-3" />
                        {format(new Date(task.scheduled_for), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {task.subject && <div className="mt-1 text-xs text-muted-foreground">Assunto: {task.subject}</div>}
                    <p className="mt-1 whitespace-pre-wrap text-xs">{task.body}</p>
                    {task.error && <p className="mt-1 text-xs text-rose-500">Erro: {task.error}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {task.status === "pending" && (
                      <>
                        {task.channel === "whatsapp" && phone && (
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={`https://wa.me/${phone}?text=${encodeURIComponent(task.body)}`}
                              target="_blank" rel="noreferrer"
                              onClick={() => setMut.mutate({ id: task.id, status: "sent" })}
                            >
                              <Send className="mr-1 h-3.5 w-3.5" /> Abrir WhatsApp
                            </a>
                          </Button>
                        )}
                        {task.channel === "email" && lead?.email && (
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={`mailto:${lead.email}?subject=${encodeURIComponent(task.subject ?? "")}&body=${encodeURIComponent(task.body)}`}
                              onClick={() => setMut.mutate({ id: task.id, status: "sent" })}
                            >
                              <Send className="mr-1 h-3.5 w-3.5" /> Abrir e-mail
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setMut.mutate({ id: task.id, status: "sent" })}>
                          Marcar como enviada
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setMut.mutate({ id: task.id, status: "cancelled" })}>
                          <X className="mr-1 h-3.5 w-3.5" /> Cancelar
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir esta tarefa?")) delMut.mutate(task.id); }}>
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
