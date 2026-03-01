# Technology Stack

**Project:** Hello GOAT -- Onboarding Wizard
**Researched:** 2026-02-28
**Overall confidence:** MEDIUM (versions from training data, not live-verified; GOAT-specific SDKs LOW confidence)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.x (App Router) | Full-stack React framework | Mandated by project constraints. App Router gives server components for secure credential handling, API routes for x402 middleware, and native Vercel deployment. | HIGH |
| React | 19.x | UI library | Ships with Next.js 15. React 19 brings `use()` hook and server actions -- helpful for wallet state management and form submissions. | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for a project handling wallet addresses, chain IDs, and payment amounts. Catches mismatched types at compile time. | HIGH |

### Backend / Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Convex | latest (1.x) | Backend-as-a-service (DB + functions + real-time) | Mandated by project constraints. Real-time subscriptions are perfect for polling builder progress and credential status. Serverless functions handle x402 verification without a separate backend. | HIGH |
| `convex-dev` | latest | Convex CLI + dev server | Required for local development and schema management. | HIGH |

### Wallet Connection

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| wagmi | 2.x | React hooks for Ethereum | Industry standard for wallet connection in React apps. Provides `useConnect`, `useAccount`, `useSwitchChain`, `useWriteContract` hooks. Handles MetaMask, Rabby, Coinbase Wallet, Rainbow natively. | HIGH |
| viem | 2.x | Low-level EVM client | wagmi's transport layer. Type-safe, tree-shakeable. Use for direct RPC calls, transaction encoding, and custom chain definitions (GOAT Testnet3). | HIGH |
| @rainbow-me/rainbowkit | 2.x | Wallet connection UI modal | Pre-built "Connect Wallet" modal with chain switching UI. Saves building custom wallet selection UI. Integrates directly with wagmi. Supports "wrong network" detection out of the box. | HIGH |

**Why not alternatives:**

| Rejected | Why |
|----------|-----|
| ethers.js v6 | wagmi/viem is the modern standard for React apps. ethers.js lacks React hooks, requires more boilerplate, and has a larger bundle size. |
| web3.js | Legacy library. Larger bundle, less type-safe, weaker React integration. |
| ConnectKit (Family) | Good alternative to RainbowKit but smaller ecosystem. RainbowKit has better docs and wider adoption. |
| Privy / Dynamic | Overkill for wallet-only auth. These add email/social login which is explicitly out of scope. Adds complexity and vendor lock-in. |
| WalletConnect v2 (standalone) | RainbowKit includes WalletConnect support automatically. No need to integrate separately. |

### GOAT Network / x402 / ERC-8004

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| goatx402-sdk-server | latest | x402 payment middleware | Referenced directly in PROJECT.md. Provides Express-style middleware for 402 payment verification. Will be used in Next.js API routes. | LOW -- GOAT-specific, cannot verify version or API |
| Custom chain definition (viem) | N/A | GOAT Testnet3 chain config | viem allows defining custom chains with `defineChain()`. Required since GOAT Testnet3 (chain ID 48816) is not in viem's built-in chain list. | HIGH |
| ERC-8004 contract ABI | N/A | Agent identity registration | Interact directly via viem/wagmi `useWriteContract` and `useReadContract`. The contract is an ERC-721 extension -- standard NFT interaction patterns apply. | MEDIUM |

**Important notes on GOAT-specific SDKs:**

- `goatx402-sdk-server` is referenced in PROJECT.md with specific import patterns. Treat the PROJECT.md code snippet as the source of truth for its API.
- ERC-8004 interaction will likely be direct contract calls via viem, not a dedicated SDK. Need the contract address and ABI from GOAT docs.
- The x402 flow is server-side (API route returns 402, client pays, server verifies). The SDK middleware handles the server side.

