"use client";

import { useAccount } from "wagmi";
import { STEPS } from "@/types/wizard";
import { useWizard } from "@/hooks/use-wizard";
import { STEP_COMPONENTS } from "@/components/wizard/steps";
import { WizardHeader } from "@/components/wizard/wizard-header";
import { WizardSidebar } from "@/components/wizard/wizard-sidebar";
import { WizardStep } from "@/components/wizard/wizard-step";

export function WizardShell() {
  const { address, chain } = useAccount();
  const wizard = useWizard(address);

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

  // Build step-specific props for StepConnectWallet
  const stepProps: Record<string, unknown> = {
    step: currentStepDef,
    status: wizard.getStepStatus(wizard.currentStep),
    onComplete: wizard.completeCurrentStep,
  };

  // Pass extra props for the connect wallet step
  if (wizard.currentStep === 0) {
    stepProps.startedAt = wizard.startedAt;
    stepProps.onStartTimer = () => {
      if (wizard.startedAt == null) {
        wizard.setStartedAt(Date.now());
      }
    };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <WizardHeader
        walletAddress={address}
        chainName={chain?.name}
        startedAt={wizard.startedAt}
      />
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
              {...(stepProps as any)}
            />
          </WizardStep>
        </main>
      </div>
    </div>
  );
}
