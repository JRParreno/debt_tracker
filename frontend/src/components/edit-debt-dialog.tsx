"use client";

import { useEffect, useState } from "react";
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
import type { DebtType, DebtUpdate } from "@/lib/types";
import { DEBT_TYPE_LABELS } from "@/lib/types";

type ScheduleType = "recurring" | "fixed";

function monthsBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return (
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1
  );
}

interface EditDebtDialogProps {
  debtId: number | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditDebtForm({
  debtId,
  onSuccess,
  onClose,
}: {
  debtId: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("loan");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("15");
  const [schedule, setSchedule] = useState<ScheduleType>("fixed");
  const [startDate, setStartDate] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("3");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [minimumDue, setMinimumDue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCreditCard = type === "credit_card";

  useEffect(() => {
    setLoading(true);
    api
      .getDebt(debtId)
      .then((debt) => {
        setName(debt.name);
        setType(debt.type);
        setAmount(String(debt.amount));
        setDueDay(String(debt.due_day));
        setStartDate(debt.start_date);
        setNotes(debt.notes ?? "");
        setCreditLimit(debt.credit_limit != null ? String(debt.credit_limit) : "");
        setStatementBalance(
          debt.statement_balance != null ? String(debt.statement_balance) : ""
        );
        setMinimumDue(debt.minimum_due != null ? String(debt.minimum_due) : "");
        if (debt.end_date) {
          setSchedule("fixed");
          setEndDate(debt.end_date);
          setTotalInstallments(
            String(monthsBetween(debt.start_date, debt.end_date))
          );
        } else {
          setSchedule("recurring");
          setEndDate("");
          setTotalInstallments("3");
        }
      })
      .catch(() => toast.error("Failed to load debt"))
      .finally(() => setLoading(false));
  }, [debtId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDueDay = parseInt(dueDay, 10);
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 28) {
      toast.error("Due day must be between 1 and 28");
      return;
    }

    let parsedAmount: number;
    if (isCreditCard) {
      parsedAmount = parseFloat(minimumDue);
      const stmtBal = parseFloat(statementBalance);
      if (isNaN(stmtBal) || stmtBal < 0) {
        toast.error("Enter a valid statement balance");
        return;
      }
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Enter a valid minimum amount due");
        return;
      }
    } else {
      parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Please fill in name and a valid amount");
        return;
      }
    }

    const payload: DebtUpdate = {
      name: name.trim(),
      type,
      amount: parsedAmount,
      due_day: parsedDueDay,
      notes: notes.trim() || null,
      start_date: startDate || null,
    };

    if (isCreditCard) {
      payload.statement_balance = parseFloat(statementBalance);
      payload.minimum_due = parsedAmount;
      const limit = parseFloat(creditLimit);
      payload.credit_limit = !isNaN(limit) && limit > 0 ? limit : null;
    } else if (schedule === "fixed") {
      const total = parseInt(totalInstallments, 10);
      if (isNaN(total) || total < 1) {
        toast.error("Total installments must be at least 1");
        return;
      }
      payload.total_installments = total;
    } else {
      payload.end_date = endDate || null;
    }

    setSubmitting(true);
    try {
      await api.updateDebt(debtId, payload);
      toast.success("Debt updated — schedule refreshed");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update debt");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-debt-name">Name</Label>
        <Input
          id="edit-debt-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as DebtType)}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-cc-limit">Credit limit (₱)</Label>
              <Input
                id="edit-cc-limit"
                type="number"
                min="0"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cc-balance">Statement balance / used (₱)</Label>
              <Input
                id="edit-cc-balance"
                type="number"
                min="0"
                step="0.01"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-cc-min-due">Minimum amount due (₱)</Label>
              <Input
                id="edit-cc-min-due"
                type="number"
                min="0"
                step="0.01"
                value={minimumDue}
                onChange={(e) => setMinimumDue(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-debt-due-day">Due day (1–28)</Label>
              <Input
                id="edit-debt-due-day"
                type="number"
                min="1"
                max="28"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-debt-amount">Amount per month (₱)</Label>
          <Input
            id="edit-debt-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-debt-due-day">Due day (1–28)</Label>
          <Input
            id="edit-debt-due-day"
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
          <div className="space-y-2">
            <Label htmlFor="edit-start-date">Start date</Label>
            <Input
              id="edit-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-total-installments">Total installments (max 360)</Label>
            <Input
              id="edit-total-installments"
              type="number"
              min="1"
              max="360"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
              className="h-11"
            />
          </div>
        </TabsContent>
        <TabsContent value="recurring" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-recurring-start">Start date</Label>
            <Input
              id="edit-recurring-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-end-date">End date (optional)</Label>
            <Input
              id="edit-end-date"
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
          <Label htmlFor="edit-recurring-start-cc">Start date</Label>
          <Input
            id="edit-recurring-start-cc"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="edit-notes">Notes</Label>
        <Input
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-11"
        />
      </div>

      <Button type="submit" className="h-11 w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

export function EditDebtDialog({
  debtId,
  onOpenChange,
  onSuccess,
}: EditDebtDialogProps) {
  const isMobile = useIsMobile();
  const open = debtId !== null;

  const handleOpenChange = (next: boolean) => {
    if (!next) onOpenChange(false);
  };

  if (!debtId) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit debt</SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-6">
            <EditDebtForm
              debtId={debtId}
              onSuccess={onSuccess}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit debt</DialogTitle>
        </DialogHeader>
        <EditDebtForm
          debtId={debtId}
          onSuccess={onSuccess}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
