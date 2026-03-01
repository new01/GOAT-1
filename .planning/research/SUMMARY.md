# Research Summary

**Project:** Hello GOAT -- Onboarding Wizard
**Synthesized:** 2026-02-28
**Synthesizer:** gsd-research-synthesizer
**Overall confidence:** MEDIUM (core stack HIGH, GOAT-specific integrations LOW)

---

## Executive Summary

Hello GOAT is a 5-step, single-page Web3 developer onboarding wizard for the GOAT Testnet3 hackathon. Its goal is to take a builder from zero to a live, verifiable agent identity with a working x402 payment transaction in under 2 minutes. The product is narrow in scope but technically dense: it combines wallet connection (wagmi/viem), custom chain configuration (chain ID 48816, not in viem's default registry), on-chain identity registration (ERC-8004 NFT), out-of-band bot credential wiring (@goathackbot via Telegram), server-side payment execution (goatx402-sdk-server), and a shareable proof page. The stack is mandated -- Next.js 15 App Router, Convex, Vercel -- which is appropriate and eliminates tech-selection risk.

The recommended build order is strict dependency order: foundation (providers, schema, chain config) before wallet connection, wallet connection before identity and credential steps, and all prior steps before the climactic demo transaction. The single greatest technical risk is the `goatx402-sdk-server` SDK: it is GOAT-specific, only documented in PROJECT.md, uses Express-style middleware that does not map directly to Next.js App Router route handlers, and cannot be live-verified. This must be treated as a first-class unknown and prototyped in Phase 1 before anything else depends on it. The second-greatest risk is credential security: merchant API keys must never reach the browser, requiring a deliberate server-side-only path through Convex `internalQuery` and Next.js API routes.

The overall architecture maps cleanly to established patterns: a single Convex `builders` table keyed by wallet address, client-side step orchestration reading from Convex, server-side demo transaction execution via a Next.js API route, and a public server-rendered proof page. For hackathon speed, full SIWE authentication can be skipped in favor of wallet-address-as-key (acceptable since no real funds are at stake), but credential isolation must be strictly enforced regardless. The differentiating feature that makes this a hackathon winner is the shareable proof page -- judges can verify any builder's completion without running any code.

---

## Key Findings

### Stack (from STACK.md)

| Technology | Purpose | Confidence |
|------------|---------|------------|
| Next.js 15 (App Router) | Full-stack framework | HIGH -- mandated, well-understood |
| React 19 + TypeScript 5 | UI + type safety | HIGH -- stable ecosystem |
| Convex 1.x | Real-time BaaS (DB + functions + real-time) | HIGH -- ideal for progress persistence |
| wagmi 2.x + viem 2.x | Wallet hooks + EVM client | HIGH -- industry standard for React+EVM |
| RainbowKit 2.x | Wallet connection modal UI | HIGH -- saves building custom wallet UX |
| Tailwind CSS 4.x + shadcn/ui | Styling + UI primitives | HIGH -- fast hackathon iteration |
| goatx402-sdk-server | x402 payment middleware | LOW -- GOAT-specific, Express-based, unverified on npm |
| viem `defineChain` (GOAT Testnet3) | Custom chain ID 48816 | HIGH -- standard viem pattern |
| ERC-8004 contract via viem/wagmi | Agent identity (NFT) | MEDIUM -- standard NFT ABI pattern; address/ABI unknown |
| Vercel | Hosting | HIGH -- mandated, zero-config Next.js |

**Rejected technologies (do not revisit):** ethers.js/web3.js (legacy), Privy/Dynamic (overkill for wallet-only auth), Zustand/Jotai/Redux (unnecessary -- Convex handles server state, wagmi handles wallet state), Chakra/MUI/Mantine (conflicting styling paradigm).

**Critical pre-implementation checks:**
- Verify `goatx402-sdk-server` exists on npm before writing any x402 code. If the package name is wrong, all x402 work is blocked.
- Tailwind 4 uses CSS-first config (no `tailwind.config.js`). Confirm shadcn/ui `init` handles Tailwind 4 correctly.
- Verify npm package versions before install: `next`, `wagmi`, `viem`, `convex`, `@rainbow-me/rainbowkit`.

---

### Features (from FEATURES.md)

**Must ship (table stakes):**
1. Wallet connection with MetaMask/Rabby/Coinbase Wallet support (RainbowKit modal)
2. Network detection + one-click switch to GOAT Testnet3 (chain ID 48816)
3. "No wallet?" install guide for Web2 developers entering hackathon
4. Linear 5-step progress indicator with completed/current/upcoming states
5. Step completion persistence in Convex keyed to wallet address (resume on refresh)
6. Credential paste form with auto-parsing and format validation
7. Copy-to-clipboard for all @goathackbot command payloads
8. Demo transaction execution with full lifecycle display (request, response, tx hash, explorer link)
9. Error detection with actionable step-specific troubleshooting
10. Block explorer deep links after every on-chain action

**High-value differentiators (prioritized by impact vs effort):**
- Shareable proof page at `/proof/{walletAddress}` -- publicly accessible, OG tags for social sharing. Judges verify builders without running code. **This is the hackathon-winning feature -- build it.**
- Pre-filled Telegram deep link (`t.me/goathackbot?start=...`) -- reduces DM friction from "find bot, type command" to "click link"
- Confetti on demo tx success -- trivial to add (canvas-confetti), every screenshot is free marketing
- Elapsed time display ("Completed in 1:47") -- validates the 2-minute product promise, creates a shareable moment
- Inline troubleshooter diagnostic panel with per-check fix buttons

**Defer to post-hackathon:**
- Animated x402 transaction lifecycle visualization
- Credential live API health check (format validation covers 80% of errors)
- Dynamic OG image generation (`/api/og`)
- Step-specific contextual help panels (experienced builders skip them anyway)
- Under-2-minute countdown timer

**Explicit anti-features (do not build):**
- Automated bot API integration (bot API not available; would be fragile)
- OAuth / email-password authentication (wallet IS the identity)
- Multi-chain support (GOAT Testnet3 only; hardcode chain ID 48816)
- Mobile-responsive layout (hackathon builders use laptops + browser extension wallets)
- Automated transaction retry (masks root cause; guide users to fix instead)
- Real mainnet transactions (testnet only per scope)
- localStorage for secrets (trivially extractable; use Convex server-side)

**Critical path:** Wallet connect -> ERC-8004 identity -> x402 credentials -> Telegram wiring -> Demo tx -> Proof page. Every step gates the next. The troubleshooter exists to unblock this chain when any step fails.

---

### Architecture (from ARCHITECTURE.md)

**Recommended architecture:** Single-page Next.js App Router app. Client-rendered wizard shell (`WizardShell`) reads `currentStep` from Convex and renders the active step. One server-rendered route: `/proof/[wallet]`. One API route: `/api/demo-tx` (server-side x402 execution, credentials never touch the browser).

**Component map:**

| Component | Responsibility | Rendering |
|-----------|---------------|-----------|
| `layout.tsx` + `providers.tsx` | Mounts QueryClientProvider > WagmiProvider > ConvexProvider (order matters) | Server shell + Client providers |
| `WizardShell` | Step orchestrator; reads `currentStep` from Convex; renders active step + sidebar | Client |
| `StepWallet` | Connect + network switch; writes wallet address to Convex on success | Client |
| `StepIdentity` | ERC-8004 deep link + polls on-chain NFT balance every 5s | Client |
| `StepPayments` | Credential paste form; writes to Convex (credentials never client-readable) | Client |
| `StepTelegram` | DM deep link generation + user-confirmed completion | Client |
| `StepDemoTx` | Calls `/api/demo-tx`; displays request/response/tx hash/explorer link | Client |
| `Troubleshooter` | Orthogonal diagnostic panel; checks all steps; accessible at any time | Client |
| `/api/demo-tx` route | Fetches credentials via Convex `internalQuery`; calls x402 SDK; returns result | Server only |
| `/proof/[wallet]/page.tsx` | Server component; Convex HTTP client; public-safe fields only; OG metadata | Server |

**Four patterns to enforce throughout:**

1. **Step completion as Convex mutations** -- each step writes to Convex on complete; wizard reads from Convex (not local state). Enables resume after page refresh without any localStorage dependency.

2. **Credential isolation** -- credentials written to Convex, returned ONLY via `internalQuery` (not callable from browser). Client sees `hasCredentials: boolean` only. API route is the single read path for secrets.

3. **Local form state, Convex on completion** -- form inputs backed by `React.useState`. Write to Convex only when the user completes a step. Never on every keystroke (avoids re-render storms).

4. **Client-side step gating** -- all 5 steps visible in sidebar (progress transparency), only current step interactive. Single page, no router navigation between steps.

**Convex schema:** Single `builders` table. `walletAddress` (lowercased, indexed). Fields: `chainId`, `agentId`, `agentName`, `credentials` (internalQuery only), `telegramConfirmed`, `demoTxHash`, `currentStep` (1-5), `completedAt`.

**Auth decision:** Skip full SIWE for hackathon. Use wallet-address-as-query-key pattern (pass `walletAddress` as string arg to Convex functions). Acceptable because testnet only, no real funds. Add SIWE post-hackathon if project continues.

**Build dependency order** (from ARCHITECTURE.md, validated against all research):
```
Phase 1 (Foundation)     --> Phase 2 (Wallet + Shell) --> Phase 3 (Identity + Credentials)
                                                              --> Phase 4 (Telegram + Demo Tx)
                                                                    --> Phase 5 (Troubleshooter + Proof)
```

---

### Pitfalls (from PITFALLS.md)

**Top 5 critical pitfalls:**

| Pitfall | Phase | Prevention |
|---------|-------|------------|
| **Merchant secrets leaked to browser** via Convex public query | Phase 1 (architecture) | Use Convex `internalQuery` for credentials. Client only sees `hasCredentials: boolean`. API route is the only consumer of secrets. |
| **Wallet connection state machine gaps** -- "connected" but wrong chain, locked wallet, no address | Phase 2 | Model 7 explicit states: NO_WALLET, WALLET_LOCKED, CONNECTING, WRONG_NETWORK, SWITCHING_NETWORK, CONNECTED, ERROR. Gate on `address !== undefined`, not just `isConnected`. |
| **`wallet_switchEthereumChain` silent failures** -- MetaMask/Rabby/Coinbase Wallet handle errors inconsistently | Phase 2 | After `switchChain`, poll `useChainId()` for 2-3s to confirm switch. Handle error codes 4902, 4001, -32603. Provide manual RPC copy-paste fallback. |
| **On-chain polling hammers RPC** -- multiple components polling independently, no rate limit | Phase 3 | Exponential backoff (2s start, 30s cap). Single shared polling utility. `viem.waitForTransactionReceipt` for tx confirmation. Manual "check again" after 30s. |
| **Demo transaction fails with unhelpful errors** -- raw 402/500 with no step context | Phase 4 | Pre-flight checklist: chain OK? balance OK? identity registered? credentials valid? token approved? Map error codes to specific step fix instructions. |

**Additional important pitfalls:**

- **Credential paste UX** (Pitfall 6): Accept full `.env` block in a single textarea. Auto-parse `KEY=value` pairs, strip markdown/backtick formatting. Show confirmation checklist ("Found 4 credentials: API URL [ok], API Key [ok]..."). Users will paste the entire Telegram message including labels.
- **Convex re-render storms** (Pitfall 8): Local React state for form inputs. Debounce any intermediate Convex writes at 500ms+. Each component subscribes only to the narrow fields it needs, not the full builder document.
- **Testnet faucet as SPOF** (Pitfall 9): Check balance in Step 1, not Step 5. Surface faucet link early. Provide Discord fallback instructions.
- **Hardcoded chain config scattered through codebase** (Pitfall 14): ALL chain config (chain ID, RPC URL, explorer URL, contract addresses, token addresses) in a single `/lib/constants.ts`. Never inline `48816` or contract addresses in component code.
- **Next.js API routes vs Convex HTTP actions ambiguity** (Pitfall 12): Clear rule -- Next.js API routes for x402 SDK calls (needs `process.env` secrets). Convex for all data reads/writes. Document this boundary.

---

## Implications for Roadmap

Research strongly supports a 5-phase build order. Each phase is independently deliverable and testable. The phase structure matches the architecture's build order recommendation with added emphasis on resolving GOAT-specific unknowns early.

### Suggested Phase Structure

**Phase 1: Foundation + Chain Config + x402 Spike**
- Rationale: Everything depends on providers, Convex schema, and chain config. More importantly, the x402 SDK must be prototyped NOW because its compatibility with Next.js route handlers is unknown. If it does not work as expected, Phase 4 (demo transaction) needs a different approach. Discover this blocker in Phase 1, not Phase 4.
- Delivers: Working dev environment with GOAT Testnet3 configured; Convex schema deployed; provider stack mounted; x402 SDK installed and minimally tested in a route handler; centralized chain/contract config file
- Features addressed: Chain config, Convex schema, provider stack
- Pitfalls to avoid: Credential architecture (#1), API route vs Convex boundary (#12), hardcoded chain config (#14)
- Research flag: **Needs `/gsd:research-phase`** -- resolve x402 SDK compatibility with Next.js App Router route handlers. The SDK uses Express middleware; how to adapt it is the critical unknown.

**Phase 2: Wallet Connection + Wizard Shell**
- Rationale: Every subsequent step requires a connected wallet and step orchestrator. This phase must be bulletproof before proceeding. The wallet state machine is the most edge-case-dense piece of the app.
- Delivers: RainbowKit wallet connect modal; network detection and one-click switch to chain 48816; 5-step sidebar progress indicator; Convex-backed step persistence; wizard resume on page refresh; "no wallet?" install guide
- Features addressed: Wallet connection (table stakes), network switch, progress indicator, persistence
- Pitfalls to avoid: State machine gaps (#2), silent chain switch failures (#3), connected-but-no-address (#10)

**Phase 3: Identity + Credentials Steps (Steps 2 and 3, parallel)**
- Rationale: ERC-8004 identity and x402 credentials are both prerequisites for the demo transaction and can be built simultaneously. This is where the GOAT-specific integrations live -- expect friction.
- Delivers: ERC-8004 identity registration deep link + on-chain polling (useReadContract with refetchInterval); credential `.env` block auto-parse form; Convex credential storage with isolation pattern; balance check with faucet link
- Features addressed: StepIdentity, StepPayments, on-chain polling hook, credential isolation
- Pitfalls to avoid: RPC hammering (#5), credential paste UX (#6), Convex re-render storms (#8), secrets leak (#1)
- Research flag: **Needs ERC-8004 contract address and minimal ABI from GOAT docs** before StepIdentity can be built. This is a known blocking gap.

**Phase 4: Telegram Wiring + Demo Transaction (Steps 4 and 5)**
- Rationale: Step 4 is lightweight (DM link + confirmation). Step 5 is the climactic moment that exercises the full stack. Build both together so the complete happy path is testable end-to-end.
- Delivers: Telegram deep link with pre-filled command; server-side x402 demo transaction via `/api/demo-tx`; full result display (request, response, tx hash, explorer link); pre-flight checklist; error-to-step routing; confetti celebration
- Features addressed: StepTelegram, demo transaction (table stakes), explorer deep links, confetti
- Pitfalls to avoid: Unhelpful demo tx errors (#7); faucet as SPOF (#9) -- balance check should already be live from Phase 2

**Phase 5: Troubleshooter + Proof Page + Polish**
- Rationale: These are observability and polish layers that require all prior steps to be complete for meaningful testing. The troubleshooter cannot be fully built until real failure modes are known from Phase 3/4 integration work.
- Delivers: Full troubleshooter diagnostic panel with per-check fix buttons; shareable proof page at `/proof/[wallet]` with OG metadata; elapsed time display; copy-link button; Open Graph tags for Discord/Twitter embeds
- Features addressed: Troubleshooter panel, shareable proof page (high-value differentiator), OG meta tags
- Pitfalls to avoid: Proof page data leakage (#13) -- dedicated public-only Convex query returning only safe fields

### Research Flags

| Phase | Research Needed? | Topic |
|-------|-----------------|-------|
| Phase 1 | YES -- critical before implementation | x402 SDK adapter pattern for Next.js App Router. The Express middleware pattern does not map directly to route handlers. Need to prototype `GoatX402` initialization in a route handler and confirm request/response handling. |
| Phase 3 | YES -- blocking for StepIdentity | ERC-8004 contract address on GOAT Testnet3 and minimal ABI (`balanceOf`, `tokenOfOwnerByIndex`). Cannot build identity polling without this. Obtain from GOAT docs at `docs.goat.network`. |
| Phase 2 | No | wagmi wallet connection and chain switching are well-documented standard patterns with HIGH confidence. |
| Phase 4 | Conditional on Phase 1 | StepDemoTx implementation is straightforward IF Phase 1 x402 spike resolves the API route compatibility. No separate research needed if Phase 1 succeeds. |
| Phase 5 | No | Next.js server components, OG metadata generation, and Convex HTTP client patterns are well-documented with HIGH confidence. |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core stack (Next.js 15, React 19, TypeScript, Convex, wagmi 2, viem 2) | HIGH | Mature, stable ecosystem. Well-understood patterns from training data. Verify package versions before install. |
| UI stack (Tailwind 4, shadcn/ui, RainbowKit 2) | HIGH | Dominant patterns. One risk: Tailwind 4 CSS-first config may affect shadcn/ui init -- verify at project setup. |
| Feature set and wizard flow | HIGH | 5-step wizard fully specified in PROJECT.md. General Web3 wizard UX is a well-established problem space. |
| Architecture patterns (Convex + wagmi + Next.js App Router) | MEDIUM-HIGH | Patterns are from training data; specific API signatures need verification against current docs during implementation. Convex's reactive query model is well-understood. |
| Pitfall identification | MEDIUM-HIGH | Core pitfalls drawn from known Web3 DApp and hackathon failure patterns. GOAT-specific failure modes (ERC-8004 event behavior, x402 error codes) should be validated against GOAT docs. |
| GOAT-specific SDKs and contracts | LOW | `goatx402-sdk-server` cannot be live-verified. ERC-8004 contract address and ABI are unknown. `@goathackbot` DM command format must be confirmed. |
| x402 + Next.js App Router compatibility | LOW | SDK documented with Express `app.use()` middleware. Adaptation to Next.js route handlers must be prototyped in Phase 1 before committing to any x402 implementation approach. |

**Overall: MEDIUM.** The general approach is solid and the standard Web3 stack is well-understood. GOAT-specific integrations introduce meaningful unknowns that must be resolved early.

### Gaps to Address (in priority order)

1. **`goatx402-sdk-server` npm existence and API surface** -- Verify the package name on npm (`npm info goatx402-sdk-server`). If it does not exist as named, all x402 integration is blocked. Check GOAT docs for the correct package name and import path. This is the single most important pre-implementation check.
2. **ERC-8004 contract address on GOAT Testnet3** -- Required for Step 2. Cannot be inferred. Must come from GOAT docs (`docs.goat.network`). Needed before StepIdentity can be implemented.
3. **ERC-8004 minimal ABI** -- Need at minimum `balanceOf(address)` and event for registration detection. The registration flow (in-wizard vs external site) must also be confirmed from PROJECT.md or GOAT docs.
4. **x402 SDK adapter for Next.js** -- Must prototype `GoatX402` initialization in a Next.js API route handler. Confirm whether the SDK's request/response model can be adapted to Next.js `Request`/`Response` objects, or whether a raw HTTP client approach is needed instead.
5. **Tailwind 4 + shadcn/ui compatibility** -- Tailwind 4 changes the config format (CSS-first, no `tailwind.config.js`). Confirm shadcn/ui's `init` script handles Tailwind 4 at project initialization.
6. **GOAT Testnet3 RPC rate limits** -- Unknown rate limits on the public RPC (`https://rpc.testnet3.goat.network`). Directly affects the polling interval strategy for Steps 2 and 5. Use conservative intervals (5s+) as a default.
7. **@goathackbot Telegram command format** -- The exact DM payload format (what to send, what format the bot responds in) must be confirmed to generate accurate copy-to-clipboard content and proof-of-concept `.env` parsing.

---

## Sources (Aggregated)

| Source | Used By | Confidence |
|--------|---------|------------|
| PROJECT.md (primary specification) | All research files | HIGH -- direct authoritative source |
| wagmi v2 documentation | STACK, ARCHITECTURE, PITFALLS | MEDIUM -- training data, not live-verified |
| viem v2 documentation | STACK, ARCHITECTURE, PITFALLS | MEDIUM -- training data |
| Convex documentation (schema, queries, mutations, internalQuery, HTTP actions) | STACK, ARCHITECTURE, PITFALLS | MEDIUM -- training data |
| Next.js 15 App Router documentation | STACK, ARCHITECTURE | HIGH -- training data, stable API |
| RainbowKit 2.x documentation | STACK, FEATURES | HIGH -- training data |
| EIP-3085 (`wallet_addEthereumChain`) | PITFALLS | HIGH -- stable specification |
| EIP-3326 (`wallet_switchEthereumChain`) | PITFALLS | HIGH -- stable specification |
| EIP-4361 (Sign-In with Ethereum) | ARCHITECTURE, PITFALLS | HIGH -- stable specification |
| Web3 onboarding UX patterns (wagmi, RainbowKit, ConnectKit, Scaffold-ETH, thirdweb) | FEATURES | MEDIUM -- training data through early 2025 |
| Common Web3 hackathon failure patterns | PITFALLS | MEDIUM -- training data from ecosystem experience |

**Note:** Web search and WebFetch tools were unavailable during all four research sessions. No live verification of npm packages, GOAT Network docs, or current library APIs was possible. All GOAT-specific details (chain ID, RPC URL, contract addresses, SDK package names) are sourced from PROJECT.md and must be validated against `docs.goat.network` during Phase 1 setup.
