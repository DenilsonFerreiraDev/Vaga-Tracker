import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, BellRing, Briefcase, CalendarCheck, Check, Hourglass, Plus, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatusPill } from "@/components/app/PageHeader";
import { JobFormDialog } from "@/components/app/JobFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { computeMetrics, isFollowUpDue, jobsQuery, relativeDay, STATUS_DOT, STATUS_LABELS, todayISO, FINAL_STATUSES, type Job } from "@/lib/jobs";
import { meQuery } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — VagaTracker" }, { name: "description", content: "Visão geral da sua busca por emprego." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: jobs, isLoading } = useQuery(jobsQuery);
  const { data: me } = useQuery(meQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const m = computeMetrics(jobs ?? []);
  const today = todayISO();
  const due = (jobs ?? []).filter((j) => isFollowUpDue(j, today)).sort((a, b) => (a.follow_up_date! < b.follow_up_date! ? -1 : 1));
  const upcoming = (jobs ?? [])
    .filter((j) => j.follow_up_date && j.follow_up_date > today && !FINAL_STATUSES.includes(j.status))
    .sort((a, b) => (a.follow_up_date! < b.follow_up_date! ? -1 : 1)).slice(0, 4);
  const recent = (jobs ?? []).slice(0, 5);
  const first = me?.name?.split(" ")[0];

  const cards = [
    { label: "Total de candidaturas", value: m.total, icon: Briefcase, tone: "text-foreground" },
    { label: "Em análise", value: m.analysis, icon: Hourglass, tone: "text-warning" },
    { label: "Entrevistas", value: m.interviews, icon: CalendarCheck, tone: "text-primary" },
    { label: "Rejeitadas", value: m.rejected, icon: XCircle, tone: "text-destructive" },
    { label: "Aprovadas", value: m.approved, icon: Trophy, tone: "text-success" },
  ];

  return (
    <>
      <PageHeader
        title={first ? `Olá, ${first}` : "Dashboard"}
        description={due.length ? `Você tem ${due.length} follow-up${due.length > 1 ? "s" : ""} para hoje.` : "Tudo em dia por aqui."}
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />Nova vaga</Button>}
      />
      <div className="space-y-8 px-4 py-6 sm:px-8">
        <section aria-label="Métricas" className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {c.label}<c.icon className={cn("h-4 w-4", c.tone)} aria-hidden />
              </div>
              {isLoading ? <Skeleton className="mt-2 h-8 w-12" /> : <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{c.value}</div>}
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><BellRing className="h-4 w-4 text-primary" />Vagas que precisam de follow-up</h2>
              <span className="font-mono text-xs text-muted-foreground">{due.length}</span>
            </div>
            {due.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum follow-up pendente. Defina datas de retorno nas suas vagas.</p>
            ) : (
              <ul className="divide-y">{due.map((j) => <FollowUpRow key={j.id} job={j} onEdit={() => { setEditing(j); setOpen(true); }} />)}</ul>
            )}
            {upcoming.length > 0 && (
              <>
                <div className="border-y bg-muted/40 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Próximos</div>
                <ul className="divide-y">
                  {upcoming.map((j) => (
                    <li key={j.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate"><span className="font-medium">{j.company}</span> <span className="text-muted-foreground">· {j.position}</span></span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{relativeDay(j.follow_up_date)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Candidaturas recentes</h2>
              <Link to="/vagas" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {recent.length === 0 && !isLoading ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">Você ainda não registrou nenhuma vaga.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setEditing(null); setOpen(true); }}>Adicionar primeira vaga</Button>
              </div>
            ) : (
              <ul className="divide-y">
                {recent.map((j) => (
                  <li key={j.id}>
                    <button onClick={() => { setEditing(j); setOpen(true); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40">
                      <div className="min-w-0"><div className="truncate text-sm font-medium">{j.company}</div><div className="truncate text-xs text-muted-foreground">{j.position}</div></div>
                      <StatusPill label={STATUS_LABELS[j.status]} dotClass={STATUS_DOT[j.status]} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <JobFormDialog open={open} onOpenChange={setOpen} job={editing} />
    </>
  );
}

function FollowUpRow({ job, onEdit }: { job: Job; onEdit: () => void }) {
  const qc = useQueryClient();
  const done = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("jobs").update({ follow_up_date: null }).eq("id", job.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jobs"] }); toast.success("Follow-up concluído"); },
  });
  const overdue = job.follow_up_date! < todayISO();
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button onClick={() => done.mutate()} disabled={done.isPending} aria-label={`Marcar follow-up de ${job.company} como feito`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border hover:border-foreground">
        {done.isPending && <Check className="h-3 w-3" />}
      </button>
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm"><span className="font-medium">{job.company}</span> <span className="text-muted-foreground">· {job.position}</span></div>
        {job.notes && <div className="truncate text-xs text-muted-foreground">{job.notes}</div>}
      </button>
      <span className={cn("shrink-0 font-mono text-xs", overdue ? "text-destructive" : "text-primary")}>{relativeDay(job.follow_up_date)}</span>
    </li>
  );
}
