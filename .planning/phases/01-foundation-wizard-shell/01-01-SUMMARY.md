---
phase: 01-foundation-wizard-shell
plan: 01
subsystem: infra
tags: [next.js, convex, wagmi, viem, rainbowkit, tailwind, shadcn, goat-testnet3]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - Running Next.js 16 app with Tailwind v4 and shadcn/ui components
  - GOAT Testnet3 chain definition (chain ID 48816) via viem defineChain
  - GOAT Testnet3 constants (RPC, explorer, bridge, faucet, token addresses)
  - wagmi + RainbowKit provider stack with SSR support
  - Convex schema with builders table (walletAddress indexed)
  - Convex query (getByWallet) and mutations (upsertBuilder, completeStep)
  - Environment variable pattern (.env.example + .env.local gitignored)
affects: [01-02-wizard-shell, 01-03-convex-persistence, phase-02-wallet]

# Tech tracking
tech-stack:
  added: [next.js 16.1.6, react 19.2.3, convex 1.32.x, wagmi 3.5.x, viem 2.46.x, rainbowkit 2.2.x, react-query 5.90.x, framer-motion 12.34.x, shadcn/ui, tailwindcss 4.x, lucide-react]
  patterns: [provider-nesting, separate-wagmi-config, conditional-convex-provider, lowercase-wallet-addresses]

key-files:
  created:
    - lib/chains.ts
    - lib/constants.ts
    - lib/wagmi-config.ts
    - app/providers.tsx
    - app/layout.tsx
    - app/page.tsx
    - convex/schema.ts
    - convex/builders.ts
    - .env.example
    - .npmrc
    - components/ui/button.tsx
    - components/ui/card.tsx
    - components/ui/separator.tsx
    - components/ui/scroll-area.tsx
  modified: []

key-decisions:
  - "Used conditional ConvexProvider wrapper to allow build without Convex URL configured"
  - "Created stub convex/_generated files for TypeScript compilation before npx convex dev"
  - "Used PLACEHOLDER fallback for WalletConnect projectId to allow build without real credentials"
  - "Set turbopack.root in next.config.ts to suppress workspace root warning"

patterns-established:
  - "Provider nesting: WagmiProvider > QueryClientProvider > RainbowKitProvider > ConvexProvider"
  - "wagmi config in separate .ts file (not inside use client component) with ssr: true"
  - "Chain config single source of truth: lib/chains.ts (viem) + lib/constants.ts (raw values)"
  - "Wallet addresses lowercased before Convex operations for consistency"
  - ".npmrc with legacy-peer-deps=true for React 19 compatibility"

requirements-completed: [WIZ-02]

# Metrics
duration: 10min
completed: 2026-02-28
---

# Phase 1 Plan 01: Project Scaffold Summary

**Next.js 16 + Convex project with GOAT Testnet3 chain config, wagmi/RainbowKit provider stack, and Convex builders schema with persistence functions**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-01T02:06:33Z
- **Completed:** 2026-03-01T02:17:17Z
- **Tasks:** 2
- **Files modified:** 31

## Accomplishments
- Scaffolded Next.js 16 project with Tailwind v4, shadcn/ui (button, card, separator, scroll-area), and all wallet/backend dependencies
- Defined GOAT Testnet3 chain (ID 48816) as single source of truth in lib/chains.ts with constants in lib/constants.ts
- Built provider stack (Wagmi > QueryClient > RainbowKit > Convex) with SSR support and graceful fallback for missing env vars
- Created Convex builders table schema with walletAddress index and three persistence functions (getByWallet, upsertBuilder, completeStep)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with dependencies, chain config, and provider stack** - `f17128e` (feat)
2. **Task 2: Create Convex schema and builder persistence functions** - `dd715a4` (feat)

