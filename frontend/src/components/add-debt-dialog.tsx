"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-media-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { DebtCreate, DebtType, PaymentCard } from "@/lib/types";
import { DEBT_TYPE_LABELS } from "@/lib/types";

type ScheduleType = "recurring" | "fixed";

interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(year: number, month: number, offset: number) {
  const d = new Date(year, month - 1 + offset, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });
}

function AddDebtForm({
  open,
  onSuccess,
  onClose,
}: {
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("loan");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("15");
  const [schedule, setSchedule] = useState<ScheduleType>("fixed");
  const [startDate, setStartDate] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("3");
  const [installmentsPaid, setInstallmentsPaid] = useState("0");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [creditCards, setCreditCards] = useState<PaymentCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [minimumDue, setMinimumDue] = useState("");
  const [paidThisMonth, setPaidThisMonth] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCard = creditCards.find((c) => String(c.id) === selectedCardId);

  useEffect(() => {
    setStartDate(todayInputValue());
  }, []);

  useEffect(() => {
    if (!open) return;
    setCardsLoading(true);
    api
      .getCards()
      .then((cards) =>
        setCreditCards(cards.filter((c) => c.card_type === "credit_card"))
      )
      .catch(() => toast.error("Failed to load cards"))
      .finally(() => setCardsLoading(false));
  }, [open]);

  const applyCard = (card: PaymentCard) => {
    setSelectedCardId(String(card.id));
    setName(card.nickname);
    setMinimumDue(card.minimum_due != null ? String(card.minimum_due) : "");
    setPaidThisMonth("");
    if (card.due_day != null) setDueDay(String(card.due_day));
  };

  const installmentPreview = useMemo(() => {
    if (schedule !== "fixed" || !startDate || !totalInstallments) return null;
    const total = parseInt(totalInstallments, 10);
    if (isNaN(total) || total < 1) return null;

    const [y, m] = startDate.split("-").map(Number);
    const last = addMonths(y, m, total - 1);
    const paid = parseInt(installmentsPaid, 10) || 0;

    return {
      from: formatMonthYear(y, m),
      to: formatMonthYear(last.year, last.month),
      total,
      paid: Math.min(paid, total),
      remaining: Math.max(0, total - paid),
    };
  }, [schedule, startDate, totalInstallments, installmentsPaid]);

  const isCreditCard = type === "credit_card";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDueDay = parseInt(dueDay, 10);

    if (isCreditCard) {
      if (!selectedCardId) {
        toast.error("Select a credit card from My Cards");
        return;
      }
      const minDue =
        selectedCard?.minimum_due ?? parseFloat(minimumDue);
      if (minDue == null || isNaN(minDue) || minDue <= 0) {
        toast.error("Enter the minimum amount due for this card");
        return;
      }
      if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 28) {
        toast.error("Due day must be between 1 and 28");
        return;
      }

      const payload: DebtCreate = {
        name: selectedCard!.nickname,
        type,
        amount: minDue,
        due_day: parsedDueDay,
        notes: notes.trim() || null,
        start_date: startDate || null,
        payment_card_id: parseInt(selectedCardId, 10),
        minimum_due: minDue,
        statement_balance: selectedCard!.balance,
        credit_limit: selectedCard!.credit_limit ?? undefined,
      };

      const paidAmount = parseFloat(paidThisMonth);
      if (!isNaN(paidAmount) && paidAmount > 0) {
        if (paidAmount > selectedCard!.balance) {
          toast.error("Payment cannot exceed the card balance");
          return;
        }
        payload.paid_this_month = paidAmount;
      }

      setSubmitting(true);
      try {
        await api.createDebt(payload);
        toast.success(
          payload.paid_this_month
            ? `Credit card bill added — ${formatCurrency(payload.paid_this_month)} marked paid this month`
            : "Credit card bill added — synced from My Cards"
        );
        onSuccess();
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add debt");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 28) {
      toast.error("Due day must be between 1 and 28");
      return;
    }

    let parsedAmount: number;
    parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please fill in a valid amount");
      return;
    }

    const payload: DebtCreate = {
      name: name.trim(),
      type,
      amount: parsedAmount,
      due_day: parsedDueDay,
      notes: notes.trim() || null,
      start_date: startDate || null,
    };

    if (schedule === "fixed") {
      const total = parseInt(totalInstallments, 10);
      const paid = parseInt(installmentsPaid, 10) || 0;
      if (isNaN(total) || total < 1) {
        toast.error("Total installments must be at least 1");
        return;
      }
      if (paid < 0 || paid > total) {
        toast.error(`Already paid must be between 0 and ${total}`);
        return;
      }
      payload.total_installments = total;
      payload.installments_paid = paid;
    } else if (endDate) {
      payload.end_date = endDate;
    }

    setSubmitting(true);
    try {
      await api.createDebt(payload);
      if (schedule === "fixed" && installmentPreview) {
        toast.success(
          `Added ${installmentPreview.total}-month plan — ${installmentPreview.paid} marked paid`
        );
      } else {
        toast.success("Debt added — monthly rows will auto-generate");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add debt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isCreditCard && (
      <div className="space-y-2">
        <Label htmlFor="debt-name">Name</Label>
        <Input
          id="debt-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Atome, Car loan"
          className="h-11"
        />
      </div>
      )}

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={type}
          onValueChange={(v) => {
            const next = v as DebtType;
            setType(next);
            if (next === "bnpl" || next === "loan") setSchedule("fixed");
            if (next === "credit_card") {
              setSchedule("recurring");
              setSelectedCardId("");
            }
          }}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Select type">
              {DEBT_TYPE_LABELS[type]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DEBT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCreditCard ? (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            Pick a card from My Cards — limit and balance sync automatically.
          </p>

          {cardsLoading ? (
            <p className="text-sm text-muted-foreground">Loading cards...</p>
          ) : creditCards.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No credit cards yet. Add one in the <strong>My cards</strong> section
              first, then come back here.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Credit card</Label>
                <Select
                  value={selectedCardId}
                  onValueChange={(id) => {
                    const card = creditCards.find((c) => String(c.id) === id);
                    if (card) applyCard(card);
                  }}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select a card">
                      {selectedCard?.nickname}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={String(card.id)}>
                        <span className="font-medium">{card.nickname}</span>
                        {card.credit_limit != null && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {formatCurrency(card.balance)} /{" "}
                            {formatCurrency(card.credit_limit)}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCard && (
                <div className="space-y-2 rounded-lg border bg-background/50 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">
                      {formatCurrency(selectedCard.balance)}
                    </span>
                  </div>
                  {selectedCard.credit_limit != null && (
                    <>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Limit</span>
                        <span>{formatCurrency(selectedCard.credit_limit)}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-emerald-400">
                        <span>Available</span>
                        <span className="font-medium">
                          {formatCurrency(
                            Math.max(0, selectedCard.credit_limit - selectedCard.balance)
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedCard && selectedCard.minimum_due == null && (
                <div className="space-y-2">
                  <Label htmlFor="cc-min-due">Minimum amount due (₱)</Label>
                  <Input
                    id="cc-min-due"
                    type="number"
                    min="0"
                    step="0.01"
                    value={minimumDue}
                    onChange={(e) => setMinimumDue(e.target.value)}
                    placeholder="500"
                    className="h-11"
                  />
                </div>
              )}

              {selectedCard && (
                <div className="space-y-2">
                  <Label htmlFor="debt-due-day-cc">Due day (1–28)</Label>
                  <Input
                    id="debt-due-day-cc"
                    type="number"
                    min="1"
                    max="28"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              {selectedCard && (
                <div className="space-y-2">
                  <Label htmlFor="cc-paid-month">Paid this month (₱)</Label>
                  <Input
                    id="cc-paid-month"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidThisMonth}
                    onChange={(e) => setPaidThisMonth(e.target.value)}
                    placeholder="e.g. 500 — leave empty if not paid yet"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Enter min, partial, or full payment already made
                    this month — it will be marked paid and the card balance
                    updates.
                  </p>
                  {!isNaN(parseFloat(paidThisMonth)) &&
                    parseFloat(paidThisMonth) > 0 &&
                    selectedCard.minimum_due != null &&
                    parseFloat(paidThisMonth) <
                      selectedCard.minimum_due - 0.001 && (
                      <p className="text-xs text-amber-400">
                        Partial payment — below minimum due of{" "}
                        {formatCurrency(selectedCard.minimum_due)}
                      </p>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="debt-amount">Amount per month (₱)</Label>
            <Input
              id="debt-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-due-day">Due day (1–28)</Label>
            <Input
              id="debt-due-day"
              type="number"
              min="1"
              max="28"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      )}

      {!isCreditCard && (
      <Tabs
        value={schedule}
        onValueChange={(v) => setSchedule(v as ScheduleType)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fixed">Fixed term</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value="fixed" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            For BNPL, loans, or any debt with a set number of payments. Past
            months are created automatically.
          </p>
          <div className="space-y-2">
            <Label htmlFor="debt-start-date">Start date (first payment month)</Label>
            <Input
              id="debt-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total-installments">Total installments (max 360)</Label>
              <Input
                id="total-installments"
                type="number"
                min="1"
                max="360"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                placeholder="3"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installments-paid">Already paid</Label>
              <Input
                id="installments-paid"
                type="number"
                min="0"
                value={installmentsPaid}
                onChange={(e) => setInstallmentsPaid(e.target.value)}
                placeholder="2"
                className="h-11"
              />
            </div>
          </div>
          {installmentPreview && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Schedule:</span>{" "}
                {installmentPreview.from} → {installmentPreview.to} (
                {installmentPreview.total} payments)
              </p>
              <p className="mt-1">
                <span className="text-emerald-400">
                  {installmentPreview.paid} paid
                </span>
                {" · "}
                <span className="text-amber-400">
                  {installmentPreview.remaining} remaining
                </span>
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recurring" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Repeats every month until you remove it or set an end date.
          </p>
          <div className="space-y-2">
            <Label htmlFor="recurring-start">Start date (optional)</Label>
            <Input
              id="recurring-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-end-date">End date (optional)</Label>
            <Input
              id="debt-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11"
            />
          </div>
        </TabsContent>
      </Tabs>
      )}

      {isCreditCard && (
        <div className="space-y-2">
          <Label htmlFor="recurring-start-cc">Start date (optional)</Label>
          <Input
            id="recurring-start-cc"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="debt-notes">Notes (optional)</Label>
        <Input
          id="debt-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-11"
        />
      </div>

      <Button
        type="submit"
        className="h-11 w-full"
        disabled={
          submitting ||
          (isCreditCard && (creditCards.length === 0 || !selectedCardId))
        }
      >
        {submitting ? "Saving..." : "Add debt"}
      </Button>
    </form>
  );
}

export function AddDebtDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddDebtDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add debt</SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-6">
            <AddDebtForm
              open={open}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add debt</DialogTitle>
        </DialogHeader>
        <AddDebtForm
          open={open}
          onSuccess={onSuccess}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AddDebtButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="h-9 w-9 shrink-0 gap-2 px-0 sm:h-11 sm:w-auto sm:px-4"
      aria-label="Add debt"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Add debt</span>
    </Button>
  );
}
