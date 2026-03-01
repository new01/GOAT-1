export enum StepStatus {
  COMPLETED = "completed",
  CURRENT = "current",
  LOCKED = "locked",
}

export interface StepDefinition {
  number: number; // 0-indexed step number
  name: string; // Display name
  description: string; // Short description
  icon: string; // Emoji or icon identifier
}

export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  isLoading: boolean;
  startedAt: number | null;
  getStepStatus: (stepNumber: number) => StepStatus;
  goToStep: (stepNumber: number) => void;
  completeCurrentStep: () => void;
  canNavigateToStep: (stepNumber: number) => boolean;
  setStartedAt: (timestamp: number) => void;
}

export const STEPS: StepDefinition[] = [
  {
    number: 0,
    name: "Connect Wallet",
    description: "Connect your EVM wallet to GOAT Testnet3",
    icon: "wallet",
  },
  {
    number: 1,
    name: "Agent Identity",
    description: "Register your ERC-8004 agent identity",
    icon: "identity",
  },
  {
    number: 2,
    name: "Payment Setup",
    description: "Configure x402 payment credentials",
    icon: "payment",
  },
  {
    number: 3,
    name: "Telegram",
    description: "Wire your Telegram bot connection",
    icon: "telegram",
  },
  {
    number: 4,
    name: "Demo Transaction",
    description: "Execute your first Hello GOAT transaction",
    icon: "rocket",
  },
];
