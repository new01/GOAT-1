"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { StepStatus, STEPS, type WizardState } from "@/types/wizard";
import { useConvexAvailable } from "@/app/providers";
import { useSafeQuery, useSafeMutation } from "@/hooks/use-safe-convex";
import { api } from "../convex/_generated/api";

/**
 * Wizard state hook with optional Convex persistence.
 *
 * When `walletAddress` is provided AND Convex is available:
 *   - Reads step progress from Convex (real-time reactive via useQuery)
 *   - Writes step completions to Convex via mutation
 *   - Maintains optimistic local state so the UI does not lag
 *
 * When `walletAddress` is NOT provided OR Convex is not configured:
 *   - Falls back to local useState (no persistence)
 *   - isLoading is always false
 */
export function useWizard(walletAddress?: string): WizardState {
  const normalizedWallet = walletAddress?.toLowerCase();
  const convexAvailable = useConvexAvailable();
  const useConvex = Boolean(normalizedWallet && convexAvailable);

  // --- Convex integration (safe -- returns undefined when provider missing) ---
  const builderData = useSafeQuery(
    api.builders.getByWallet,
    useConvex && normalizedWallet
      ? { walletAddress: normalizedWallet }
      : "skip"
  );
  const completeStepMutation = useSafeMutation(api.builders.completeStep);

  // --- Local state ---
  const [localCurrentStep, setLocalCurrentStep] = useState(0);
  const [localCompletedSteps, setLocalCompletedSteps] = useState<number[]>([]);

  // Track whether we've synced Convex data at least once
  const hasSynced = useRef(false);

  // Sync Convex data into local state when it arrives
  useEffect(() => {
    if (useConvex && builderData) {
      setLocalCurrentStep(builderData.currentStep);
      setLocalCompletedSteps(builderData.completedSteps);
      hasSynced.current = true;
    }
  }, [useConvex, builderData]);

  // Determine loading state:
  // - No wallet / no Convex: never loading
  // - Convex mode but query hasn't resolved yet (undefined): loading
  const isLoading = useConvex ? builderData === undefined : false;

  // Derive current values:
  // When Convex has data, use it (real-time). Otherwise use local state.
  const currentStep = useConvex && builderData
    ? builderData.currentStep
    : localCurrentStep;

  const completedSteps = useConvex && builderData
    ? builderData.completedSteps
    : localCompletedSteps;

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
        setLocalCurrentStep(stepNumber);
      }
    },
    [canNavigateToStep]
  );

  const completeCurrentStep = useCallback(() => {
    const stepToComplete = currentStep;
    const nextStep = Math.min(stepToComplete + 1, STEPS.length - 1);

    // Optimistic local update
    setLocalCompletedSteps((prev) => {
      if (prev.includes(stepToComplete)) return prev;
      return [...prev, stepToComplete];
    });
    setLocalCurrentStep(nextStep);

    // Persist to Convex if connected
    if (useConvex && completeStepMutation) {
      completeStepMutation({
        walletAddress: normalizedWallet!,
        stepNumber: stepToComplete,
      });
    }
  }, [currentStep, useConvex, normalizedWallet, completeStepMutation]);

  return {
    currentStep: useConvex && builderData ? currentStep : localCurrentStep,
    completedSteps: useConvex && builderData ? completedSteps : localCompletedSteps,
    isLoading,
    getStepStatus,
    goToStep,
    completeCurrentStep,
    canNavigateToStep,
  };
}
