import type { SiteContent } from "@/lib/sites.functions";
import { Check, Loader2, Instagram, Facebook, Youtube, Music2, Twitter, MessageCircle, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitToSite } from "@/lib/submissions.functions";
import { trackSiteEvent, type SiteEventType } from "@/lib/site-analytics.functions";
import { toast } from "sonner";

interface Props {
  content: SiteContent;
  theme: { primary: string; accent: string; background?: string; text?: string };
  siteId?: string;
}

export function SiteRenderer({ content, theme, siteId }: Props) {
  const bg = theme.background ?? "#ffffff";
  const text = theme.text ?? "#0a0a0a";
  const style = {
    "--sr-primary": theme.primary,
    "--sr-accent": theme.accent,
    "--sr-bg": bg,
    "--sr-text": text,
    backgroundColor: bg,
    color: text,
  } as React.CSSProperties;

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


  return (
    <div style={style} className="min-h-screen">
      <header className="border-b" style={{ borderColor: `${text}18` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-bold">{content.brandName}</div>
          <a href="#cta" onClick={() => track.current("cta_click", { where: "header" })}
             className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: theme.primary }}>
            {content.ctaLabel}
          </a>
        </div>
      </header>

      <section className="relative px-6 py-20" style={{ backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 0%, ${theme.primary}22, transparent 70%)` }}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
               style={{ backgroundColor: `${theme.accent}22`, color: theme.primary }}>
              {content.tagline}
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{content.headline}</h1>
            <p className="mt-6 text-lg opacity-80">{content.subheadline}</p>
            <div className="mt-8">
              <a href="#cta" onClick={() => track.current("cta_click", { where: "hero" })}
                 className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
                 style={{ backgroundColor: theme.primary }}>
                {content.ctaLabel}
              </a>
            </div>
          </div>
          {hero && (
            <div className="overflow-hidden rounded-3xl shadow-2xl" style={{ borderColor: `${theme.primary}33` }}>
              <img src={hero} alt={content.brandName} className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {content.benefits.map((b, i) => (
              <div key={i} className="rounded-2xl border p-6" style={{ borderColor: `${text}15`, backgroundColor: `${text}05` }}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                     style={{ backgroundColor: `${theme.primary}18`, color: theme.primary }}>
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm opacity-75">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-center text-3xl font-bold">Galeria</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {gallery.map((url, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden rounded-2xl">
                  <img src={url} alt={`Foto ${i + 2}`} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16" style={{ backgroundColor: `${text}05` }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">Sobre</h2>
          <p className="mt-4 text-lg opacity-80">{content.about}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">O que dizem</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {content.testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-2xl border p-6" style={{ borderColor: `${text}15` }}>
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
          <h2 className="mb-8 text-center text-3xl font-bold">Perguntas frequentes</h2>
          <div className="space-y-4">
            {content.faq.map((f, i) => (
              <div key={i} className="rounded-xl border p-5" style={{ borderColor: `${text}15`, backgroundColor: bg }}>
                <h3 className="font-semibold">{f.question}</h3>
                <p className="mt-2 text-sm opacity-75">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl p-10 text-center text-white"
             style={{ backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}>
          <h2 className="text-3xl font-bold sm:text-4xl">{content.headline}</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">{content.subheadline}</p>
          {siteId ? (
            <CaptureForm siteId={siteId} ctaLabel={content.ctaLabel} primary={theme.primary}
              onSubmitted={() => track.current("form_submit")} />
          ) : (
            <a href="#" className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-semibold shadow-lg" style={{ color: theme.primary }}>
              {content.ctaLabel}
            </a>
          )}
        </div>
      </section>

      <SocialsBar socials={socials} primary={theme.primary}
        onClick={(label) => track.current(label === "WhatsApp" ? "whatsapp_click" : "social_click", { network: label })} />

      <footer className="border-t px-6 py-8 text-center text-sm opacity-70" style={{ borderColor: `${text}18` }}>
        {content.footerNote} · Feito com <a href="/" className="underline">Sitelume</a>
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

function CaptureForm({ siteId, ctaLabel, primary, onSubmitted }: { siteId: string; ctaLabel: string; primary: string; onSubmitted?: () => void }) {
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
    <form onSubmit={onSubmit} className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl bg-white/95 p-6 text-left text-neutral-900">
      <input required placeholder="Seu nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      <input type="email" placeholder="E-mail" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      <input placeholder="Telefone / WhatsApp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      <textarea placeholder="Mensagem (opcional)" rows={2} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={loading || !f.name}
        className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold text-white shadow-lg disabled:opacity-60"
        style={{ backgroundColor: primary }}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {ctaLabel}
      </button>
    </form>
  );
}
