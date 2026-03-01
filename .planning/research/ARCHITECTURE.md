# Architecture Patterns

**Domain:** Web3 onboarding wizard (hackathon tool)
**Researched:** 2026-02-28
**Overall Confidence:** MEDIUM (training data only -- no live verification of Convex or wagmi docs possible in this session)

## Recommended Architecture

Single-page Next.js App Router application with Convex real-time backend. The wizard is a client-rendered stepper component that orchestrates wallet connection (wagmi/viem), on-chain reads (viem public client), and Convex mutations/queries for persistent state. A shareable proof page is the only server-rendered route.

```
+------------------------------------------------------------------+
|                        Vercel (Next.js)                          |
|                                                                   |
|  /app                                                            |
|  +-- layout.tsx          (providers: Wagmi, Convex, QueryClient) |
|  +-- page.tsx            (wizard shell - client component)       |
|  +-- /proof/[wallet]/                                            |
|      +-- page.tsx        (shareable proof - server component)    |
|                                                                   |
|  /components                                                      |
|  +-- WizardShell.tsx     (step orchestrator)                     |
|  +-- StepWallet.tsx      (step 1: connect + network switch)     |
|  +-- StepIdentity.tsx    (step 2: ERC-8004 registration)        |
|  +-- StepPayments.tsx    (step 3: x402 merchant setup)          |
|  +-- StepTelegram.tsx    (step 4: telegram wiring)              |
|  +-- StepDemoTx.tsx      (step 5: demo transaction)             |
|  +-- Troubleshooter.tsx  (error detection panel)                 |
|  +-- ProofCard.tsx       (shareable proof display)               |
|                                                                   |
|  /convex                                                          |
|  +-- schema.ts           (table definitions)                     |
|  +-- auth.ts             (wallet-based auth functions)           |
|  +-- builders.ts         (progress + credential mutations)       |
|  +-- proof.ts            (public proof queries)                  |
+------------------------------------------------------------------+
         |                    |                     |
         v                    v                     v
   +-----------+      +-------------+      +-----------------+
   |  Convex   |      | GOAT RPC    |      | GOAT Explorer   |
   |  Cloud    |      | (Testnet3)  |      | (deep links)    |
   +-----------+      +-------------+      +-----------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Rendering |
|-----------|---------------|-------------------|-----------|
| **layout.tsx** | Mounts all providers (WagmiProvider, ConvexProvider, QueryClientProvider). No UI of its own. | All child components inherit providers | Server (shell) + Client (providers) |
| **WizardShell** | Tracks current step, reads completion status from Convex, renders active step + sidebar progress indicator. Manages overall flow. | Convex (query: builder progress), all Step components | Client |
| **StepWallet** | Wallet connect button, "no wallet?" guide, network detection + switch to Testnet3 (chain 48816). Writes wallet address to Convex on success. | wagmi hooks, Convex (mutation: create/update builder) | Client |
| **StepIdentity** | Shows ERC-8004 deep link to registration. Polls on-chain for agentId NFT ownership. Writes agentId to Convex on detection. | viem public client (read contract), Convex (mutation: save identity) | Client |
| **StepPayments** | Guides user to DM @goathackbot. Provides paste form for .env values (API URL, API key, API secret, merchant ID). Validates and encrypts before saving. | Convex (mutation: store credentials) | Client |
| **StepTelegram** | Generates DM payload, shows link to @goathackbot, polls or accepts user confirmation. | Convex (mutation: mark telegram complete) | Client |
| **StepDemoTx** | Executes canned x402 transaction via API route. Displays request/response, tx hash, explorer link. | Next.js API route (/api/demo-tx), Convex (mutation: save tx proof) | Client |
| **Troubleshooter** | Detects: wrong network, no funds, missing env vars, invalid callback URL, webhook errors. Renders contextual fix suggestions. | wagmi hooks (chain, balance), Convex (query: credentials status) | Client |
| **ProofCard** | Displays builder achievement: identity, last tx, payment receipt. Used in both wizard and proof page. | Convex (query: builder proof data) | Client (in wizard) / Server (in proof page) |
| **/api/demo-tx** | Server-side API route that creates x402 GoatX402 instance with builder's credentials, executes canned request, returns result. Credentials never leave server. | Convex (fetch credentials server-side), goatx402-sdk-server | Server (API route) |
| **/proof/[wallet]/page.tsx** | Public shareable page. Fetches builder proof from Convex, renders ProofCard with OG meta tags for social sharing. | Convex (query: public proof), ProofCard component | Server |

### Data Flow

#### Primary Flow: Builder Onboarding

```
Builder opens wizard
    |
    v
