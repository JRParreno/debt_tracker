"use client";

import { useState } from "react";
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
import { useIsMobile } from "@/hooks/use-media-query";
import { api } from "@/lib/api";
import type { CardCreate, CardType } from "@/lib/types";
import { CARD_TYPE_LABELS } from "@/lib/types";

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function AddCardForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [cardType, setCardType] = useState<CardType>("credit_card");
  const [creditLimit, setCreditLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [minimumDue, setMinimumDue] = useState("");
  const [dueDay, setDueDay] = useState("15");
  const [submitting, setSubmitting] = useState(false);

  const isCredit = cardType === "credit_card";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.error("Enter a nickname");
      return;
    }

    const payload: CardCreate = {
      nickname: nickname.trim(),
      card_type: cardType,
      balance: parseFloat(balance) || 0,
    };

    if (isCredit) {
      const limit = parseFloat(creditLimit);
      if (!isNaN(limit) && limit > 0) {
        payload.credit_limit = limit;
        if (payload.balance > limit) {
          toast.error("Used amount cannot exceed credit limit");
          return;
        }
      }
      const minDue = parseFloat(minimumDue);
      if (!isNaN(minDue) && minDue > 0) payload.minimum_due = minDue;
      const day = parseInt(dueDay, 10);
      if (!isNaN(day) && day >= 1 && day <= 28) payload.due_day = day;
    }

    setSubmitting(true);
    try {
      await api.createCard(payload);
      toast.success(`Added ${nickname.trim()}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="card-nickname">Nickname</Label>
        <Input
          id="card-nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. BPI Blue, GCash, Payroll ATM"
          className="h-11"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={cardType}
          onValueChange={(v) => setCardType(v as CardType)}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCredit ? (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="card-limit">Credit limit (₱)</Label>
              <Input
                id="card-limit"
                type="number"
                min="0"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="10000"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-used">Used / remaining (₱)</Label>
              <Input
                id="card-used"
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="5000"
                className="h-11"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="card-min-due">Min due (optional)</Label>
              <Input
                id="card-min-due"
                type="number"
                min="0"
                step="0.01"
                value={minimumDue}
                onChange={(e) => setMinimumDue(e.target.value)}
                placeholder="500"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-due-day">Due day (optional)</Label>
              <Input
                id="card-due-day"
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
        <div className="space-y-2">
          <Label htmlFor="card-balance">
            {cardType === "debit_card" ? "Available balance (₱)" : "Wallet balance (₱)"}
          </Label>
          <Input
            id="card-balance"
            type="number"
            min="0"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
            className="h-11"
          />
        </div>
      )}

      <Button type="submit" className="h-11 w-full" disabled={submitting}>
        {submitting ? "Adding..." : "Add card"}
      </Button>
    </form>
  );
}

export function AddCardDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCardDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add card</SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-6">
            <AddCardForm
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add card</DialogTitle>
        </DialogHeader>
        <AddCardForm
          onSuccess={onSuccess}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AddCardButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="icon"
      className="h-9 w-9 shrink-0 sm:h-11 sm:w-auto sm:px-4"
      aria-label="Add card"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Add card</span>
    </Button>
  );
}
