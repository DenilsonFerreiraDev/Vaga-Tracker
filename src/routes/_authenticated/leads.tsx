import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — VagaTracker" }, { name: "description", content: "Contatos captados pela página inicial." }] }),
  component: Leads,
});

function Leads() {
  const { data: me } = useQuery(meQuery);
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    enabled: !!me?.isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (me && !me.isAdmin) {
    return <><PageHeader title="Leads" /><p className="px-8 py-16 text-center text-sm text-muted-foreground">Apenas administradores podem ver esta página.</p></>;
  }

  return (
    <>
      <PageHeader title="Leads" description={`${leads.length} contatos captados pela página inicial`} />
      <div className="px-4 py-6 sm:px-8">
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b bg-muted/50 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-2 text-left font-normal">Nome</th><th className="px-4 py-2 text-left font-normal">E-mail</th><th className="px-4 py-2 text-left font-normal">Área</th><th className="px-4 py-2 text-right font-normal">Cadastro</th></tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3"><a href={`mailto:${l.email}`} className="text-muted-foreground hover:text-foreground">{l.email}</a></td>
                  <td className="px-4 py-3 text-muted-foreground">{l.professional_area || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
              {!isLoading && leads.length === 0 && <tr><td colSpan={4} className="px-4 py-16 text-center text-muted-foreground">Nenhum lead ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
