# Feature Landscape

**Domain:** Web3 developer onboarding wizard (hackathon context, GOAT Testnet3)
**Researched:** 2026-02-28

**Confidence note:** Web search and WebFetch tools were unavailable during this research. Findings are based on training knowledge of Web3 onboarding patterns (wagmi, RainbowKit, ConnectKit, Alchemy onboarding, thirdweb, Hardhat, Scaffold-ETH), wizard UX patterns, and the detailed project context in PROJECT.md. ERC-8004 and x402 are GOAT-specific primitives with limited public documentation -- findings on those are derived from the PROJECT.md specification. Overall confidence: MEDIUM for general Web3 UX patterns, LOW for GOAT-specific protocol details.

---

## Table Stakes

Features users expect. Missing = wizard feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Wallet connection (multi-provider)** | Every Web3 dApp starts here. If users cannot connect their wallet in one click, they leave. RainbowKit and ConnectKit have trained users to expect a polished modal. | Low | Use wagmi + RainbowKit or ConnectKit. Must support MetaMask, Rabby, Coinbase Wallet, WalletConnect. |
| **Network detection + auto-switch** | Users will be on mainnet or another testnet. Wizard must detect wrong network and offer one-click switch via `wallet_addEthereumChain` / `wallet_switchEthereumChain`. | Low | Chain ID 48816 is non-standard -- must provide full chain config (RPC, explorer, currency symbol BTC). |
| **"No wallet?" install guide** | Hackathon audience includes Web2 developers with zero wallet experience. Without this, you lose 30-50% of builders. | Low | Link to MetaMask install + brief setup instructions. Detect whether MetaMask extension is present via `window.ethereum`. |
| **Linear step progress indicator** | Users need to see where they are and what is left. Stepper/progress bar is table stakes for any multi-step wizard. | Low | 5-step horizontal stepper. Steps should show completed/current/upcoming states. |
| **Step completion persistence** | If users refresh, close tab, or come back later, progress must survive. Losing progress = rage quit. | Medium | Convex backend keyed to wallet address. Also use localStorage as fallback for in-flight state. |
| **Credential input form with validation** | Users paste .env values from @goathackbot DM. Form must validate format before saving (non-empty, expected patterns for API keys, merchant IDs). | Low | Mask sensitive values after entry. Clear error messages for malformed input. |
| **Copy-to-clipboard for bot commands** | User must DM @goathackbot with specific commands. Requiring them to manually type commands is friction that causes drop-off. | Low | Single-click copy button for each command payload. Visual feedback (checkmark) on copy. |
| **Demo transaction execution with visible result** | The entire wizard exists for this moment. User clicks "Send Demo Transaction" and sees: request, response, tx hash, explorer link. If this feels anticlimactic, the wizard failed. | High | Must show the full lifecycle: 402 challenge, payment, response. Link to block explorer for verification. |
| **Error detection + troubleshooter** | Wrong network, no funds, missing env vars, invalid credentials -- users WILL hit these. Without inline error handling, support channels drown. | Medium | Detect common failures and surface actionable fixes. See dedicated troubleshooter section below. |
| **Explorer deep links** | After any on-chain action (identity registration, demo tx), link directly to the transaction on the GOAT Testnet3 explorer. Without this, users cannot verify anything happened. | Low | Template: `https://explorer.testnet3.goat.network/tx/{hash}` |

---

## Differentiators

