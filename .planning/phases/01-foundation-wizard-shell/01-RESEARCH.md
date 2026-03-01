# Phase 1: Foundation + Wizard Shell - Research

**Researched:** 2026-02-28
**Domain:** Next.js + Convex + wagmi/viem scaffold, wizard shell UI, GOAT Testnet3 chain config, x402 spike
**Confidence:** MEDIUM-HIGH

## Summary

Phase 1 is a greenfield scaffold: create a Next.js 15 App Router project with Convex backend, wagmi/viem + RainbowKit provider stack, GOAT Testnet3 chain configuration, and a 5-step wizard shell with sidebar navigation and Convex-persisted progress. The phase also includes an x402 SDK spike to validate the demo transaction approach for Phase 4.

The technology stack is mature and well-documented. Next.js 15 with App Router, Convex, wagmi v3, viem v2, RainbowKit v2, shadcn/ui, Tailwind CSS, and Motion (formerly Framer Motion) all have stable releases and clear integration patterns. The main technical risk is the x402 spike: the `goatx402-sdk-server` package referenced in PROJECT.md does not exist on npm, and the official x402 SDKs (`@x402/next`, `@x402/express`, `@x402/evm`, `@x402/core`) do not officially list GOAT Testnet3 as a supported network. However, the `@x402/evm` package states support for "any EVM-compatible chain" with custom configuration, and GOAT Network has demonstrated x402 integration through GMPayer. The spike should validate this path or document the gap.

**Primary recommendation:** Use `@x402/next` (the official Coinbase x402 Next.js package) for the spike rather than the non-existent `goatx402-sdk-server`. Build a mock API route that simulates the x402 request/response cycle, and attempt real SDK initialization to confirm the handler shape works. Flag GOAT Testnet3 chain support as the specific risk to validate.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Left sidebar (~200px narrow) + main content area layout
- Sidebar shows: step number icon, step name, status icon (checkmark/diamond/circle)
- Header bar: "Hello GOAT" branding on left, elapsed timer in center, connected wallet address on right
- Timer starts counting up from wallet connect (Phase 2), shows 0:00 placeholder in Phase 1
- Slide/fade animation between steps (smooth, polished feel)
- Manual advance: show success state on step completion, user clicks "Continue" to proceed
- Completed steps are clickable in sidebar -- shows read-only summary of completed content
- Future steps are visible but grayed out/locked -- users can see what's coming but can't interact
- Strict linear dependency: Step N must be complete before Step N+1 is interactive
- Package manager: npm
- Convex: new project, created fresh during Phase 1 setup
- x402 SDK spike: mock only -- verify the Next.js API route handler shape works, no real SDK or credentials in Phase 1