### UI / Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | Fast iteration for hackathon. No component library overhead. Works natively with Next.js. v4 uses Rust-based engine (Lightning CSS) and a CSS-first config approach. | HIGH |
| shadcn/ui | latest | UI component primitives | Copy-paste component library built on Radix UI + Tailwind. Gives polished Stepper, Card, Button, Dialog, Toast components without a heavy dependency. Perfect for wizard UI. | HIGH |
| Radix UI (primitives) | latest | Accessible headless components | Underlies shadcn/ui. Provides Dialog (for "no wallet?" flow), Tooltip (for help text), Accordion (for troubleshooter). | HIGH |
| lucide-react | latest | Icon library | Default icon set for shadcn/ui. Consistent, tree-shakeable. | HIGH |
| sonner | latest | Toast notifications | Best-in-class toast library. Used for transaction confirmations, error alerts, copy-to-clipboard feedback. Default toast in shadcn/ui. | HIGH |

**Why not alternatives:**

| Rejected | Why |
|----------|-----|
| Chakra UI | Heavier runtime, different styling paradigm. Would conflict with Tailwind. |
| Material UI (MUI) | Way too heavy for a wizard app. Bundle size matters for time-to-first-success. |
| Ant Design | Enterprise-focused, not Web3 aesthetic. |
| Mantine | Good library but shadcn/ui gives more control with less dependency weight. |
| CSS Modules | Slower to iterate than Tailwind for hackathon pace. |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Convex React hooks | (included with convex) | Server state | `useQuery()` and `useMutation()` for all persisted data (builder progress, credentials). Real-time by default. | HIGH |
| wagmi hooks | (included with wagmi) | Wallet state | `useAccount()`, `useChainId()`, etc. Already reactive. No additional state management needed for wallet data. | HIGH |
| React `useState` / `useReducer` | (built-in) | Local UI state | Wizard step tracking, form state, UI toggles. Simple enough that Zustand/Jotai would be overhead. | HIGH |
| nuqs | 2.x | URL search params state | Sync wizard step to URL params so users can share links to specific steps. Lightweight, Next.js App Router compatible. | MEDIUM |

**Why not Zustand, Jotai, Redux:**

The wizard's state is either server-owned (Convex) or wallet-owned (wagmi). The remaining local state (current step, form values, UI toggles) is trivially handled by React built-ins. Adding a client state library would be premature abstraction.

### Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | 9.x | Linting | Flat config format. Next.js includes `eslint-config-next`. | HIGH |
| Prettier | 3.x | Code formatting | Consistency. Use `prettier-plugin-tailwindcss` for class sorting. | HIGH |
| @tanstack/react-query | 5.x | Async state (optional) | Only if needed for non-Convex async operations (e.g., polling ERC-8004 registration status via RPC). wagmi already uses TanStack Query internally. | MEDIUM |

### Deployment / Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Hosting platform | Mandated by project constraints. Zero-config Next.js deployment. | HIGH |
| Vercel Environment Variables | N/A | Secret management | Store Convex deployment URL and any server-side keys. Never expose x402 API keys to client. | HIGH |
| Convex Cloud | N/A | Backend hosting | Convex deploys its own backend. Free tier is sufficient for hackathon. | HIGH |

## Custom Chain Definition

The GOAT Testnet3 chain must be defined manually since it is not in viem's default chain list:

```typescript
// lib/chains.ts
import { defineChain } from 'viem'

export const goatTestnet3 = defineChain({
  id: 48816,
  name: 'GOAT Testnet3',
  nativeCurrency: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet3.goat.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GOAT Explorer',
      url: 'https://explorer.testnet3.goat.network',
    },
  },
  testnet: true,
})

// Known token addresses on GOAT Testnet3
export const GOAT_TOKENS = {
  USDC: '0x29d1ee93e9ecf6e50f309f498e40a6b42d352fa1' as const,
  USDT: '0xdce0af57e8f2ce957b3838cd2a2f3f3677965dd3' as const,
}
```

## Convex + Wallet Auth Pattern

