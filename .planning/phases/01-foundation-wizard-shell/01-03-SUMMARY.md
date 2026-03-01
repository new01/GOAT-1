---
phase: 01-foundation-wizard-shell
plan: 03
subsystem: database
tags: [convex, useQuery, useMutation, persistence, wizard, real-time-sync, optimistic-updates]

# Dependency graph
requires:
  - phase: 01-01
    provides: Convex schema with builders table, getByWallet query, completeStep mutation
  - phase: 01-02
    provides: useWizard hook with local state, wizard-shell component, types/wizard.ts
provides:
  - useWizard hook with Convex persistence (reads/writes step progress to Convex when wallet address provided)
  - Dual-mode wizard operation (local state without wallet, Convex-backed with wallet)
  - useSafeConvex hook for conditional Convex access without provider crash
  - Loading state handling in wizard shell while Convex query resolves
  - Human-verified complete Phase 1 wizard shell (layout, step interaction, animations, x402 spike)
affects: [phase-02-wallet, phase-03-identity, phase-04-demo-tx]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-mode-persistence, safe-convex-hook, optimistic-step-completion, conditional-convex-queries]

key-files:
  created:
    - hooks/use-safe-convex.ts
  modified:
    - hooks/use-wizard.ts
    - components/wizard/wizard-shell.tsx
    - app/providers.tsx
    - convex/_generated/api.ts
    - types/wizard.ts

key-decisions:
  - "Created useSafeConvex hook to safely access Convex client when provider may not be mounted"
  - "Dual-mode useWizard: local useState when no wallet, Convex useQuery/useMutation when wallet provided"
  - "Optimistic local state in Convex mode prevents UI lag while mutation is in-flight"

patterns-established:
  - "Dual-mode persistence: hooks accept optional walletAddress, fall back to local state when absent"
  - "Safe Convex access: useSafeConvex hook checks provider availability before calling useQuery/useMutation"
  - "Wallet address always lowercased before any Convex operation"

requirements-completed: [WIZ-02]

# Metrics
duration: 5min
completed: 2026-02-28
---

# Phase 1 Plan 03: Convex Persistence Wiring Summary

**Wizard hook wired to Convex for step persistence with dual-mode operation (local state fallback without wallet) and human-verified complete Phase 1 wizard shell**

## Performance

- **Duration:** 5 min (Task 1 execution + Task 2 checkpoint approval)
- **Started:** 2026-02-28
- **Completed:** 2026-02-28
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 6

## Accomplishments
- Wired useWizard hook to Convex backend: reads step progress via useQuery(api.builders.getByWallet) and writes completions via useMutation(api.builders.completeStep) when a wallet address is provided
- Created useSafeConvex hook for conditional Convex access that gracefully handles missing ConvexProvider
- Maintained backward compatibility: wizard still works in local-state mode without a wallet address (Phase 1 default)
- Human-verified the complete Phase 1 wizard shell: layout, sidebar navigation, step interaction, animations, and x402 spike all confirmed working

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire wizard hook to Convex for step persistence** - `6152899` (feat)
2. **Task 2: Verify complete wizard shell** - checkpoint:human-verify (approved, no code changes)

## Files Created/Modified
- `hooks/use-safe-convex.ts` - Hook to safely access Convex client when ConvexProvider may not be mounted
- `hooks/use-wizard.ts` - Updated to accept optional walletAddress; uses Convex queries/mutations when wallet provided, local state otherwise
- `components/wizard/wizard-shell.tsx` - Added optional walletAddress prop, loading state handling, passes wallet to useWizard
- `app/providers.tsx` - Updated to support Convex provider detection by useSafeConvex
- `convex/_generated/api.ts` - Updated stub with builders API shape for TypeScript compilation
- `types/wizard.ts` - Added isLoading field to WizardState interface

## Decisions Made
- **useSafeConvex hook:** Created a dedicated hook to safely detect whether ConvexProvider is mounted, avoiding crashes when Convex URL is not configured. This enables the dual-mode persistence pattern.
- **Dual-mode persistence:** useWizard accepts an optional walletAddress. When present, it reads from and writes to Convex. When absent, it uses local useState. This keeps the wizard functional in Phase 1 (no wallet yet) while being ready for Phase 2.
- **Optimistic updates:** In Convex mode, local state is updated immediately on step completion while the mutation is in-flight, preventing UI lag.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no additional external service configuration required beyond what Plan 01-01 documented (Convex backend and WalletConnect project ID).

## Next Phase Readiness
- Phase 1 is fully complete: scaffold, wizard UI, and Convex persistence are all wired and verified
- Phase 2 (Wallet Connection) can pass the connected wallet address to WizardShell, activating Convex persistence automatically
- Step registry allows Phase 2+ to replace StepPlaceholder components with real step implementations
- All Phase 1 success criteria from ROADMAP.md are met and human-verified

## Self-Check: PASSED

All 6 key files verified present. Task 1 commit (6152899) confirmed in git log. Task 2 was a human-verify checkpoint (approved, no commit needed).

---
*Phase: 01-foundation-wizard-shell*
*Completed: 2026-02-28*