### Claude's Discretion
- Directory structure choice (feature-grouped vs type-grouped or hybrid)
- Exact animation library/approach for step transitions
- Convex schema field naming conventions
- shadcn/ui component selection for wizard shell
- Tailwind configuration details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WIZ-01 | 5-step horizontal progress stepper showing completed/current/upcoming states | shadcn/ui sidebar + custom step list with status icons; Motion AnimatePresence for transitions |
| WIZ-02 | Step completion persisted in Convex keyed to wallet address -- progress survives page refresh | Convex `builders` table with `walletAddress` index, `completedSteps` field, `useQuery` for real-time sync |
| WIZ-03 | All steps visible in sidebar at all times; only current step is interactive | Left sidebar with step list always visible; conditional styling for completed/current/locked states |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | React framework with App Router, SSR | Default for React web apps; Vercel-native deployment |
| Convex | 1.32.x | Backend-as-a-service: database, real-time queries, mutations | Real-time reactive queries; TypeScript-native schema; zero-config hosting |
| wagmi | 3.5.x | React hooks for Ethereum wallet interaction | Industry standard for React + EVM wallet integration |
| viem | 2.x | Low-level Ethereum client (transport, chain definitions, ABI) | Peer dependency of wagmi; performant, tree-shakable |
| @rainbow-me/rainbowkit | 2.2.x | Wallet connection modal UI | Best-in-class UX for wallet connect; MetaMask, Rabby, Coinbase, WalletConnect |
| @tanstack/react-query | 5.x | Async state management | Required peer dependency of wagmi; caches wallet/chain queries |
| React | 19.x | UI library | Bundled with Next.js 15 |
| TypeScript | 5.x | Type safety | Default with create-next-app |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | Pre-built accessible UI components (built on Radix UI) | Sidebar layout, buttons, progress indicators, form elements |
| Tailwind CSS | 3.x or 4.x | Utility-first CSS framework | All styling; comes with create-next-app |
| framer-motion (motion) | 12.x | Animation library | Step transition slide/fade animations via AnimatePresence |
| @x402/next | latest | x402 payment protocol Next.js middleware | Spike: validate API route handler shape for Phase 4 |
| @x402/evm | latest | x402 EVM chain support | Spike: test EVM scheme registration for GOAT chain |
| @x402/core | latest | x402 core protocol types and facilitator client | Spike: HTTPFacilitatorClient setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Motion (framer-motion) | CSS transitions + Tailwind | Simpler but less control over enter/exit animations; AnimatePresence is specifically needed for step transitions |
| shadcn/ui | Radix UI primitives directly | More work; shadcn/ui wraps Radix with Tailwind styling pre-applied |
| Convex | Supabase, Firebase | Convex has better real-time reactivity out of the box; user already decided on Convex |

**Installation:**
```bash
# Project scaffold
npx create-next-app@latest hello-goat --typescript --tailwind --eslint --app --use-npm

# Convex
npm install convex

# Wallet stack
npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query

# UI and animation
npx shadcn@latest init
npx shadcn@latest add button card separator scroll-area
npm install framer-motion

# x402 spike (Phase 1 only -- validate approach)
npm install @x402/next @x402/evm @x402/core
```

## Architecture Patterns

### Recommended Project Structure
```
hello-goat/
├── app/
│   ├── layout.tsx              # Root layout (server component)
│   ├── page.tsx                # Main wizard page
│   ├── providers.tsx           # "use client" -- all provider wrappers
│   ├── globals.css             # Tailwind base + custom variables
│   └── api/
│       └── x402-spike/
│           └── route.ts        # x402 spike API route handler
├── components/
│   ├── ui/                     # shadcn/ui generated components
│   ├── wizard/
│   │   ├── wizard-shell.tsx    # Main layout: sidebar + content area
│   │   ├── wizard-sidebar.tsx  # Left sidebar with step list
│   │   ├── wizard-header.tsx   # Top header bar
│   │   ├── wizard-step.tsx     # Step content container with animations
│   │   └── steps/
│   │       ├── step-placeholder.tsx  # Placeholder for all 5 steps (Phase 1)
│   │       └── index.ts        # Step registry (name, icon, component)
│   └── shared/                 # Reusable components
├── lib/
│   ├── constants.ts            # GOAT Testnet3 chain config, token addresses
│   ├── chains.ts               # viem defineChain for GOAT Testnet3
│   ├── wagmi-config.ts         # wagmi + RainbowKit config (separate from "use client")
│   └── utils.ts                # shadcn/ui utility (cn function)
├── convex/
│   ├── schema.ts               # Convex schema definition
│   ├── builders.ts             # Query/mutation functions for builders table
│   └── _generated/             # Convex auto-generated types
├── hooks/
│   └── use-wizard.ts           # Wizard state management hook
└── types/
    └── wizard.ts               # Wizard type definitions
```

