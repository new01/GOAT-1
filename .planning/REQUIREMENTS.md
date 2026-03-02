# Requirements: Hello GOAT — Onboarding Wizard

**Defined:** 2026-02-28
**Core Value:** Time-to-first-success under 2 minutes — builder sets up OpenClaw agent on GOAT with identity, payments, and Telegram, then runs a live demo transaction.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Wallet & Network

- [x] **WALL-01**: User can connect wallet via RainbowKit modal (MetaMask, Rabby, Coinbase Wallet, WalletConnect)
- [x] **WALL-02**: Wizard detects wrong network and prompts one-click switch to GOAT Testnet3 (chain ID 48816)
- [x] **WALL-03**: User without a wallet sees "No wallet?" guide with MetaMask install steps and GOAT Testnet3 network config
- [x] **WALL-04**: Connected wallet address and network name displayed after successful connection
- [x] **WALL-05**: User can see BTC, USDC, and USDT balances on GOAT Testnet3 with faucet link when any balance is zero

### Identity (ERC-8004)

- [ ] **IDEN-01**: Wizard checks if connected wallet already has an ERC-8004 agentId on GOAT Testnet3
- [ ] **IDEN-02**: User without identity is guided to register via deep link to registration site
- [ ] **IDEN-03**: Wizard polls on-chain for identity registration confirmation (5s interval, exponential backoff to 30s)
- [ ] **IDEN-04**: Registered identity displayed with name, agentId, and services
- [ ] **IDEN-05**: Explorer link shown for the identity NFT on GOAT Testnet3

### Payments (x402)

- [ ] **PAY-01**: Wizard generates copy-to-clipboard DM payload for @goathackbot with user's wallet address and project info
- [ ] **PAY-02**: Telegram deep link opens @goathackbot directly for credential provisioning
- [ ] **PAY-03**: User can paste .env values (GOATX402_API_URL, GOATX402_API_KEY, GOATX402_API_SECRET, GOATX402_MERCHANT_ID) into a form with auto-parse of full .env blocks
- [ ] **PAY-04**: Form validates credential format (non-empty, expected patterns) with clear error messages
- [ ] **PAY-05**: Credentials stored securely in Convex backend — never exposed to browser (internalQuery only)

### Telegram

- [ ] **TELE-01**: Wizard generates DM payload for @goathackbot with wallet address for Telegram bot wiring
- [ ] **TELE-02**: Pre-filled Telegram deep link (`t.me/goathackbot?start=...`) for one-click bot connection
- [ ] **TELE-03**: User can confirm Telegram connection via "I've done this" button

### OpenClaw Agent Setup

- [ ] **CLAW-01**: Wizard asks user if they already have OpenClaw installed (simple yes/no question, no autodetection)
- [ ] **CLAW-02**: Users without OpenClaw see step-by-step install guide (`npm install -g openclaw@latest`, `openclaw onboard --install-daemon`)
- [ ] **CLAW-03**: Wizard provides OpenClaw configuration instructions to connect agent to GOAT Testnet3 for the demo transaction
- [ ] **CLAW-04**: User's OpenClaw agent is configured to execute the test x402 transaction on GOAT

### Demo Transaction

- [ ] **DEMO-01**: Pre-flight checklist validates all prior steps are complete before enabling "Send Demo Transaction" button
- [ ] **DEMO-02**: User clicks "Hello GOAT" button to execute a canned x402 transaction via server-side API route
- [ ] **DEMO-03**: Full transaction lifecycle displayed: request body, 402 challenge, on-chain payment, server verification, response
- [ ] **DEMO-04**: Transaction hash and explorer deep link shown after successful transaction
- [ ] **DEMO-05**: Confetti celebration animation triggers on successful demo transaction
- [ ] **DEMO-06**: Elapsed time displayed ("Completed in 1:47") from wallet connect to demo tx success

### Wizard UX

- [x] **WIZ-01**: 5-step horizontal progress stepper showing completed/current/upcoming states
- [x] **WIZ-02**: Step completion persisted in Convex keyed to wallet address — progress survives page refresh
- [x] **WIZ-03**: All steps visible in sidebar at all times; only current step is interactive
- [x] **WIZ-04**: Basic inline error messages per step with actionable fix instructions
- [ ] **WIZ-05**: Copy-to-clipboard buttons for all bot command payloads with visual feedback