Convex does not have built-in wallet auth. The recommended approach:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  builders: defineTable({
    walletAddress: v.string(), // lowercase, checksummed
    currentStep: v.number(),   // 1-5
    stepsCompleted: v.array(v.number()),
    // Credential storage (encrypted or hashed)
    x402ApiUrl: v.optional(v.string()),
    x402MerchantId: v.optional(v.string()),
    agentId: v.optional(v.string()),
    lastTxHash: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_wallet', ['walletAddress']),
})
```

**Auth approach:** Use wallet signature verification (Sign-In with Ethereum / EIP-4361 pattern). The client signs a message, the Convex function verifies the signature using viem's `verifyMessage`. This avoids needing Convex's built-in auth providers.

## x402 Integration Pattern

The x402 SDK is server-side only. In Next.js App Router:

```typescript
// app/api/generate/route.ts
import { GoatX402 } from 'goatx402-sdk-server'

// Initialize outside handler for connection reuse
const x402 = new GoatX402({
  apiUrl: process.env.GOATX402_API_URL!,
  apiKey: process.env.GOATX402_API_KEY!,
  apiSecret: process.env.GOATX402_API_SECRET!,
  merchantId: process.env.GOATX402_MERCHANT_ID!,
})

export async function GET(request: Request) {
  // x402 middleware pattern adapted for Next.js route handlers
  // The SDK's Express middleware needs to be adapted or used differently
  // in Next.js App Router route handlers
}
```

**Note:** The PROJECT.md shows Express-style `app.use()` middleware. Next.js App Router uses route handlers, not Express middleware. The x402 SDK may need wrapping to work with Next.js `Request`/`Response` objects. This is a potential friction point -- flag for Phase-specific research.

## Installation

```bash
# Initialize Next.js project
npx create-next-app@latest hello-goat --typescript --tailwind --eslint --app --src-dir

# Core framework
npm install convex

# Wallet connection
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query

# UI components (shadcn/ui is added via CLI, not npm)
npx shadcn@latest init
npx shadcn@latest add button card dialog input label progress tabs toast accordion badge separator

# Additional UI
npm install lucide-react sonner

# GOAT-specific
npm install goatx402-sdk-server

# URL state (optional)
npm install nuqs

# Dev dependencies
npm install -D convex prettier prettier-plugin-tailwindcss
```

## Version Verification Needed

The following versions could not be live-verified due to tool restrictions. Before starting development, verify:

| Package | Assumed Version | Verify Command |
|---------|----------------|----------------|
| next | 15.x | `npm info next version` |
| wagmi | 2.x | `npm info wagmi version` |
| viem | 2.x | `npm info viem version` |
| convex | 1.x | `npm info convex version` |
| @rainbow-me/rainbowkit | 2.x | `npm info @rainbow-me/rainbowkit version` |
| goatx402-sdk-server | unknown | `npm info goatx402-sdk-server version` |
| tailwindcss | 4.x | `npm info tailwindcss version` |

**Critical:** The `goatx402-sdk-server` package name is taken directly from PROJECT.md. Verify it exists on npm. If not, check the GOAT docs for the correct package name. This is the highest-risk dependency.

## Sources

- PROJECT.md -- Primary source for GOAT-specific SDKs, chain config, and x402 patterns
- Training data (May 2025 cutoff) -- wagmi, viem, Next.js, Convex, RainbowKit, shadcn/ui, Tailwind CSS ecosystem knowledge
- No live verification was possible for this research session

## Confidence Notes

| Area | Confidence | Reason |
|------|------------|--------|
| Next.js + React + TypeScript | HIGH | Mature, stable ecosystem. Versions well-known. |
| wagmi + viem + RainbowKit | HIGH | Industry standard for React + EVM. API is stable at v2. |
| Convex | HIGH | Well-documented BaaS. React integration is straightforward. |
| Tailwind + shadcn/ui | HIGH | Dominant styling stack for React apps. |
| goatx402-sdk-server | LOW | Only source is PROJECT.md snippet. Cannot verify package exists on npm, API surface, or version. |
| ERC-8004 contract interaction | LOW | No ABI or contract address available. Need GOAT docs. |
| Wallet auth in Convex | MEDIUM | Pattern is well-known (SIWE/EIP-4361) but Convex-specific implementation details need verification. |
| x402 + Next.js App Router compatibility | LOW | SDK shows Express middleware pattern. May not work directly with Next.js route handlers. Needs investigation. |