[1] WizardShell loads, queries Convex for existing progress (by wallet if previously connected)
    |
    v
[2] StepWallet: wagmi connect -> wallet address obtained
    |  - Mutation: convex/builders.createOrResume({ walletAddress })
    |  - Also checks chainId, prompts network switch if not 48816
    |
    v
[3] StepIdentity: User clicks deep link to ERC-8004 registration site
    |  - Poll loop: viem publicClient.readContract({ abi: ERC8004ABI, functionName: 'balanceOf', args: [walletAddress] })
    |  - On NFT detected: convex/builders.saveIdentity({ agentId, name })
    |
    v
[4] StepPayments: User DMs @goathackbot, pastes 4 .env values into form
    |  - Client-side validation (non-empty, URL format for API URL)
    |  - Mutation: convex/builders.storeCredentials({ apiUrl, apiKey, apiSecret, merchantId })
    |  - Credentials stored encrypted in Convex (see Security section)
    |
    v
[5] StepTelegram: User clicks generated Telegram DM link, confirms in wizard
    |  - Mutation: convex/builders.markTelegramComplete()
    |
    v
[6] StepDemoTx: Client calls /api/demo-tx with builder's wallet address
    |  - API route fetches credentials from Convex (internal action)
    |  - Creates GoatX402 instance, executes canned transaction
    |  - Returns: { txHash, explorerUrl, requestPayload, responsePayload }
    |  - Mutation: convex/builders.saveDemoTx({ txHash, completedAt })
    |
    v
[7] Proof page available at /proof/[walletAddress]
    - Query: convex/proof.getPublicProof({ walletAddress })
    - Returns: identity info, tx hash, completion timestamp
```

#### Secondary Flow: Troubleshooter Detection

```
Troubleshooter runs continuous checks (via wagmi hooks + Convex queries):

[A] Wrong network? -> wagmi useChainId() !== 48816 -> Show "Switch to GOAT Testnet3" button
[B] No funds?     -> viem getBalance(walletAddress) === 0n -> Show faucet link
[C] Missing creds? -> Convex query: builder.credentials incomplete -> Highlight Step 3
[D] Invalid URL?   -> Convex query: builder.credentials.apiUrl fails URL parse -> Show fix
[E] Tx failed?     -> /api/demo-tx returns error -> Parse error, show specific fix
```

#### Data Flow: Shareable Proof Page

```
External visitor hits /proof/[wallet]
    |
    v
Next.js server component fetches from Convex:
    convex/proof.getPublicProof({ walletAddress })
    |
    v
Returns public-safe data only:
    { displayName, agentId, lastTxHash, completedAt, explorerUrl }
    |
    v
Renders ProofCard + OG meta tags (for Twitter/Discord embeds)
    generateMetadata() sets og:title, og:description, og:image
```

## Convex Schema Design

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  builders: defineTable({
    walletAddress: v.string(),       // primary identifier (lowercased)

    // Step 1: Wallet
    chainId: v.optional(v.number()),
    connectedAt: v.optional(v.number()),

    // Step 2: Identity
    agentId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    identityVerifiedAt: v.optional(v.number()),

    // Step 3: Payments (encrypted)
    credentials: v.optional(v.object({
      apiUrl: v.string(),
      apiKey: v.string(),      // encrypted at rest
      apiSecret: v.string(),   // encrypted at rest
      merchantId: v.string(),
    })),
    credentialsSavedAt: v.optional(v.number()),

    // Step 4: Telegram
    telegramConfirmed: v.optional(v.boolean()),
    telegramConfirmedAt: v.optional(v.number()),

    // Step 5: Demo Tx
    demoTxHash: v.optional(v.string()),
    demoTxCompletedAt: v.optional(v.number()),

    // Overall
    currentStep: v.number(),         // 1-5
    completedAt: v.optional(v.number()),
  })
    .index("by_wallet", ["walletAddress"]),
});
```

