"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MonthPicker } from "@/components/month-picker";

interface AppShellProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  headerActions?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  year,
  month,
  onMonthChange,
  headerActions,
  summary,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        {/* Mobile: title + actions on one row, month strip below */}
        <div className="mx-auto max-w-6xl px-3 py-2 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <h1 className="truncate text-base font-bold tracking-tight">
              Debt Tracker
            </h1>
            <div className="flex shrink-0 items-center gap-1">
              {headerActions}
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-1.5">
            <MonthPicker
              year={year}
              month={month}
              onChange={onMonthChange}
              compact
            />
          </div>
        </div>

        {/* Desktop */}
        <div className="mx-auto hidden max-w-6xl items-center justify-between gap-4 p-4 sm:flex">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Debt Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Track bills, plan payments, stay on budget
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <MonthPicker year={year} month={month} onChange={onMonthChange} />
            <div className="flex items-center gap-2">
              {headerActions}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-3 py-3 pb-28 sm:space-y-6 sm:p-4 sm:pb-32">
        {children}
      </main>

      {summary}
    </div>
  );
}