### Pattern 1: Provider Nesting Order
**What:** Correct nesting of providers in the App Router
**When to use:** Root layout setup -- providers must wrap all pages
**Example:**
```typescript
// app/providers.tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/wagmi-config";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConvexProvider client={convex}>
            {children}
          </ConvexProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**Key rule:** wagmiConfig MUST be defined in a separate file (not inside a `"use client"` component) because it runs on both server and client. The `providers.tsx` file has `"use client"` and imports the config.

```typescript
// app/layout.tsx (server component -- NO "use client")
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Pattern 2: GOAT Testnet3 Chain Definition
**What:** Custom viem chain definition for GOAT Testnet3
**When to use:** Single source of truth for chain config, used by wagmi, RainbowKit, and all EVM interactions
**Example:**
```typescript
// lib/chains.ts
import { defineChain } from "viem";

export const goatTestnet3 = defineChain({
  id: 48816,
  name: "GOAT Testnet3",
  nativeCurrency: {
    decimals: 18,
    name: "Bitcoin",
    symbol: "BTC",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet3.goat.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "GOAT Explorer",
      url: "https://explorer.testnet3.goat.network",
    },
  },
  testnet: true,
});
```

```typescript
// lib/constants.ts
export const GOAT_TESTNET3 = {
  chainId: 48816,
  chainIdHex: "0xBEB0",
  rpc: "https://rpc.testnet3.goat.network",
  rpcBackup: "https://rpc.ankr.com/goat_testnet",
  explorer: "https://explorer.testnet3.goat.network",
  bridge: "https://bridge.testnet3.goat.network",
  faucet: "https://bridge.testnet3.goat.network/faucet",
  tokens: {
    USDC: "0x29d1ee93e9ecf6e50f309f498e40a6b42d352fa1",
    USDT: "0xdce0af57e8f2ce957b3838cd2a2f3f3677965dd3",
  },
} as const;
```

### Pattern 3: wagmi Config (Separate File)
**What:** wagmi config defined outside `"use client"` components
**When to use:** Required for SSR compatibility in Next.js App Router
**Example:**
```typescript
// lib/wagmi-config.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { goatTestnet3 } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Hello GOAT",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [goatTestnet3],
  transports: {
    [goatTestnet3.id]: http(goatTestnet3.rpcUrls.default.http[0]),
  },
  ssr: true,
});
```

**Note:** `ssr: true` is critical for Next.js App Router compatibility. Without it, hydration mismatches occur.

### Pattern 4: Convex Schema and Builder Persistence
**What:** Convex schema for tracking wizard progress per wallet address
**When to use:** Persisting step completion, querying builder state
**Example:**
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  builders: defineTable({
    walletAddress: v.string(),
    completedSteps: v.array(v.number()),
    currentStep: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_wallet", ["walletAddress"]),
});
```

```typescript
// convex/builders.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("builders")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .unique();
  },
});

export const upsertBuilder = mutation({
  args: {
    walletAddress: v.string(),
    currentStep: v.number(),
    completedSteps: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("builders")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentStep: args.currentStep,
        completedSteps: args.completedSteps,
      });
      return existing._id;
    }

    return await ctx.db.insert("builders", {
      walletAddress: args.walletAddress,
      completedSteps: args.completedSteps,
      currentStep: args.currentStep,
    });
  },
});
```

### Pattern 5: Wizard Step Transition Animation
**What:** AnimatePresence with mode="wait" for sequential step transitions
**When to use:** Switching between wizard steps with slide/fade effect
**Example:**
```typescript
// components/wizard/wizard-step.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";

