import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — VagaTracker" },
      { name: "description", content: "Defina uma nova senha para sua conta VagaTracker." },
      { property: "og:title", content: "Nova senha — VagaTracker" },
      { property: "og:description", content: "Defina uma nova senha para sua conta VagaTracker." },
    ],
  }),
  component: Page,
});

function Page() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (password !== fd.get("confirm")) { toast.error("As senhas não conferem"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-semibold">Definir nova senha</h1>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input id="confirm" name="confirm" type="password" required minLength={6} autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar senha"}</Button>
        </form>
      </div>
    </div>
  );
}
