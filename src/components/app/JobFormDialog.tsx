import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABELS, STATUS_ORDER, todayISO, type Job, type JobStatus } from "@/lib/jobs";

const schema = z.object({
  company: z.string().trim().min(1, "Informe a empresa").max(120),
  position: z.string().trim().min(1, "Informe o cargo").max(160),
  job_url: z.union([z.literal(""), z.string().trim().url("Link inválido").max(500)]),
  applied_at: z.string().min(1, "Informe a data"),
  salary_range: z.string().trim().max(80),
  notes: z.string().trim().max(2000),
  follow_up_date: z.string(),
});

export function JobFormDialog({ open, onOpenChange, job }: { open: boolean; onOpenChange: (o: boolean) => void; job?: Job | null }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<JobStatus>("aplicada");
  useEffect(() => { if (open) setStatus(job?.status ?? "aplicada"); }, [open, job]);

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const payload = {
        ...values,
        status,
        job_url: values.job_url || null,
        salary_range: values.salary_range || null,
        notes: values.notes || null,
        follow_up_date: values.follow_up_date || null,
      };
      const { error } = job
        ? await supabase.from("jobs").update(payload).eq("id", job.id)
        : await supabase.from("jobs").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success(job ? "Vaga atualizada" : "Vaga adicionada");
      onOpenChange(false);
    },
    onError: () => toast.error("Não foi possível salvar. Tente novamente."),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos"); return; }
    save.mutate(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{job ? "Editar vaga" : "Nova vaga"}</DialogTitle>
          <DialogDescription>Registre os detalhes para acompanhar o processo.</DialogDescription>
        </DialogHeader>
        <form id="job-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" key={job?.id ?? "new"}>
          <Field label="Empresa" id="company"><Input id="company" name="company" defaultValue={job?.company} required maxLength={120} autoFocus /></Field>
          <Field label="Cargo" id="position"><Input id="position" name="position" defaultValue={job?.position} required maxLength={160} /></Field>
          <Field label="Link da vaga" id="job_url" full><Input id="job_url" name="job_url" type="url" placeholder="https://" defaultValue={job?.job_url ?? ""} /></Field>
          <Field label="Data da candidatura" id="applied_at"><Input id="applied_at" name="applied_at" type="date" defaultValue={job?.applied_at ?? todayISO()} required /></Field>
          <Field label="Status" id="status">
            <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Faixa salarial (opcional)" id="salary_range"><Input id="salary_range" name="salary_range" placeholder="R$ 4.000 – 5.500" defaultValue={job?.salary_range ?? ""} maxLength={80} /></Field>
          <Field label="Data de follow-up" id="follow_up_date"><Input id="follow_up_date" name="follow_up_date" type="date" defaultValue={job?.follow_up_date ?? ""} /></Field>
          <Field label="Observações" id="notes" full><Textarea id="notes" name="notes" rows={3} placeholder="Próxima ação, contato do recrutador..." defaultValue={job?.notes ?? ""} maxLength={2000} /></Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form="job-form" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, full, children }: { label: string; id: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
