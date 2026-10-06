import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, Briefcase, LayoutDashboard, LogOut, Menu, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { meQuery, initials } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vagas", label: "Vagas", icon: Briefcase },
  { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { to: "/leads", label: "Leads", icon: Users, admin: true },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: me } = useQuery(meQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4"><Logo /></div>
      <nav className="flex-1 space-y-0.5 p-2" aria-label="Principal">
        {NAV.filter((n) => !("admin" in n) || me?.isAdmin).map((n) => {
          const active = path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate}
              className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
              <n.icon className="h-4 w-4" aria-hidden />{n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <Avatar className="h-7 w-7">
            {me?.avatarUrl && <AvatarImage src={me.avatarUrl} alt="" />}
            <AvatarFallback className="text-[11px]">{me ? initials(me.name, me.email) : ""}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{me?.name || "Sua conta"}</div>
            <div className="truncate text-xs text-muted-foreground">{me?.email}</div>
          </div>
          <button onClick={signOut} aria-label="Sair" title="Sair"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r bg-card md:block"><SidebarContent /></aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="rounded-md p-2 hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="min-w-0 pb-24"><Outlet /></main>
    </div>
  );
}
