import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { computeMetrics, jobsQuery, STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/estatisticas")({
  head: () => ({ meta: [{ title: "Estatísticas — VagaTracker" }, { name: "description", content: "Métricas da sua busca por emprego." }] }),
  component: Stats,
});

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function Stats() {
  const { data: jobs = [] } = useQuery(jobsQuery);
  const m = computeMetrics(jobs);

  const monthly = useMemo(() => {
    const now = new Date();
    const out = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()]!, total: 0 };
    });
    jobs.forEach((j) => { const o = out.find((x) => j.applied_at.startsWith(x.key)); if (o) o.total++; });
    return out;
  }, [jobs]);

  const byStatus = STATUS_ORDER.map((s) => ({ s, name: STATUS_LABELS[s], value: jobs.filter((j) => j.status === s).length })).filter((d) => d.value > 0);

  const kpis = [
    { label: "Total de candidaturas", value: String(m.total) },
    { label: "Taxa de resposta", value: `${m.responseRate}%` },
    { label: "Taxa de entrevistas", value: `${m.interviewRate}%` },
    { label: "Taxa de aprovação", value: `${m.approvalRate}%` },
  ];
  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

  return (
    <>
      <PageHeader title="Estatísticas" description="Entenda o desempenho da sua busca." />
      <div className="space-y-6 px-4 py-6 sm:px-8">
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-card p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{k.value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-lg border bg-card">
            <h2 className="border-b px-4 py-3 text-sm font-semibold">Candidaturas por mês</h2>
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} stroke="var(--muted-foreground)" />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} formatter={(v) => [v, "Candidaturas"]} />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border bg-card">
            <h2 className="border-b px-4 py-3 text-sm font-semibold">Distribuição por status</h2>
            {byStatus.length === 0 ? (
              <p className="px-4 py-24 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <div className="p-4">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="var(--card)">
                        {byStatus.map((d) => <Cell key={d.s} fill={STATUS_COLORS[d.s]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {byStatus.map((d) => (
                    <li key={d.s} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 truncate"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_COLORS[d.s] }} />{d.name}</span>
                      <span className="font-mono text-muted-foreground">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
