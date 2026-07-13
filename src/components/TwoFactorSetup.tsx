import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Loader2, Trash2 } from "lucide-react";

type Factor = { id: string; friendly_name?: string | null; status: string; factor_type: string };

export function TwoFactorSetup() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<null | { factorId: string; qr: string; secret: string }>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [aal, setAal] = useState<string>("aal1");

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.all ?? []);
    const { data: lvl } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal(lvl?.currentLevel ?? "aal1");
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function startEnroll() {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `TOTP ${new Date().toLocaleDateString()}`,
      });
      if (error) throw error;
      setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar 2FA");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnroll() {
    if (!enrolling || !code) return;
    setBusy(true);
    try {
      const { data: chal, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: chal.id,
        code,
      });
      if (vErr) throw vErr;
      toast.success("2FA ativado com sucesso");
      setEnrolling(null);
      setCode("");
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Código inválido");
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnroll() {
    if (!enrolling) return;
    await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId });
    setEnrolling(null);
    setCode("");
    await refresh();
  }

  async function removeFactor(id: string) {
    if (!confirm("Remover este fator 2FA?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) return toast.error(error.message);
    toast.success("Fator removido");
    await refresh();
  }

  async function challengeExisting(id: string) {
    setBusy(true);
    try {
      const { data: chal, error: cErr } = await supabase.auth.mfa.challenge({ factorId: id });
      if (cErr) throw cErr;
      const c = prompt("Digite o código do seu app autenticador:");
      if (!c) return;
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId: id, challengeId: chal.id, code: c });
      if (vErr) throw vErr;
      toast.success("Sessão elevada para aal2");
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setBusy(false);
    }
  }

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {aal === "aal2" ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldAlert className="h-4 w-4 text-amber-500" />}
            Autenticação em dois fatores (TOTP)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Nível atual: <span className="font-mono">{aal}</span>. Obrigatório para acessar áreas de super admin.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Carregando…
        </div>
      ) : enrolling ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Escaneie o QR code com Google Authenticator, 1Password, Authy ou similar, e digite o código de 6 dígitos.
          </p>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-background p-4">
            <img src={enrolling.qr} alt="QR Code TOTP" className="h-40 w-40" />
            <code className="text-[10px] break-all text-muted-foreground">{enrolling.secret}</code>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="totp-code" className="text-xs">Código do app</Label>
            <Input
              id="totp-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              className="font-mono tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={verifyEnroll} disabled={busy || code.length !== 6}>
              {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Ativar
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEnroll} disabled={busy}>Cancelar</Button>
          </div>
        </div>
      ) : verified.length === 0 ? (
        <Button size="sm" onClick={startEnroll} disabled={busy}>
          {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Ativar 2FA
        </Button>
      ) : (
        <div className="space-y-2">
          {verified.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-3 py-2">
              <div className="text-xs">
                <p className="font-medium">{f.friendly_name || "Autenticador"}</p>
                <p className="text-muted-foreground">TOTP · {f.status}</p>
              </div>
              <div className="flex gap-1">
                {aal !== "aal2" && (
                  <Button size="sm" variant="outline" onClick={() => challengeExisting(f.id)} disabled={busy}>
                    Validar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => removeFactor(f.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={startEnroll} disabled={busy}>
            Adicionar outro dispositivo
          </Button>
        </div>
      )}
    </div>
  );
}
