"use client";

import { Clock, Wallet } from "lucide-react";
import { useTimer } from "@/hooks/use-timer";

interface WizardHeaderProps {
  walletAddress?: string;
  chainName?: string;
  startedAt?: number | null;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WizardHeader({
  walletAddress,
  chainName,
  startedAt,
}: WizardHeaderProps) {
  const { elapsed } = useTimer(startedAt);

  return (
    <header className="flex h-[60px] items-center justify-between border-b px-6">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight">Hello GOAT</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="size-4" />
        <span className="text-sm font-mono">{elapsed}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wallet className="size-4" />
        {walletAddress ? (
          <span className="text-sm">
            {truncateAddress(walletAddress)}
            {chainName && (
              <span className="ml-1 text-xs text-muted-foreground/70">
                ({chainName})
              </span>
            )}
          </span>
        ) : (
          <span className="text-sm">Not Connected</span>
        )}
      </div>
    </header>
  );
}