Features that set this wizard apart from generic onboarding. Not expected, but create delight and competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Shareable proof page** | A single URL that shows "This agent is live" with identity, last tx, and payment receipt. Builders show judges. Judges verify without running anything. This is the hackathon killer feature. | Medium | Static-ish page generated per wallet address. Must be publicly accessible without wallet connection. Include: agent name, agentId (NFT), ERC-8004 metadata, last demo tx hash + timestamp, payment receipt. |
| **Under-2-minute timer / progress tracker** | Show elapsed time prominently. "You completed onboarding in 1:47" creates a shareable moment and validates the product promise. Gamification without being gimmicky. | Low | Start timer on wallet connect. Stop on demo tx success. Display final time on proof page. |
| **Inline troubleshooter panel (not just error messages)** | Go beyond "Error: wrong network" -- provide a collapsible diagnostic panel that runs checks: network correct? Funds available? Env vars set? Identity registered? Each check green/red with fix button. | Medium | Run diagnostics on demand or when a step fails. Each check is independent. Fix buttons trigger the corrective action (switch network, open faucet, etc.). |
| **Faucet integration link with balance display** | Show current testnet balance in the wizard. When balance is zero, surface a direct link to the GOAT faucet with pre-filled address. After funding, auto-detect balance change. | Medium | Poll balance via `eth_getBalance` on the GOAT Testnet3 RPC. Show both native BTC and USDC/USDT balances (relevant for x402 payments). |
| **Animated transaction lifecycle visualization** | Instead of just showing a spinner, visualize the x402 flow: Client Request -> 402 Response -> On-chain Payment -> Server Verification -> Response Delivered. Each step lights up in sequence. | Medium | Makes the x402 protocol tangible and educational. Builders understand what they just built, not just that it worked. |
| **Pre-filled deep link to @goathackbot** | Instead of saying "DM @goathackbot", provide a `https://t.me/goathackbot?start=...` deep link that opens Telegram directly to the bot with a pre-filled start command containing the user's wallet address. | Low | Reduces friction from "open Telegram, find bot, type command" to "click link, confirm." |
| **Step-specific contextual help** | Each step gets a collapsible "What is this?" section explaining the concept (What is ERC-8004? What is x402? Why do I need a Telegram bot?). Educates without blocking progress. | Low | Short explanations (3-4 sentences each). Link to full docs for deep dives. Collapsed by default so experienced users skip them. |
| **Credential validation with live API check** | After user pastes x402 credentials, ping the API to verify they work before proceeding. Catches typos and expired credentials immediately rather than at demo transaction time. | Medium | Make a lightweight health-check call to the x402 API with the provided credentials. Show green checkmark or specific error. |
| **Confetti / success celebration on demo tx** | When the demo transaction succeeds, trigger a brief confetti animation. Sounds trivial but hackathon builders screenshot and share success moments. Every screenshot is marketing. | Low | Use canvas-confetti library (tiny, no deps). Trigger once on demo tx confirmation. |

---

## Anti-Features

Features to explicitly NOT build. Each would waste time, add complexity, or harm the experience.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Automated bot API integration** | PROJECT.md explicitly scopes this out. The bot API is not available for direct integration. Building an unofficial integration would be fragile and could break at any time. | Guide + paste: Show the user what to DM, let them copy commands, then paste the response values into the wizard form. |
| **OAuth / email-password authentication** | Adds significant complexity (session management, password reset, email verification) for zero benefit. The user already has a wallet -- that IS their identity. | Wallet-only auth. Wallet address = user ID in Convex. Sign-in-with-Ethereum (SIWE) if message signing is needed. |
| **Multi-chain support** | This wizard is exclusively for GOAT Testnet3. Supporting multiple chains adds configuration complexity and confuses the single-network narrative. | Hardcode Chain ID 48816. If user is on wrong network, prompt switch. No chain selector dropdown. |
| **Custom wallet adapter / connection flow** | Reinventing wallet connection UX is a deep rabbit hole (mobile wallets, deep links, QR codes, edge cases). Libraries solve this completely. | Use wagmi + RainbowKit. They handle every edge case and users recognize the UI. |
| **Real mainnet transactions** | Testnet only per scope. Mainnet would require real money handling, compliance concerns, and error recovery for lost funds. | Lock to testnet. Make it visually obvious (testnet badge, testnet colors) so nobody mistakes it for mainnet. |
| **Credential storage in browser (localStorage for secrets)** | API keys and merchant secrets in localStorage are trivially extractable. In a hackathon context, someone will inspect and find them. | Store credentials in Convex backend, encrypted at rest. Only send to client when needed for API calls. Better: proxy x402 calls through a Next.js API route so credentials never reach the browser. |
| **Mobile-responsive wizard** | Hackathon builders code on laptops. MetaMask is a browser extension. Mobile wallet connection adds significant complexity. Zero ROI for this context. | Desktop-only layout. Responsive enough to not break on smaller laptop screens (1280px+) but do not invest in mobile breakpoints. |
| **Multi-language / i18n** | English-only hackathon. i18n infrastructure adds complexity to every string in the app. | Hardcode English strings. No translation keys, no locale detection. |
| **Leaderboard / competitive features** | Turns collaborative hackathon vibes into competition. Also requires real-time sync infrastructure, anti-gaming measures, and moderation. | The proof page serves the "show off" need without creating competition. |
| **Automated retry / recovery for failed transactions** | Transaction failures on testnet are usually config errors, not transient failures. Auto-retry masks the real problem and burns test tokens. | Surface the error clearly in the troubleshooter. Guide user to fix the root cause. Provide a manual "Try Again" button. |
| **Video tutorials / embedded walkthroughs** | Video production takes days, becomes stale immediately, and cannot be searched or skimmed. Text + screenshots win for developer tools. | Concise text instructions with copy-to-clipboard code snippets. Each step is short enough to not need a video. |

