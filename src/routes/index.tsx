import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Zap, Rocket, ArrowRight, Wand2, Palette, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="inline-block h-6 w-6 rounded-md bg-gradient-primary" />
            Sitelume
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-hero px-6 pt-24 pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Novo · IA gera sua landing em segundos
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-7xl">
            Sua landing page pronta em{" "}
            <span className="text-gradient-primary">minutos</span>, não meses.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Descreva o seu negócio. A Sitelume escreve os textos, monta a página e
            publica em uma URL profissional. Sem código, sem designer, sem template
            genérico.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/30">
                Criar minha landing grátis <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="outline" className="border-border/60">
                Ver como funciona
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sem cartão de crédito · Publicação incluída
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Três passos até estar no ar
            </h2>
            <p className="mt-3 text-muted-foreground">
              Do briefing à URL pública em menos tempo do que abrir um editor.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Wand2,
                step: "01",
                title: "Descreva seu negócio",
                text: "Preencha um briefing rápido: nome, setor, público e sua oferta.",
              },
              {
                icon: Sparkles,
                step: "02",
                title: "A IA escreve tudo",
                text: "Headline, benefícios, depoimentos e FAQ, no tom da sua marca.",
              },
              {
                icon: Rocket,
                step: "03",
                title: "Publique com 1 clique",
                text: "Sua landing fica em uma URL pública, pronta para receber tráfego.",
              },
            ].map(({ icon: Icon, step, title, text }) => (
              <div
                key={step}
                className="group relative rounded-2xl border border-border/60 bg-card/60 p-6 transition-colors hover:border-primary/50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-sm text-muted-foreground">{step}</span>
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border/50 bg-card/30 px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Feita para converter, não só bonita.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada seção segue princípios de copy e design que funcionam: hero
              direto, benefícios claros, prova social e uma CTA que não deixa
              dúvida sobre o próximo passo.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Zap, t: "Geração em segundos", d: "IA de última geração escreve o site inteiro na hora." },
                { icon: Palette, t: "Personalize o visual", d: "Ajuste cores, textos e imagens sem sair da plataforma." },
                { icon: Globe2, t: "URL pública imediata", d: "Publique em /s/sua-marca e comece a divulgar." },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-sm text-muted-foreground">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-primary opacity-30 blur-2xl" />
            <div className="relative rounded-2xl border border-border/60 bg-background/80 p-6 shadow-2xl">
              <div className="mb-4 flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive/70" />
                <span className="h-3 w-3 rounded-full bg-accent/70" />
                <span className="h-3 w-3 rounded-full bg-primary/70" />
              </div>
              <div className="space-y-3">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-24 rounded-lg bg-gradient-primary opacity-80" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 rounded bg-muted" />
                  <div className="h-12 rounded bg-muted" />
                  <div className="h-12 rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-gradient-primary p-10 text-center text-primary-foreground shadow-2xl shadow-primary/30">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Pronto para publicar sua landing?
          </h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Crie sua conta grátis, gere sua primeira página e coloque no ar hoje.
          </p>
          <div className="mt-8">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                Começar agora <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Sitelume · Feito no Brasil
      </footer>
    </div>
  );
}
