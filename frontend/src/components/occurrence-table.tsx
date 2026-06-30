"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCardDetails } from "@/components/credit-card-details";
import { PaymentAmountDisplay } from "@/components/payment-amount-display";
import { statusBadgeClass } from "@/components/filter-bar";
import { formatDate } from "@/lib/format";
import type { Occurrence } from "@/lib/types";
import { DEBT_TYPE_LABELS } from "@/lib/types";

interface OccurrenceTableProps {
  occurrences: Occurrence[];
  onTogglePaid: (id: number, isPaid: boolean) => void;
  onEdit: (debtId: number) => void;
  onDelete: (debtId: number, debtName: string) => void;
  onAdjustPayment: (occurrence: Occurrence) => void;
}

export function OccurrenceTable({
  occurrences,
  onTogglePaid,
  onEdit,
  onDelete,
  onAdjustPayment,
}: OccurrenceTableProps) {
  if (occurrences.length === 0) {
    return null;
  }

  return (
    <div className="hidden rounded-lg border lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Paid</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {occurrences.map((occ) => (
            <TableRow key={occ.id}>
              <TableCell className="font-medium">
                <div>{occ.debt_name}</div>
                {occ.debt_type === "credit_card" && (
                  <div className="mt-2 max-w-xs">
                    <CreditCardDetails
                      occurrence={occ}
                      onAdjustPayment={() => onAdjustPayment(occ)}
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>{DEBT_TYPE_LABELS[occ.debt_type]}</TableCell>
              <TableCell>{formatDate(occ.due_date)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={statusBadgeClass(occ.status)}>
                  {occ.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <PaymentAmountDisplay occurrence={occ} className="text-right" />
                  {!occ.is_paid && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => onAdjustPayment(occ)}
                    >
                      Adjust payment
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={occ.is_paid}
                  onCheckedChange={(checked) => onTogglePaid(occ.id, checked)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label={`Edit ${occ.debt_name}`}
                    onClick={() => onEdit(occ.debt_id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    aria-label={`Delete ${occ.debt_name}`}
                    onClick={() => onDelete(occ.debt_id, occ.debt_name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
