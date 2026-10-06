import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, StatusPill } from "@/components/app/PageHeader";
import { JobFormDialog } from "@/components/app/JobFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, isFollowUpDue, jobsQuery, relativeDay, STATUS_DOT, STATUS_LABELS, STATUS_ORDER, type Job, type JobStatus } from "@/lib/jobs";
import { cn } from "@/lib/utils";

const statusEnum = z.enum(STATUS_ORDER as [JobStatus, ...JobStatus[]]);

export const Route = createFileRoute("/_authenticated/vagas")({
  validateSearch: (s: Record<string, unknown>) => z.object({ status: statusEnum.optional(), q: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Vagas — VagaTracker" }, { name: "description", content: "Gerencie suas candidaturas." }] }),
  component: VagasPage,
});

function VagasPage() {
  const { status, q = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: jobs, isLoading } = useQuery(jobsQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const qc = useQueryClient();

  const counts = useMemo(() => {
    const c: Partial<Record<JobStatus, number>> = {};
    (jobs ?? []).forEach((j) => { c[j.status] = (c[j.status] ?? 0) + 1; });
    return c;
  }, [jobs]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (jobs ?? []).filter((j) => (!status || j.status === status) && (!s || `${j.company} ${j.position}`.toLowerCase().includes(s)));
  }, [jobs, status, q]);

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("jobs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jobs"] }); toast.success("Vaga excluída"); setDeleting(null); },
    onError: () => toast.error("Não foi possível excluir."),
  });

  const edit = (j: Job | null) => { setEditing(j); setOpen(true); };

  return (
    <>
      <PageHeader title="Vagas" description={`${jobs?.length ?? 0} candidaturas registradas`}
        actions={<Button onClick={() => edit(null)}><Plus className="mr-1 h-4 w-4" />Nova vaga</Button>} />
      <div className="px-4 py-6 sm:px-8">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-col gap-3 border-b px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filtrar por status">
              <FilterTab active={!status} onClick={() => navigate({ search: (p) => ({ ...p, status: undefined }) })} label="Todas" count={jobs?.length} />
              {STATUS_ORDER.map((s) => (
                <FilterTab key={s} active={status === s} onClick={() => navigate({ search: (p) => ({ ...p, status: s }) })} label={STATUS_LABELS[s]} count={counts[s]} />
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm lg:w-64">
              <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <input value={q} onChange={(e) => navigate({ search: (p) => ({ ...p, q: e.target.value || undefined }), replace: true })}
                placeholder="Buscar empresa ou cargo" aria-label="Buscar empresa ou cargo" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
            </label>
          </div>

          <div className="hidden grid-cols-[1.4fr_1fr_110px_110px_40px] gap-4 border-b bg-muted/50 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
            <span>Empresa / cargo</span><span>Status</span><span>Data</span><span>Follow-up</span><span className="sr-only">Ações</span>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-sm text-muted-foreground">{jobs?.length ? "Nenhuma vaga encontrada com esses filtros." : "Nenhuma vaga ainda. Comece registrando sua primeira candidatura."}</p>
              {!jobs?.length && <Button variant="outline" size="sm" className="mt-3" onClick={() => edit(null)}>Adicionar vaga</Button>}
            </div>
          ) : (
            <ul className="divide-y">
              {rows.map((j) => (
                <li key={j.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-muted/40 md:grid-cols-[1.4fr_1fr_110px_110px_40px]">
                  <button onClick={() => edit(j)} className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5 truncate font-medium">{j.company}
                      {j.job_url && <a href={j.job_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Abrir vaga" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-3 w-3" /></a>}
                    </div>
                    <div className="truncate text-muted-foreground">{j.position}{j.salary_range && <span className="hidden sm:inline"> · {j.salary_range}</span>}</div>
                  </button>
                  <div className="row-span-2 justify-self-end md:row-span-1 md:justify-self-start">
                    <span className="md:hidden"><RowMenu onEdit={() => edit(j)} onDelete={() => setDeleting(j)} /></span>
                    <span className="hidden md:inline"><StatusPill label={STATUS_LABELS[j.status]} dotClass={STATUS_DOT[j.status]} /></span>
                  </div>
                  <div className="flex items-center gap-3 md:contents">
                    <span className="md:hidden"><StatusPill label={STATUS_LABELS[j.status]} dotClass={STATUS_DOT[j.status]} /></span>
                    <span className="font-mono text-xs text-muted-foreground">{formatDate(j.applied_at)}</span>
                    <span className={cn("font-mono text-xs", isFollowUpDue(j) ? "text-primary" : "text-muted-foreground")}>{j.follow_up_date ? relativeDay(j.follow_up_date) : <span className="hidden md:inline">—</span>}</span>
                  </div>
                  <span className="hidden md:block"><RowMenu onEdit={() => edit(j)} onDelete={() => setDeleting(j)} /></span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t bg-muted/40 px-4 py-2 font-mono text-[11px] text-muted-foreground">{rows.length} de {jobs?.length ?? 0} candidaturas</div>
        </div>
      </div>

      <JobFormDialog open={open} onOpenChange={setOpen} job={editing} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
            <AlertDialogDescription>A candidatura para {deleting?.company} será removida permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && del.mutate(deleting.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FilterTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button role="tab" aria-selected={active} onClick={onClick}
      className={cn("shrink-0 rounded-md px-2.5 py-1 text-sm transition-colors", active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
      {label}{count ? <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{count}</span> : null}
    </button>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Ações" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
