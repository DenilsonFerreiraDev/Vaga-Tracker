import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => z.object({ mode: z.enum(["login", "signup"]).optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Entrar — VagaTracker" },
      { name: "description", content: "Acesse sua conta VagaTracker ou crie uma gratuitamente." },
      { property: "og:title", content: "Entrar — VagaTracker" },
      { property: "og:description", content: "Acesse sua conta VagaTracker ou crie uma gratuitamente." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().trim().max(120).optional(),
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(initial ?? "login");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { email, password, name } = parsed.data;
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) toast.error("E-mail ou senha incorretos.");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/", data: { full_name: name } },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      setSent(true);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com Google.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-xl border bg-card p-6 shadow-card sm:p-8">
          {sent ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold">Confirme seu e-mail</h1>
              <p className="mt-3 text-muted-foreground">
                Enviamos um link de confirmação. Clique nele para ativar sua conta.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("login"); }}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold">{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta grátis"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login" ? "Entre para acompanhar suas candidaturas." : "Leva menos de um minuto."}
              </p>
              <Button type="button" variant="outline" className="mt-6 w-full" onClick={google}>
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95S8.78 6.28 12 6.28c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.72 14.55 2.8 12 2.8 6.92 2.8 2.8 6.92 2.8 12s4.12 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51z"/></svg>
                Continuar com Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={onSubmit} className="grid gap-4">
                {mode === "signup" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" name="name" autoComplete="name" />
                  </div>
                )}
                <div className="grid gap-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    {mode === "login" && (
                      <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                        Esqueci minha senha
                      </Link>
                    )}
                  </div>
                  <Input id="password" name="password" type="password" required minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"} />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
                <button type="button" className="font-semibold text-primary hover:underline"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Cadastre-se" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
