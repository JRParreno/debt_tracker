"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatMonthYear } from "@/lib/format";
import type { MonthlySummaryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MonthlySummarySectionProps {
  items: MonthlySummaryItem[];
  selectedYear: number;
  selectedMonth: number;
  onSelectMonth: (year: number, month: number) => void;
  loading?: boolean;
}

export function MonthlySummarySection({
  items,
  selectedYear,
  selectedMonth,
  onSelectMonth,
  loading,
}: MonthlySummarySectionProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly history</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isSelected =
              item.year === selectedYear && item.month === selectedMonth;
            return (
              <button
                key={`${item.year}-${item.month}`}
                type="button"
                onClick={() => onSelectMonth(item.year, item.month)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                  isSelected && "border-primary bg-primary/10"
                )}
              >
                <p className="text-sm font-medium">
                  {formatMonthYear(item.year, item.month)}
                </p>
                <p className="text-lg font-semibold">{formatCurrency(item.total)}</p>
                <p className="text-xs text-muted-foreground">
                  Paid {formatCurrency(item.paid)} · Owed{" "}
                  {formatCurrency(item.unpaid)}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
