import type { SiteContent } from "@/lib/sites.functions";
import { Check, Loader2, Instagram, Facebook, Youtube, Music2, Twitter, MessageCircle, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitToSite } from "@/lib/submissions.functions";
import { trackSiteEvent, type SiteEventType } from "@/lib/site-analytics.functions";
import { toast } from "sonner";

export type SiteTemplate = "modern" | "classic" | "bold" | "minimal";

export const SITE_TEMPLATES: { id: SiteTemplate; label: string; description: string }[] = [
  { id: "modern", label: "Moderno", description: "Gradientes, cantos suaves, hero em duas colunas." },
  { id: "classic", label: "Clássico", description: "Tipografia serifada, hero centralizado, elegante." },
  { id: "bold", label: "Bold", description: "Brutalista, blocos sólidos, tipografia em caixa alta." },
  { id: "minimal", label: "Minimal", description: "Muito espaço em branco, sem sombras, foco no texto." },
];

interface Theme {
  primary: string;
  accent: string;
  background?: string;
  text?: string;
  template?: SiteTemplate;
}

interface Props {
  content: SiteContent;
  theme: Theme;
  siteId?: string;
}

interface TemplateSpec {
  fontFamily: string;
  headingFont: string;
  headingWeight: string;
  headingCase: "normal" | "uppercase";
  headingTracking: string;
  radiusHero: string;
  radiusCard: string;
  radiusBtn: string;
  border: string;
  shadow: string;
  ctaHeroBg: (p: string, a: string) => string;
  ctaSectionBg: (p: string, a: string) => string;
  ctaTextColor: string;
  heroLayout: "split" | "centered" | "stack";
  heroGlow: boolean;
  benefitBorder: number;
  uppercaseSection: boolean;
}

const TEMPLATES: Record<SiteTemplate, TemplateSpec> = {
  modern: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    headingFont: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    headingWeight: "700",
    headingCase: "normal",
    headingTracking: "-0.02em",
    radiusHero: "1.5rem",
    radiusCard: "1rem",
    radiusBtn: "0.5rem",
    border: "1px solid",
    shadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    ctaHeroBg: (p, _a) => p,
    ctaSectionBg: (p, a) => `linear-gradient(135deg, ${p}, ${a})`,
    ctaTextColor: "#ffffff",
    heroLayout: "split",
    heroGlow: true,
    benefitBorder: 1,
    uppercaseSection: false,
  },
  classic: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    headingFont: "'Playfair Display', Georgia, serif",
    headingWeight: "600",
    headingCase: "normal",
    headingTracking: "-0.01em",
    radiusHero: "0.25rem",
    radiusCard: "0.25rem",
    radiusBtn: "0.125rem",
    border: "1px solid",
    shadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    ctaHeroBg: (p, _a) => p,
    ctaSectionBg: (p, _a) => p,
    ctaTextColor: "#ffffff",
    heroLayout: "centered",
    heroGlow: false,
    benefitBorder: 1,
    uppercaseSection: true,
  },
  bold: {
    fontFamily: "Impact, 'Helvetica Neue', Arial, sans-serif",
    headingFont: "Impact, 'Arial Black', sans-serif",
    headingWeight: "900",
    headingCase: "uppercase",
    headingTracking: "-0.03em",
    radiusHero: "0",
    radiusCard: "0",
    radiusBtn: "0",
    border: "3px solid",
    shadow: "8px 8px 0 rgba(0,0,0,1)",
    ctaHeroBg: (p, _a) => p,
    ctaSectionBg: (p, _a) => p,
    ctaTextColor: "#ffffff",
    heroLayout: "split",
    heroGlow: false,
    benefitBorder: 3,
    uppercaseSection: true,
  },
  minimal: {
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headingFont: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headingWeight: "300",
    headingCase: "normal",
    headingTracking: "-0.03em",
    radiusHero: "0",
    radiusCard: "0",
    radiusBtn: "9999px",
    border: "1px solid",
    shadow: "none",
    ctaHeroBg: (p, _a) => p,
    ctaSectionBg: (p, _a) => p,
    ctaTextColor: "#ffffff",
    heroLayout: "stack",
    heroGlow: false,
    benefitBorder: 0,
    uppercaseSection: true,
  },
};

