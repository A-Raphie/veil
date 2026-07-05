"use client";

/**
 * Reusable alert/banner — semantic variants mapped to the design tokens.
 * Includes an optional action (e.g. "Switch to Sepolia") for inline CTAs.
 */

import type { ReactNode } from "react";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "error";

const STYLES: Record<Variant, { wrap: string; icon: ReactNode }> = {
  info: {
    wrap: "border-sky-500/30 bg-sky-950/30 text-sky-100",
    icon: <Info className="h-4 w-4 text-sky-400" />,
  },
  success: {
    wrap: "border-brand-500/30 bg-brand-950/30 text-brand-100",
    icon: <CheckCircle2 className="h-4 w-4 text-brand-400" />,
  },
  warning: {
    wrap: "border-amber-500/30 bg-amber-950/30 text-amber-100",
    icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  },
  error: {
    wrap: "border-rose-500/30 bg-rose-950/30 text-rose-100",
    icon: <XCircle className="h-4 w-4 text-rose-400" />,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  action,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const s = STYLES[variant];
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        s.wrap,
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{s.icon}</span>
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5 text-xs opacity-90" : ""}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
