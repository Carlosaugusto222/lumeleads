import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Users, PenLine, ArrowRight, ArrowLeft, Check,
  Palette, Image as ImageIcon, Share2, RefreshCw, X, Plus, Wand2,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { generateSite } from "@/lib/sites.functions";
import { listLeads } from "@/lib/leads.functions";
import { suggestPalettes, fetchPlacePhotos, fetchInstagramPhotos, fetchStockPhotos, type Palette as PaletteType } from "@/lib/site-wizard.functions";

const newSiteSearchSchema = z.object({
  leadId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/app/new")({
  validateSearch: newSiteSearchSchema,
  component: NewSite,
});

type Socials = {
  instagram: string; facebook: string; whatsapp: string;
  tiktok: string; youtube: string; x: string; website: string;
};
const emptySocials: Socials = { instagram: "", facebook: "", whatsapp: "", tiktok: "", youtube: "", x: "", website: "" };

const STEPS = [
  { key: "basics", label: "Negócio", icon: PenLine },
  { key: "palette", label: "Cores", icon: Palette },
  { key: "photos", label: "Fotos", icon: ImageIcon },
  { key: "socials", label: "Redes", icon: Share2 },
  { key: "generate", label: "Gerar", icon: Sparkles },
] as const;

function NewSite() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const gen = useServerFn(generateSite);
  const listLeadsFn = useServerFn(listLeads);
  const suggestFn = useServerFn(suggestPalettes);
  const photosFn = useServerFn(fetchPlacePhotos);
  const igFn = useServerFn(fetchInstagramPhotos);
  const stockFn = useServerFn(fetchStockPhotos);
  const [igHandle, setIgHandle] = useState("");
  const [stockQuery, setStockQuery] = useState("");

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"lead" | "manual">(search.leadId ? "lead" : "lead");
  const [selectedLeadId, setSelectedLeadId] = useState<string>(search.leadId ?? "");

  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("");
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [tone, setTone] = useState<"profissional" | "descontraido" | "premium" | "amigavel">("profissional");

  const [palettes, setPalettes] = useState<PaletteType[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<PaletteType | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");

  const [socials, setSocials] = useState<Socials>(emptySocials);

  const { data: leads } = useQuery({ queryKey: ["leads"], queryFn: () => listLeadsFn() });
  const selectedLead = useMemo(() => leads?.find((l) => l.id === selectedLeadId), [leads, selectedLeadId]);

  useEffect(() => {
    if (mode !== "lead" || !selectedLead) return;
    setBusinessName(selectedLead.name);
    setSector(selectedLead.category ?? "");
    setAudience(selectedLead.city ? `Clientes em ${selectedLead.city}` : "");
    setOffer(`Site profissional para ${selectedLead.name}`);
    if (selectedLead.website && !socials.website) {
      setSocials((s) => ({ ...s, website: selectedLead.website ?? "" }));
    }
    if (selectedLead.phone && !socials.whatsapp) {
      setSocials((s) => ({ ...s, whatsapp: (selectedLead.phone ?? "").replace(/\D/g, "") }));
    }
  }, [selectedLead, mode]);

  const suggestMut = useMutation({
    mutationFn: () => suggestFn({ data: { businessName, sector, tone } }),
    onSuccess: ({ palettes: p }) => {
      setPalettes(p);
      if (p[0]) setSelectedPalette(p[0]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao sugerir cores"),
  });

  const photosMut = useMutation({
    mutationFn: () => {
      const q = selectedLead
        ? `${selectedLead.name} ${selectedLead.city ?? ""} ${selectedLead.state ?? ""}`.trim()
        : `${businessName} ${sector}`.trim();
      return photosFn({ data: { query: q, max: 6 } });
    },
    onSuccess: ({ photos: p }) => {
      if (!p.length) toast.info("Nenhuma foto encontrada no Google. Adicione URLs manualmente.");
      setPhotos((prev) => Array.from(new Set([...prev, ...p])).slice(0, 12));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao buscar fotos"),
  });

  const igMut = useMutation({
    mutationFn: () => igFn({ data: { handle: igHandle || socials.instagram } }),
    onSuccess: ({ photos: p }) => {
      if (!p.length) toast.info("Nenhuma foto pública encontrada no perfil.");
      else toast.success(`${p.length} foto(s) do Instagram adicionadas`);
      setPhotos((prev) => Array.from(new Set([...prev, ...p])).slice(0, 12));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao buscar Instagram"),
  });

  const stockMut = useMutation({
    mutationFn: () => {
      const q = (stockQuery || `${sector} ${businessName}`).trim();
      if (!q) throw new Error("Informe um termo de busca (ex: 'cafeteria', 'salão de beleza')");
      return stockFn({ data: { query: q, max: 8, source: "both" } });
    },
    onSuccess: ({ photos: p, sources }) => {
      if (!sources.pexels && !sources.unsplash) {
        toast.error("Bancos de imagens não configurados. Peça ao admin para adicionar PEXELS_API_KEY e/ou UNSPLASH_ACCESS_KEY.");
        return;
      }
      if (!p.length) toast.info("Nenhuma foto encontrada para esse termo.");
      else toast.success(`${p.length} foto(s) adicionadas`);
      setPhotos((prev) => Array.from(new Set([...prev, ...p.map((x) => x.url)])).slice(0, 12));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao buscar fotos"),
  });




  const genMut = useMutation({
    mutationFn: () =>
      gen({
        data: {
          businessName, sector, audience, offer, tone,
          palette: selectedPalette ?? undefined,
          photos: photos.length ? photos : undefined,
          socials,
        },
      }),
    onSuccess: ({ id }) => {
      toast.success("Landing gerada!");
      navigate({ to: "/app/sites/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro na geração"),
  });

  const canAdvance = () => {
    if (step === 0) return !!(businessName && sector && audience && offer);
    if (step === 1) return !!selectedPalette;
    return true;
  };

  function goNext() {
    if (!canAdvance()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (step === 0 && palettes.length === 0) suggestMut.mutate();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() { setStep((s) => Math.max(s - 1, 0)); }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Novo site</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fluxo guiado para gerar um site com fotos reais e sua identidade.</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card/40 p-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <button key={s.key} type="button" onClick={() => i < step && setStep(i)}
              className={`flex flex-1 min-w-[80px] items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition ${
                active ? "bg-primary text-primary-foreground" : done ? "text-primary" : "text-muted-foreground"
              }`}>
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-card/40 p-1">
              <Button type="button" variant={mode === "lead" ? "default" : "ghost"} size="sm" onClick={() => setMode("lead")}>
                <Users className="h-4 w-4" /> Do CRM
              </Button>
              <Button type="button" variant={mode === "manual" ? "default" : "ghost"} size="sm" onClick={() => setMode("manual")}>
                <PenLine className="h-4 w-4" /> Manual
              </Button>
            </div>

            {mode === "lead" && (
              <div className="space-y-2">
                <Label>Lead *</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                  <SelectContent>
                    {(leads ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}{l.city ? ` — ${l.city}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FieldRow>
              <Field label="Nome do negócio *"><Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></Field>
              <Field label="Setor *"><Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex: cafeteria artesanal" /></Field>
            </FieldRow>
            <Field label="Público-alvo *"><Input value={audience} onChange={(e) => setAudience(e.target.value)} /></Field>
            <Field label="Oferta principal *"><Textarea rows={2} value={offer} onChange={(e) => setOffer(e.target.value)} /></Field>
            <Field label="Tom de voz">
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="descontraido">Descontraído</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="amigavel">Amigável</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Escolha uma paleta</h2>
                <p className="text-xs text-muted-foreground">Sugestões da IA para o seu setor.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => suggestMut.mutate()} disabled={suggestMut.isPending}>
                {suggestMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {palettes.length ? "Sugerir de novo" : "Gerar sugestões"}
              </Button>
            </div>
            {suggestMut.isPending && !palettes.length && (
              <div className="flex items-center justify-center rounded-xl border border-dashed py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando setor e gerando paletas...
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {palettes.map((p, i) => {
                const active = selectedPalette?.primary === p.primary && selectedPalette?.accent === p.accent;
                return (
                  <button key={i} type="button" onClick={() => setSelectedPalette(p)}
                    className={`group rounded-xl border p-3 text-left transition ${active ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:border-primary/50"}`}>
                    <div className="mb-2 flex h-16 overflow-hidden rounded-lg">
                      <div className="flex-1" style={{ backgroundColor: p.primary }} />
                      <div className="flex-1" style={{ backgroundColor: p.accent }} />
                      <div className="flex-1" style={{ backgroundColor: p.background }} />
                      <div className="flex-1" style={{ backgroundColor: p.text }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.name}</span>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    {p.mood && <p className="mt-1 text-xs text-muted-foreground">{p.mood}</p>}
                  </button>
                );
              })}
            </div>

            {selectedPalette && (
              <div className="rounded-xl border border-border/60 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Personalizar</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["primary", "accent", "background", "text"] as const).map((k) => (
                    <label key={k} className="flex flex-col gap-1 text-xs">
                      <span className="capitalize">{k}</span>
                      <input type="color" value={selectedPalette[k]}
                        onChange={(e) => setSelectedPalette({ ...selectedPalette, [k]: e.target.value })}
                        className="h-9 w-full cursor-pointer rounded-md border border-border/60" />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Fotos reais</h2>
                <p className="text-xs text-muted-foreground">A primeira foto vira o hero; as demais entram na galeria.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => photosMut.mutate()} disabled={photosMut.isPending}>
                {photosMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Buscar no Google
              </Button>
            </div>

            <div className="flex gap-2">
              <Input value={igHandle} onChange={(e) => setIgHandle(e.target.value)}
                placeholder="@perfil do Instagram (público)" />
              <Button type="button" variant="outline"
                onClick={() => {
                  const h = (igHandle || socials.instagram).trim();
                  if (!h) return toast.error("Informe um @perfil do Instagram");
                  igMut.mutate();
                }}
                disabled={igMut.isPending}>
                {igMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Instagram
              </Button>
            </div>

            <div className="flex gap-2">
              <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Cole uma URL de imagem" />
              <Button type="button" onClick={() => {
                if (!photoUrl) return;
                try { new URL(photoUrl); } catch { toast.error("URL inválida"); return; }
                setPhotos((p) => Array.from(new Set([...p, photoUrl])).slice(0, 12));
                setPhotoUrl("");
              }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {photos.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                Nenhuma foto ainda. Clique em "Buscar no Google" ou cole URLs.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((url, i) => (
                  <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Hero</span>}
                    <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Redes sociais</h2>
              <p className="text-xs text-muted-foreground">Deixe em branco o que não usar.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SocialField label="Instagram (@usuario)" value={socials.instagram} onChange={(v) => setSocials({ ...socials, instagram: v })} />
              <SocialField label="Facebook (usuario)" value={socials.facebook} onChange={(v) => setSocials({ ...socials, facebook: v })} />
              <SocialField label="WhatsApp (5511999...)" value={socials.whatsapp} onChange={(v) => setSocials({ ...socials, whatsapp: v })} />
              <SocialField label="TikTok (usuario)" value={socials.tiktok} onChange={(v) => setSocials({ ...socials, tiktok: v })} />
              <SocialField label="YouTube (@canal ou URL)" value={socials.youtube} onChange={(v) => setSocials({ ...socials, youtube: v })} />
              <SocialField label="X / Twitter (usuario)" value={socials.x} onChange={(v) => setSocials({ ...socials, x: v })} />
              <div className="sm:col-span-2">
                <SocialField label="Site atual (URL completa)" value={socials.website} onChange={(v) => setSocials({ ...socials, website: v })} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Revisar e gerar</h2>
            <div className="grid gap-3 text-sm">
              <SummaryRow k="Negócio" v={businessName} />
              <SummaryRow k="Setor" v={sector} />
              <SummaryRow k="Tom" v={tone} />
              <SummaryRow k="Paleta" v={selectedPalette ? selectedPalette.name : "—"}
                extra={selectedPalette && (
                  <div className="flex h-4 w-24 overflow-hidden rounded">
                    <div className="flex-1" style={{ backgroundColor: selectedPalette.primary }} />
                    <div className="flex-1" style={{ backgroundColor: selectedPalette.accent }} />
                    <div className="flex-1" style={{ backgroundColor: selectedPalette.background }} />
                    <div className="flex-1" style={{ backgroundColor: selectedPalette.text }} />
                  </div>
                )} />
              <SummaryRow k="Fotos" v={`${photos.length} foto(s)`} />
              <SummaryRow k="Redes" v={Object.values(socials).filter(Boolean).length + " preenchidas"} />
            </div>
            <Button type="button" size="lg" onClick={() => genMut.mutate()} disabled={genMut.isPending}
              className="w-full bg-gradient-primary text-primary-foreground">
              {genMut.isPending ? (<><Loader2 className="h-4 w-4 animate-spin" /> Gerando sua landing...</>) : (<><Sparkles className="h-4 w-4" /> Gerar site com IA</>)}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 && (
          <Button type="button" onClick={goNext} disabled={!canAdvance()}>
            Próximo <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>);
}
function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
function SocialField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (<div className="space-y-1.5"><Label className="text-xs">{label}</Label><Input value={value} onChange={(e) => onChange(e.target.value)} /></div>);
}
function SummaryRow({ k, v, extra }: { k: string; v: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{k}</span>
      <span className="flex items-center gap-2 text-sm">{extra} {v}</span>
    </div>
  );
}
