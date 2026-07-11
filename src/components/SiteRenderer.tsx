import type { SiteContent } from "@/lib/sites.functions";
import { Check } from "lucide-react";

interface Props {
  content: SiteContent;
  theme: { primary: string; accent: string };
}

export function SiteRenderer({ content, theme }: Props) {
  const style = {
    "--sr-primary": theme.primary,
    "--sr-accent": theme.accent,
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className="min-h-screen bg-white text-neutral-900"
    >
      {/* Nav */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-bold">{content.brandName}</div>
          <a
            href="#cta"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--sr-primary)" }}
          >
            {content.ctaLabel}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        className="px-6 py-20"
        style={{
          backgroundImage: `radial-gradient(ellipse 70% 60% at 50% 0%, ${theme.primary}22, transparent 70%)`,
        }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <p
            className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${theme.accent}22`, color: "var(--sr-primary)" }}
          >
            {content.tagline}
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            {content.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            {content.subheadline}
          </p>
          <div className="mt-8">
            <a
              href="#cta"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: "var(--sr-primary)" }}
            >
              {content.ctaLabel}
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {content.benefits.map((b, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${theme.primary}18`, color: "var(--sr-primary)" }}
                >
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold">Sobre</h2>
          <p className="mt-4 text-lg text-neutral-700">{content.about}</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">O que dizem</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {content.testimonials.map((t, i) => (
              <blockquote
                key={i}
                className="rounded-2xl border border-neutral-200 bg-white p-6"
              >
                <p className="text-neutral-700">“{t.quote}”</p>
                <footer className="mt-4 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-neutral-500">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-neutral-50 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">Perguntas frequentes</h2>
          <div className="space-y-4">
            {content.faq.map((f, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 className="font-semibold">{f.question}</h3>
                <p className="mt-2 text-sm text-neutral-600">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-6 py-20">
        <div
          className="mx-auto max-w-4xl rounded-3xl p-10 text-center text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
          }}
        >
          <h2 className="text-3xl font-bold sm:text-4xl">{content.headline}</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">{content.subheadline}</p>
          <a
            href="#"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-semibold shadow-lg"
            style={{ color: "var(--sr-primary)" }}
          >
            {content.ctaLabel}
          </a>
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-8 text-center text-sm text-neutral-500">
        {content.footerNote} · Feito com{" "}
        <a href="/" className="underline">
          Sitelume
        </a>
      </footer>
    </div>
  );
}
