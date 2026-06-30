"use client";

import type { CurrentSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryBarProps {
  summary: CurrentSummary | null;
  loading?: boolean;
}

const barClassName =
  "fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 shadow-[0_-4px_24px_rgba(0,0,0,0.25)] backdrop-blur supports-backdrop-filter:bg-background/90 pb-[max(0.5rem,env(safe-area-inset-bottom))]";

export function SummaryBar({ summary, loading }: SummaryBarProps) {
  if (loading) {
    return (
      <div className={barClassName}>
        <div className="mx-auto max-w-6xl px-3 py-2 sm:p-4">
          <Skeleton className="h-10 w-full sm:h-12" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const surplusOk = summary.surplus >= 0;

  return (
    <div className={barClassName}>
      {/* Mobile: single dense row */}
      <div className="mx-auto max-w-6xl px-3 py-2 sm:hidden">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Owed
            </p>
            <p className="truncate text-sm font-semibold tabular-nums text-amber-400">
              {formatCurrency(summary.unpaid)}
            </p>
          </div>
          <div className="min-w-0 border-x border-border/60 px-1">
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Surplus
            </p>
            <p
              className={cn(
                "truncate text-sm font-semibold tabular-nums",
                surplusOk ? "text-emerald-400" : "text-red-400"
              )}
            >
              {formatCurrency(summary.surplus)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Paid
            </p>
            <p className="truncate text-sm font-semibold tabular-nums text-emerald-400">
              {formatCurrency(summary.paid)}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden max-w-6xl gap-3 p-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">This month total</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(summary.total)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Paid / Still owed</p>
          <p className="text-lg font-semibold tabular-nums">
            <span className="text-emerald-400">{formatCurrency(summary.paid)}</span>
            {" / "}
            <span className="text-amber-400">{formatCurrency(summary.unpaid)}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Income vs debt</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(summary.total_income)} vs{" "}
            {formatCurrency(summary.unpaid)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            Pending / Overdue · Surplus
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {summary.pending_count} / {summary.overdue_count} ·{" "}
            <span className={surplusOk ? "text-emerald-400" : "text-red-400"}>
              {formatCurrency(summary.surplus)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