interface WizardStepProps {
  stepIndex: number;
  children: React.ReactNode;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function WizardStep({ stepIndex, children }: WizardStepProps) {
  return (
    <AnimatePresence mode="wait" custom={1}>
      <motion.div
        key={stepIndex}
        custom={1}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Pattern 6: x402 Spike API Route
**What:** Mock + real SDK initialization test for x402 on Next.js
**When to use:** Phase 1 spike to validate the approach for Phase 4
**Example:**
```typescript
// app/api/x402-spike/route.ts
import { NextRequest, NextResponse } from "next/server";

// Phase 1 spike: mock the x402 request/response cycle
// to confirm the Next.js API route handler shape works.
//
// In Phase 4, this becomes a real x402-protected endpoint.

export async function GET(request: NextRequest) {
  // Simulate a successful x402 flow
  const mockResponse = {
    status: "success",
    message: "x402 spike: API route handler shape works",
    mock402Challenge: {
      status: 402,
      headers: {
        "X-Payment-Required": "true",
        "X-Payment-Amount": "0.1",
        "X-Payment-Currency": "USDC",
        "X-Payment-Network": "eip155:48816",
      },
    },
    mockSettlement: {
      txHash: "0x" + "a".repeat(64),
      network: "GOAT Testnet3",
      amount: "0.1 USDC",
    },
    spikeResult: "PASS",
  };

  return NextResponse.json(mockResponse);
}

export async function POST(request: NextRequest) {
  // Simulate receiving a payment proof and settling
  const body = await request.json();

  return NextResponse.json({
    status: "settled",
    paymentProof: body.paymentProof ?? "mock-proof",
    result: "x402 spike: POST handler shape confirmed",
  });
}
```

### Anti-Patterns to Avoid
- **Putting wagmiConfig inside a "use client" component:** Causes SSR issues. Keep config in a plain .ts file.
- **Using `useState` for wizard state that needs persistence:** Use Convex queries/mutations, not local state. Local state vanishes on refresh.
- **Nesting ConvexProvider inside RainbowKitProvider when using Convex auth:** For Phase 1 without auth this is fine, but in later phases with wallet-based auth, provider order matters.
- **Creating multiple QueryClient instances:** Only one QueryClient should exist. If both wagmi and Convex need TanStack Query, share the same client. (Convex uses its own transport, not TanStack Query, so this is not an issue here.)
- **Hardcoding chain config values across files:** Use the single `constants.ts` / `chains.ts` source of truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wallet connection modal | Custom modal with wallet detection | RainbowKit `<ConnectButton />` | Handles 10+ wallets, WalletConnect protocol, chain switching, mobile deep links |
| EVM chain definition | Manual chain object | viem `defineChain()` | Ensures correct type shape for wagmi/RainbowKit consumption |
| Step transition animations | Manual CSS transitions with state | Motion `AnimatePresence` + `mode="wait"` | Handles enter/exit lifecycle, prevents layout jumps during transitions |
| Form components | Raw HTML inputs | shadcn/ui Button, Card, Input | Accessible (Radix UI), styled (Tailwind), consistent |
| Real-time data sync | WebSocket polling | Convex `useQuery()` | Automatic subscription, optimistic updates, zero setup |
| Database schema types | Manual TypeScript interfaces | Convex `defineSchema()` + codegen | End-to-end type safety from schema to React hooks |

**Key insight:** This phase is pure scaffolding. Every "build" decision should be "configure existing library" not "write custom logic." The only custom code is the wizard shell layout, the step state machine, and the x402 spike.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with wagmi SSR
**What goes wrong:** Next.js renders on server; wagmi detects no wallet (server has no browser extensions). Client renders with wallet available. React throws hydration mismatch.
**Why it happens:** wagmi v2+ defaults to `ssr: false`. Without `ssr: true` in config, the initial server render differs from client.
**How to avoid:** Always pass `ssr: true` to `getDefaultConfig()`. This tells wagmi to return consistent initial state on both server and client.
**Warning signs:** Console error "Text content does not match server-rendered HTML" or flash of wrong content on load.

### Pitfall 2: WalletConnect Project ID Missing
**What goes wrong:** RainbowKit throws "No projectId found" at build time or runtime.
**Why it happens:** WalletConnect v2 requires a project ID. It's free but must be registered.
**How to avoid:** Register at https://dashboard.reown.com/ (free). Store in `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. Add `.env.local` to `.gitignore`.
**Warning signs:** Build failure with "Every dApp must now provide a WalletConnect Cloud projectId."

### Pitfall 3: Convex Dev Environment Not Running
**What goes wrong:** `useQuery` returns undefined forever; mutations silently fail; no error visible.
**Why it happens:** `npx convex dev` must be running alongside `npm run dev`. Two terminals needed.
**How to avoid:** Add a combined dev script: `"dev": "npm-run-all --parallel dev:next dev:convex"` or just document the two-terminal approach clearly.
**Warning signs:** Convex dashboard shows no function calls; UI shows loading state indefinitely.

### Pitfall 4: shadcn/ui Peer Dependency Conflicts with React 19
**What goes wrong:** `npx shadcn@latest add button` fails with peer dependency resolution errors.
**Why it happens:** Some Radix UI packages haven't published React 19-compatible versions. npm strict mode blocks install.
**How to avoid:** Use `--legacy-peer-deps` flag when adding components: `npx shadcn@latest add button --legacy-peer-deps`. Or configure `.npmrc` with `legacy-peer-deps=true`.
**Warning signs:** npm ERR! ERESOLVE during component installation.

### Pitfall 5: x402 SDK Assumes Express Middleware
**What goes wrong:** Developer tries to use `goatx402-sdk-server` (from PROJECT.md reference) and finds the package doesn't exist on npm.
**Why it happens:** The x402 ecosystem has multiple packages with overlapping names. The actual packages are `@x402/next`, `@x402/express`, `@x402/evm`, `@x402/core` (official Coinbase packages) or `x402-next`, `x402-express` (community packages).
**How to avoid:** Use `@x402/next` for the Next.js middleware approach (paymentProxy in middleware.ts) or build a mock API route for the Phase 1 spike. Do NOT search for `goatx402-sdk-server`.
**Warning signs:** "npm ERR! 404 Not Found" when trying to install the non-existent package.

### Pitfall 6: GOAT Testnet3 Not in Official x402 Network List
**What goes wrong:** The x402 facilitator at `x402.org` only supports Base Sepolia and Solana Devnet. GOAT Testnet3 (`eip155:48816`) is not listed.
**Why it happens:** x402 facilitator support is limited to specific networks. GOAT Network has its own x402 integration (GMPayer) that may use a different facilitator.
**How to avoid:** The Phase 1 spike should test: (1) whether `@x402/evm` can register a custom chain, and (2) mock the full flow without relying on the testnet facilitator. Flag this gap clearly for Phase 4 planning.
**Warning signs:** x402 facilitator returns errors about unsupported network when using `eip155:48816`.

### Pitfall 7: Convex Environment Variables
**What goes wrong:** App connects to wrong Convex deployment or fails to connect.
**Why it happens:** `NEXT_PUBLIC_CONVEX_URL` must match the Convex deployment URL from `npx convex dev`.
**How to avoid:** Run `npx convex dev` which auto-creates `.env.local` with the correct URL. Never hardcode the URL.
**Warning signs:** Convex client errors in console; "Convex deployment not found."

## Code Examples

Verified patterns from official sources:

### Convex Query with Index Lookup
```typescript
// Source: https://docs.convex.dev/database/reading-data/indexes/
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("builders")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.walletAddress)
      )
      .unique();
  },
});
```

### Convex Mutation with Upsert Pattern
```typescript
// Source: https://docs.convex.dev/functions/mutation-functions
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const completeStep = mutation({
  args: {
    walletAddress: v.string(),
    stepNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const builder = await ctx.db
      .query("builders")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", args.walletAddress)
      )
      .unique();

    if (builder) {
      const completedSteps = builder.completedSteps.includes(args.stepNumber)
        ? builder.completedSteps
        : [...builder.completedSteps, args.stepNumber];
      await ctx.db.patch(builder._id, {
        completedSteps,
        currentStep: Math.max(...completedSteps) + 1,
      });
    } else {
      await ctx.db.insert("builders", {
        walletAddress: args.walletAddress,
        completedSteps: [args.stepNumber],
        currentStep: args.stepNumber + 1,
      });
    }
  },
});
```

### Using Convex Query in React
```typescript
// Source: https://docs.convex.dev/quickstart/nextjs
"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function WizardPage({ walletAddress }: { walletAddress: string }) {
  const builder = useQuery(api.builders.getByWallet, { walletAddress });
  const completeStep = useMutation(api.builders.completeStep);

  const handleStepComplete = async (stepNumber: number) => {
    await completeStep({ walletAddress, stepNumber });
  };

  // builder is undefined while loading, null if not found
  const currentStep = builder?.currentStep ?? 0;
  const completedSteps = builder?.completedSteps ?? [];

  return (/* wizard UI */);
}
```

### RainbowKit Custom Chain Integration
```typescript
// Source: https://rainbowkit.com/docs/custom-chains
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { goatTestnet3 } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Hello GOAT",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [goatTestnet3],
  transports: {
    [goatTestnet3.id]: http("https://rpc.testnet3.goat.network"),
  },
  ssr: true,
});
```

### x402 Next.js Middleware (Reference for Spike)
```typescript
// Source: https://docs.cdp.coinbase.com/x402/quickstart-for-sellers
// middleware.ts (for reference -- spike will mock this)
import { paymentProxy, x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://www.x402.org/facilitator",
});

const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:48816", new ExactEvmScheme()); // GOAT Testnet3 -- untested

export const middleware = paymentProxy(
  {
    "/api/demo": {
      accepts: [{
        scheme: "exact",
        price: "$0.01",
        network: "eip155:48816",
        payTo: "0xYourAddress",
      }],
      description: "Hello GOAT demo transaction",
      mimeType: "application/json",
    },
  },
  server,
);

export const config = {
  matcher: ["/api/demo/:path*"],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion (package: framer-motion) | Motion (same package, rebranded) | Feb 2025 | Package name `framer-motion` still works; import paths unchanged. API is the same. |
| wagmi v2 | wagmi v3 | 2025 | Migration guide available; main change is config API updates |
| RainbowKit v1 (wagmi v1) | RainbowKit v2 (wagmi v2+) | 2024 | Uses `getDefaultConfig` instead of separate chain/wallet config |
| WalletConnect v1 | WalletConnect v2 (Reown) | 2024 | Requires project ID from dashboard.reown.com |
| shadcn-ui CLI | shadcn CLI (`npx shadcn@latest`) | 2024 | Package renamed from `shadcn-ui` to `shadcn` |
| x402 (goatx402-sdk-server) | @x402/next, @x402/express | 2025 | Official Coinbase packages; GOAT-specific package does not exist on npm |
| Convex with Pages Router | Convex with App Router | 2023 | ConvexClientProvider with "use client" is the standard pattern |

**Deprecated/outdated:**
- `goatx402-sdk-server`: This package name appears in PROJECT.md but does not exist on npm. The actual x402 ecosystem uses `@x402/next` (Coinbase official) or `x402-next` (Sei community fork). The spike should validate with `@x402/next`.
- `WalletConnect Cloud`: Now called Reown (https://dashboard.reown.com/). Same functionality, new branding.
- `npx shadcn-ui@latest`: Use `npx shadcn@latest` instead.

## Open Questions

1. **GOAT Testnet3 x402 facilitator**
   - What we know: The official x402 facilitator (`x402.org`) supports Base Sepolia and Solana Devnet only. GOAT Network has GMPayer which is x402-based.
   - What's unclear: Does GOAT Network run its own x402 facilitator? Is there a GOAT-specific SDK or endpoint for the hackathon?
   - Recommendation: The Phase 1 spike should attempt to register `eip155:48816` with `@x402/evm`'s `ExactEvmScheme`. If the facilitator rejects the chain, document the gap. Check if `@goathackbot` provides a facilitator URL with the merchant credentials. Mock the flow for Phase 1 regardless.

2. **`goatx402-sdk-server` package identity**
   - What we know: The package does not exist on npm. The import `GoatX402` from `goatx402-sdk-server` shown in PROJECT.md appears to be either (a) a private/unreleased package, (b) a placeholder name from hackathon documentation, or (c) an older name that was superseded.
   - What's unclear: Whether the hackathon will provide a specific GOAT x402 SDK or if builders are expected to use the standard `@x402/*` packages with GOAT chain config.
   - Recommendation: Build the spike with `@x402/next` and mock the GOAT-specific parts. If a GOAT-specific SDK surfaces later, adaptation should be straightforward since the API route handler shape is the same.

3. **WalletConnect Project ID**
   - What we know: Required for RainbowKit. Free registration at https://dashboard.reown.com/.
   - What's unclear: Whether the project already has one registered.
   - Recommendation: Register a new one during setup. Store in `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. Add `.env.example` with placeholder.

4. **Convex deployment for development**
   - What we know: `npx convex dev` creates a development deployment automatically.
   - What's unclear: Whether a Convex account is already set up.
   - Recommendation: `npx convex dev` will prompt for login/signup on first run. Follow the interactive setup.

## Sources

### Primary (HIGH confidence)
- [Next.js App Router docs](https://nextjs.org/docs/app/getting-started/installation) - Project setup, installation, App Router patterns
- [Convex Next.js Quickstart](https://docs.convex.dev/quickstart/nextjs) - Provider setup, schema, queries
- [Convex Schema docs](https://docs.convex.dev/database/schemas) - defineSchema, defineTable, validators
- [Convex Mutation docs](https://docs.convex.dev/functions/mutation-functions) - mutation definitions, ctx.db operations
- [Convex Index docs](https://docs.convex.dev/database/reading-data/indexes/) - withIndex query pattern
- [RainbowKit Installation](https://rainbowkit.com/docs/installation) - Provider setup, config, peer deps
- [RainbowKit Custom Chains](https://rainbowkit.com/docs/custom-chains) - defineChain integration
- [GOAT Network Quick Start](https://docs.goat.network/builders/quick-start) - Chain config, RPC, explorer
- [GOAT Network RPC](https://docs.goat.network/network/networks-rpc) - Network parameters, backup RPC
- [x402 Quickstart for Sellers](https://docs.cdp.coinbase.com/x402/quickstart-for-sellers) - @x402/next setup, middleware, facilitator
- [x402 Network Support](https://docs.cdp.coinbase.com/x402/network-support) - Supported chains (Base, Solana only)

### Secondary (MEDIUM confidence)
- [Motion AnimatePresence](https://motion.dev/docs/react-animate-presence) - mode="wait", exit animations
- [shadcn/ui Next.js setup](https://ui.shadcn.com/docs/installation/next) - Init command, component installation
- [wagmi SSR docs](https://wagmi.sh/react/installation) - ssr: true config for Next.js
- [Reown (WalletConnect) dashboard](https://dashboard.reown.com/) - Project ID registration

### Tertiary (LOW confidence)
- `goatx402-sdk-server` package existence - NOT FOUND on npm; treated as non-existent. The PROJECT.md reference may be aspirational or from pre-release hackathon docs.
- GOAT Network x402 facilitator endpoint - No official documentation found. GMPayer exists but its facilitator URL is undocumented.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are stable, well-documented, and widely used. Versions confirmed on npm.
- Architecture: HIGH - Provider patterns, schema design, and project structure follow official documentation exactly.
- Pitfalls: HIGH - SSR hydration, peer deps, and Convex dev environment issues are well-documented.
- x402 spike: LOW - The `goatx402-sdk-server` package does not exist. GOAT Testnet3 is not in the official x402 supported networks list. The spike must validate this gap or find the correct path.

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable stack; x402/GOAT findings may change sooner if hackathon SDK is released)
