"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DemoCardsSection } from "@/components/demo-cards-section";
import { FilterBar } from "@/components/filter-bar";
import { MonthlySummarySection } from "@/components/monthly-summary-section";
import { OccurrenceCards } from "@/components/occurrence-cards";
import { OccurrenceTable } from "@/components/occurrence-table";
import { PayOccurrenceDialog } from "@/components/pay-occurrence-dialog";
import type { PayOccurrenceResult } from "@/components/pay-occurrence-dialog";
import { PayStrategyCard } from "@/components/pay-strategy-card";
import { SummaryBar } from "@/components/summary-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  cloneOccurrences,
  computeCurrentSummary,
  computeStrategy,
  filterOccurrences,
  getDemoDataset,
  recomputeMonthlyHistory,
  refreshOccurrenceStatus,
} from "@/lib/demo-data";
import type { DebtType, Occurrence, OccurrenceStatus } from "@/lib/types";
import { Info } from "lucide-react";

export default function DemoPage() {
  const dataset = getDemoDataset();
  const [year, setYear] = useState(dataset.defaultYear);
  const [month, setMonth] = useState(dataset.defaultMonth);
  const [statusFilter, setStatusFilter] = useState<OccurrenceStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<DebtType | "all">("all");
  const [allOccurrences, setAllOccurrences] = useState<Occurrence[]>([]);
  const [payTarget, setPayTarget] = useState<Occurrence | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAllOccurrences(cloneOccurrences(dataset.occurrences));
    setReady(true);
  }, [dataset.occurrences]);

  const occurrences = useMemo(
    () =>
      filterOccurrences(
        allOccurrences,
        year,
        month,
        statusFilter,
        typeFilter
      ),
    [allOccurrences, year, month, statusFilter, typeFilter]
  );

  const currentSummary = useMemo(
    () => computeCurrentSummary(allOccurrences, dataset.income, year, month),
    [allOccurrences, dataset.income, year, month]
  );

  const strategy = useMemo(
    () => computeStrategy(allOccurrences, dataset.income, year, month),
    [allOccurrences, dataset.income, year, month]
  );

  const monthlyHistory = useMemo(
    () => recomputeMonthlyHistory(allOccurrences, dataset.monthlyHistory),
    [allOccurrences, dataset.monthlyHistory]
  );

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const demoToast = () => toast.info("Demo mode — changes stay in this session only");

  const handleTogglePaid = useCallback((id: number, isPaid: boolean) => {
    setAllOccurrences((prev) =>
      prev.map((o) =>
        o.id === id
          ? refreshOccurrenceStatus({
              ...o,
              is_paid: isPaid,
              paid_at: isPaid ? new Date().toISOString() : null,
            })
          : o
      )
    );
    toast.success(isPaid ? "Marked as paid (demo)" : "Marked as unpaid (demo)");
  }, []);

  const handleAdjustPayment = useCallback(
    async (occ: Occurrence, { amount, markPaid }: PayOccurrenceResult) => {
      setAllOccurrences((prev) =>
        prev.map((o) => {
          if (o.id !== occ.id) return o;
          let updated = { ...o, amount };
          if (markPaid) {
            updated.is_paid = true;
            updated.paid_at = new Date().toISOString();
            if (
              o.debt_type === "credit_card" &&
              o.statement_balance != null
            ) {
              updated.statement_balance = Math.max(
                0,
                o.statement_balance - amount
              );
            }
          }
          return refreshOccurrenceStatus(updated);
        })
      );
      if (markPaid) {
        toast.success(`Paid ${formatCurrency(amount)} (demo)`);
      } else {
        toast.success(`Payment set to ${formatCurrency(amount)} (demo)`);
      }
    },
    []
  );

  return (
    <>
      <AppShell
        year={year}
        month={month}
        onMonthChange={handleMonthChange}
        headerActions={
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 w-full sm:w-auto"
            )}
          >
            Open live app
          </Link>
        }
        summary={<SummaryBar summary={currentSummary} loading={!ready} />}
      >
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle>Demo preview</AlertTitle>
          <AlertDescription>
            Sample data from{" "}
            <code className="rounded bg-muted px-1 text-xs">src/data/demo.json</code>
            . No backend required. Toggle paid and adjust payments to try the UI —
            refresh the page to reset.
          </AlertDescription>
        </Alert>

        <DemoCardsSection cards={dataset.cards} loading={!ready} />

        <PayStrategyCard strategy={strategy} loading={!ready} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Debts this month</h2>
          <FilterBar
            status={statusFilter}
            type={typeFilter}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
          />

          {ready && occurrences.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No debts match your filters for this month.
            </div>
          )}

          {ready && occurrences.length > 0 && (
            <>
              <OccurrenceCards
                occurrences={occurrences}
                onTogglePaid={handleTogglePaid}
                onEdit={() => demoToast()}
                onDelete={() => demoToast()}
                onAdjustPayment={setPayTarget}
              />
              <OccurrenceTable
                occurrences={occurrences}
                onTogglePaid={handleTogglePaid}
                onEdit={() => demoToast()}
                onDelete={() => demoToast()}
                onAdjustPayment={setPayTarget}
              />
            </>
          )}
        </section>

        <MonthlySummarySection
          items={monthlyHistory}
          selectedYear={year}
          selectedMonth={month}
          onSelectMonth={handleMonthChange}
          loading={!ready}
        />
      </AppShell>

      <PayOccurrenceDialog
        occurrence={payTarget}
        open={payTarget !== null}
        onOpenChange={(open) => !open && setPayTarget(null)}
        onConfirm={(result) =>
          payTarget ? handleAdjustPayment(payTarget, result) : Promise.resolve()
        }
      />
    </>
  );
}
