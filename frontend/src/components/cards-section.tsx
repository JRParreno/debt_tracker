"use client";

import { useState } from "react";
import {
  CreditCard,
  Landmark,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  AddCardButton,
  AddCardDialog,
} from "@/components/add-card-dialog";
import { UpdateCardDialog } from "@/components/update-card-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { api } from "@/lib/api";
import type { CardType, PaymentCard } from "@/lib/types";
import { CARD_TYPE_LABELS } from "@/lib/types";

const CARD_ICONS: Record<CardType, typeof CreditCard> = {
  credit_card: CreditCard,
  debit_card: Landmark,
  online_card: Smartphone,
};

interface CardsSectionProps {
  cards: PaymentCard[];
  loading: boolean;
  onRefresh: () => void;
}

function CardTile({
  card,
  onUpdate,
  onDelete,
}: {
  card: PaymentCard;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const Icon = CARD_ICONS[card.card_type];
  const isCredit = card.card_type === "credit_card";
  const limit = card.credit_limit;
  const usedPct =
    isCredit && limit != null && limit > 0
      ? Math.min(100, (card.balance / limit) * 100)
      : null;
  const remaining =
    isCredit && limit != null ? Math.max(0, limit - card.balance) : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{card.nickname}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {CARD_TYPE_LABELS[card.card_type]}
              </Badge>
            </div>
          </div>
        </div>

        {isCredit ? (
          <div className="space-y-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 text-muted-foreground">Used</span>
              <span className="font-medium tabular-nums">{formatCurrency(card.balance)}</span>
            </div>
            {limit != null && (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="shrink-0 text-muted-foreground">Limit</span>
                  <span className="tabular-nums">{formatCurrency(limit)}</span>
                </div>
                {usedPct != null && <Progress value={usedPct} className="h-2" />}
                {remaining != null && (
                  <div className="flex items-baseline justify-between gap-3 text-emerald-400">
                    <span className="shrink-0">Available</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                )}
              </>
            )}
            {card.minimum_due != null && (
              <div className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 text-muted-foreground">Min due</span>
                <span className="tabular-nums">{formatCurrency(card.minimum_due)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-semibold">{formatCurrency(card.balance)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-10 min-h-10 flex-1 sm:h-11 sm:min-h-11"
            onClick={onUpdate}
          >
            Update
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 min-h-10 w-10 shrink-0 px-0 text-destructive hover:text-destructive sm:h-11 sm:min-h-11 sm:w-11"
            aria-label={`Remove ${card.nickname}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CardsSection({ cards, loading, onRefresh }: CardsSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editCard, setEditCard] = useState<PaymentCard | null>(null);

  const handleDelete = async (card: PaymentCard) => {
    if (!confirm(`Remove ${card.nickname}?`)) return;
    try {
      await api.deleteCard(card.id);
      toast.success("Card removed");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove card");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold sm:text-lg">My cards</h2>
        <AddCardButton onClick={() => setAddOpen(true)} />
      </div>
      <p className="hidden text-sm text-muted-foreground sm:block">
        Credit, debit, and online wallets — nickname only, quick balance updates
      </p>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full sm:h-44" />
          ))}
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center sm:p-8">
          <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">
            No cards yet. Add a nickname to track balances here.
          </p>
          <Button className="mt-4 h-11" onClick={() => setAddOpen(true)}>
            Add your first card
          </Button>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              onUpdate={() => setEditCard(card)}
              onDelete={() => handleDelete(card)}
            />
          ))}
        </div>
      )}

      <AddCardDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={onRefresh}
      />
      <UpdateCardDialog
        card={editCard}
        open={editCard !== null}
        onOpenChange={(open) => !open && setEditCard(null)}
        onSuccess={onRefresh}
      />
    </section>
  );
}
