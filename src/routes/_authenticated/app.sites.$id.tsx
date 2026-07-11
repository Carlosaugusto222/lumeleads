import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Rocket, Save, ExternalLink, Loader2 } from "lucide-react";

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
import { SiteRenderer } from "@/components/SiteRenderer";

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
  const [theme, setTheme] = useState({ primary: "#7c3aed", accent: "#22d3ee" });
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!site) return;
    const parsed = siteContentSchema.safeParse(site.content);
    if (parsed.success) setContent(parsed.data);
    setTitle(site.title);
    const t = site.theme as { primary?: string; accent?: string } | null;
    setTheme({ primary: t?.primary ?? "#7c3aed", accent: t?.accent ?? "#22d3ee" });
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
