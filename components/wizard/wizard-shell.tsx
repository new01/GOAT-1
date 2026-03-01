"use client";

import { STEPS } from "@/types/wizard";
import { useWizard } from "@/hooks/use-wizard";
import { STEP_COMPONENTS } from "@/components/wizard/steps";
import { WizardHeader } from "@/components/wizard/wizard-header";
import { WizardSidebar } from "@/components/wizard/wizard-sidebar";
import { WizardStep } from "@/components/wizard/wizard-step";

interface WizardShellProps {
  walletAddress?: string;
}

export function WizardShell({ walletAddress }: WizardShellProps) {
  const wizard = useWizard(walletAddress);

  if (wizard.isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <WizardHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">Loading progress...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStepDef = STEPS[wizard.currentStep];
  const StepComponent =
    STEP_COMPONENTS[wizard.currentStep as keyof typeof STEP_COMPONENTS];

  return (
    <div className="flex min-h-screen flex-col">
      <WizardHeader />
      <div className="flex flex-1">
        <WizardSidebar
          steps={STEPS}
          currentStep={wizard.currentStep}
          completedSteps={wizard.completedSteps}
          onStepClick={wizard.goToStep}
        />
        <main className="flex-1 overflow-hidden p-8">
          <WizardStep stepIndex={wizard.currentStep}>
            <StepComponent
              step={currentStepDef}
              status={wizard.getStepStatus(wizard.currentStep)}
              onComplete={wizard.completeCurrentStep}
            />
          </WizardStep>
        </main>
      </div>
    </div>
  );
}
