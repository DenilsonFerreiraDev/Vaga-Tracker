import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];
export type JobStatus = Database["public"]["Enums"]["job_status"];

export const STATUS_LABELS: Record<JobStatus, string> = {
  aplicada: "Aplicada",
  em_analise: "Em análise",
  entrevista_rh: "Entrevista RH",
  entrevista_tecnica: "Entrevista Técnica",
  teste_tecnico: "Teste Técnico",
  aguardando_retorno: "Aguardando Retorno",
  rejeitada: "Rejeitada",
  aprovada: "Aprovada",
};

export const STATUS_ORDER = Object.keys(STATUS_LABELS) as JobStatus[];

export const STATUS_TONE: Record<JobStatus, string> = {
  aplicada: "bg-secondary text-secondary-foreground",
  em_analise: "bg-warning/15 text-foreground",
  entrevista_rh: "bg-primary/10 text-primary",
  entrevista_tecnica: "bg-primary/10 text-primary",
  teste_tecnico: "bg-primary/10 text-primary",
  aguardando_retorno: "bg-muted text-muted-foreground",
  rejeitada: "bg-destructive/10 text-destructive",
  aprovada: "bg-success/15 text-success",
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  aplicada: "var(--chart-5)",
  em_analise: "var(--chart-3)",
  entrevista_rh: "var(--chart-1)",
  entrevista_tecnica: "oklch(0.65 0.17 255)",
  teste_tecnico: "oklch(0.75 0.11 250)",
  aguardando_retorno: "var(--input)",
  rejeitada: "var(--chart-4)",
  aprovada: "var(--chart-2)",
};

export const STATUS_DOT: Record<JobStatus, string> = {
  aplicada: "bg-muted-foreground",
  em_analise: "bg-warning",
  entrevista_rh: "bg-primary",
  entrevista_tecnica: "bg-primary",
  teste_tecnico: "bg-primary",
  aguardando_retorno: "bg-input",
  rejeitada: "bg-destructive",
  aprovada: "bg-success",
};

export const FINAL_STATUSES: JobStatus[] = ["rejeitada", "aprovada"];

export function isFollowUpDue(j: Job, today = todayISO()) {
  return !!j.follow_up_date && j.follow_up_date <= today && !FINAL_STATUSES.includes(j.status);
}

export function relativeDay(d: string | null, today = todayISO()) {
  if (!d) return "—";
  const diff = Math.round((Date.parse(d) - Date.parse(today)) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff < 0) return `${-diff} dias atrás`;
  if (diff < 7) return `em ${diff} dias`;
  return formatDate(d);
}

export const INTERVIEW_STATUSES: JobStatus[] = ["entrevista_rh", "entrevista_tecnica", "teste_tecnico"];
export const ANALYSIS_STATUSES: JobStatus[] = ["em_analise", "aguardando_retorno"];

export const jobsQuery = queryOptions({
  queryKey: ["jobs"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("applied_at", { ascending: false });
    if (error) throw error;
    return data as Job[];
  },
});

export function computeMetrics(jobs: Job[]) {
  const total = jobs.length;
  const count = (s: JobStatus[]) => jobs.filter((j) => s.includes(j.status)).length;
  const interviews = count(INTERVIEW_STATUSES);
  const analysis = count(ANALYSIS_STATUSES);
  const rejected = count(["rejeitada"]);
  const approved = count(["aprovada"]);
  const responded = jobs.filter((j) => j.status !== "aplicada" && j.status !== "aguardando_retorno").length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return {
    total,
    interviews,
    analysis,
    rejected,
    approved,
    responseRate: pct(responded),
    interviewRate: pct(interviews + approved),
    approvalRate: pct(approved),
  };
}

export function formatDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
