import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight, BellRing, BarChart3, CheckCircle2, ClipboardList, Layers, PlayCircle,
  RefreshCw, Trophy, Briefcase, CalendarCheck, XCircle, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VagaTracker — Organize sua busca por emprego" },
      { name: "description", content: "Controle todas as suas candidaturas em um único lugar e acompanhe cada etapa do processo seletivo." },
      { property: "og:title", content: "VagaTracker — Organize sua busca por emprego" },
      { property: "og:description", content: "Registre vagas, acompanhe etapas e visualize métricas da sua busca por emprego." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const benefits = [
  { icon: ClipboardList, title: "Nunca perca uma candidatura", text: "Registre e centralize todas as vagas." },
  { icon: Layers, title: "Acompanhe cada etapa", text: "Monitore entrevistas, testes e retornos." },
  { icon: BarChart3, title: "Visualize sua evolução", text: "Acompanhe métricas e resultados da sua busca." },
];

const steps = [
  { icon: Briefcase, text: "Cadastre uma vaga." },
  { icon: RefreshCw, text: "Atualize o status do processo." },
  { icon: BarChart3, text: "Visualize suas métricas." },
  { icon: Trophy, text: "Conquiste sua próxima oportunidade." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Começar grátis</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-soft">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-soft">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Seu CRM pessoal de carreira
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
                Organize sua busca por emprego e{" "}
                <span className="text-primary">aumente suas chances</span> de conseguir entrevistas.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Controle todas as suas candidaturas em um único lugar e acompanhe cada etapa do processo seletivo.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 shadow-glow">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Começar Gratuitamente <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 bg-card">
                  <a href="#demo"><PlayCircle className="mr-1 h-4 w-4" /> Ver Demonstração</a>
                </Button>
              </div>
            </div>
            <DemoPreview />
          </div>
        </section>

        {/* Benefícios */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-extrabold">Tudo o que você precisa para ser contratado</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <article key={b.title} className="rounded-2xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-card">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <b.icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-muted-foreground">{b.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section id="demo" className="scroll-mt-20 border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-3xl font-extrabold">Como funciona</h2>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.text} className="relative rounded-2xl border bg-background p-6">
                  <span className="text-sm font-bold text-primary">Passo {i + 1}</span>
                  <s.icon className="mt-4 h-7 w-7 text-primary-deep" aria-hidden />
                  <p className="mt-3 font-semibold">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Lead capture */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <LeadForm />
        </section>

        {/* CTA Final */}
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-6xl rounded-3xl bg-hero px-6 py-16 text-center text-primary-foreground shadow-card">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Pare de perder oportunidades.</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Comece agora e tenha controle total da sua busca por emprego.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-8">
              <Link to="/auth" search={{ mode: "signup" }}>Começar Agora <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} VagaTracker. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function DemoPreview() {
  const rows = [
    { c: "Nubank", p: "Product Designer", s: "Entrevista Técnica", t: "bg-primary/10 text-primary" },
    { c: "iFood", p: "Frontend Engineer", s: "Em análise", t: "bg-warning/15 text-foreground" },
    { c: "Stone", p: "UX Researcher", s: "Aprovada", t: "bg-success/15 text-success" },
    { c: "XP Inc.", p: "Data Analyst", s: "Rejeitada", t: "bg-destructive/10 text-destructive" },
  ];
  const stats = [
    { icon: Briefcase, label: "Total", v: 24, t: "text-primary" },
    { icon: CalendarCheck, label: "Entrevistas", v: 6, t: "text-primary-deep" },
    { icon: Trophy, label: "Aprovadas", v: 2, t: "text-success" },
    { icon: XCircle, label: "Rejeitadas", v: 5, t: "text-destructive" },
  ];
  return (
    <div aria-hidden className="rounded-3xl border bg-card p-4 shadow-card sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-3">
            <s.icon className={`h-4 w-4 ${s.t}`} />
            <div className="mt-2 text-2xl font-extrabold">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4" /> Pesquisar vagas...
      </div>
      <ul className="mt-3 divide-y">
        {rows.map((r) => (
          <li key={r.c} className="flex items-center justify-between gap-3 py-3">
            <div>
              <div className="font-semibold">{r.c}</div>
              <div className="text-xs text-muted-foreground">{r.p}</div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.t}`}>{r.s}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        <BellRing className="h-4 w-4" /> 2 vagas precisam de follow-up hoje
      </div>
    </div>
  );
}

const leadSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  professional_area: z.string().trim().max(120).optional(),
});

function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = leadSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      professional_area: parsed.data.professional_area || null,
    });
    setLoading(false);
    if (error) return toast.error("Não foi possível enviar. Tente novamente.");
    setDone(true);
    toast.success("Pronto! Em breve você receberá nossas dicas.");
  }

  return (
    <div className="grid items-center gap-10 rounded-3xl border bg-card p-6 shadow-soft md:grid-cols-2 md:p-10">
      <div>
        <h2 className="text-3xl font-extrabold">Receba dicas para conseguir mais entrevistas</h2>
        <p className="mt-3 text-muted-foreground">
          Deixe seu contato e receba conteúdos práticos sobre currículo, LinkedIn e processos seletivos.
        </p>
      </div>
      {done ? (
        <div className="rounded-2xl bg-success/10 p-6 text-center font-semibold text-success">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8" /> Obrigado! Seu cadastro foi recebido.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="lead-name">Nome</Label>
            <Input id="lead-name" name="name" required maxLength={120} autoComplete="name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lead-email">E-mail</Label>
            <Input id="lead-email" name="email" type="email" required maxLength={255} autoComplete="email" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lead-area">Área profissional</Label>
            <Input id="lead-area" name="professional_area" maxLength={120} placeholder="Ex.: Tecnologia, Marketing..." />
          </div>
          <Button type="submit" size="lg" disabled={loading}>{loading ? "Enviando..." : "Quero receber"}</Button>
        </form>
      )}
    </div>
  );
}
