import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — VagaTracker" },
      { name: "description", content: "Receba um link para redefinir sua senha do VagaTracker." },
      { property: "og:title", content: "Recuperar senha — VagaTracker" },
      { property: "og:description", content: "Receba um link para redefinir sua senha do VagaTracker." },
    ],
  }),
  component: Page,
});

function Page() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-semibold">Recuperar senha</h1>
          {sent ? (
            <p className="mt-3 text-muted-foreground">Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar link"}</Button>
            </form>
          )}
          <Link to="/auth" className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}
