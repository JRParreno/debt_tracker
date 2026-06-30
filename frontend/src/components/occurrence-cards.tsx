"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CreditCardDetails } from "@/components/credit-card-details";
import { PaymentAmountDisplay } from "@/components/payment-amount-display";
import { statusBadgeClass } from "@/components/filter-bar";
import { formatDate } from "@/lib/format";
import type { Occurrence } from "@/lib/types";
import { DEBT_TYPE_LABELS } from "@/lib/types";

interface OccurrenceCardsProps {
  occurrences: Occurrence[];
  onTogglePaid: (id: number, isPaid: boolean) => void;
  onEdit: (debtId: number) => void;
  onDelete: (debtId: number, debtName: string) => void;
  onAdjustPayment: (occurrence: Occurrence) => void;
}

export function OccurrenceCards({
  occurrences,
  onTogglePaid,
  onEdit,
  onDelete,
  onAdjustPayment,
}: OccurrenceCardsProps) {
  if (occurrences.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 lg:hidden">
      {occurrences.map((occ) => (
        <Card key={occ.id}>
          <CardContent className="space-y-2.5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{occ.debt_name}</p>
                  <Badge variant="outline" className={statusBadgeClass(occ.status)}>
                    {occ.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {DEBT_TYPE_LABELS[occ.debt_type]} · Due{" "}
                  {formatDate(occ.due_date)}
                </p>
                <PaymentAmountDisplay occurrence={occ} />
              </div>
              <div className="flex min-h-10 min-w-10 flex-col items-center justify-center gap-0.5">
                <Switch
                  checked={occ.is_paid}
                  onCheckedChange={(checked) => onTogglePaid(occ.id, checked)}
                  className="scale-100"
                />
                <span className="text-xs text-muted-foreground">Paid</span>
              </div>
            </div>
            {occ.debt_type === "credit_card" && (
              <CreditCardDetails
                occurrence={occ}
                onAdjustPayment={() => onAdjustPayment(occ)}
              />
            )}
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 flex-1 sm:h-11"
                onClick={() => onAdjustPayment(occ)}
              >
                {occ.debt_type === "credit_card" ? "Adjust pay" : "Pay partial"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 flex-1 gap-2 sm:h-11"
                onClick={() => onEdit(occ.debt_id)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 flex-1 gap-2 text-destructive hover:text-destructive sm:h-11"
                onClick={() => onDelete(occ.debt_id, occ.debt_name)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