export function SiteRenderer({ content, theme, siteId }: Props) {
  const bg = theme.background ?? "#ffffff";
  const text = theme.text ?? "#0a0a0a";
  const tpl = TEMPLATES[theme.template ?? "modern"];
  const style = {
    backgroundColor: bg,
    color: text,
    fontFamily: tpl.fontFamily,
  } as React.CSSProperties;

  const headingStyle: React.CSSProperties = {
    fontFamily: tpl.headingFont,
    fontWeight: tpl.headingWeight,
    letterSpacing: tpl.headingTracking,
    textTransform: tpl.headingCase,
  };

  const btnBase: React.CSSProperties = {
    backgroundColor: theme.primary,
    color: tpl.ctaTextColor,
    borderRadius: tpl.radiusBtn,
  };

  const sectionLabel: React.CSSProperties = tpl.uppercaseSection
    ? { textTransform: "uppercase", letterSpacing: "0.1em" }
    : {};

  const photos = content.photos ?? [];
  const hero = photos[0];
  const gallery = photos.slice(1, 7);
  const socials = content.socials ?? {};

  const trackFn = useServerFn(trackSiteEvent);
  const track = useRef((_type: SiteEventType, _meta?: Record<string, unknown>) => {});
  useEffect(() => {
    if (!siteId) return;
    track.current = (type, meta) => {
      trackFn({ data: { site_id: siteId, event_type: type, meta } }).catch(() => {});
    };
    track.current("view");
  }, [siteId, trackFn]);

  const heroBg = tpl.heroGlow
    ? { backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 0%, ${theme.primary}22, transparent 70%)` }
    : {};

  return (
    <div style={style} className="min-h-screen">
      <header style={{ borderBottom: `${tpl.border} ${text}18` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {content.logoUrl ? (
              <img src={content.logoUrl} alt={`${content.brandName} logo`} className="h-8 w-8 rounded object-contain" />
            ) : null}
            <div className="text-lg" style={{ ...headingStyle, fontWeight: tpl.headingWeight }}>{content.brandName}</div>
          </div>
          <a href="#cta" onClick={() => track.current("cta_click", { where: "header" })}
             className="px-4 py-2 text-sm font-medium" style={btnBase}>
            {content.ctaLabel}
          </a>
        </div>
      </header>

      <section className="relative px-6 py-20" style={heroBg}>
        <div
          className={`mx-auto max-w-6xl ${
            tpl.heroLayout === "split"
              ? "grid items-center gap-10 md:grid-cols-2"
              : tpl.heroLayout === "centered"
              ? "text-center"
              : "text-left"
          }`}
        >
          <div className={tpl.heroLayout === "centered" ? "mx-auto max-w-3xl" : ""}>
            <p className="mb-4 inline-block px-3 py-1 text-xs font-semibold"
               style={{ backgroundColor: `${theme.accent}22`, color: theme.primary, borderRadius: tpl.radiusBtn, ...sectionLabel }}>
              {content.tagline}
            </p>
            <h1 className="text-4xl leading-tight sm:text-5xl" style={headingStyle}>{content.headline}</h1>
            <p className="mt-6 text-lg opacity-80">{content.subheadline}</p>
            <div className="mt-8">
              <a href="#cta" onClick={() => track.current("cta_click", { where: "hero" })}
                 className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold transition-transform hover:scale-105"
                 style={{ ...btnBase, backgroundColor: tpl.ctaHeroBg(theme.primary, theme.accent), boxShadow: tpl.shadow }}>
                {content.ctaLabel}
              </a>
            </div>
          </div>
          {hero && tpl.heroLayout !== "centered" && (
            <div className="overflow-hidden" style={{ borderRadius: tpl.radiusHero, boxShadow: tpl.shadow, border: tpl.border !== "1px solid" ? `${tpl.border} ${text}` : undefined }}>
              <img src={hero} alt={content.brandName} className="h-full w-full object-cover" />
            </div>
          )}
          {hero && tpl.heroLayout === "centered" && (
            <div className="mx-auto mt-10 max-w-3xl overflow-hidden" style={{ borderRadius: tpl.radiusHero, boxShadow: tpl.shadow }}>
              <img src={hero} alt={content.brandName} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {content.benefits.map((b, i) => (
              <div key={i} className="p-6" style={{
                border: tpl.benefitBorder ? `${tpl.benefitBorder}px solid ${text}${tpl.benefitBorder >= 3 ? "" : "15"}` : "none",
                borderRadius: tpl.radiusCard,
                backgroundColor: `${text}05`,
              }}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center"
                     style={{ backgroundColor: `${theme.primary}18`, color: theme.primary, borderRadius: tpl.radiusBtn }}>
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg" style={{ ...headingStyle, fontSize: "1.125rem" }}>{b.title}</h3>
                <p className="mt-2 text-sm opacity-75">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-center text-3xl" style={headingStyle}>Galeria</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {gallery.map((url, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden" style={{ borderRadius: tpl.radiusCard }}>
                  <img src={url} alt={`Foto ${i + 2}`} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16" style={{ backgroundColor: `${text}05` }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl" style={headingStyle}>Sobre</h2>
          <p className="mt-4 text-lg opacity-80">{content.about}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl" style={headingStyle}>O que dizem</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {content.testimonials.map((t, i) => (
              <blockquote key={i} className="p-6" style={{
                border: `${tpl.benefitBorder || 1}px solid ${text}15`,
                borderRadius: tpl.radiusCard,
              }}>
                <p className="opacity-80">“{t.quote}”</p>
                <footer className="mt-4 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="opacity-60">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ backgroundColor: `${text}05` }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl" style={headingStyle}>Perguntas frequentes</h2>
          <div className="space-y-4">
            {content.faq.map((f, i) => (
              <div key={i} className="p-5" style={{
                border: `1px solid ${text}15`,
                borderRadius: tpl.radiusCard,
                backgroundColor: bg,
              }}>
                <h3 className="font-semibold">{f.question}</h3>
                <p className="mt-2 text-sm opacity-75">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="px-6 py-20">
        <div className="mx-auto max-w-4xl p-10 text-center text-white"
             style={{ backgroundImage: tpl.ctaSectionBg(theme.primary, theme.accent), backgroundColor: theme.primary, borderRadius: tpl.radiusHero, boxShadow: tpl.shadow }}>
          <h2 className="text-3xl sm:text-4xl" style={{ ...headingStyle, color: "#ffffff" }}>{content.headline}</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">{content.subheadline}</p>
          {siteId ? (
            <CaptureForm siteId={siteId} ctaLabel={content.ctaLabel} primary={theme.primary} radius={tpl.radiusBtn}
              onSubmitted={() => track.current("form_submit")} />
          ) : (
            <a href="#" className="mt-8 inline-flex items-center justify-center bg-white px-6 py-3 text-base font-semibold shadow-lg" style={{ color: theme.primary, borderRadius: tpl.radiusBtn }}>
              {content.ctaLabel}
            </a>
          )}
        </div>
      </section>

      <SocialsBar socials={socials} primary={theme.primary}
        onClick={(label) => track.current(label === "WhatsApp" ? "whatsapp_click" : "social_click", { network: label })} />

      <footer className="px-6 py-8 text-center text-sm opacity-70" style={{ borderTop: `${tpl.border} ${text}18` }}>
        {content.footerNote} · Feito com <a href="/" className="underline">LumeLeads</a>
      </footer>
    </div>
  );
}

function SocialsBar({ socials, primary, onClick }: { socials: SiteContent["socials"]; primary: string; onClick?: (label: string) => void }) {
  const items: Array<{ url: string; icon: React.ReactNode; label: string }> = [];
  const push = (url: string | undefined, icon: React.ReactNode, label: string, prefix = "") => {
    if (!url) return;
    let href = url;
    if (prefix && !/^https?:\/\//i.test(url)) href = prefix + url.replace(/^@/, "");
    items.push({ url: href, icon, label });
  };
  push(socials?.instagram, <Instagram className="h-5 w-5" />, "Instagram", "https://instagram.com/");
  push(socials?.facebook, <Facebook className="h-5 w-5" />, "Facebook", "https://facebook.com/");
  push(
    socials?.whatsapp,
    <MessageCircle className="h-5 w-5" />,
    "WhatsApp",
    "https://wa.me/",
  );
  push(socials?.tiktok, <Music2 className="h-5 w-5" />, "TikTok", "https://tiktok.com/@");
  push(socials?.youtube, <Youtube className="h-5 w-5" />, "YouTube", "https://youtube.com/");
  push(socials?.x, <Twitter className="h-5 w-5" />, "X", "https://x.com/");
  push(socials?.website, <Globe className="h-5 w-5" />, "Site");
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-8">
      {items.map((i, idx) => (
        <a key={idx} href={i.url} target="_blank" rel="noreferrer" aria-label={i.label}
          onClick={() => onClick?.(i.label)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-110"
          style={{ backgroundColor: primary }}>
          {i.icon}
        </a>
      ))}
    </div>
  );
}

function CaptureForm({ siteId, ctaLabel, primary, radius, onSubmitted }: { siteId: string; ctaLabel: string; primary: string; radius: string; onSubmitted?: () => void }) {
  const submit = useServerFn(submitToSite);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name) return;
    setLoading(true);
    try {
      await submit({ data: { site_id: siteId, ...f } });
      setDone(true);
      onSubmitted?.();
      setF({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white/95 p-6 text-neutral-900">
        <h3 className="text-lg font-bold">Recebemos seu contato! ✅</h3>
        <p className="mt-1 text-sm text-neutral-600">Em breve entraremos em contato.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 grid max-w-md gap-3 bg-white/95 p-6 text-left text-neutral-900" style={{ borderRadius: radius === "0" ? "0" : "1rem" }}>
      <input required placeholder="Seu nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
        className="border border-neutral-300 px-3 py-2 text-sm" style={{ borderRadius: radius }} />
      <input type="email" placeholder="E-mail" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
        className="border border-neutral-300 px-3 py-2 text-sm" style={{ borderRadius: radius }} />
      <input placeholder="Telefone / WhatsApp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })}
        className="border border-neutral-300 px-3 py-2 text-sm" style={{ borderRadius: radius }} />
      <textarea placeholder="Mensagem (opcional)" rows={2} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })}
        className="border border-neutral-300 px-3 py-2 text-sm" style={{ borderRadius: radius }} />
      <button type="submit" disabled={loading || !f.name}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white shadow-lg disabled:opacity-60"
        style={{ backgroundColor: primary, borderRadius: radius }}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {ctaLabel}
      </button>
    </form>
  );
}
