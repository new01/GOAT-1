"use client";

import { StepStatus, type StepDefinition } from "@/types/wizard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Diamond, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardSidebarProps {
  steps: StepDefinition[];
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

function getStepStatus(
  stepNumber: number,
  currentStep: number,
  completedSteps: number[]
): StepStatus {
  if (completedSteps.includes(stepNumber)) return StepStatus.COMPLETED;
  if (stepNumber === currentStep) return StepStatus.CURRENT;
  return StepStatus.LOCKED;
}

function StepStatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case StepStatus.COMPLETED:
      return <Check className="size-4 text-green-600" />;
    case StepStatus.CURRENT:
      return <Diamond className="size-4 text-primary" />;
    case StepStatus.LOCKED:
      return <Circle className="size-3.5 text-muted-foreground/50" />;
  }
}

export function WizardSidebar({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: WizardSidebarProps) {
  return (
    <aside className="w-52 shrink-0 border-r bg-muted/30">
      <ScrollArea className="h-full">
        <nav className="flex flex-col gap-1 p-3">
          {steps.map((step) => {
            const status = getStepStatus(
              step.number,
              currentStep,
              completedSteps
            );
            const isClickable = status !== StepStatus.LOCKED;

            return (
              <button
                key={step.number}
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  status === StepStatus.CURRENT &&
                    "bg-accent text-accent-foreground font-medium",
                  status === StepStatus.COMPLETED &&
                    "hover:bg-accent/50 cursor-pointer",
                  status === StepStatus.LOCKED &&
                    "cursor-not-allowed opacity-50"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    status === StepStatus.COMPLETED &&
                      "bg-green-100 text-green-700",
                    status === StepStatus.CURRENT &&
                      "bg-primary text-primary-foreground",
                    status === StepStatus.LOCKED &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {step.number + 1}
                </span>
                <span className="flex-1 truncate">{step.name}</span>
                <StepStatusIcon status={status} />
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