**Key design decisions:**
- Single `builders` table. No normalization needed for a 5-step wizard with one entity type.
- `walletAddress` as the natural key (lowercased to prevent case mismatch issues with EVM addresses).
- `currentStep` tracks where the user left off for resume behavior.
- Credentials stored as a nested object. In production you would encrypt `apiKey` and `apiSecret` before storing. For a hackathon, Convex's transport encryption and access control may suffice, but the architecture should encrypt regardless (see Security section).
- Single index on `walletAddress` covers both authenticated queries and the public proof page lookup.

## Convex Authentication: Wallet-Based Custom Auth

Convex supports custom JWT-based authentication. The pattern for wallet-based auth:

```
1. User connects wallet via wagmi (client-side)
2. User signs a message (SIWE - Sign In With Ethereum) via wagmi's useSignMessage
3. Client sends { message, signature, walletAddress } to a Convex action
4. Convex action verifies signature using viem's verifyMessage
5. Convex action issues a JWT (or sets identity) for the session
6. Subsequent Convex queries/mutations use ctx.auth.getUserIdentity()
```

**Simpler hackathon alternative:** Skip SIWE entirely. Use Convex without authentication -- just pass `walletAddress` as a parameter to all queries/mutations and use it as the lookup key. This is acceptable because:
- No sensitive operations (no real funds, testnet only)
- The "worst case" is someone viewing/modifying another builder's wizard progress
- Saves significant implementation time

**Recommendation:** Use the simpler approach (walletAddress as parameter) for hackathon speed. Add SIWE later if the project continues post-hackathon.

## Provider Stack (layout.tsx)

The root layout must nest providers in the correct order. This is critical for Next.js App Router + Web3 apps.

```typescript
// app/layout.tsx (simplified)
// This is a server component that renders a client component wrapper

// app/providers.tsx ("use client")
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ConvexProvider client={convex}>
          {children}
        </ConvexProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
```

**Provider nesting order matters:**
1. **QueryClientProvider** (outermost) -- TanStack Query, used by wagmi internally
2. **WagmiProvider** -- wallet connection state, must wrap anything using wagmi hooks
3. **ConvexProvider** -- Convex real-time queries/mutations

wagmi v2 requires TanStack Query as a peer. ConvexProvider is innermost because it may need wallet state from wagmi for authenticated operations.

## Wagmi Configuration

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected, walletConnect } from 'wagmi/connectors';

export const goatTestnet3 = defineChain({
  id: 48816,
  name: 'GOAT Testnet3',
  nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet3.goat.network'] },
  },
  blockExplorers: {
    default: { name: 'GOAT Explorer', url: 'https://explorer.testnet3.goat.network' },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [goatTestnet3],
  connectors: [
    injected(),                          // MetaMask, Rabby, etc.
    // walletConnect({ projectId }),      // optional, adds QR code scanning
  ],
  transports: {
    [goatTestnet3.id]: http(),
  },
});
```

**Key points:**
- GOAT Testnet3 is a custom chain (not in viem's built-in chain registry). Must use `defineChain`.
- `injected()` connector covers MetaMask, Rabby, Coinbase Wallet browser extension -- all the wallets mentioned in the project spec.
- WalletConnect is optional and adds complexity (needs a projectId from WalletConnect Cloud). Skip for hackathon unless QR code mobile wallet scanning is needed.

## On-Chain Polling Pattern (Step 2: ERC-8004 Identity)

```typescript
// hooks/useIdentityPolling.ts
import { useReadContract } from 'wagmi';
import { goatTestnet3 } from '@/lib/wagmi';

