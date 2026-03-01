---
phase: 01-foundation-wizard-shell
plan: 02
subsystem: ui
tags: [wizard, sidebar, stepper, framer-motion, shadcn, x402, api-route, animate-presence]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js scaffold with shadcn/ui components, Tailwind v4, framer-motion, lucide-react
provides:
  - 5-step wizard shell UI with left sidebar navigation and animated step transitions
  - WizardHeader with branding, timer placeholder, and wallet placeholder
  - WizardSidebar with step number circles, names, and status icons (completed/current/locked)
  - useWizard hook with local state management (currentStep, completedSteps, navigation)
  - StepPlaceholder component used by all 5 steps in Phase 1
  - Step registry (STEP_COMPONENTS) mapping step numbers to components
  - x402 spike mock API route validating Next.js route handler shape
affects: [01-03-convex-persistence, phase-02-wallet, phase-03-identity, phase-04-demo-tx]

# Tech tracking
tech-stack:
  added: []
  patterns: [wizard-shell-layout, step-registry-pattern, animated-step-transitions, useWizard-local-state]

key-files:
  created:
    - types/wizard.ts
    - hooks/use-wizard.ts
    - components/wizard/wizard-shell.tsx
    - components/wizard/wizard-sidebar.tsx
    - components/wizard/wizard-header.tsx
    - components/wizard/wizard-step.tsx
    - components/wizard/steps/step-placeholder.tsx
    - components/wizard/steps/index.ts
    - app/api/x402-spike/route.ts
  modified:
    - app/page.tsx

key-decisions:
  - "Used lucide-react icons (Check, Diamond, Circle, Clock, Wallet, Lock) for all wizard status indicators"
  - "Tracked animation direction via useRef for correct forward/backward slide transitions"
  - "Used local useState for wizard state -- Plan 01-03 will add Convex persistence"

patterns-established:
  - "Wizard shell layout: fixed header + sidebar (w-52) + flex-1 content area with overflow-hidden"
  - "Step registry pattern: STEP_COMPONENTS maps step number to component, replaceable per-step in future phases"
  - "Step status derivation: StepStatus enum (COMPLETED/CURRENT/LOCKED) computed from currentStep + completedSteps array"
  - "Animated step transitions: AnimatePresence mode=wait with directional slide/fade variants"

requirements-completed: [WIZ-01, WIZ-03]

# Metrics
duration: 3min
completed: 2026-02-28
---

# Phase 1 Plan 02: Wizard Shell Summary

**5-step wizard shell with sidebar navigation, animated step transitions, and x402 mock API route for Phase 4 validation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T02:22:03Z
- **Completed:** 2026-03-01T02:25:02Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Built complete wizard shell UI with left sidebar showing all 5 steps with step number circles, names, and status icons
- Implemented animated step transitions using Motion AnimatePresence with directional slide/fade (forward slides left, backward slides right)
- Created useWizard hook managing step navigation, completion, and status derivation with local state
- Created x402 spike mock API route confirming Next.js route handler shape for GET (402 challenge + settlement) and POST (payment proof settlement)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create wizard types, step registry, hook, and full wizard shell UI** - `c3920fd` (feat)
2. **Task 2: Create x402 spike mock API route** - `dcabe9d` (feat)

## Files Created/Modified
- `types/wizard.ts` - StepStatus enum, StepDefinition interface, WizardState interface, STEPS array with all 5 step definitions
- `hooks/use-wizard.ts` - useWizard hook with useState for currentStep/completedSteps, navigation guards, step completion
- `components/wizard/wizard-shell.tsx` - Main layout composing header + sidebar + animated step content area
- `components/wizard/wizard-sidebar.tsx` - Left sidebar with step list, number circles, status icons, click navigation for completed steps
- `components/wizard/wizard-header.tsx` - Header bar with "Hello GOAT" branding, 0:00 timer placeholder, "Not Connected" wallet placeholder
- `components/wizard/wizard-step.tsx` - Step content container with AnimatePresence slide/fade animations tracking direction via ref
- `components/wizard/steps/step-placeholder.tsx` - Placeholder component with Mark Complete (current), Completed checkmark (done), or Lock icon (locked)
- `components/wizard/steps/index.ts` - Step registry mapping step numbers 0-4 to StepPlaceholder (replaced per-step in future phases)
- `app/page.tsx` - Updated to render WizardShell as main content
- `app/api/x402-spike/route.ts` - Mock x402 GET (402 challenge + settlement JSON) and POST (payment proof + settlement confirmation) handlers

## Decisions Made
- **Lucide-react icons for status:** Used Check (completed), Diamond (current), Circle (locked), Clock (timer), Wallet (connection) -- consistent icon library already in the project from Plan 01.
- **Direction tracking via useRef:** Tracked previous step index with a ref to calculate animation direction (forward = slide left, backward = slide right) rather than passing direction as a prop.
- **Local state for Phase 1:** Used useState in useWizard hook -- Plan 01-03 will wire this to Convex for persistence. This keeps the wizard functional without requiring Convex to be running.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required for the wizard shell.

## Next Phase Readiness
- Wizard shell is fully functional with placeholder steps -- Plan 01-03 (Convex persistence) can wire useWizard to Convex backend
- Step registry allows future phases to swap StepPlaceholder for real step components without touching the shell
- x402 spike API route confirms the handler shape works -- Phase 4 replaces with real @x402/next middleware
- All 5 steps visible in sidebar at all times with correct status indicators

## Self-Check: PASSED

All 10 key files verified present. Both task commits (c3920fd, dcabe9d) confirmed in git log.

---
*Phase: 01-foundation-wizard-shell*
*Completed: 2026-02-28*
