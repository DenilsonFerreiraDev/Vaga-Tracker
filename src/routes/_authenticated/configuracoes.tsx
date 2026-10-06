import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { initials, meQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — VagaTracker" }, { name: "description", content: "Gerencie seu perfil." }] }),
  component: Settings,
});

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b py-8 md:grid-cols-[240px_1fr]">
      <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
      <div className="max-w-md">{children}</div>
    </section>
  );
}

function Settings() {
  const { data: me } = useQuery(meQuery);
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (!me) return <PageHeader title="Configurações" />;

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim().slice(0, 120);
    setBusy("name");
    const { error } = await supabase.from("profiles").upsert({ id: me!.id, full_name: name });
    setBusy(null);
    if (error) { toast.error("Não foi possível salvar."); return; }
    qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Nome atualizado");
  }

  async function saveEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) { toast.error("E-mail inválido"); return; }
    if (parsed.data === me!.email) return;
    setBusy("email");
    const { error } = await supabase.auth.updateUser({ email: parsed.data }, { emailRedirectTo: window.location.origin + "/auth" });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Enviamos um link de confirmação para o novo e-mail.");
  }

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Escolha uma imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem maior que 5 MB."); return; }
    setBusy("avatar");
    const path = `${me!.id}/avatar-${Date.now()}.${file.name.split(".").pop() || "png"}`;
    const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (up.error) { setBusy(null); toast.error("Falha no envio da imagem."); return; }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from("profiles").upsert({ id: me!.id, avatar_url: signed?.signedUrl ?? null });
    setBusy(null);
    qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Foto atualizada");
  }

  return (
    <>
      <PageHeader title="Configurações" description="Gerencie seu perfil e conta." />
      <div className="px-4 sm:px-8">
        <Section title="Foto de perfil" description="PNG ou JPG até 5 MB.">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {me.avatarUrl && <AvatarImage src={me.avatarUrl} alt="Foto de perfil" />}
              <AvatarFallback>{initials(me.name, me.email)}</AvatarFallback>
            </Avatar>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy === "avatar"}>
              <Upload className="mr-1.5 h-4 w-4" />{busy === "avatar" ? "Enviando..." : "Alterar foto"}
            </Button>
          </div>
        </Section>
        <Section title="Nome" description="Como você aparece no VagaTracker.">
          <form onSubmit={saveName} className="flex gap-2">
            <Label htmlFor="name" className="sr-only">Nome</Label>
            <Input id="name" name="name" defaultValue={me.name} maxLength={120} />
            <Button type="submit" disabled={busy === "name"}>Salvar</Button>
          </form>
        </Section>
        <Section title="E-mail" description="Usado para entrar. A troca exige confirmação.">
          <form onSubmit={saveEmail} className="flex gap-2">
            <Label htmlFor="email" className="sr-only">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={me.email} />
            <Button type="submit" disabled={busy === "email"}>Salvar</Button>
          </form>
        </Section>
      </div>
    </>
  );
}