const ERC8004_CONTRACT = '0x...'; // ERC-8004 registry address on Testnet3

export function useIdentityPolling(walletAddress: `0x${string}` | undefined) {
  const { data: balance, isLoading } = useReadContract({
    address: ERC8004_CONTRACT,
    abi: erc8004ABI,                    // minimal ABI: balanceOf, tokenOfOwnerByIndex
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    chainId: goatTestnet3.id,
    query: {
      enabled: !!walletAddress,
      refetchInterval: 5_000,           // poll every 5 seconds
    },
  });

  const hasIdentity = balance !== undefined && balance > 0n;

  return { hasIdentity, isLoading };
}
```

**Pattern:** wagmi's `useReadContract` with `refetchInterval` is the simplest polling mechanism. It uses TanStack Query under the hood, so you get caching, deduplication, and automatic cleanup for free.

**Alternative considered:** WebSocket subscription to contract events. Rejected because GOAT Testnet3 RPC may not support WebSocket, and polling every 5 seconds is perfectly adequate for a wizard where the user is actively waiting.

## Demo Transaction Execution (Step 5)

The demo transaction MUST execute server-side to keep credentials secure.

```
Client (StepDemoTx)                    Server (/api/demo-tx)
    |                                       |
    |-- POST { walletAddress } ------------>|
    |                                       |-- Fetch credentials from Convex
    |                                       |-- Create GoatX402 instance
    |                                       |-- Execute canned x402 request
    |                                       |-- Return { txHash, explorer, payload }
    |<-- Response --------------------------|
    |
    |-- Save proof to Convex (mutation)
```

```typescript
// app/api/demo-tx/route.ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const { walletAddress } = await req.json();

  // Fetch credentials from Convex (server-side, no auth needed for hackathon)
  const builder = await convex.query(api.builders.getByWallet, {
    walletAddress: walletAddress.toLowerCase()
  });

  if (!builder?.credentials) {
    return Response.json({ error: "No credentials found" }, { status: 400 });
  }

  // Execute demo transaction using goatx402-sdk-server
  const { GoatX402 } = await import('goatx402-sdk-server');
  const x402 = new GoatX402({
    apiUrl: builder.credentials.apiUrl,
    apiKey: builder.credentials.apiKey,
    apiSecret: builder.credentials.apiSecret,
    merchantId: builder.credentials.merchantId,
  });

  // Canned transaction execution...
  // Return result with tx hash and explorer link
}
```

**Why server-side:** The goatx402-sdk-server uses API keys and secrets. These must never be sent to the client. The Next.js API route acts as a thin server that fetches credentials from Convex and executes the transaction.

## Shareable Proof Page Architecture

```typescript
// app/proof/[wallet]/page.tsx
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Server-side metadata generation for social sharing
export async function generateMetadata({ params }: { params: { wallet: string } }) {
  const proof = await convex.query(api.proof.getPublicProof, {
    walletAddress: params.wallet.toLowerCase()
  });

  return {
    title: `${proof?.agentName ?? 'Builder'} is live on GOAT`,
    description: `Completed Hello GOAT onboarding with agent ${proof?.agentId}`,
    openGraph: {
      title: `${proof?.agentName ?? 'Builder'} is live on GOAT`,
      description: `Agent identity verified, demo tx: ${proof?.demoTxHash?.slice(0, 10)}...`,
      // og:image could be a dynamic OG image via /api/og if time permits
    },
  };
}

