"use client";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";

interface DeleteDebtDialogProps {
  debtId: number | null;
  debtName?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteDebtDialog({
  debtId,
  debtName,
  onOpenChange,
  onSuccess,
}: DeleteDebtDialogProps) {
  const open = debtId !== null;

  const handleDelete = async () => {
    if (!debtId) return;
    try {
      await api.deleteDebt(debtId);
      toast.success("Debt removed");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete debt");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete debt?</AlertDialogTitle>
          <AlertDialogDescription>
            {debtName
              ? `"${debtName}" will be removed from your tracker. Past payment history stays in the database but won't show in the app.`
              : "This debt will be removed from your tracker."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