---

## Feature Dependencies

```
Wallet Connection (Step 1)
  |
  +---> Network Switch (auto-prompted if wrong chain)
  |       |
  |       +---> Balance Check / Faucet Link
  |
  +---> ERC-8004 Identity Registration (Step 2)
  |       |
  |       +---> Identity Verification (polling for on-chain confirmation)
  |
  +---> x402 Credential Setup (Step 3)
  |       |
  |       +---> Credential Validation (live API check)
  |       |
  |       +---> Telegram Bot Wiring (Step 4)
  |               |
  |               +---> Bot DM deep link generation
  |               +---> Connection confirmation
  |
  +---> Demo Transaction (Step 5) -- requires Steps 1-4 complete
          |
          +---> Transaction Lifecycle Visualization
          +---> Explorer Deep Link
          +---> Proof Page Generation
          +---> Success Celebration

Troubleshooter Panel -- runs independently, checks all steps
Progress Persistence -- runs in background across all steps
Timer -- starts at Step 1, ends at Step 5
```

**Key dependency insight:** Steps 1-4 are strictly linear. Each step requires the previous step's output. The demo transaction (Step 5) is the capstone that exercises everything. The proof page requires Step 5 completion. The troubleshooter is orthogonal -- it can run at any point.

**Critical path:** Wallet connect -> Identity registration -> x402 credentials -> Telegram wiring -> Demo tx -> Proof page. Any block in this chain stops the entire wizard. The troubleshooter's job is to unblock this chain.

---

## Detailed Feature Specifications

### Step 1: Wallet Connection + Network Setup

**Sub-features:**
1. Connect wallet button (RainbowKit modal)
2. Detect if MetaMask/any injected provider is present
3. "No wallet?" expandable guide (install MetaMask, create wallet, save seed phrase)
4. Network detection: check if connected to Chain ID 48816
5. Auto-prompt network switch via `wallet_addEthereumChain`
6. Display connected address (truncated) and network name
7. Balance display: native BTC + USDC + USDT on GOAT Testnet3
8. Faucet link when balance is zero: `https://bridge.testnet3.goat.network/faucet`

**Completion criteria:** Wallet connected to GOAT Testnet3 with non-zero balance.

### Step 2: ERC-8004 Identity Registration

**Sub-features:**
1. Explain what ERC-8004 is (collapsible)
2. Check if wallet already has an agentId (query ERC-8004 registry contract)
3. If no identity: guide to register (deep link or in-wizard form)
4. Poll for on-chain confirmation of identity NFT
5. Display registered identity: name, agentId, services
6. Explorer link to the identity NFT

**Completion criteria:** Wallet has a registered ERC-8004 agentId confirmed on-chain.

### Step 3: x402 Merchant Setup

**Sub-features:**
1. Explain what x402 is (collapsible)
2. Generate DM payload for @goathackbot (copy-to-clipboard)
3. Telegram deep link to @goathackbot
4. Form to paste returned .env values: API_URL, API_KEY, API_SECRET, MERCHANT_ID
5. Input validation (non-empty, expected formats)
6. Live credential verification (API health check)
7. Secure storage to Convex backend

**Completion criteria:** Valid x402 credentials stored and verified.

### Step 4: Telegram Agent Wiring

**Sub-features:**
1. Explain why Telegram bot is needed (collapsible)
2. Generate DM payload for @goathackbot with wallet address
3. Telegram deep link with pre-filled command
4. Confirmation polling or manual "I've done this" button
5. Display connection status

