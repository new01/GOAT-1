"use client";

import { useState } from "react";
import { useAccount, useSwitchChain, useBalance, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { StepStatus, type StepDefinition } from "@/types/wizard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, AlertTriangle, ExternalLink, ChevronDown, ChevronRight, Copy, CheckCheck } from "lucide-react";
import { GOAT_TESTNET3 } from "@/lib/constants";
import { erc20BalanceOfABI } from "@/lib/abi";

interface StepConnectWalletProps {
  step: StepDefinition;
  status: StepStatus;
  onComplete: () => void;
  startedAt?: number | null;
  onStartTimer?: () => void;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(value: bigint | undefined, decimals: number): string {
  if (value === undefined) return "—";
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fractional = value % divisor;
  const fracStr = fractional.toString().padStart(decimals, "0").slice(0, 4);
  // Trim trailing zeros from fractional part
  const trimmed = fracStr.replace(/0+$/, "") || "0";
  return `${whole}.${trimmed}`;
}

/** Displays native BTC + ERC-20 token balances */
function BalanceDisplay({ address }: { address: `0x${string}` }) {
  // Native BTC balance
  const { data: nativeBalance, isLoading: nativeLoading } = useBalance({
    address,
  });

  // USDC balance
  const { data: usdcRaw } = useReadContract({
    address: GOAT_TESTNET3.tokens.USDC as `0x${string}`,
    abi: erc20BalanceOfABI,
    functionName: "balanceOf",
    args: [address],
  });

  // USDT balance
  const { data: usdtRaw } = useReadContract({
    address: GOAT_TESTNET3.tokens.USDT as `0x${string}`,
    abi: erc20BalanceOfABI,
    functionName: "balanceOf",
    args: [address],
  });

  // ERC-20 tokens on GOAT Testnet3 use 6 decimals for USDC/USDT
  const usdcBalance = formatBalance(usdcRaw as bigint | undefined, 6);
  const usdtBalance = formatBalance(usdtRaw as bigint | undefined, 6);

  const btcFormatted = nativeLoading
    ? "..."
    : nativeBalance
      ? formatBalance(nativeBalance.value, nativeBalance.decimals)
      : "—";

  const zero = BigInt(0);
  const anyZero =
    nativeBalance?.value === zero ||
    (usdcRaw as bigint | undefined) === zero ||
    (usdtRaw as bigint | undefined) === zero;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Balances</h4>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">BTC</p>
          <p className="font-mono text-sm font-medium">{btcFormatted}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">USDC</p>
          <p className="font-mono text-sm font-medium">{usdcBalance}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">USDT</p>
          <p className="font-mono text-sm font-medium">{usdtBalance}</p>
        </div>
      </div>
      {anyZero && (
        <a
          href={GOAT_TESTNET3.faucet}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          Get test tokens
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

/** Expandable "No wallet?" guide */
function NoWalletGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-dashed p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        No wallet?
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">1.</span> Install MetaMask from{" "}
            <a
              href="https://metamask.io/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              metamask.io/download
            </a>
          </p>
          <p>
            <span className="font-medium text-foreground">2.</span> Create or import a wallet
          </p>
          <p>
            <span className="font-medium text-foreground">3.</span> Add GOAT Testnet3 network:
          </p>
          <div className="ml-4 space-y-1 rounded-md bg-muted p-3 font-mono text-xs">
            <p>Network Name: GOAT Testnet3</p>
            <p>RPC URL: {GOAT_TESTNET3.rpc}</p>
            <p>Chain ID: {GOAT_TESTNET3.chainId}</p>
            <p>Symbol: BTC</p>
            <p>Explorer: {GOAT_TESTNET3.explorer}</p>
          </div>
          <p>
            <span className="font-medium text-foreground">4.</span> Get test tokens from the{" "}
            <a
              href={GOAT_TESTNET3.faucet}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              faucet
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export function StepConnectWallet({
  step,
  status,
  onComplete,
  startedAt,
  onStartTimer,
}: StepConnectWalletProps) {
  const { address, isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isCorrectNetwork = chain?.id === GOAT_TESTNET3.chainId;

  const handleSwitchNetwork = () => {
    setError(null);
    try {
      switchChain(
        { chainId: GOAT_TESTNET3.chainId },
        {
          onError: () => {
            setError(
              "Could not switch network automatically. Open your wallet and switch to GOAT Testnet3 (Chain ID 48816) manually."
            );
          },
        }
      );
    } catch {
      setError(
        "Failed to switch network. Try switching manually in your wallet."
      );
    }
  };

  const handleContinue = () => {
    if (startedAt == null && onStartTimer) {
      onStartTimer();
    }
    onComplete();
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- State D: Completed (read-only) ---
  if (status === StepStatus.COMPLETED) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Check className="size-5 text-green-600" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            {isConnected && address
              ? `${truncateAddress(address)} on ${chain?.name ?? "Unknown"}`
              : step.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected && address && isCorrectNetwork && (
            <BalanceDisplay address={address} />
          )}
        </CardContent>
      </Card>
    );
  }

  // --- State A: Not Connected ---
  if (!isConnected || !address) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-xl">
            Connect your wallet to GOAT Testnet3
          </CardTitle>
          <CardDescription>
            Connect an EVM wallet to get started. MetaMask, Rabby, Coinbase
            Wallet, and WalletConnect are supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConnectButton />
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          <NoWalletGuide />
        </CardContent>
      </Card>
    );
  }

  // --- State B: Connected, Wrong Network ---
  if (!isCorrectNetwork) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="text-xl">Switch Network</CardTitle>
          <CardDescription>
            Connected as {truncateAddress(address)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Wrong network</p>
              <p className="mt-1">
                You&apos;re connected to{" "}
                <span className="font-medium">{chain?.name ?? `Chain ${chain?.id}`}</span>.
                Switch to GOAT Testnet3 to continue.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className="w-full"
          >
            {isSwitching ? "Switching..." : "Switch to GOAT Testnet3"}
          </Button>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- State C: Connected, Correct Network ---
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500" />
            Connected to GOAT Testnet3
          </span>
        </CardTitle>
        <CardDescription>
          Your wallet is ready to go
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address display */}
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
            {address}
          </code>
          <button
            onClick={handleCopyAddress}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            title="Copy address"
          >
            {copied ? (
              <CheckCheck className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>

        {/* Balances */}
        <BalanceDisplay address={address} />

        {/* Continue button */}
        <Button onClick={handleContinue} className="w-full">
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
