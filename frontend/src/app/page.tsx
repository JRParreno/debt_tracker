"use client";

import Link from "next/link";
import { Presentation } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AddDebtButton,
  AddDebtDialog,
} from "@/components/add-debt-dialog";
import { AppShell } from "@/components/app-shell";
import { CardsSection } from "@/components/cards-section";
import { DeleteDebtDialog } from "@/components/delete-debt-dialog";
import { EditDebtDialog } from "@/components/edit-debt-dialog";
import { FilterBar } from "@/components/filter-bar";
import {
  IncomeButton,
  IncomeSettingsDialog,
} from "@/components/income-settings-dialog";
import { MonthlySummarySection } from "@/components/monthly-summary-section";
import { OccurrenceCards } from "@/components/occurrence-cards";
import { OccurrenceTable } from "@/components/occurrence-table";
import { PayOccurrenceDialog } from "@/components/pay-occurrence-dialog";
import type { PayOccurrenceResult } from "@/components/pay-occurrence-dialog";
import { PayStrategyCard } from "@/components/pay-strategy-card";
import { SummaryBar } from "@/components/summary-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  CurrentSummary,
  DebtType,
  MonthlySummaryItem,
  Occurrence,
  OccurrenceStatus,
  PaymentCard,
  StrategySummary,
} from "@/lib/types";

export default function DashboardPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<OccurrenceStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<DebtType | "all">("all");

  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [currentSummary, setCurrentSummary] = useState<CurrentSummary | null>(
    null
  );
  const [strategy, setStrategy] = useState<StrategySummary | null>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlySummaryItem[]>(
    []
  );
  const [cards, setCards] = useState<PaymentCard[]>([]);

  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [editDebtId, setEditDebtId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [payTarget, setPayTarget] = useState<Occurrence | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [occ, summary, strat, history, cardList] = await Promise.all([
        api.getOccurrences({
          year,
          month,
          status: statusFilter === "all" ? undefined : statusFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
        }),
        api.getCurrentSummary(year, month),
        api.getStrategy(year, month),
        api.getMonthlySummary(12),
        api.getCards(),
      ]);
      setOccurrences(occ);
      setCurrentSummary(summary);
      setStrategy(strat);
      setMonthlyHistory(history);
      setCards(cardList);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load data. Is the API running?"
      );
    } finally {
      setLoading(false);
    }
  }, [year, month, statusFilter, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const handleTogglePaid = async (id: number, isPaid: boolean) => {
    try {
      await api.updateOccurrence(id, { is_paid: isPaid });
      toast.success(isPaid ? "Marked as paid" : "Marked as unpaid");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleAdjustPayment = async (
    occ: Occurrence,
    { amount, markPaid }: PayOccurrenceResult
  ) => {
    try {
      await api.updateOccurrence(occ.id, {
        amount,
        ...(markPaid ? { is_paid: true } : {}),
      });
      if (markPaid) {
        toast.success(
          amount < occ.scheduled_amount - 0.001
            ? `Paid ${formatCurrency(amount)} (partial) — totals updated`
            : `Paid ${formatCurrency(amount)} — marked as done`
        );
      } else {
        toast.success(
          amount < occ.scheduled_amount - 0.001
            ? `Planning to pay ${formatCurrency(amount)} this month`
            : `Payment set to ${formatCurrency(amount)}`
        );
      }
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const showEmpty = !loading && occurrences.length === 0;

  return (
    <>
      <AppShell
        year={year}
        month={month}
        onMonthChange={handleMonthChange}
        headerActions={
          <>
            <Link
              href="/demo"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "h-9 w-9 shrink-0 sm:h-11 sm:w-auto sm:px-4 inline-flex items-center justify-center"
              )}
              aria-label="Demo"
            >
              <Presentation className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Demo</span>
            </Link>
            <IncomeButton onClick={() => setIncomeOpen(true)} />
            <AddDebtButton onClick={() => setAddOpen(true)} />
          </>
        }
        summary={<SummaryBar summary={currentSummary} loading={loading} />}
      >
        <CardsSection cards={cards} loading={loading} onRefresh={loadData} />

        <PayStrategyCard strategy={strategy} loading={loading} />

        <section className="space-y-2.5">
          <h2 className="text-base font-semibold sm:text-lg">Debts this month</h2>
          <FilterBar
            status={statusFilter}
            type={typeFilter}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
          />

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {showEmpty && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No debts for this month yet.
              </p>
              <Button
                className="mt-4 h-11"
                onClick={() => setAddOpen(true)}
              >
                Add your first debt
              </Button>
            </div>
          )}

          {!loading && occurrences.length > 0 && (
            <>
              <OccurrenceCards
                occurrences={occurrences}
                onTogglePaid={handleTogglePaid}
                onEdit={setEditDebtId}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
                onAdjustPayment={setPayTarget}
              />
              <OccurrenceTable
                occurrences={occurrences}
                onTogglePaid={handleTogglePaid}
                onEdit={setEditDebtId}
                onDelete={(id, name) => setDeleteTarget({ id, name })}
                onAdjustPayment={setPayTarget}
              />
            </>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-1">
          <MonthlySummarySection
            items={monthlyHistory}
            selectedYear={year}
            selectedMonth={month}
            onSelectMonth={handleMonthChange}
            loading={loading}
          />
        </div>
      </AppShell>

      <AddDebtDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={loadData}
      />
      <IncomeSettingsDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        onSuccess={loadData}
      />
      <EditDebtDialog
        debtId={editDebtId}
        onOpenChange={(open) => !open && setEditDebtId(null)}
        onSuccess={loadData}
      />
      <DeleteDebtDialog
        debtId={deleteTarget?.id ?? null}
        debtName={deleteTarget?.name}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={loadData}
      />
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
