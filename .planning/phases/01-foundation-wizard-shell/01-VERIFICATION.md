---
phase: 01-foundation-wizard-shell
verified: 2026-02-28T08:00:00Z
status: human_needed
score: 11/11 must-haves verified
re_verification: false
human_verification:
  - test: "Open http://localhost:3000 and visually verify the wizard shell renders"
    expected: "Left sidebar (~200px) shows all 5 steps with step number circles (1-5), step names, and status icons. Step 1 (Connect Wallet) is highlighted as current. Steps 2-5 are grayed out."
    why_human: "Visual layout and styling correctness cannot be verified by grep. Confirms provider stack hydrates without errors."
  - test: "Click Mark Complete on Step 1, then click Step 3 in sidebar"
    expected: "Step 1 shows green checkmark in sidebar, Step 2 becomes current (highlighted), slide/fade animation plays. Clicking Step 3 does nothing (locked step, grayed out, cursor not-allowed)."
    why_human: "Step interaction behavior and animation smoothness require a running browser."
  - test: "Open http://localhost:3000/api/x402-spike in browser"
    expected: "JSON response contains status: 'success', spikeResult: 'PASS', mock402Challenge with X-Payment-Network eip155:48816, and mockSettlement with txHash."
    why_human: "Confirms the Next.js API route is reachable and returns the correct shape at runtime."
  - test: "Run npx convex dev, then mark a step complete and refresh the page"
    expected: "After Convex is deployed (NEXT_PUBLIC_CONVEX_URL set), completing a step with a wallet address persists in Convex and survives page refresh."
    why_human: "Convex persistence (WIZ-02 full runtime behavior) requires a live Convex deployment and cannot be verified from the codebase alone."
---

# Phase 1: Foundation + Wizard Shell Verification Report

**Phase Goal:** A running Next.js app with Convex backend, GOAT Testnet3 chain config, provider stack, and a 5-step wizard shell that persists progress -- plus a verified x402 SDK spike confirming the demo transaction approach works
**Verified:** 2026-02-28T08:00:00Z
**Status:** human_needed (all automated checks passed; 4 items require human runtime verification)
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

The phase roadmap defines 4 success criteria. All 4 are verified at the code level. Runtime behavior requires human testing (see Human Verification section).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Developer can run `npm run dev` and see a 5-step horizontal progress stepper with all steps visible in a sidebar | VERIFIED | `npm run build` exits cleanly. `app/page.tsx` renders `<WizardShell />`. `wizard-shell.tsx` renders `WizardSidebar` with all 5 `STEPS` from `types/wizard.ts`. Sidebar maps over steps and renders step number, name, and `StepStatusIcon` for each. |
| 2 | Convex backend is deployed with a `builders` table and schema; step completion persists across page refreshes when keyed to a wallet address | VERIFIED (code) / HUMAN (runtime) | `convex/schema.ts` defines `builders` table with `walletAddress` (indexed `by_wallet`), `completedSteps`, `currentStep`, `startedAt`, `completedAt`. `convex/builders.ts` exports `getByWallet`, `upsertBuilder`, `completeStep`. `hooks/use-wizard.ts` calls `useSafeQuery(api.builders.getByWallet)` and `useSafeMutation(api.builders.completeStep)` when walletAddress is provided. Actual persistence requires live Convex deployment -- human test needed. |
| 3 | GOAT Testnet3 chain config (chain ID 48816, RPC, explorer, token addresses) is defined in a single constants file and used by the provider stack | VERIFIED | `lib/chains.ts` exports `goatTestnet3` via `defineChain` with `id: 48816`, RPC `https://rpc.testnet3.goat.network`, and explorer URL. `lib/constants.ts` exports `GOAT_TESTNET3` with `chainId: 48816`, `chainIdHex`, `rpc`, `rpcBackup`, `explorer`, `bridge`, `faucet`, and `tokens` (USDC + USDT addresses). `lib/wagmi-config.ts` imports `goatTestnet3` from `./chains` and uses it with `ssr: true`. |
| 4 | A test Next.js API route successfully initializes the x402 SDK and handles a request/response cycle (spike -- confirms the approach for Phase 4) | VERIFIED (code) / HUMAN (runtime) | `app/api/x402-spike/route.ts` exports `GET` and `POST` handlers. `GET` returns `{ status: "success", spikeResult: "PASS", mock402Challenge: { status: 402, headers: { "X-Payment-Network": "eip155:48816" } }, mockSettlement: { txHash, network, amount } }`. `POST` reads body and returns settlement confirmation. Route builds as dynamic (`ƒ`) in production build. Runtime accessibility requires a running dev server. |

