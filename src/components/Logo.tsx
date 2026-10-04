import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 font-extrabold text-lg", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-hero text-primary-foreground shadow-glow">
        <BriefcaseBusiness className="h-5 w-5" aria-hidden />
      </span>
      <span className={light ? "text-sidebar-accent-foreground" : "text-foreground"}>
        Vaga<span className={light ? "text-sidebar-foreground" : "text-primary"}>Tracker</span>
      </span>
    </Link>
  );
}
