import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 font-semibold text-[15px] tracking-tight", className)}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
        <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className={light ? "text-sidebar-accent-foreground" : "text-foreground"}>
        Vaga<span className={light ? "text-sidebar-foreground" : "text-foreground"}>Tracker</span>
      </span>
    </Link>
  );
}
