"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { errorMessage } from "@/lib/forms";
import { useUpdatePatient } from "@/lib/queries/patients";
import type { DoctorSummary } from "@/types/models";
import { DoctorSelect } from "./doctor-select";

interface ReassignPatientDialogProps {
  patient: { _id: string; fullName: string } | null;
  currentDoctor: DoctorSummary;
  onOpenChange: (open: boolean) => void;
}

/** "Removing" a patient from a doctor means moving them to another doctor — patients always need one. */
export function ReassignPatientDialog({ patient, currentDoctor, onOpenChange }: ReassignPatientDialogProps) {
  const [target, setTarget] = useState<DoctorSummary | null>(null);
  const update = useUpdatePatient();
  const selectId = useId();

  const close = () => {
    onOpenChange(false);
    setTarget(null);
    update.reset();
  };

  return (
    <Dialog open={patient !== null} onOpenChange={(open) => !open && !update.isPending && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign {patient?.fullName}</DialogTitle>
          <DialogDescription>
            Move this patient from {currentDoctor.name} to another doctor. Their records stay intact.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor={selectId}>New doctor</FieldLabel>
          <DoctorSelect
            id={selectId}
            value={target?._id ?? ""}
            onChange={setTarget}
            excludeId={currentDoctor._id}
          />
        </Field>

        {target && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <span className="truncate text-muted-foreground">{currentDoctor.name}</span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate font-medium">{target.name}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={update.isPending}>
            Cancel
          </Button>
          <Button
            disabled={!target || update.isPending}
            onClick={() => {
              if (!patient || !target) return;
              update.mutate(
                { id: patient._id, values: { doctor: target._id } },
                {
                  onSuccess: () => {
                    toast.success(`${patient.fullName} was reassigned to ${target.name}`);
                    close();
                  },
                  onError: (error) => toast.error(errorMessage(error, "Could not reassign the patient")),
                },
              );
            }}
          >
            {update.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {update.isPending ? "Reassigning…" : "Reassign patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