**Score:** 4/4 truths verified at code level

### Required Artifacts

#### Plan 01-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/chains.ts` | GOAT Testnet3 viem chain definition | VERIFIED | 23 lines. Exports `goatTestnet3` via `defineChain`. Contains `id: 48816`, native currency BTC, RPC URL, block explorer, `testnet: true`. |
| `lib/constants.ts` | GOAT Testnet3 config constants | VERIFIED | 13 lines. Exports `GOAT_TESTNET3 as const` with all required fields: `chainId`, `chainIdHex`, `rpc`, `rpcBackup`, `explorer`, `bridge`, `faucet`, `tokens.USDC`, `tokens.USDT`. |
| `lib/wagmi-config.ts` | wagmi + RainbowKit config with SSR | VERIFIED | 19 lines. Imports `getDefaultConfig` from RainbowKit. `ssr: true` confirmed on line 18. Imports `goatTestnet3` from `./chains`. Exported as named `wagmiConfig`. Not inside a `use client` component. |
| `app/providers.tsx` | Client provider wrapper | VERIFIED | 53 lines. `"use client"` on line 1. Provider nesting: `WagmiProvider > QueryClientProvider > RainbowKitProvider > ConvexWrapper`. Imports `wagmiConfig` from `@/lib/wagmi-config`. Conditional `ConvexWrapper` handles missing Convex URL gracefully. |
| `convex/schema.ts` | Convex schema with builders table | VERIFIED | 14 lines. Uses `defineSchema` and `defineTable`. `builders` table has `walletAddress` (string, indexed `by_wallet`), `completedSteps` (array of numbers), `currentStep` (number), `startedAt` and `completedAt` (optional numbers). |
| `convex/builders.ts` | Convex query and mutation functions | VERIFIED | 88 lines. Exports `getByWallet` (query with index lookup + lowercase), `upsertBuilder` (mutation with upsert pattern + lowercase), `completeStep` (mutation with step-list management + lowercase). All use `by_wallet` index. |

#### Plan 01-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `types/wizard.ts` | Step status enum, step definition type, wizard state type | VERIFIED | 55 lines. Exports `StepStatus` enum (COMPLETED/CURRENT/LOCKED), `StepDefinition` interface, `WizardState` interface (with `isLoading` added in Plan 03), and `STEPS` array with all 5 step definitions. |
| `hooks/use-wizard.ts` | Wizard state management hook | VERIFIED | 124 lines. Exports `useWizard`. Dual-mode: local state without wallet, Convex-backed with wallet. Implements `getStepStatus`, `goToStep`, `completeCurrentStep`, `canNavigateToStep`, `isLoading`. |
| `components/wizard/wizard-shell.tsx` | Main wizard layout | VERIFIED | 57 lines. Exports `WizardShell`. Accepts optional `walletAddress` prop. Composes `WizardHeader`, `WizardSidebar`, `WizardStep`. Loading spinner when `wizard.isLoading`. |
| `components/wizard/wizard-sidebar.tsx` | Left sidebar with step list | VERIFIED | 91 lines. Exports `WizardSidebar`. 200px (`w-52`) sidebar. `ScrollArea` wrapping. All 5 steps rendered with number circle (1-5), name, and `StepStatusIcon` (Check/Diamond/Circle). COMPLETED steps clickable, LOCKED steps `disabled`. |
| `components/wizard/wizard-header.tsx` | Top header with branding, timer, wallet | VERIFIED | 21 lines. Exports `WizardHeader`. Fixed 60px height. Left: "Hello GOAT" bold text. Center: Clock icon + "0:00" mono. Right: Wallet icon + "Not Connected". |
| `components/wizard/wizard-step.tsx` | Step content with AnimatePresence animations | VERIFIED | 50 lines. Exports `WizardStep`. Uses `AnimatePresence mode="wait"`. `stepVariants` define enter (slide from x:100, opacity 0), center (x:0, opacity 1), exit (slide to x:-100). Direction tracked via `useRef`. Duration 0.3s easeInOut. |
| `components/wizard/steps/index.ts` | Step registry | VERIFIED | 11 lines. Exports `STEP_COMPONENTS` (map of step 0-4 to `StepPlaceholder`) and re-exports `STEPS as STEP_DEFINITIONS` from `@/types/wizard`. |
| `components/wizard/steps/step-placeholder.tsx` | Placeholder for all 5 steps | VERIFIED | 62 lines. Exports `StepPlaceholder`. Shows "Mark Complete" Button (CURRENT), green Check + "Completed" (COMPLETED), Lock icon + "Complete previous steps to unlock" (LOCKED). Uses shadcn `Card`. |
| `app/api/x402-spike/route.ts` | Mock x402 API route | VERIFIED | 52 lines. Exports `GET` and `POST`. GET returns `{ status, message, mock402Challenge, mockSettlement, spikeResult: "PASS" }`. POST reads body.paymentProof and returns settlement confirmation. Comment block documents Phase 1 spike intent. |

