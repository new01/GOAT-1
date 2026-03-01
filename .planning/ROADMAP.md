# Roadmap: Hello GOAT -- Onboarding Wizard

## Overview

This roadmap takes a builder from an empty project to a fully functional 5-step onboarding wizard on GOAT Testnet3. The build follows strict dependency order: foundation and wizard shell first (everything depends on providers, schema, and step orchestration), then wallet connection (every subsequent step requires a connected wallet), then identity and payment credential collection (both are demo tx prerequisites), then Telegram wiring, OpenClaw agent setup, and the climactic demo transaction, and finally the shareable proof page that gives judges a single URL to verify completion. Each phase delivers a coherent, testable capability. The x402 SDK is spiked in Phase 1 to surface the biggest technical unknown before anything depends on it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Wizard Shell** - Next.js + Convex + chain config + provider stack + 5-step wizard shell with persistence
- [ ] **Phase 2: Wallet Connection** - RainbowKit wallet connect, network detection/switch, balance display, no-wallet guide
- [ ] **Phase 3: Identity + Payment Credentials** - ERC-8004 identity registration/polling and x402 credential paste/storage
- [ ] **Phase 4: Telegram + OpenClaw + Demo Transaction** - Telegram bot wiring, OpenClaw agent setup, and end-to-end demo tx execution
- [ ] **Phase 5: Proof Page** - Shareable proof page for judges with agent status and transaction history

## Phase Details

### Phase 1: Foundation + Wizard Shell
**Goal**: A running Next.js app with Convex backend, GOAT Testnet3 chain config, provider stack, and a 5-step wizard shell that persists progress -- plus a verified x402 SDK spike confirming the demo transaction approach works
**Depends on**: Nothing (first phase)
**Requirements**: WIZ-01, WIZ-02, WIZ-03
**Success Criteria** (what must be TRUE):
  1. Developer can run `npm run dev` and see a 5-step horizontal progress stepper with all steps visible in a sidebar
  2. Convex backend is deployed with a `builders` table and schema; step completion persists across page refreshes when keyed to a wallet address
  3. GOAT Testnet3 chain config (chain ID 48816, RPC, explorer, token addresses) is defined in a single constants file and used by the provider stack
  4. A test Next.js API route successfully initializes the x402 SDK and handles a request/response cycle (spike -- confirms the approach for Phase 4)
**Plans**: 3 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md -- Project scaffold (Next.js + Convex + deps + chain config + provider stack + Convex schema)
- [x] 01-02-PLAN.md -- Wizard shell UI (5-step sidebar, header, step animations, step registry) + x402 spike API route
- [x] 01-03-PLAN.md -- Convex persistence wiring (connect wizard to Convex backend) + visual verification checkpoint

### Phase 2: Wallet Connection
**Goal**: Users can connect their wallet, land on GOAT Testnet3, see their balances, and get help if they have no wallet -- completing Step 1 of the wizard
**Depends on**: Phase 1
**Requirements**: WALL-01, WALL-02, WALL-03, WALL-04, WALL-05, WIZ-04
**Success Criteria** (what must be TRUE):
  1. User can connect a wallet via RainbowKit modal (MetaMask, Rabby, Coinbase Wallet, WalletConnect) and see their wallet address and network name displayed
  2. User on the wrong network sees a prompt and can one-click switch to GOAT Testnet3 (chain ID 48816)
  3. User without any wallet sees a "No wallet?" guide with MetaMask install steps and manual GOAT Testnet3 network configuration
  4. User can see BTC, USDC, and USDT balances on GOAT Testnet3 with a faucet link when any balance is zero
  5. Inline error messages appear with actionable fix instructions when wallet connection or network switching fails
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Identity + Payment Credentials
**Goal**: Users can register their ERC-8004 agent identity and provide x402 merchant credentials -- completing Steps 2 and 3 of the wizard
**Depends on**: Phase 2
**Requirements**: IDEN-01, IDEN-02, IDEN-03, IDEN-04, IDEN-05, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, WIZ-05
**Success Criteria** (what must be TRUE):
  1. Wizard detects whether the connected wallet already has an ERC-8004 identity on GOAT Testnet3 and displays it if found (name, agentId, services, explorer link)
  2. User without an identity sees a deep link to the registration site, and the wizard polls on-chain (5s interval with exponential backoff to 30s) until registration is confirmed
  3. User can copy a pre-generated DM payload for @goathackbot to their clipboard, open the bot via Telegram deep link, and paste .env credential values into a form that auto-parses full .env blocks
  4. Credential form validates format (non-empty, expected patterns) with clear error messages, and credentials are stored securely in Convex (never exposed to browser -- internalQuery only)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Telegram + OpenClaw + Demo Transaction
**Goal**: Users can wire their Telegram bot, set up their OpenClaw agent, and execute a live "Hello GOAT" demo transaction that exercises the full stack -- completing Steps 4 and 5 of the wizard
**Depends on**: Phase 3
**Requirements**: TELE-01, TELE-02, TELE-03, CLAW-01, CLAW-02, CLAW-03, CLAW-04, DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05, DEMO-06
**Success Criteria** (what must be TRUE):
  1. User can generate a Telegram DM payload, open @goathackbot via pre-filled deep link, and confirm connection via "I've done this" button
  2. User can determine if they have OpenClaw installed, see step-by-step install/configuration instructions if not, and configure their agent to connect to GOAT Testnet3
  3. Pre-flight checklist validates all prior steps (wallet, identity, credentials, Telegram, OpenClaw) are complete before enabling the "Send Demo Transaction" button
  4. User clicks "Hello GOAT" and sees the full transaction lifecycle: request body, 402 challenge, on-chain payment, server verification, response, transaction hash, and explorer deep link
  5. Confetti animation triggers on successful demo transaction and elapsed time from wallet connect to completion is displayed
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Proof Page
**Goal**: Builders have a shareable URL that proves their agent is live on GOAT Testnet3 -- judges can verify completion without running any code
**Depends on**: Phase 4
**Requirements**: PROOF-01, PROOF-02, PROOF-03, PROOF-04
**Success Criteria** (what must be TRUE):
  1. A public page at `/proof/{walletAddress}` is accessible without wallet connection and displays agent name, agentId, ERC-8004 metadata, last demo tx hash with timestamp, and elapsed onboarding time
  2. Page shows a visible "This agent is live on GOAT Testnet3" badge
  3. User can copy the proof page URL with a single click for easy sharing
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Wizard Shell | 3/3 | Complete | 2026-02-28 |
| 2. Wallet Connection | 0/2 | Not started | - |
| 3. Identity + Payment Credentials | 0/2 | Not started | - |
| 4. Telegram + OpenClaw + Demo Transaction | 0/3 | Not started | - |
| 5. Proof Page | 0/1 | Not started | - |
