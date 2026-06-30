"use client";

import { cn } from "@/lib/utils";
import type { DebtType, OccurrenceStatus } from "@/lib/types";
import { DEBT_TYPE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: { value: OccurrenceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const TYPE_OPTIONS: { value: DebtType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  ...Object.entries(DEBT_TYPE_LABELS).map(([value, label]) => ({
    value: value as DebtType,
    label,
  })),
];

interface FilterBarProps {
  status: OccurrenceStatus | "all";
  type: DebtType | "all";
  onStatusChange: (status: OccurrenceStatus | "all") => void;
  onTypeChange: (type: DebtType | "all") => void;
}

export function FilterBar({
  status,
  type,
  onStatusChange,
  onTypeChange,
}: FilterBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={status === opt.value ? "default" : "outline"}
            size="sm"
            className="h-9 shrink-0 px-3 sm:h-11 sm:px-4"
            onClick={() => onStatusChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <Select
        value={type}
        onValueChange={(v) => onTypeChange(v as DebtType | "all")}
      >
        <SelectTrigger className="h-9 w-full sm:h-11 sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function statusBadgeClass(status: OccurrenceStatus): string {
  return cn(
    status === "paid" && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    status === "pending" && "bg-amber-500/15 text-amber-400 border-amber-500/30",
    status === "overdue" && "bg-red-500/15 text-red-400 border-red-500/30"
  );
}