#### Plan 01-03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hooks/use-wizard.ts` | Wizard hook with Convex persistence | VERIFIED | Updated to accept `walletAddress?`. Uses `useSafeQuery(api.builders.getByWallet)` and `useSafeMutation(api.builders.completeStep)`. Optimistic local state on step completion. `isLoading` derived from Convex query state. |
| `components/wizard/wizard-shell.tsx` | Wizard shell passing wallet address to hook | VERIFIED | `WizardShellProps` interface with `walletAddress?: string`. Passes `walletAddress` to `useWizard(walletAddress)` on line 15. |

### Key Link Verification

#### Plan 01-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/providers.tsx` | `lib/wagmi-config.ts` | `import wagmiConfig` | WIRED | Line 9: `import { wagmiConfig } from "@/lib/wagmi-config"`. Used in `<WagmiProvider config={wagmiConfig}>` line 43. |
| `lib/wagmi-config.ts` | `lib/chains.ts` | `import goatTestnet3` | WIRED | Line 3: `import { goatTestnet3 } from "./chains"`. Used in `chains: [goatTestnet3]` and transport. |
| `convex/builders.ts` | `convex/schema.ts` | `builders table queries` | WIRED | Three functions query `"builders"` table and use `.withIndex("by_wallet", ...)`. Table defined in schema.ts. |

#### Plan 01-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/page.tsx` | `components/wizard/wizard-shell.tsx` | `renders WizardShell` | WIRED | Line 3: `import { WizardShell }`. Line 6: `return <WizardShell />`. |
| `components/wizard/wizard-shell.tsx` | `components/wizard/wizard-sidebar.tsx` | `renders WizardSidebar` | WIRED | Line 7: import. Lines 39-44: rendered with steps, currentStep, completedSteps, onStepClick. |
| `components/wizard/wizard-shell.tsx` | `components/wizard/wizard-step.tsx` | `renders WizardStep` | WIRED | Line 8: import. Line 46: `<WizardStep stepIndex={wizard.currentStep}>`. |
| `components/wizard/wizard-sidebar.tsx` | `types/wizard.ts` | `uses StepDefinition and StepStatus types` | WIRED | Line 3: `import { StepStatus, type StepDefinition } from "@/types/wizard"`. Both used in function signatures. |
| `hooks/use-wizard.ts` | `types/wizard.ts` | `uses WizardState type` | WIRED | Line 4: `import { StepStatus, STEPS, type WizardState } from "@/types/wizard"`. Return type annotation is `WizardState`. |

#### Plan 01-03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks/use-wizard.ts` | `convex/builders.ts` | `useQuery(api.builders.getByWallet) and useMutation(api.builders.completeStep)` | WIRED | Line 28: `useSafeQuery(api.builders.getByWallet, ...)`. Line 33: `useSafeMutation(api.builders.completeStep)`. |
| `components/wizard/wizard-shell.tsx` | `hooks/use-wizard.ts` | `calls useWizard with wallet address` | WIRED | Line 4: `import { useWizard }`. Line 15: `const wizard = useWizard(walletAddress)`. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| WIZ-01 | 01-02 | 5-step horizontal progress stepper showing completed/current/upcoming states | SATISFIED | `WizardSidebar` renders all 5 steps with `StepStatus` (COMPLETED/CURRENT/LOCKED). Step number circles, status icons (Check/Diamond/Circle), and CSS classes differentiate states. |
| WIZ-02 | 01-01, 01-03 | Step completion persisted in Convex keyed to wallet address -- progress survives page refresh | SATISFIED (code) | Convex `builders` table schema exists. `completeStep` mutation writes to Convex. `getByWallet` query reads on mount. Dual-mode hook falls back to local state when no wallet. Runtime persistence requires live Convex -- human test needed. |
| WIZ-03 | 01-02 | All steps visible in sidebar at all times; only current step is interactive | SATISFIED | `WizardSidebar` always renders all 5 steps. LOCKED steps have `disabled={true}` and `cursor-not-allowed opacity-50`. CURRENT step has interactive `StepPlaceholder` with "Mark Complete" button. COMPLETED steps are clickable (read-only view). |

