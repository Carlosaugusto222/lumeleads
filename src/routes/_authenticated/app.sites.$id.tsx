import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Rocket, Save, ExternalLink, Loader2, Eye, MousePointerClick, MessageCircle, Send } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getMySite,
  updateSite,
  setPublished,
  siteContentSchema,
  type SiteContent,
} from "@/lib/sites.functions";
import { getSiteAnalytics } from "@/lib/site-analytics.functions";
import { generateLogo } from "@/lib/logo.functions";
import { SiteRenderer, SITE_TEMPLATES, type SiteTemplate } from "@/components/SiteRenderer";

export const Route = createFileRoute("/_authenticated/app/sites/$id")({
  component: EditSite,
});

function EditSite() {
  const { id } = Route.useParams();
  const get = useServerFn(getMySite);
  const upd = useServerFn(updateSite);
  const pub = useServerFn(setPublished);
  const qc = useQueryClient();

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", id],
    queryFn: () => get({ data: { id } }),
  });

  const [content, setContent] = useState<SiteContent | null>(null);
  const [theme, setTheme] = useState<{ primary: string; accent: string; template: SiteTemplate }>({ primary: "#7c3aed", accent: "#22d3ee", template: "modern" });
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!site) return;
    const parsed = siteContentSchema.safeParse(site.content);
    if (parsed.success) setContent(parsed.data);
    setTitle(site.title);
    const t = site.theme as { primary?: string; accent?: string; template?: SiteTemplate } | null;
    setTheme({
      primary: t?.primary ?? "#7c3aed",
      accent: t?.accent ?? "#22d3ee",
      template: t?.template ?? "modern",
    });
  }, [site]);

  const saveMut = useMutation({
    mutationFn: () =>
      upd({ data: { id, title, content: content!, theme } }),
    onSuccess: () => {
      toast.success("Alterações salvas");
      qc.invalidateQueries({ queryKey: ["site", id] });
      qc.invalidateQueries({ queryKey: ["my-sites"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const pubMut = useMutation({
    mutationFn: () => pub({ data: { id, published: !site!.published } }),
    onSuccess: () => {
      toast.success(!site!.published ? "Publicado!" : "Despublicado");
      qc.invalidateQueries({ queryKey: ["site", id] });
      qc.invalidateQueries({ queryKey: ["my-sites"] });
    },
  });

  if (isLoading || !site || !content) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  function updateBenefit(i: number, patch: Partial<SiteContent["benefits"][number]>) {
    setContent((c) => {
      if (!c) return c;
      const benefits = c.benefits.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
      return { ...c, benefits };
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2">
          {site.published && (
            <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4" /> Abrir site
              </Button>
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => pubMut.mutate()}
            disabled={pubMut.isPending}
          >
            <Rocket className="h-4 w-4" />
            {site.published ? "Despublicar" : "Publicar"}
          </Button>
          <Button
            size="sm"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="bg-gradient-primary text-primary-foreground"
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Editor */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
          <Card title="Marca">
            <Field label="Título / Nome do site" value={title} onChange={setTitle} />
            <Field
              label="Nome da marca"
              value={content.brandName}
              onChange={(v) => setContent({ ...content, brandName: v })}
            />
            <Field
              label="Tagline"
              value={content.tagline}
              onChange={(v) => setContent({ ...content, tagline: v })}
            />
            <LogoField
              logoUrl={content.logoUrl}
              brandName={content.brandName}
              tagline={content.tagline}
              primary={theme.primary}
              accent={theme.accent}
              onChange={(v) => setContent({ ...content, logoUrl: v })}
            />
          </Card>

          <Card title="Template">
            <div className="grid grid-cols-2 gap-2">
              {SITE_TEMPLATES.map((t) => {
                const active = theme.template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme({ ...theme, template: t.id })}
                    className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 bg-background hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">{t.label}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{t.description}</div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Cores">
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Primária"
                value={theme.primary}
                onChange={(v) => setTheme({ ...theme, primary: v })}
              />
              <ColorField
                label="Acento"
                value={theme.accent}
                onChange={(v) => setTheme({ ...theme, accent: v })}
              />
            </div>
          </Card>

          <Card title="Hero">
            <Field
              label="Headline"
              value={content.headline}
              onChange={(v) => setContent({ ...content, headline: v })}
            />
            <AreaField
              label="Subheadline"
              value={content.subheadline}
              onChange={(v) => setContent({ ...content, subheadline: v })}
            />
            <Field
              label="Texto do botão"
              value={content.ctaLabel}
              onChange={(v) => setContent({ ...content, ctaLabel: v })}
            />
          </Card>

          <Card title="Benefícios">
            {content.benefits.map((b, i) => (
              <div key={i} className="space-y-2 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <Field label={`Título ${i + 1}`} value={b.title} onChange={(v) => updateBenefit(i, { title: v })} />
                <AreaField label="Descrição" value={b.description} onChange={(v) => updateBenefit(i, { description: v })} />
              </div>
            ))}
          </Card>

          <Card title="Sobre">
            <AreaField
              label="Texto"
              value={content.about}
              onChange={(v) => setContent({ ...content, about: v })}
              rows={4}
            />
          </Card>
          <Card title="Analytics">
            <AnalyticsPanel siteId={id} published={site.published} />
          </Card>
        </div>

        {/* Preview */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-2xl">
          <SiteRenderer content={content} theme={theme} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}

function AnalyticsPanel({ siteId, published }: { siteId: string; published: boolean }) {
  const fn = useServerFn(getSiteAnalytics);
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["site-analytics", siteId, days],
    queryFn: () => fn({ data: { site_id: siteId, days } }),
    enabled: published,
  });

  if (!published) {
    return <p className="text-xs text-muted-foreground">Publique o site para começar a coletar visitas e cliques.</p>;
  }
  if (isLoading || !data) {
    return <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  }

  const kpis = [
    { label: "Visitas", value: data.totals.view, Icon: Eye },
    { label: "Cliques CTA", value: data.totals.cta_click, Icon: MousePointerClick },
    { label: "WhatsApp", value: data.totals.whatsapp_click, Icon: MessageCircle },
    { label: "Formulários", value: data.totals.form_submit, Icon: Send },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`rounded-md px-2 py-1 text-xs ${days === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {d}d
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {kpis.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-lg border border-border/60 bg-background p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3 w-3" />{label}</div>
            <div className="mt-1 text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="view" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Visitas" />
            <Line type="monotone" dataKey="cta_click" stroke="#f59e0b" strokeWidth={2} dot={false} name="CTA" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LogoField({
  logoUrl,
  brandName,
  tagline,
  primary,
  accent,
  onChange,
}: {
  logoUrl?: string;
  brandName: string;
  tagline: string;
  primary: string;
  accent: string;
  onChange: (v: string | undefined) => void;
}) {
  const gen = useServerFn(generateLogo);
  const mut = useMutation({
    mutationFn: () =>
      gen({
        data: {
          businessName: brandName,
          sector: tagline || brandName,
          primaryColor: primary,
          accentColor: accent,
          style: "minimal",
        },
      }),
    onSuccess: (r) => {
      onChange(r.dataUrl);
      toast.success("Logo gerado! Clique em Salvar para aplicar.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao gerar logo"),
  });

  return (
    <div className="space-y-2 pt-2">
      <Label className="text-xs text-muted-foreground">Logotipo (IA)</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-md border border-border/60 bg-background">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-full w-full rounded-md object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">sem logo</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            {logoUrl ? "Regerar" : "Gerar com IA"}
          </Button>
          {logoUrl ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(undefined)}>
              Remover
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
