"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import type { StrategySummary } from "@/lib/types";
import { ChevronDown } from "lucide-react";

interface PayStrategyCardProps {
  strategy: StrategySummary | null;
  loading?: boolean;
}

export function PayStrategyCard({ strategy, loading }: PayStrategyCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!strategy) return null;

  const hasShortfall = strategy.surplus < 0;

  return (
    <Card>
      <CardHeader className="space-y-0 p-3 pb-2 sm:p-6 sm:pb-3">
        <CardTitle className="text-base sm:text-lg">Pay strategy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
        {hasShortfall ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Shortfall this month</AlertTitle>
            <AlertDescription>
              You need {formatCurrency(Math.abs(strategy.surplus))} more to cover
              all unpaid debts.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>On track</AlertTitle>
            <AlertDescription>
              Surplus of {formatCurrency(strategy.surplus)} after unpaid debts.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {strategy.periods.map((period) => {
            const pct =
              period.income > 0
                ? Math.min(100, (period.debts_due / period.income) * 100)
                : 0;
            const ok = period.remaining >= 0;

            return (
              <Card key={period.label} className="bg-muted/30">
                <CardContent className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{period.label}</p>
                    <Badge
                      variant="outline"
                      className={
                        ok
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-red-500/30 text-red-400"
                      }
                    >
                      {ok ? "OK" : "Short"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Income</p>
                      <p className="font-medium">{formatCurrency(period.income)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due</p>
                      <p className="font-medium">{formatCurrency(period.debts_due)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Left</p>
                      <p
                        className={`font-medium ${ok ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {formatCurrency(period.remaining)}
                      </p>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />

                  {period.debts.length > 0 && (
                    <Collapsible className="lg:hidden">
                      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm text-muted-foreground">
                        {period.debts.length} debt(s)
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-1">
                        {period.debts.map((d) => (
                          <div
                            key={d.id}
                            className="flex justify-between text-sm"
                          >
                            <span>{d.name}</span>
                            <span>{formatCurrency(d.amount)}</span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {period.debts.length > 0 && (
                    <ul className="hidden space-y-1 lg:block">
                      {period.debts.map((d) => (
                        <li
                          key={d.id}
                          className="flex justify-between text-sm text-muted-foreground"
                        >
                          <span>
                            {d.name} ({formatDate(d.due_date)})
                          </span>
                          <span>{formatCurrency(d.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
