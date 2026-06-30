"use client";

import {
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { CardType, PaymentCard } from "@/lib/types";
import { CARD_TYPE_LABELS } from "@/lib/types";

const CARD_ICONS: Record<CardType, typeof CreditCard> = {
  credit_card: CreditCard,
  debit_card: Landmark,
  online_card: Smartphone,
};

interface DemoCardsSectionProps {
  cards: PaymentCard[];
  loading?: boolean;
}

export function DemoCardsSection({ cards, loading }: DemoCardsSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My cards</h2>
        <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
          Sample cards from demo.json — read-only preview
        </p>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = CARD_ICONS[card.card_type];
            const isCredit = card.card_type === "credit_card";
            const limit = card.credit_limit;
            const usedPct =
              isCredit && limit != null && limit > 0
                ? Math.min(100, (card.balance / limit) * 100)
                : null;
            const remaining =
              isCredit && limit != null
                ? Math.max(0, limit - card.balance)
                : null;

            return (
              <Card key={card.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
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

                  {isCredit ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Used</span>
                        <span className="font-medium">
                          {formatCurrency(card.balance)}
                        </span>
                      </div>
                      {limit != null && (
                        <>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Limit</span>
                            <span>{formatCurrency(limit)}</span>
                          </div>
                          {usedPct != null && (
                            <Progress value={usedPct} className="h-1.5" />
                          )}
                          {remaining != null && (
                            <div className="flex justify-between gap-2 text-emerald-400">
                              <span>Available</span>
                              <span className="font-medium">
                                {formatCurrency(remaining)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(card.balance)}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
