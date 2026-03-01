# Hello GOAT — Onboarding Wizard

## What This Is

A single-page onboarding wizard that takes a brand-new builder from zero to a live demo transaction on GOAT Testnet3 in under 2 minutes. It replaces the manual hackathon checklist with a guided 5-step experience, a troubleshooter panel for common failures, and a shareable proof page for judges.

## Core Value

Time-to-first-success under 2 minutes — a builder with no prior GOAT experience completes all setup and runs a live demo transaction, visibly safer than "paste keys into random places."

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 5-step checklist wizard (wallet → identity → payments → telegram → demo tx)
- [ ] Step 1: Wallet connection with "no wallet?" MetaMask setup flow + GOAT Testnet3 network switch
- [ ] Step 2: ERC-8004 identity registration/verification (deep link + status polling)
- [ ] Step 3: x402 merchant setup (guide user to DM @goathackbot, paste .env values into form)
- [ ] Step 4: Telegram agent wiring (generate DM payload for @goathackbot, confirm connection)
- [ ] Step 5: "Hello GOAT" demo transaction (canned end-to-end tx, shows request/response + tx hash + explorer deep link)
- [ ] Troubleshooter panel (detect wrong network, no funds, missing env vars, invalid callback URL, webhook not set)
- [ ] Shareable proof page (single URL: "This agent is live" + identity + last tx + payment receipt)
- [ ] Convex backend for storing builder progress keyed to wallet address
- [ ] Wallet-based authentication (wallet address = identity)

### Out of Scope

- OAuth / email-password auth — wallet-only is sufficient for hackathon context
- Mobile app — web-only, deployed to Vercel
- Real mainnet transactions — testnet only
- Automated credential provisioning via bot API — guide + paste approach instead
- Multi-language / i18n — English only for hackathon

## Context

**Hackathon context:** This is for the Goat Network Builder Hub hackathon. Builders who create an ERC-8004 identity, complete an x402 transaction, and join the Telegram group are eligible for prizes.

**GOAT Testnet3 reference:**
- Chain ID: 48816
- RPC: https://rpc.testnet3.goat.network
- Explorer: https://explorer.testnet3.goat.network
- Faucet: https://bridge.testnet3.goat.network/faucet
- USDC: 0x29d1ee93e9ecf6e50f309f498e40a6b42d352fa1
- USDT: 0xdce0af57e8f2ce957b3838cd2a2f3f3677965dd3

**Key primitives:**
- **ERC-8004** — Agent identity standard. Each agent gets a unique agentId (ERC-721 NFT) with name, description, services, and x402Support flag.
- **x402** — Pay-per-use HTTP payment standard. Server returns 402; client pays on-chain; server verifies and returns response. Uses USDC/USDT on GOAT Testnet3.
- **@goathackbot** — Telegram bot that provisions credentials: creates x402 merchant account, registers ERC-8004 identity, funds wallet with test tokens, and provides .env values.

**Wallet setup guidance (Step 1 "no wallet?" flow):**
1. Install MetaMask browser extension
2. Create a new wallet (save seed phrase)
3. Add GOAT Testnet3 manually: Network name: GOAT Testnet3, RPC URL: https://rpc.testnet3.goat.network, Chain ID: 48816, Currency: BTC, Explorer: https://explorer.testnet3.goat.network
4. Alternative: Any EVM wallet (Rabby, Coinbase Wallet, Rainbow) — just add the network config above

**x402 SDK integration (for demo transaction):**
```javascript
import { GoatX402 } from 'goatx402-sdk-server'
const x402 = new GoatX402({
  apiUrl: process.env.GOATX402_API_URL,
  apiKey: process.env.GOATX402_API_KEY,
  apiSecret: process.env.GOATX402_API_SECRET,
  merchantId: process.env.GOATX402_MERCHANT_ID,
})
app.use('/api/generate', x402.middleware({ amount: '0.1', symbol: 'USDC' }))
```

**Docs:** https://docs.goat.network/builders/quick-start

## Constraints

- **Tech stack**: Next.js (React) + Convex backend, deployed to Vercel
- **Timeline**: Hackathon — ship fast, polish later
- **Network**: GOAT Testnet3 only (Chain ID 48816)
- **Auth**: Wallet connect only — no email/password
- **Credential flow**: Guide + paste (user DMs @goathackbot, pastes .env values into wizard form)
- **Performance**: Time-to-first-success < 2 minutes for the demo transaction
- **Security**: No raw key pasting in plaintext — credentials stored securely in Convex

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Convex for backend | Manages credentials, login state, builder progress | — Pending |
| Wallet-only auth | Simplest for hackathon; wallet address is the natural identity on GOAT | — Pending |
| Guide + paste for credentials | Bot API not available for direct integration; guide user through DM flow | — Pending |
| Next.js on Vercel | Natural fit for SSR + Vercel deployment | — Pending |
| Single-page wizard (not multi-page) | Keeps all 5 steps visible, shows progress at a glance | — Pending |

---
*Last updated: 2026-02-28 after initialization*