export default async function ProofPage({ params }: { params: { wallet: string } }) {
  const proof = await convex.query(api.proof.getPublicProof, {
    walletAddress: params.wallet.toLowerCase()
  });

  if (!proof) return <NotFound />;

  return <ProofCard proof={proof} />;
}
```

**Key decisions:**
- Server component for SEO and social card generation (OG tags render server-side)
- `ConvexHttpClient` for server-side Convex queries (not the real-time React client)
- Public query that returns ONLY safe-to-share fields (no credentials, no API keys)
- The proof page is the only SSR route; the wizard itself is entirely client-rendered

## Patterns to Follow

### Pattern 1: Step Completion as Convex Mutations

**What:** Each step completion triggers a Convex mutation that records progress. The wizard reads completion state from Convex, not local state.

**When:** Always. This is the core resume pattern.

**Why:** If the user closes the browser and comes back, they reconnect their wallet, Convex query fires with their wallet address, and the wizard resumes at their current step. No local storage needed.

```typescript
// convex/builders.ts
export const completeStep = mutation({
  args: {
    walletAddress: v.string(),
    step: v.number(),
    data: v.any(),  // step-specific data
  },
  handler: async (ctx, args) => {
    const builder = await ctx.db
      .query("builders")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress.toLowerCase()))
      .unique();

    if (!builder) throw new Error("Builder not found");

    // Update step-specific fields + advance currentStep
    await ctx.db.patch(builder._id, {
      ...args.data,
      currentStep: Math.max(builder.currentStep, args.step + 1),
    });
  },
});
```

### Pattern 2: Client-Side Step Gating

**What:** Steps are visible but locked until prerequisites are met. The user can see all 5 steps (progress transparency) but can only interact with the current step.

**When:** Wizard rendering.

**Why:** Single-page wizard requirement from PROJECT.md. Showing all steps gives a sense of progress and lets users see what is coming.

```typescript
// components/WizardShell.tsx
function WizardShell() {
  const { address } = useAccount();
  const builder = useQuery(api.builders.getByWallet,
    address ? { walletAddress: address.toLowerCase() } : "skip"
  );

  const currentStep = builder?.currentStep ?? 1;

  return (
    <div className="flex gap-8">
      <StepSidebar currentStep={currentStep} />
      <div className="flex-1">
        {currentStep === 1 && <StepWallet />}
        {currentStep === 2 && <StepIdentity />}
        {currentStep === 3 && <StepPayments />}
        {currentStep === 4 && <StepTelegram />}
        {currentStep === 5 && <StepDemoTx />}
        {builder?.completedAt && <CompletionCard proof={builder} />}
      </div>
      <Troubleshooter builder={builder} />
    </div>
  );
}
```

### Pattern 3: Optimistic Step Transitions

**What:** When a step completes, immediately show the next step in the UI while the Convex mutation is in flight.

**When:** After any step completion action.

**Why:** Convex mutations are fast (typically <100ms) but the user should never see a loading spinner between steps. Convex's `useMutation` with `optimisticUpdate` handles this natively.

### Pattern 4: Credential Isolation

**What:** Credentials (API keys, secrets) are written to Convex and only ever read server-side. The client never reads them back.

**When:** Step 3 (payments) and Step 5 (demo tx).

**Why:** Even on testnet, building the habit of credential isolation is important. The credentials query is an `internalQuery` (only callable from other Convex functions and actions, not from the client).

```typescript
// convex/builders.ts
// This query is INTERNAL -- not exposed to the client
export const getCredentials = internalQuery({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const builder = await ctx.db
      .query("builders")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress.toLowerCase()))
      .unique();
    return builder?.credentials ?? null;
  },
});

// Client-visible query returns everything EXCEPT credentials
export const getByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const builder = await ctx.db
      .query("builders")
      .withIndex("by_wallet", q => q.eq("walletAddress", args.walletAddress.toLowerCase()))
      .unique();
    if (!builder) return null;
    const { credentials, ...safe } = builder;
    return { ...safe, hasCredentials: !!credentials };
  },
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Credentials in Client State or localStorage

**What:** Putting API keys, secrets, or merchant IDs in React state, Zustand, localStorage, or cookies.

**Why bad:** Anyone can read localStorage. React DevTools expose state. Even on testnet, this builds dangerous habits and could leak credentials if the testnet transitions to mainnet.

**Instead:** Write credentials to Convex immediately, only read them server-side (via internalQuery or httpAction).

