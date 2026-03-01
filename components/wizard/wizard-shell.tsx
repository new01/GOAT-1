"use client";

import { STEPS } from "@/types/wizard";
import { useWizard } from "@/hooks/use-wizard";
import { STEP_COMPONENTS } from "@/components/wizard/steps";
import { WizardHeader } from "@/components/wizard/wizard-header";
import { WizardSidebar } from "@/components/wizard/wizard-sidebar";
import { WizardStep } from "@/components/wizard/wizard-step";

export function WizardShell() {
  const wizard = useWizard();
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
