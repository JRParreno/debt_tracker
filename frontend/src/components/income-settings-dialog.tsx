"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-media-query";
import { api } from "@/lib/api";
import type { IncomeSettings, PayFrequency } from "@/lib/types";

interface IncomeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function IncomeForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("monthly");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [payDay, setPayDay] = useState("15");
  const [cutoff1Day, setCutoff1Day] = useState("15");
  const [cutoff1Amount, setCutoff1Amount] = useState("");
  const [cutoff2Day, setCutoff2Day] = useState("28");
  const [cutoff2Amount, setCutoff2Amount] = useState("");

  useEffect(() => {
    api
      .getIncome()
      .then((income: IncomeSettings) => {
        setPayFrequency(income.pay_frequency);
        setMonthlyAmount(String(income.monthly_amount ?? ""));
        setPayDay(String(income.pay_day ?? 15));
        setCutoff1Day(String(income.cutoff_1_day ?? 15));
        setCutoff1Amount(String(income.cutoff_1_amount ?? ""));
        setCutoff2Day(String(income.cutoff_2_day ?? 28));
        setCutoff2Amount(String(income.cutoff_2_amount ?? ""));
      })
      .catch(() => toast.error("Failed to load income settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateIncome({
        pay_frequency: payFrequency,
        monthly_amount:
          payFrequency === "monthly" ? parseFloat(monthlyAmount) || 0 : null,
        pay_day: payFrequency === "monthly" ? parseInt(payDay, 10) : null,
        cutoff_1_day:
          payFrequency === "semi_monthly" ? parseInt(cutoff1Day, 10) : null,
        cutoff_1_amount:
          payFrequency === "semi_monthly"
            ? parseFloat(cutoff1Amount) || 0
            : null,
        cutoff_2_day:
          payFrequency === "semi_monthly" ? parseInt(cutoff2Day, 10) : null,
        cutoff_2_amount:
          payFrequency === "semi_monthly"
            ? parseFloat(cutoff2Amount) || 0
            : null,
      });
      toast.success("Income settings saved");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs
        value={payFrequency}
        onValueChange={(v) => setPayFrequency(v as PayFrequency)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="semi_monthly">Per cutoff</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-amount">Monthly salary (₱)</Label>
            <Input
              id="monthly-amount"
              type="number"
              min="0"
              step="0.01"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-day">Pay day (1–28)</Label>
            <Input
              id="pay-day"
              type="number"
              min="1"
              max="28"
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
              className="h-11"
            />
          </div>
        </TabsContent>
        <TabsContent value="semi_monthly" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cutoff 1 day</Label>
              <Input
                type="number"
                min="1"
                max="28"
                value={cutoff1Day}
                onChange={(e) => setCutoff1Day(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Cutoff 1 amount (₱)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={cutoff1Amount}
                onChange={(e) => setCutoff1Amount(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Cutoff 2 day</Label>
              <Input
                type="number"
                min="1"
                max="28"
                value={cutoff2Day}
                onChange={(e) => setCutoff2Day(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Cutoff 2 amount (₱)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={cutoff2Amount}
                onChange={(e) => setCutoff2Amount(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <Button type="submit" className="h-11 w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Save income"}
      </Button>
    </form>
  );
}

export function IncomeSettingsDialog({
  open,
  onOpenChange,
  onSuccess,
}: IncomeSettingsDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Income settings</SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-6">
            <IncomeForm
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
          <DialogTitle>Income settings</DialogTitle>
        </DialogHeader>
        <IncomeForm
          onSuccess={onSuccess}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function IncomeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-9 w-9 shrink-0 gap-2 px-0 sm:h-11 sm:w-auto sm:px-4"
      aria-label="Income settings"
    >
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">Income</span>
    </Button>
  );
}
