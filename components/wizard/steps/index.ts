import { StepConnectWallet } from "./step-connect-wallet";
import { StepPlaceholder } from "./step-placeholder";

export const STEP_COMPONENTS = {
  0: StepConnectWallet,
  1: StepPlaceholder,
  2: StepPlaceholder,
  3: StepPlaceholder,
  4: StepPlaceholder,
} as const;

export { STEPS as STEP_DEFINITIONS } from "@/types/wizard";
