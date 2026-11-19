"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/forms";
import { pluralize } from "@/lib/format";
import { useDeleteDoctor } from "@/lib/queries/doctors";
import type { Doctor } from "@/types/models";

interface DeleteDoctorDialogProps {
  doctor: Pick<Doctor, "_id" | "name" | "patientCount"> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Enforces the deletion policy in the UI: a doctor with assigned patients cannot be deleted.
 * The backend is the source of truth (409) — that case is handled too, e.g. if a patient
 * was assigned after this page loaded.
 */
export function DeleteDoctorDialog({ doctor, onOpenChange, onDeleted }: DeleteDoctorDialogProps) {
  const deleteDoctor = useDeleteDoctor();
  const [blockedCount, setBlockedCount] = useState<number | null>(null);

  const close = () => {
    onOpenChange(false);
    setBlockedCount(null);
    deleteDoctor.reset();
  };

  if (!doctor) return null;
  const patientCount = blockedCount ?? doctor.patientCount;

  if (patientCount > 0) {
    return (
      <AlertDialog open onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-warning/10 text-warning">
              <AlertTriangle className="size-5" aria-hidden />
            </div>
            <AlertDialogTitle>{doctor.name} can’t be deleted yet</AlertDialogTitle>
            <AlertDialogDescription>
              This doctor still has {pluralize(patientCount, "assigned patient")}. Every patient must belong to a
              doctor, so reassign or remove those patients first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <Button asChild>
              <Link href={`/doctors/${doctor._id}#patients`} onClick={close}>
                Manage patients
              </Link>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && close()}
      title={`Delete ${doctor.name}?`}
      description={<p>This permanently removes the doctor’s profile. This action cannot be undone.</p>}
      confirmLabel="Delete doctor"
      pendingLabel="Deleting…"
      destructive
      isPending={deleteDoctor.isPending}
      onConfirm={() =>
        deleteDoctor.mutate(doctor._id, {
          onSuccess: () => {
            toast.success(`${doctor.name} was deleted`);
            close();
            onDeleted?.();
          },
          onError: (error) => {
            const details = isApiError(error) ? error.details : undefined;
            if (isApiError(error) && error.status === 409 && details && typeof details === "object" && "patientCount" in details) {
              setBlockedCount(Number(details.patientCount));
              return;
            }
            toast.error(errorMessage(error, "Could not delete the doctor"));
          },
        })
      }
    />
  );
}
