"use client";

import { StepStatus, type StepDefinition } from "@/types/wizard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Lock } from "lucide-react";

interface StepPlaceholderProps {
  step: StepDefinition;
  status: StepStatus;
  onComplete: () => void;
}

export function StepPlaceholder({
  step,
  status,
  onComplete,
}: StepPlaceholderProps) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl">
          Step {step.number + 1}: {step.name}
        </CardTitle>
        <CardDescription>{step.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === StepStatus.CURRENT && (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              This step will be implemented in a future phase. For now, mark it
              complete to continue.
            </p>
            <Button onClick={onComplete} className="w-fit">
              Mark Complete
            </Button>
          </div>
        )}
        {status === StepStatus.COMPLETED && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="size-5" />
            <span className="font-medium">Completed</span>
          </div>
        )}
        {status === StepStatus.LOCKED && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="size-4" />
            <span className="text-sm">
              Complete previous steps to unlock
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
