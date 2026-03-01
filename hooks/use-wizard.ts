"use client";

import { useState, useCallback } from "react";
import { StepStatus, STEPS, type WizardState } from "@/types/wizard";

export function useWizard(): WizardState {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const getStepStatus = useCallback(
    (stepNumber: number): StepStatus => {
      if (completedSteps.includes(stepNumber)) {
        return StepStatus.COMPLETED;
      }
      if (stepNumber === currentStep) {
        return StepStatus.CURRENT;
      }
      return StepStatus.LOCKED;
    },
    [currentStep, completedSteps]
  );

  const canNavigateToStep = useCallback(
    (stepNumber: number): boolean => {
      return completedSteps.includes(stepNumber) || stepNumber === currentStep;
    },
    [currentStep, completedSteps]
  );

  const goToStep = useCallback(
    (stepNumber: number) => {
      if (canNavigateToStep(stepNumber)) {
        setCurrentStep(stepNumber);
      }
    },
    [canNavigateToStep]
  );

  const completeCurrentStep = useCallback(() => {
    setCompletedSteps((prev) => {
      if (prev.includes(currentStep)) {
        return prev;
      }
      return [...prev, currentStep];
    });
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [currentStep]);

  return {
    currentStep,
    completedSteps,
    getStepStatus,
    goToStep,
    completeCurrentStep,
    canNavigateToStep,
  };
}
