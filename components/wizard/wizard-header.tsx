"use client";

import { Clock, Wallet } from "lucide-react";

export function WizardHeader() {
  return (
    <header className="flex h-[60px] items-center justify-between border-b px-6">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight">Hello GOAT</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="size-4" />
        <span className="text-sm font-mono">0:00</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wallet className="size-4" />
        <span className="text-sm">Not Connected</span>
      </div>
    </header>
  );
}
