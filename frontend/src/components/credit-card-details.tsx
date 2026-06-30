"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { Occurrence } from "@/lib/types";

interface CreditCardDetailsProps {
  occurrence: Occurrence;
  onAdjustPayment: () => void;
  disabled?: boolean;
}

export function CreditCardDetails({
  occurrence,
  onAdjustPayment,
  disabled,
}: CreditCardDetailsProps) {
  const balance = occurrence.statement_balance;
  const limit = occurrence.credit_limit;
  const minDue = occurrence.minimum_due ?? occurrence.scheduled_amount;
  const usedPct =
    balance != null && limit != null && limit > 0
      ? Math.min(100, (balance / limit) * 100)
      : null;

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
      {balance != null && limit != null && (
        <>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Used / limit</span>
            <span className="font-medium">
              {formatCurrency(balance)} / {formatCurrency(limit)}
            </span>
          </div>
          {usedPct != null && <Progress value={usedPct} className="h-1.5" />}
        </>
      )}
      {balance != null && limit == null && (
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Statement balance</span>
          <span className="font-medium">{formatCurrency(balance)}</span>
        </div>
      )}
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Minimum due</span>
        <span>{formatCurrency(minDue)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Paying this month</span>
        <span className="font-semibold text-primary">
          {formatCurrency(occurrence.amount)}
        </span>
      </div>
      {!occurrence.is_paid && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 w-full"
          disabled={disabled}
          onClick={onAdjustPayment}
        >
          Adjust payment (min / partial / full)
        </Button>
      )}
    </div>
  );
}
