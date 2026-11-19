"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { errorMessage } from "@/lib/forms";
import { useDeletePatient } from "@/lib/queries/patients";

interface DeletePatientDialogProps {
  patient: { _id: string; fullName: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeletePatientDialog({ patient, onOpenChange, onDeleted }: DeletePatientDialogProps) {
  const deletePatient = useDeletePatient();

  return (
    <ConfirmDialog
      open={patient !== null}
      onOpenChange={(open) => {
        if (!open) deletePatient.reset();
        onOpenChange(open);
      }}
      title={`Delete ${patient?.fullName ?? "patient"}?`}
      description={<p>This permanently deletes the patient record and their details. This action cannot be undone.</p>}
      confirmLabel="Delete patient"
      pendingLabel="Deleting…"
      destructive
      isPending={deletePatient.isPending}
      onConfirm={() => {
        if (!patient) return;
        deletePatient.mutate(patient._id, {
          onSuccess: () => {
            toast.success(`${patient.fullName} was deleted`);
            onOpenChange(false);
            onDeleted?.();
          },
          onError: (error) => toast.error(errorMessage(error, "Could not delete the patient")),
        });
      }}
    />
  );
}