### Anti-Pattern 2: Multi-Page Wizard with Router Navigation

**What:** Using Next.js routes like `/step/1`, `/step/2`, etc. for wizard steps.

**Why bad:** Breaks the "all steps visible at once" requirement. Adds unnecessary route transitions. Makes the troubleshooter (which needs to see all steps) awkward to implement. URL-based step tracking fights with the Convex-based progress tracking.

**Instead:** Single page with conditional rendering based on `currentStep` from Convex.

### Anti-Pattern 3: Polling On-Chain State from the Server

**What:** Using a Convex scheduled function or cron to poll the blockchain for ERC-8004 identity.

**Why bad:** Adds complexity, costs Convex function invocations, and introduces latency. The user is sitting on the wizard page waiting -- the client should poll directly.

**Instead:** Client-side polling via wagmi's `useReadContract` with `refetchInterval`. When detected, write to Convex via mutation.

### Anti-Pattern 4: Using wagmi for Server-Side Chain Reads

**What:** Trying to use wagmi hooks in API routes or server components.

**Why bad:** wagmi hooks are React hooks -- they only work in client components. Server-side chain reads need a raw viem client.

**Instead:** Create a standalone viem `publicClient` for any server-side blockchain reads. Use wagmi hooks exclusively in client components.

## Security Considerations

### Credential Storage in Convex

For hackathon scope, Convex provides:
- Transport encryption (HTTPS to Convex Cloud)
- Access control (internalQuery prevents client-side reads)
- No direct database access (all reads go through defined functions)

For production, add application-level encryption:
- Encrypt `apiKey` and `apiSecret` with a server-side encryption key before storing
- Decrypt only in server-side actions when needed for transaction execution
- Store the encryption key as a Convex environment variable

### Wallet Address Validation

Always lowercase wallet addresses before storage and lookup. EVM addresses are case-insensitive but string comparison is not. Use `address.toLowerCase()` at every entry point.

### Public Proof Page Data Exposure

The proof query must ONLY return:
- `agentName`, `agentId` (public identity info)
- `demoTxHash` (transaction hashes are public on-chain anyway)
- `completedAt` (timestamp)
- `walletAddress` (already in the URL)

NEVER return: `credentials`, `apiKey`, `apiSecret`, `merchantId`.

## Directory Structure

```
/app
  layout.tsx                  # Root layout, imports Providers
  page.tsx                    # Main wizard page ("use client" or thin server wrapper)
  providers.tsx               # "use client" -- nests Wagmi, Convex, QueryClient
  /proof
    /[wallet]
      page.tsx                # Server component, shareable proof
  /api
    /demo-tx
      route.ts                # API route for server-side x402 execution

/components
  /wizard
    WizardShell.tsx           # Step orchestrator + layout
    StepSidebar.tsx           # Progress indicator (steps 1-5 with completion marks)
    StepWallet.tsx            # Step 1
    StepIdentity.tsx          # Step 2
    StepPayments.tsx          # Step 3
    StepTelegram.tsx          # Step 4
    StepDemoTx.tsx            # Step 5
    CompletionCard.tsx        # Post-completion summary
  /troubleshooter
    Troubleshooter.tsx        # Main troubleshooter panel
    checks.ts                 # Individual check functions
  /proof
    ProofCard.tsx             # Reusable proof display
  /ui
    Button.tsx                # Shared UI primitives
    Card.tsx
    Badge.tsx
    ...

/convex
  schema.ts                   # Table definitions
  builders.ts                 # Builder CRUD, step completion
  proof.ts                    # Public proof queries
  _generated/                 # Auto-generated by Convex

/hooks
  useIdentityPolling.ts       # ERC-8004 on-chain polling
  useNetworkCheck.ts          # Chain ID validation
  useBuilderProgress.ts       # Convex query wrapper for builder state

/lib
  wagmi.ts                    # Wagmi config + GOAT chain definition
  convex.ts                   # Convex client initialization
  constants.ts                # Contract addresses, chain config, faucet URLs
  abi/
    erc8004.ts                # ERC-8004 contract ABI (minimal)
```