**Completion criteria:** Telegram bot connection confirmed.

### Step 5: Demo Transaction ("Hello GOAT")

**Sub-features:**
1. Pre-flight check: verify Steps 1-4 are complete
2. "Send Demo Transaction" button (prominent, primary CTA)
3. Transaction lifecycle visualization (402 -> pay -> verify -> response)
4. Loading state with step-by-step progress
5. Success display: request body, response body, tx hash, explorer link, payment amount
6. Error display: what went wrong, troubleshooter link
7. Confetti celebration on success
8. Timer stop + elapsed time display
9. "View Your Proof Page" CTA button

**Completion criteria:** Successful x402 demo transaction with visible tx hash.

### Troubleshooter Panel

**Sub-features (diagnostic checks):**
1. Network check: connected to Chain ID 48816?
2. Balance check: has native BTC for gas? Has USDC/USDT for x402 payment?
3. Identity check: ERC-8004 agentId registered?
4. Credential check: x402 env vars present and valid?
5. Telegram check: bot connection confirmed?
6. Each check shows: green (pass), red (fail) with fix action button

**Activation:** Always accessible via a floating "Need Help?" button. Auto-opens on any step failure.

### Shareable Proof Page

**Sub-features:**
1. Unique URL per wallet: `/proof/{walletAddress}` or `/proof/{agentId}`
2. Publicly accessible (no wallet connection required to view)
3. Displays: agent name, agentId, ERC-8004 metadata, last demo tx hash + timestamp, payment receipt, elapsed onboarding time
4. "This agent is live on GOAT Testnet3" badge
5. Open Graph meta tags for rich link previews when shared on Twitter/Discord/Telegram
6. Copy link button

**Completion criteria:** Accessible at a shareable URL after Step 5 completion.

---

## MVP Recommendation

**Prioritize (must ship):**
1. Wallet connection with network switch (Step 1) -- gate to everything else
2. ERC-8004 identity registration flow (Step 2) -- hackathon requirement
3. x402 credential paste form with basic validation (Step 3) -- hackathon requirement
4. Telegram bot DM flow with copy-to-clipboard (Step 4) -- hackathon requirement
5. Demo transaction execution with result display (Step 5) -- the whole point
6. Linear progress stepper -- users must see where they are
7. Progress persistence in Convex -- losing progress kills the experience
8. Basic error messages per step -- without these, support load is unbearable

**Prioritize (high-value, low-effort):**
9. Explorer deep links -- trivial to add, big usability win
10. Copy-to-clipboard for bot commands -- trivial, massive friction reduction
11. Shareable proof page (basic version) -- judges need this, it is the deliverable

**Defer (nice-to-have, add if time permits):**
- Animated transaction lifecycle visualization -- impressive but not blocking
- Under-2-minute timer -- fun but cosmetic
- Credential live API validation -- catches errors early but basic validation covers 80%
- Confetti on success -- delightful but 30 seconds to add at the end
- Inline troubleshooter panel (full diagnostic mode) -- basic error messages cover MVP; full panel is a polish feature
- Step-specific contextual help -- experienced builders skip it; add after core flow works
- Faucet balance auto-detection -- manual check works fine
- Open Graph meta tags for proof page -- add last, pure polish

---

## Sources

- Project specification: `/Users/wesleyw/Documents/GitHub/GOAT-1/.planning/PROJECT.md`
- GOAT Testnet3 docs reference: `https://docs.goat.network/builders/quick-start` (referenced in PROJECT.md but not fetched; web tools unavailable)
- Web3 onboarding pattern knowledge: Based on training data covering wagmi, RainbowKit, ConnectKit, Scaffold-ETH, thirdweb, Alchemy onboarding flows through early 2025

**Confidence levels:**
- General Web3 wallet/wizard UX patterns: HIGH (well-established patterns, unlikely to have changed)
- GOAT-specific ERC-8004 details: LOW (GOAT-specific standard; details sourced from PROJECT.md only)
- GOAT-specific x402 protocol details: LOW (GOAT-specific protocol; details sourced from PROJECT.md only)
- Feature prioritization for hackathon context: HIGH (hackathon onboarding is a well-understood problem space)
- Dependency ordering: HIGH (follows directly from the 5-step sequential design in PROJECT.md)
