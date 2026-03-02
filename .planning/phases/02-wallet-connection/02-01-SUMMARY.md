---
phase: 02-wallet-connection
plan: 01
subsystem: ui
tags: [wagmi, rainbowkit, wallet-connect, erc20, viem, react, tailwind]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Wizard shell, stepper, Convex persistence, WagmiProvider + RainbowKitProvider"
provides:
  - "StepConnectWallet component with full wallet onboarding (connect, switch network, view balances)"
  - "useTimer hook for elapsed time from startedAt timestamp"
  - "ERC-20 ABI (balanceOf, decimals) in lib/abi.ts"
  - "WizardState.startedAt and setStartedAt for timer persistence via Convex"
  - "Wallet address wired through useAccount -> useWizard for Convex step persistence"
  - "WizardHeader showing real wallet address, chain name, and running timer"
affects: [03-agent-identity, 04-payment-setup]

# Tech tracking
tech-stack:
  added: []
  patterns: [wagmi-hooks-in-step-components, conditional-ui-states-per-connection-status, erc20-balance-reading]

key-files:
  created:
    - components/wizard/steps/step-connect-wallet.tsx
    - hooks/use-timer.ts
    - lib/abi.ts
  modified:
    - components/wizard/steps/index.ts
    - components/wizard/wizard-header.tsx
    - components/wizard/wizard-shell.tsx
    - hooks/use-wizard.ts
    - types/wizard.ts
    - convex/builders.ts

key-decisions:
  - "Used BigInt() constructor instead of 0n literal for ES target compatibility"
  - "Hardcoded 6 decimals for USDC/USDT rather than calling decimals() on-chain (standard stablecoin convention)"
  - "WizardShell no longer accepts walletAddress prop -- uses useAccount() directly for cleaner architecture"
  - "Timer starts on Continue click (not on wallet connect) to track active wizard time"

patterns-established:
  - "Step components use wagmi hooks directly since they render inside WagmiProvider"
  - "4-state conditional rendering pattern: not-connected / wrong-network / correct-network / completed"
  - "Balance display with faucet link when any balance is zero"
  - "Inline error messages with actionable fix instructions"

requirements-completed: [WALL-01, WALL-02, WALL-03, WALL-04, WALL-05, WIZ-04]

# Metrics
duration: 45min
completed: 2026-03-01
---

# Phase 2 Plan 1: Connect Wallet Step Summary

**Full wallet onboarding step with RainbowKit connection modal, GOAT Testnet3 network switching, BTC/USDC/USDT balance display, and elapsed timer wired to Convex persistence**

## Performance

- **Duration:** 45 min
- **Started:** 2026-03-01T03:20:43Z
- **Completed:** 2026-03-01T04:06:31Z
- **Tasks:** 1
- **Files modified:** 16

## Accomplishments
- Step 0 now renders a complete wallet onboarding experience instead of a placeholder
- RainbowKit ConnectButton opens wallet modal supporting MetaMask, Rabby, Coinbase Wallet, and WalletConnect
- Wrong network detection with amber warning and one-click "Switch to GOAT Testnet3" button
- Correct network shows green success indicator with full address, copy button, and BTC/USDC/USDT balances
- "No wallet?" expandable guide with MetaMask install steps and GOAT Testnet3 network config
- Inline error messages for connection and network switch failures with actionable fix instructions
- Header displays real wallet address, chain name, and running timer from startedAt
- Wallet address flows through useAccount -> useWizard -> Convex for persistent step tracking
- Timer starts on first "Continue" click and persists across refreshes via Convex startedAt field

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Connect Wallet step component with full wallet connection UI** - `fa151dc` (feat)

## Files Created/Modified
- `lib/abi.ts` - Minimal ERC-20 ABI with balanceOf and decimals for token balance reading
- `hooks/use-timer.ts` - Elapsed timer hook using setInterval, formats as M:SS from epoch timestamp
- `components/wizard/steps/step-connect-wallet.tsx` - Full Connect Wallet step with 4 UI states and balance display
- `components/wizard/steps/index.ts` - Updated step registry: step 0 now maps to StepConnectWallet
- `components/wizard/wizard-header.tsx` - Updated to accept walletAddress, chainName, startedAt props with live timer
- `components/wizard/wizard-shell.tsx` - Now uses useAccount() from wagmi and passes wallet state through wizard
- `hooks/use-wizard.ts` - Added startedAt/setStartedAt with Convex persistence via upsertBuilder
- `types/wizard.ts` - Extended WizardState interface with startedAt and setStartedAt
- `convex/builders.ts` - upsertBuilder mutation now accepts optional startedAt field

## Decisions Made
- Used `BigInt()` constructor instead of `0n` literal for ES target compatibility (tsconfig targets below ES2020)
- Hardcoded 6 decimals for USDC/USDT rather than on-chain `decimals()` call -- standard stablecoin convention avoids extra RPC
- WizardShell no longer accepts `walletAddress` prop -- uses `useAccount()` directly for cleaner separation of concerns
- Timer starts on "Continue" click (not wallet connect event) so it tracks active wizard progression time
- Used `formatBalance()` helper with BigInt division for both native BTC (18 decimals) and ERC-20 tokens (6 decimals)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed BigInt literal compatibility with ES target**
- **Found during:** Task 1 (build verification)
- **Issue:** Used `0n` BigInt literal which requires ES2020+ target; project tsconfig targets lower
- **Fix:** Replaced `0n` with `BigInt(0)` constructor call
- **Files modified:** components/wizard/steps/step-connect-wallet.tsx
- **Verification:** `npm run build` passes
- **Committed in:** fa151dc (part of task commit)

**2. [Rule 1 - Bug] Fixed wagmi v3 useBalance return type**
- **Found during:** Task 1 (build verification)
- **Issue:** Used `nativeBalance.formatted` which doesn't exist in wagmi v3's `GetBalanceReturnType` (only has value, decimals, symbol)
- **Fix:** Used `formatBalance(nativeBalance.value, nativeBalance.decimals)` with shared BigInt formatting helper
- **Files modified:** components/wizard/steps/step-connect-wallet.tsx
- **Verification:** `npm run build` passes
- **Committed in:** fa151dc (part of task commit)

**3. [Rule 2 - Missing Critical] Added startedAt to Convex upsertBuilder mutation**
- **Found during:** Task 1 (Step 4 - useWizard update)
- **Issue:** upsertBuilder mutation didn't accept startedAt field, needed for timer persistence
- **Fix:** Added optional `startedAt` arg to upsertBuilder and included it in both insert and patch operations
- **Files modified:** convex/builders.ts
- **Verification:** `npm run build` passes, schema already had `startedAt: v.optional(v.number())`
- **Committed in:** fa151dc (part of task commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None -- plan executed as written after auto-fixes during build verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Wallet connection step is fully functional, ready for users to connect and proceed to Step 2
- Wallet address persists in Convex for step tracking across sessions
- Timer persists via Convex startedAt for cross-refresh continuity
- Plan 02-02 (if present) can build on the wallet connection foundation
- Phase 3 (Agent Identity) can use the connected wallet address from useAccount()

## Self-Check: PASSED

All created files verified on disk. Commit fa151dc verified in git log.

---
*Phase: 02-wallet-connection*
*Completed: 2026-03-01*
