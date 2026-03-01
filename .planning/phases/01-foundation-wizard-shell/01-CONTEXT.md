# Phase 1: Foundation + Wizard Shell - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the Next.js + Convex + wagmi/viem project with GOAT Testnet3 chain config, provider stack, and a 5-step wizard shell with Convex-backed persistence. Includes an x402 SDK mock spike to validate the API route approach for Phase 4. No actual step content — just the shell that all steps render into.

</domain>

<decisions>
## Implementation Decisions

### Wizard Layout
- Left sidebar (~200px narrow) + main content area layout
- Sidebar shows: step number icon, step name, status icon (✓/◆/○)
- Header bar: "Hello GOAT" branding on left, elapsed timer in center, connected wallet address on right
- Timer starts counting up from wallet connect (Phase 2), shows 0:00 placeholder in Phase 1

### Step Transitions
- Slide/fade animation between steps (smooth, polished feel)
- Manual advance: show success state on step completion, user clicks "Continue" to proceed
- Completed steps are clickable in sidebar — shows read-only summary of completed content
- Future steps are visible but grayed out/locked — users can see what's coming but can't interact
- Strict linear dependency: Step N must be complete before Step N+1 is interactive

### Project Scaffold
- Package manager: npm
- Convex: new project, created fresh during Phase 1 setup
- Directory structure: Claude's discretion (pick most practical for this project)
- x402 SDK spike: mock only — verify the Next.js API route handler shape works, no real SDK or credentials in Phase 1

### Claude's Discretion
- Directory structure choice (feature-grouped vs type-grouped or hybrid)
- Exact animation library/approach for step transitions
- Convex schema field naming conventions
- shadcn/ui component selection for wizard shell
- Tailwind configuration details

</decisions>

<specifics>
## Specific Ideas

- The wizard should feel like a settings page with a sidebar nav — familiar, not novel
- All 5 steps visible at all times in the sidebar so users know the full journey
- Grayed-out future steps create anticipation without confusion

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- Convex schema will be the shared data layer for all future phases
- Provider stack (QueryClient > Wagmi > Convex) must be set up correctly for all downstream components
- Chain config constants file will be imported throughout the app
- Wizard shell component is the rendering container for all 5 step components

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-wizard-shell*
*Context gathered: 2026-02-28*
