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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import { api } from "@/lib/api";
import type { PaymentCard } from "@/lib/types";

interface UpdateCardDialogProps {
  card: PaymentCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function UpdateCardForm({
  card,
  onSuccess,
  onClose,
}: {
  card: PaymentCard;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isCredit = card.card_type === "credit_card";
  const [nickname, setNickname] = useState(card.nickname);
  const [creditLimit, setCreditLimit] = useState(
    card.credit_limit != null ? String(card.credit_limit) : ""
  );
  const [balance, setBalance] = useState(String(card.balance));
  const [minimumDue, setMinimumDue] = useState(
    card.minimum_due != null ? String(card.minimum_due) : ""
  );
  const [dueDay, setDueDay] = useState(
    card.due_day != null ? String(card.due_day) : "15"
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNickname(card.nickname);
    setCreditLimit(card.credit_limit != null ? String(card.credit_limit) : "");
    setBalance(String(card.balance));
    setMinimumDue(card.minimum_due != null ? String(card.minimum_due) : "");
    setDueDay(card.due_day != null ? String(card.due_day) : "15");
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast.error("Enter a nickname");
      return;
    }

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const payload: Parameters<typeof api.updateCard>[1] = {
      nickname: nickname.trim(),
      balance: parsedBalance,
    };

    if (isCredit) {
      const limit = parseFloat(creditLimit);
      payload.credit_limit = !isNaN(limit) && limit > 0 ? limit : null;
      if (payload.credit_limit != null && parsedBalance > payload.credit_limit) {
        toast.error("Used amount cannot exceed credit limit");
        return;
      }
      const minDue = parseFloat(minimumDue);
      payload.minimum_due = !isNaN(minDue) && minDue > 0 ? minDue : null;
      const day = parseInt(dueDay, 10);
      payload.due_day = !isNaN(day) && day >= 1 && day <= 28 ? day : null;
    }

    setSubmitting(true);
    try {
      await api.updateCard(card.id, payload);
      toast.success("Card updated");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update card");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-card-nickname">Nickname</Label>
        <Input
          id="edit-card-nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="h-11"
        />
      </div>

      {isCredit ? (
        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-card-limit">Credit limit (₱)</Label>
              <Input
                id="edit-card-limit"
                type="number"
                min="0"
                step="0.01"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-card-used">Used amount (₱)</Label>
              <Input
                id="edit-card-used"
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-card-min-due">Min due</Label>
              <Input
                id="edit-card-min-due"
                type="number"
                min="0"
                step="0.01"
                value={minimumDue}
                onChange={(e) => setMinimumDue(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-card-due-day">Due day</Label>
              <Input
                id="edit-card-due-day"
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
          <Label htmlFor="edit-card-balance">
            {card.card_type === "debit_card"
              ? "Available balance (₱)"
              : "Wallet balance (₱)"}
          </Label>
          <Input
            id="edit-card-balance"
            type="number"
            min="0"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="h-11"
          />
        </div>
      )}

      <Button type="submit" className="h-11 w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

export function UpdateCardDialog({
  card,
  open,
  onOpenChange,
  onSuccess,
}: UpdateCardDialogProps) {
  const isMobile = useIsMobile();
  if (!card) return null;

  const form = (
    <UpdateCardForm
      card={card}
      onSuccess={onSuccess}
      onClose={() => onOpenChange(false)}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Update {card.nickname}</SheetTitle>
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
          <DialogTitle>Update {card.nickname}</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}