## Files Created/Modified
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js config with turbopack root
- `postcss.config.mjs` - PostCSS with Tailwind plugin
- `eslint.config.mjs` - ESLint configuration
- `components.json` - shadcn/ui configuration
- `.npmrc` - npm config for legacy peer deps
- `.gitignore` - Git ignore rules with .env.example exception
- `.env.example` - Required environment variables documentation
- `app/layout.tsx` - Root layout with Providers wrapper and metadata
- `app/page.tsx` - Placeholder "Hello GOAT" page
- `app/providers.tsx` - Client provider stack (Wagmi, QueryClient, RainbowKit, Convex)
- `app/globals.css` - Tailwind v4 + shadcn/ui CSS variables
- `lib/chains.ts` - GOAT Testnet3 viem chain definition
- `lib/constants.ts` - GOAT Testnet3 config constants (RPC, explorer, tokens)
- `lib/wagmi-config.ts` - wagmi + RainbowKit config with SSR
- `lib/utils.ts` - shadcn/ui cn() utility
- `components/ui/button.tsx` - shadcn button component
- `components/ui/card.tsx` - shadcn card component
- `components/ui/separator.tsx` - shadcn separator component
- `components/ui/scroll-area.tsx` - shadcn scroll-area component
- `convex/schema.ts` - Convex schema with builders table
- `convex/builders.ts` - getByWallet query, upsertBuilder and completeStep mutations
- `convex/_generated/server.ts` - Stub server utilities for pre-deployment TypeScript compilation
- `convex/_generated/api.ts` - Stub API module for pre-deployment TypeScript compilation

## Decisions Made
- **Conditional ConvexProvider:** Wrapped ConvexProvider in a conditional component so the app builds and runs even without a configured Convex URL. Once `npx convex dev` is run, the ConvexProvider activates automatically.
- **Stub _generated files:** Created minimal Convex _generated stubs to allow TypeScript compilation before `npx convex dev` is run. These will be overwritten by Convex codegen.
- **WalletConnect PLACEHOLDER:** Used a "PLACEHOLDER" fallback for the WalletConnect projectId so the build succeeds without real credentials. Wallet connection requires a real project ID from dashboard.reown.com.
- **Turbopack root:** Set `turbopack.root` to `__dirname` in next.config.ts to suppress the "multiple lockfiles" workspace root warning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ConvexReactClient crashes on invalid URL placeholder**
- **Found during:** Task 1 (build verification)
- **Issue:** `.env.local` had `NEXT_PUBLIC_CONVEX_URL=your_convex_url_here` which is not a valid URL, causing ConvexReactClient to throw "Provided address was not an absolute URL" at build time
- **Fix:** Made ConvexProvider conditional -- only instantiates ConvexReactClient when a valid URL is present. Changed .env.local to comment out placeholders instead.
- **Files modified:** app/providers.tsx, .env.local
- **Verification:** npm run build passes
- **Committed in:** f17128e (Task 1 commit)

**2. [Rule 1 - Bug] RainbowKit crashes without WalletConnect projectId**
- **Found during:** Task 1 (build verification)
- **Issue:** Empty/missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID causes "No projectId found" error at build time
- **Fix:** Used "PLACEHOLDER" fallback in wagmi-config.ts so build succeeds. Wallet connection still requires a real project ID.
- **Files modified:** lib/wagmi-config.ts
- **Verification:** npm run build passes
- **Committed in:** f17128e (Task 1 commit)

**3. [Rule 3 - Blocking] Convex _generated directory missing before deployment**
- **Found during:** Task 2 (Convex file creation)
- **Issue:** convex/builders.ts imports from `./_generated/server` which doesn't exist until `npx convex dev` is run
- **Fix:** Created stub _generated/server.ts and _generated/api.ts that provide correctly-typed exports using Convex generics. These will be overwritten by real codegen.
- **Files modified:** convex/_generated/server.ts, convex/_generated/api.ts
- **Verification:** npm run build passes; TypeScript compiles without errors
- **Committed in:** dd715a4 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for build to succeed without external service credentials. No scope creep.

## Issues Encountered
- Next.js create-next-app required a temp directory approach since the repo was not empty
- Turbopack detected a parent lockfile at ~/package-lock.json causing a workspace root warning (fixed with turbopack.root config)

## User Setup Required

Before wallet connection and Convex backend work, the user must:
1. **WalletConnect Project ID:** Register at https://dashboard.reown.com/ (free), create a project, copy the Project ID, and set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local`
2. **Convex Backend:** Run `npx convex dev` which will prompt for Convex login/signup, create a development deployment, and auto-populate `NEXT_PUBLIC_CONVEX_URL` in `.env.local`

## Next Phase Readiness
- Foundation is complete: Next.js builds, provider stack is configured, chain config is defined, Convex schema is ready
- Plan 01-02 (wizard shell UI) can proceed immediately -- all dependencies and provider infrastructure are in place
- Convex schema push to a real deployment will happen when user runs `npx convex dev` (authentication gate)

## Self-Check: PASSED

All 20 key files verified present. Both task commits (f17128e, dd715a4) confirmed in git log.

---
*Phase: 01-foundation-wizard-shell*
*Completed: 2026-02-28*