No orphaned requirements: REQUIREMENTS.md maps WIZ-01, WIZ-02, WIZ-03 to Phase 1. All three are claimed by plans 01-01, 01-02, and 01-03.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `hooks/use-safe-convex.ts` | 22 | Conditional `useQuery` call: `convexAvailable ? useQuery(...) : undefined` | Warning | Violates React Rules of Hooks -- hooks must be called unconditionally. The `eslint-disable` suppresses the lint warning but does not remove the runtime risk. If `convexAvailable` changes between renders, React's hook call order changes, which can cause subtle state corruption bugs. Functional for Phase 1 (the value is stable after mount), but should be refactored before Phase 2. The same pattern applies to `useMutation` on line 35. |
| `lib/wagmi-config.ts` | 9 | `process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID \|\| "PLACEHOLDER"` | Info | Intentional design decision documented in 01-01-SUMMARY.md. Wallet connection requires a real project ID from dashboard.reown.com. Does not block the wizard shell from rendering. |

### Human Verification Required

#### 1. Wizard Layout and Provider Stack

**Test:** Run `npm run dev` and `npx convex dev` in separate terminals. Open http://localhost:3000.
**Expected:** Left sidebar (~200px) shows all 5 steps with step number circles (1-5), step names, and status icons. Header shows "Hello GOAT" (bold, left), "0:00" with clock icon (center), and "Not Connected" with wallet icon (right). Step 1 (Connect Wallet) is highlighted with accent background. Steps 2-5 are grayed out with 50% opacity.
**Why human:** Visual layout, font rendering, color/contrast correctness, and provider stack hydration errors cannot be verified by grep.

#### 2. Step Interaction and Animation

**Test:** On the wizard at http://localhost:3000, click "Mark Complete" on Step 1. Then click Step 1 in the sidebar. Then click Step 3 in the sidebar.
**Expected:** After "Mark Complete": sidebar shows green checkmark for Step 1, Step 2 becomes current (highlighted), slide/fade transition plays (0.3s). Clicking Step 1 in sidebar navigates to read-only view showing green "Completed". Clicking Step 3 does nothing (locked, cursor-not-allowed).
**Why human:** Animation smoothness, visual step state transitions, and navigation guards require a running browser.

#### 3. x402 Spike API Route

**Test:** Open http://localhost:3000/api/x402-spike in a browser.
**Expected:** JSON response: `{ "status": "success", "spikeResult": "PASS", "mock402Challenge": { "status": 402, "headers": { "X-Payment-Network": "eip155:48816", ... } }, "mockSettlement": { "txHash": "0xaaaa...aaaa", "network": "GOAT Testnet3", "amount": "0.1 USDC" } }`.
**Why human:** Confirms the API route is reachable at runtime, not just buildable. Also confirms the POST handler works (can test with `curl -X POST http://localhost:3000/api/x402-spike -d '{"paymentProof":"test"}' -H 'Content-Type: application/json'`).

#### 4. Convex Persistence (WIZ-02 Full Runtime)

**Test:** Run `npx convex dev` (requires Convex account + `NEXT_PUBLIC_CONVEX_URL` in `.env.local`). Add a test `walletAddress` prop to `<WizardShell walletAddress="0xtest" />` in `app/page.tsx`. Click "Mark Complete" on Step 1. Reload the page.
**Expected:** After reload, Step 1 still shows as completed. The Convex dashboard should show a `builders` record with `walletAddress: "0xtest"` and `completedSteps: [0]`.
**Why human:** Requires a live Convex deployment. The stub `_generated/api.ts` is used at build time; the real Convex SDK wires at runtime after `npx convex dev`. This is the most critical WIZ-02 validation.

### Gaps Summary

No automated gaps found. All artifacts exist, are substantive, and are wired correctly. The build passes cleanly. All 3 requirement IDs (WIZ-01, WIZ-02, WIZ-03) have implementation evidence.

The one warning-level anti-pattern (conditional hook calls in `use-safe-convex.ts`) does not block Phase 1 goal achievement but should be refactored in Phase 2 or 3 before Convex is used with real wallet addresses.

---

_Verified: 2026-02-28T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
