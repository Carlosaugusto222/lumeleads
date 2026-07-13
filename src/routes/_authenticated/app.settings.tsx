import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { User, Shield, Loader2, LogOut, Trash2, Monitor, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, updateMyProfile, deleteMyAccount, listMySessions, revokeMySession } from "@/lib/account.functions";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { exportMyData } from "@/lib/data-export.functions";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

type Tab = "profile" | "security";

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 font-display text-2xl font-bold sm:text-3xl">Configurações</h1>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="mb-1 text-sm font-semibold">Conta</div>
          <p className="mb-3 text-xs text-muted-foreground">Gerencie suas informações.</p>
          <nav className="space-y-1">
            {[
              { k: "profile" as const, label: "Perfil", Icon: User },
              { k: "security" as const, label: "Segurança", Icon: Shield },
            ].map(({ k, label, Icon }) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  tab === k ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
          {tab === "profile" ? <ProfileTab /> : <SecurityTab />}
        </section>
      </div>
    </div>
  );
}

function ProfileTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyAccount);
  const updateFn = useServerFn(updateMyProfile);
  const { data, isLoading } = useQuery({ queryKey: ["my-account"], queryFn: () => getFn() });
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (data?.displayName !== undefined) setDisplayName(data.displayName);
  }, [data?.displayName]);

  const mut = useMutation({
    mutationFn: () => updateFn({ data: { displayName } }),
    onSuccess: () => {
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["my-account"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Perfil</h2>
        <p className="text-xs text-muted-foreground">Como você aparece na plataforma.</p>
      </div>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={data?.email ?? ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome" maxLength={80} />
          </div>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !displayName.trim()}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </div>
      )}
    </div>
  );
}

function SecurityTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const deleteFn = useServerFn(deleteMyAccount);
  const listSessionsFn = useServerFn(listMySessions);
  const revokeSessionFn = useServerFn(revokeMySession);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);

  const sessionsQ = useQuery({ queryKey: ["my-sessions"], queryFn: () => listSessionsFn() });
  const revokeMut = useMutation({
    mutationFn: (sessionId: string) => revokeSessionFn({ data: { sessionId } }),
    onSuccess: () => {
      toast.success("Sessão revogada");
      qc.invalidateQueries({ queryKey: ["my-sessions"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.session_id) setCurrentSessionId(payload.session_id as string);
      } catch { /* ignore */ }
    });
  }, []);

  async function handlePassword() {
    if (password.length < 8) return toast.error("Senha deve ter ao menos 8 caracteres");
    if (password !== password2) return toast.error("As senhas não coincidem");
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada");
    setPassword(""); setPassword2("");
  }

  async function handleSignOutAll() {
    setSigningOutAll(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOutAll(false);
    if (error) return toast.error(error.message);
    await qc.cancelQueries();
    qc.clear();
    navigate({ to: "/auth", replace: true });
  }

  async function handleDelete() {
    try {
      await deleteFn({ data: { confirm: "DELETAR" } });
      await supabase.auth.signOut();
      qc.clear();
      toast.success("Conta excluída");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Segurança</h2>
        <p className="text-xs text-muted-foreground">Senha, dispositivos e exclusão de conta.</p>
      </div>

      <TwoFactorSetup />

      <div className="space-y-3 border-b border-border/60 pb-6">
        <h3 className="text-sm font-medium">Senha</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Nova senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres" />
          </div>
          <div className="grid gap-1.5">
            <Label>Confirmar</Label>
            <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
          </div>
        </div>
        <Button onClick={handlePassword} disabled={savingPwd || !password}>
          {savingPwd && <Loader2 className="h-4 w-4 animate-spin" />} Definir senha
        </Button>
      </div>

      <div className="space-y-3 border-b border-border/60 pb-6">
        <h3 className="text-sm font-medium">Dispositivos ativos</h3>
        {sessionsQ.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-2">
            {sessionsQ.data?.sessions.map((s: { id: string; userAgent: string; ip: string; lastActiveAt: string }) => {
              const isCurrent = s.id === currentSessionId;
              return (
                <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                  <Monitor className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      {parseUA(s.userAgent)}
                      {isCurrent && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">ESTE</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.ip || "IP desconhecido"} · ativo em {new Date(s.lastActiveAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  {!isCurrent && (
                    <Button size="sm" variant="ghost"
                      onClick={() => revokeMut.mutate(s.id)}
                      disabled={revokeMut.isPending}>
                      Revogar
                    </Button>
                  )}
                </div>
              );
            })}
            {!sessionsQ.data?.sessions.length && (
              <p className="text-xs text-muted-foreground">Nenhuma sessão ativa encontrada.</p>
            )}
          </div>
        )}
        <Button variant="outline" onClick={handleSignOutAll} disabled={signingOutAll}>
          {signingOutAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sair de todos os dispositivos
        </Button>
      </div>

      <DataExportSection />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-destructive">Excluir conta</h3>
        <p className="text-xs text-muted-foreground">
          Ação permanente. Todos os seus dados (leads, sites, agendamentos) serão apagados.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive"><Trash2 className="h-4 w-4" /> Excluir conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir conta permanentemente?</DialogTitle>
              <DialogDescription>
                Digite <b>DELETAR</b> para confirmar. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETAR" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="destructive" disabled={confirm !== "DELETAR"} onClick={handleDelete}>
                Confirmar exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function parseUA(ua: string): string {
  if (!ua) return "Dispositivo desconhecido";
  const os = /Windows/i.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
    : /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS"
    : /Linux/i.test(ua) ? "Linux" : "";
  const browser = /Edg\//i.test(ua) ? "Edge"
    : /Chrome\//i.test(ua) ? "Chrome"
    : /Firefox\//i.test(ua) ? "Firefox"
    : /Safari\//i.test(ua) ? "Safari" : "Navegador";
  return [browser, os].filter(Boolean).join(" · ");
}