### Proof Page

- [ ] **PROOF-01**: Shareable proof page at `/proof/{walletAddress}` accessible without wallet connection
- [ ] **PROOF-02**: Page displays: agent name, agentId, ERC-8004 metadata, last demo tx hash + timestamp, elapsed onboarding time
- [ ] **PROOF-03**: "This agent is live on GOAT Testnet3" badge visible on proof page
- [ ] **PROOF-04**: Copy-link button for easy sharing

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Diagnostics

- **DIAG-01**: Full troubleshooter diagnostic panel with per-check fix buttons (network, balance, identity, credentials, telegram)
- **DIAG-02**: Animated x402 transaction lifecycle visualization (402 → pay → verify → response with step-by-step animation)
- **DIAG-03**: Credential live API health check (ping x402 API to verify credentials work before demo tx)

### OpenClaw Advanced

- **CLAW-05**: Heartbeat configuration for GOAT monitoring (configure 30min heartbeat interval)
- **CLAW-06**: HEARTBEAT.md template generation for GOAT agent monitoring checklist

### Polish

- **POL-01**: Open Graph meta tags on proof page for rich link previews (Twitter, Discord, Telegram)
- **POL-02**: Dynamic OG image generation via `/api/og` endpoint
- **POL-03**: Step-specific contextual help panels (collapsible "What is ERC-8004?" etc.)
- **POL-04**: Under-2-minute countdown timer (visual pressure element)

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth / email-password auth | Wallet-only is sufficient for hackathon; wallet IS the identity |
| Mobile-responsive layout | Hackathon builders use laptops + browser extensions |
| Multi-chain support | GOAT Testnet3 only; hardcode chain ID 48816 |
| Automated bot API integration | Bot API not available; guide + paste instead |
| Real mainnet transactions | Testnet only — no real funds at stake |
| Video tutorials | Text + copy-to-clipboard is faster and searchable |
| Leaderboard / competitive features | Proof page serves "show off" need without competition |
| Automated transaction retry | Masks root cause; guide users to fix instead |
| localStorage for secrets | Trivially extractable; use Convex server-side only |
| Multi-language / i18n | English only for hackathon |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WALL-01 | Phase 2 | Complete |
| WALL-02 | Phase 2 | Complete |
| WALL-03 | Phase 2 | Complete |
| WALL-04 | Phase 2 | Complete |
| WALL-05 | Phase 2 | Complete |
| IDEN-01 | Phase 3 | Pending |
| IDEN-02 | Phase 3 | Pending |
| IDEN-03 | Phase 3 | Pending |
| IDEN-04 | Phase 3 | Pending |
| IDEN-05 | Phase 3 | Pending |
| PAY-01 | Phase 3 | Pending |
| PAY-02 | Phase 3 | Pending |
| PAY-03 | Phase 3 | Pending |
| PAY-04 | Phase 3 | Pending |
| PAY-05 | Phase 3 | Pending |
| TELE-01 | Phase 4 | Pending |
| TELE-02 | Phase 4 | Pending |
| TELE-03 | Phase 4 | Pending |
| CLAW-01 | Phase 4 | Pending |
| CLAW-02 | Phase 4 | Pending |
| CLAW-03 | Phase 4 | Pending |
| CLAW-04 | Phase 4 | Pending |
| DEMO-01 | Phase 4 | Pending |
| DEMO-02 | Phase 4 | Pending |
| DEMO-03 | Phase 4 | Pending |
| DEMO-04 | Phase 4 | Pending |
| DEMO-05 | Phase 4 | Pending |
| DEMO-06 | Phase 4 | Pending |
| WIZ-01 | Phase 1 | Complete |
| WIZ-02 | Phase 1 | Complete |
| WIZ-03 | Phase 1 | Complete |
| WIZ-04 | Phase 2 | Complete |
| WIZ-05 | Phase 3 | Pending |
| PROOF-01 | Phase 5 | Pending |
| PROOF-02 | Phase 5 | Pending |
| PROOF-03 | Phase 5 | Pending |
| PROOF-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 after roadmap creation*
