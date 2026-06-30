"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Occurrence } from "@/lib/types";

interface PaymentAmountDisplayProps {
  occurrence: Occurrence;
  className?: string;
}

export function PaymentAmountDisplay({
  occurrence,
  className,
}: PaymentAmountDisplayProps) {
  const isPartial =
    occurrence.amount < occurrence.scheduled_amount - 0.001 && !occurrence.is_paid;
  const isCreditCard = occurrence.debt_type === "credit_card";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg font-semibold">
          {isCreditCard ? "Pay " : ""}
          {formatCurrency(occurrence.amount)}
        </p>
        {isPartial && (
          <Badge variant="outline" className="border-amber-500/50 text-amber-400">
            Partial
          </Badge>
        )}
      </div>
      {(isPartial || occurrence.amount !== occurrence.scheduled_amount) && (
        <p className="text-sm text-muted-foreground">
          Due {formatCurrency(occurrence.scheduled_amount)}
          {isPartial && (
            <>
              {" "}
              · Short by{" "}
              {formatCurrency(occurrence.scheduled_amount - occurrence.amount)}
            </>
          )}
        </p>
      )}
    </div>
  );
}
