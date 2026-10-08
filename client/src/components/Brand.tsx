import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** A single compact brand treatment shared by public and authenticated pages. */
export function Brand({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center gap-2.5 rounded-md font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary", className)} aria-label="Finance Manager home">
      <img src="/brand/logo.png" width={32} height={32} alt="" className="h-8 w-8 shrink-0" />
      <span>Finance<span className="font-normal">Manager</span></span>
    </Link>
  );
}
