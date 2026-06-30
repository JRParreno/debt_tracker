"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMonthYear, formatMonthYearShort } from "@/lib/format";

interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  compact?: boolean;
}

export function MonthPicker({
  year,
  month,
  onChange,
  compact = false,
}: MonthPickerProps) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };

  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  const label = compact
    ? formatMonthYearShort(year, month)
    : formatMonthYear(year, month);

  return (
    <div className={cn("flex items-center", compact ? "w-full gap-0.5" : "gap-1")}>
      <Button
        variant="outline"
        size="icon"
        className={cn(compact ? "h-9 w-9 shrink-0" : "h-11 w-11")}
        onClick={prev}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous month</span>
      </Button>
      <span
        className={cn(
          "flex-1 text-center font-medium",
          compact
            ? "text-sm"
            : "min-w-[9rem] text-sm sm:min-w-[11rem] sm:text-base"
        )}
      >
        {label}
      </span>
      <Button
        variant="outline"
        size="icon"
        className={cn(compact ? "h-9 w-9 shrink-0" : "h-11 w-11")}
        onClick={next}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next month</span>
      </Button>
    </div>
  );
}
