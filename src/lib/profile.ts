import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) throw new Error("Não autenticado");
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    return {
      id: user.id,
      email: user.email ?? "",
      name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "",
      avatarUrl: profile?.avatar_url ?? null,
      isAdmin: !!roles?.some((r) => r.role === "admin"),
    };
  },
});

export function initials(name: string, email: string) {
  const src = name.trim() || email;
  return src.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}