## Scalability Considerations

| Concern | Hackathon (100 users) | Post-Hackathon (10K users) | Production (1M users) |
|---------|----------------------|---------------------------|----------------------|
| Convex throughput | Free tier handles it easily | Still within Convex Pro limits | Would need to evaluate Convex enterprise or consider migration |
| RPC polling | 100 clients x 1 req/5s = 20 rps, trivial | 10K x 1/5s = 2K rps, may need RPC provider upgrade | Need WebSocket events or indexer (The Graph, Ponder) |
| Proof page traffic | Static enough, Vercel edge cache | Add ISR (revalidate: 60) for caching | CDN + ISR, or pre-generate at completion time |
| Credential storage | Convex internalQuery sufficient | Add application-level encryption | Dedicated secrets manager (Vault, AWS Secrets Manager) |

## Build Order (Dependencies)

This is the critical section for roadmap phase structure.

```
Phase 1: Foundation
  [A] Next.js project setup + Convex init
  [B] Wagmi config + GOAT Testnet3 chain definition
  [C] Provider stack (layout.tsx + providers.tsx)
  [D] Convex schema + basic builder CRUD

  Dependencies: None (greenfield)
  Enables: Everything else

Phase 2: Wallet + Wizard Shell
  [E] WizardShell component (step orchestrator)
  [F] StepWallet (connect + network switch)
  [G] StepSidebar (progress indicator)
  [H] Builder progress query + resume logic

  Dependencies: Phase 1 (A, B, C, D)
  Enables: All subsequent steps, troubleshooter

Phase 3: Identity + Payments Steps
  [I] StepIdentity (ERC-8004 deep link + on-chain polling)
  [J] StepPayments (credential paste form + Convex storage)
  [K] useIdentityPolling hook

  Dependencies: Phase 2 (wallet must be connected first)
  Enables: Demo transaction (needs both identity and credentials)
  Note: Steps I and J can be built in parallel

Phase 4: Telegram + Demo Transaction
  [L] StepTelegram (DM link + confirmation)
  [M] /api/demo-tx route (server-side x402 execution)
  [N] StepDemoTx (execute + display results)

  Dependencies: Phase 3 (needs credentials for demo tx)
  Note: L can be built in parallel with M+N

Phase 5: Troubleshooter + Proof Page
  [O] Troubleshooter panel (all checks)
  [P] /proof/[wallet] page (server component)
  [Q] ProofCard component
  [R] OG meta tags for social sharing

  Dependencies: Phase 4 (needs all steps complete to test fully)
  Note: O and P+Q+R can be built in parallel
```

**Phase ordering rationale:**
1. Foundation must come first -- everything depends on providers and schema.
2. Wallet + Shell second because every subsequent step requires a connected wallet and the step orchestrator.
3. Identity + Payments third because the demo transaction needs both an ERC-8004 identity and x402 credentials.
4. Telegram + Demo Tx fourth because the demo tx is the climactic moment and needs all prior steps.
5. Troubleshooter + Proof last because they are enhancement/polish layers that observe state from all other steps.

## Sources

- Convex documentation (schema, queries, mutations, internalQuery pattern) -- training data, MEDIUM confidence
- wagmi v2 documentation (useReadContract, refetchInterval, connectors, createConfig) -- training data, MEDIUM confidence
- viem documentation (defineChain, publicClient, verifyMessage) -- training data, MEDIUM confidence
- Next.js App Router documentation (server components, API routes, generateMetadata) -- training data, HIGH confidence
- GOAT Network project context (PROJECT.md) -- direct source, HIGH confidence
- SIWE (Sign-In With Ethereum) specification -- training data, MEDIUM confidence

**Confidence notes:** All Convex and wagmi patterns are based on training data up to May 2025. Convex's API surface is stable but specific function signatures should be verified against current docs during implementation. wagmi v2 patterns are well-established and unlikely to have changed significantly.
