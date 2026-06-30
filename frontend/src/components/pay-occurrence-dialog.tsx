"use client";

import { useEffect, useMemo, useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/format";
import type { Occurrence } from "@/lib/types";

export interface PayOccurrenceResult {
  amount: number;
  markPaid: boolean;
}

interface PayOccurrenceDialogProps {
  occurrence: Occurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: PayOccurrenceResult) => Promise<void>;
}

function PayOccurrenceForm({
  occurrence,
  onConfirm,
  onClose,
}: {
  occurrence: Occurrence;
  onConfirm: (result: PayOccurrenceResult) => Promise<void>;
  onClose: () => void;
}) {
  const isCreditCard = occurrence.debt_type === "credit_card";
  const dueAmount = occurrence.scheduled_amount;
  const minDue = occurrence.minimum_due ?? dueAmount;
  const fullBalance = occurrence.statement_balance;

  const maxAmount = useMemo(() => {
    if (isCreditCard && fullBalance != null) return fullBalance;
    return dueAmount;
  }, [isCreditCard, fullBalance, dueAmount]);

  const [amount, setAmount] = useState(String(occurrence.amount));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAmount(String(occurrence.amount));
  }, [occurrence]);

  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0 && parsed <= maxAmount + 0.001;

  const applyPreset = (value: number) => {
    setAmount(String(value));
  };

  const handleSubmit = async (markPaid: boolean) => {
    if (!isValid) {
      toast.error(`Enter an amount between ₱0.01 and ${formatCurrency(maxAmount)}`);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({ amount: parsed, markPaid });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isPartial = isValid && parsed < dueAmount - 0.001;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-3 text-sm space-y-1">
        <p className="font-medium">{occurrence.debt_name}</p>
        {isCreditCard && fullBalance != null && (
          <p className="text-muted-foreground">
            Statement balance: {formatCurrency(fullBalance)}
          </p>
        )}
        <p className="text-muted-foreground">
          Full due this month: {formatCurrency(dueAmount)}
        </p>
        {occurrence.amount !== dueAmount && (
          <p className="text-amber-400">
            Currently planning to pay {formatCurrency(occurrence.amount)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10"
          onClick={() => applyPreset(dueAmount)}
        >
          Full due ({formatCurrency(dueAmount)})
        </Button>
        {isCreditCard && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10"
            onClick={() => applyPreset(minDue)}
          >
            Minimum ({formatCurrency(minDue)})
          </Button>
        )}
        {isCreditCard && fullBalance != null && fullBalance > minDue && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => applyPreset(fullBalance)}
          >
            Full balance ({formatCurrency(fullBalance)})
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pay-amount">Amount to pay this month (₱)</Label>
        <Input
          id="pay-amount"
          type="number"
          min="0.01"
          step="0.01"
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          {isPartial
            ? `Partial payment — ${formatCurrency(dueAmount - parsed)} remains from this month's due`
            : "Adjust based on your priorities. Totals update to match what you plan to pay."}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          disabled={submitting || !isValid}
          onClick={() => handleSubmit(false)}
        >
          {submitting ? "Saving..." : "Update plan only"}
        </Button>
        <Button
          type="button"
          className="h-11 flex-1"
          disabled={submitting || !isValid}
          onClick={() => handleSubmit(true)}
        >
          {submitting
            ? "Saving..."
            : isPartial
              ? `Pay ${formatCurrency(parsed)} & mark done`
              : "Pay & mark done"}
        </Button>
      </div>
    </div>
  );
}

export function PayOccurrenceDialog({
  occurrence,
  open,
  onOpenChange,
  onConfirm,
}: PayOccurrenceDialogProps) {
  const isMobile = useIsMobile();

  if (!occurrence) return null;

  const form = (
    <PayOccurrenceForm
      occurrence={occurrence}
      onConfirm={onConfirm}
      onClose={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Adjust payment</SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-6">{form}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust payment</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
