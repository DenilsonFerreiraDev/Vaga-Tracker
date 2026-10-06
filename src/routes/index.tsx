import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Check, Search, CornerDownLeft, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VagaTracker — Sua busca por emprego merece mais do que uma planilha" },
      { name: "description", content: "A central de controle da sua busca por emprego: candidaturas, próximas ações e follow-ups em um só lugar." },
      { property: "og:title", content: "VagaTracker — Central de controle da busca de emprego" },
      { property: "og:description", content: "Pare de perder candidaturas, entrevistas e oportunidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

type Stage = "Aplicada" | "Em análise" | "Entrevista" | "Teste técnico" | "Aprovada" | "Rejeitada";
const STAGE_DOT: Record<Stage, string> = {
  Aplicada: "text-muted-foreground",
  "Em análise": "text-warning",
  Entrevista: "text-primary",
  "Teste técnico": "text-primary",
  Aprovada: "text-success",
  Rejeitada: "text-destructive",
};

const SAMPLE: { company: string; role: string; stage: Stage; next: string; followUp: string; due?: boolean }[] = [
  { company: "Nubank", role: "Analista de Dados Jr.", stage: "Entrevista", next: "Preparar case técnico", followUp: "Hoje", due: true },
  { company: "iFood", role: "Desenvolvedora Front-end", stage: "Teste técnico", next: "Entregar desafio no GitHub", followUp: "Amanhã", due: true },
  { company: "Ambev", role: "Trainee 2027", stage: "Em análise", next: "Mandar mensagem ao recrutador", followUp: "12 out" },
  { company: "Stone", role: "UX Designer", stage: "Aprovada", next: "Revisar proposta", followUp: "14 out" },
  { company: "Itaú", role: "Estágio em Produto", stage: "Aplicada", next: "Aguardar retorno", followUp: "18 out" },
  { company: "Mercado Livre", role: "QA Analyst", stage: "Rejeitada", next: "Pedir feedback", followUp: "—" },
];

const FILTERS = ["Todas", "Em andamento", "Follow-up"] as const;

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup" }}>Criar conta</Link></Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 md:pt-20">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Central de controle da busca de emprego
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.1] sm:text-[44px]">
              Sua busca por emprego merece mais do que uma planilha.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Saiba exatamente onde está cada candidatura, qual é o próximo passo e quem você precisa responder hoje.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>Começar gratuitamente <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <span className="text-sm text-muted-foreground">Grátis. Sem cartão.</span>
            </div>

            <div className="mt-12"><LivePreview /></div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">
            {[
              ["01", "Nenhuma candidatura esquecida", "Vagas do LinkedIn, Gupy e e-mail num só lugar, com link, salário e anotações."],
              ["02", "O próximo passo sempre claro", "Cada processo tem uma etapa e uma próxima ação. Você abre e já sabe o que fazer."],
              ["03", "Follow-up no momento certo", "Defina a data de retorno e o VagaTracker avisa quando é hora de cobrar o recrutador."],
            ].map(([n, t, d]) => (
              <article key={n} className="bg-card p-6">
                <span className="font-mono text-xs text-muted-foreground">{n}</span>
                <h2 className="mt-3 text-base font-semibold tracking-tight">{t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-semibold">Pensado para quem está na correria.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Estudantes, recém-formados e profissionais em recolocação usam o VagaTracker para trocar a ansiedade pela clareza.
              </p>
            </div>
            <ol className="grid gap-3 text-sm">
              {["Salve a vaga em segundos", "Atualize a etapa depois de cada contato", "Veja suas taxas de resposta e entrevista", "Ajuste a estratégia e conquiste a vaga"].map((s, i) => (
                <li key={s} className="flex items-center gap-4 rounded-md border bg-background px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-medium">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6"><LeadForm /></section>

        <section className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
            <h2 className="text-2xl font-semibold">Pare de perder candidaturas, entrevistas e oportunidades.</h2>
            <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Começar agora <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} VagaTracker</span>
          <span className="font-mono">feito no Brasil</span>
        </div>
      </footer>
    </div>
  );
}

function LivePreview() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas");
  const [q, setQ] = useState("");
  const [done, setDone] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => SAMPLE.filter((r) => {
    if (filter === "Em andamento" && (r.stage === "Aprovada" || r.stage === "Rejeitada")) return false;
    if (filter === "Follow-up" && !r.due) return false;
    const s = q.trim().toLowerCase();
    return !s || `${r.company} ${r.role}`.toLowerCase().includes(s);
  }), [filter, q]);

  const dueCount = SAMPLE.filter((r) => r.due && !done[r.company]).length;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1" role="tablist" aria-label="Filtrar candidaturas">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={cn("rounded-md px-2.5 py-1 text-sm transition-colors",
                filter === f ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f}
              {f === "Follow-up" && dueCount > 0 && (
                <span className="ml-1.5 rounded bg-primary px-1.5 py-px font-mono text-[10px] text-primary-foreground">{dueCount}</span>
              )}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm sm:w-64">
          <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa ou cargo"
            aria-label="Buscar empresa ou cargo" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
          <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </label>
      </div>

      <div className="hidden grid-cols-[1.3fr_1fr_1.4fr_auto] gap-4 border-b bg-muted/50 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
        <span>Empresa / cargo</span><span>Etapa</span><span>Próxima ação</span><span className="w-24 text-right">Follow-up</span>
      </div>

      <ul className="divide-y">
        {rows.map((r) => {
          const isDone = done[r.company];
          return (
            <li key={r.company} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 px-4 py-3 text-sm transition-colors hover:bg-muted/40 md:grid-cols-[1.3fr_1fr_1.4fr_auto] md:items-center">
              <div className="min-w-0">
                <div className="font-medium">{r.company}</div>
                <div className="truncate text-muted-foreground">{r.role}</div>
              </div>
              <span className="flex items-center gap-1.5 justify-self-end text-muted-foreground md:justify-self-start">
                <Circle className={cn("h-2.5 w-2.5 fill-current", STAGE_DOT[r.stage])} aria-hidden />{r.stage}
              </span>
              <button onClick={() => setDone((d) => ({ ...d, [r.company]: !d[r.company] }))}
                className="col-span-2 flex items-center gap-2 text-left md:col-span-1" aria-pressed={isDone}>
                <span className={cn("inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  isDone && "border-foreground bg-foreground text-background")}>
                  {isDone && <Check className="h-3 w-3" />}
                </span>
                <span className={cn(isDone && "text-muted-foreground line-through")}>{r.next}</span>
              </button>
              <span className={cn("hidden w-24 text-right font-mono text-xs md:block",
                r.due && !isDone ? "text-primary" : "text-muted-foreground")}>{r.followUp}</span>
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma vaga encontrada.</li>}
      </ul>

      <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 font-mono text-[11px] text-muted-foreground">
        <span>{rows.length} de {SAMPLE.length} candidaturas</span>
        <span className="hidden sm:inline">exemplo interativo · clique nas ações</span>
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
    const parsed = leadSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    setLoading(true);
    const { error } = await supabase.from("leads").insert({
      name: parsed.data.name, email: parsed.data.email, professional_area: parsed.data.professional_area || null,
    });
    setLoading(false);
    if (error) { toast.error("Não foi possível enviar. Tente novamente."); return; }
    setDone(true);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-end">
      <div>
        <h2 className="text-2xl font-semibold">Dicas práticas para conseguir mais entrevistas.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Currículo, LinkedIn e processos seletivos. Um e-mail por semana, sem spam.</p>
      </div>
      {done ? (
        <p className="flex items-center gap-2 rounded-md border px-4 py-3 text-sm"><Check className="h-4 w-4 text-success" /> Cadastro recebido. Obrigado!</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input name="name" aria-label="Nome" placeholder="Nome" required maxLength={120} autoComplete="name" />
          <Input name="email" aria-label="E-mail" type="email" placeholder="E-mail" required maxLength={255} autoComplete="email" />
          <Input name="professional_area" aria-label="Área profissional" placeholder="Área profissional" maxLength={120} />
          <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Inscrever"}</Button>
        </form>
      )}
    </div>
  );
}
