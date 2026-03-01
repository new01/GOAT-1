# Domain Pitfalls

**Domain:** Web3 onboarding wizard (wallet connect, testnet switching, credential management, on-chain polling, demo transactions)
**Project:** Hello GOAT -- Onboarding Wizard
**Researched:** 2026-02-28
**Overall confidence:** MEDIUM (based on training data for wagmi/viem, Convex, and EVM wallet patterns; web verification tools were unavailable)

---

## Critical Pitfalls

Mistakes that cause rewrites, security incidents, or a broken onboarding flow.

---

### Pitfall 1: Exposing Merchant Secrets in the Browser

**What goes wrong:** The x402 merchant credentials (`GOATX402_API_KEY`, `GOATX402_API_SECRET`, `GOATX402_MERCHANT_ID`) get stored in Convex and then fetched into React components for the demo transaction. Since Convex queries run client-side by default, these secrets end up in the browser's network tab, localStorage, or JavaScript bundle. Anyone inspecting the page can steal them and impersonate the merchant.

**Why it happens:** Convex queries are designed for real-time reactivity and run from the client. Developers new to Convex assume "backend" means "server-only," but Convex queries are callable from the browser. The x402 SDK snippet in PROJECT.md (`new GoatX402({...})`) uses `process.env`, implying server-side usage, but a wizard that "stores credentials in Convex" can easily leak them to the client.

**Consequences:**
- Merchant API secrets visible in browser DevTools (Network tab, Convex WebSocket frames)
- Stolen credentials allow unauthorized charges or identity impersonation
- Hackathon judges who inspect the app see a critical security flaw

**Prevention:**
- Store merchant secrets in Convex but NEVER return them to the client via queries. Use Convex `internalQuery` or `internalMutation` patterns for secret access.
- The demo transaction endpoint must be a Next.js API route (or Convex HTTP action) that reads secrets server-side, calls the x402 SDK, and returns only the transaction result to the browser.
- Convex table-level access: add a `credentials` table with NO public query functions. Only internal functions or HTTP actions should read from it.
- For the wizard UI, store a boolean `hasCredentials: true/false` on the builder's progress record -- never the actual values.
- Use Convex environment variables (`npx convex env set`) for shared secrets that should never leave the server.

**Detection (warning signs):**
- Any Convex `query` or `mutation` function that returns fields like `apiKey`, `apiSecret`, or `merchantId`
- React component that renders or logs credential values
- Network tab showing credential data in Convex WebSocket messages

**Phase relevance:** Must be addressed in Phase 1 (architecture) before any credential storage is implemented. Retrofitting is painful.

---

### Pitfall 2: Wallet Connection State Machine Gaps

**What goes wrong:** The wallet connection flow has at least 6 distinct states: no wallet installed, wallet installed but locked, wallet connected to wrong network, wallet connected to correct network, user rejected connection, and connection lost mid-session. Most implementations handle 2-3 of these and break silently on the rest. The wizard shows "Connected" but the user is actually on Ethereum mainnet, or shows "Connect Wallet" when the wallet is locked (not absent).

**Why it happens:** Libraries like wagmi abstract wallet connection into `useConnect` / `useAccount`, but the edge cases (wrong chain, rejected request, wallet locked vs absent) require explicit handling. Developers test the happy path (MetaMask installed, user clicks approve) and never encounter the error states until real users hit them.

**Consequences:**
- User sees "Connected" but subsequent steps fail silently because they are on the wrong chain
- "Connect Wallet" button does nothing because MetaMask is locked (no error shown)
- User rejects the connection popup, and the wizard provides no recovery path
- Page refresh loses connection state; user has to start over

**Prevention:**
- Model wallet state explicitly as a state machine with these states: `NO_WALLET`, `WALLET_LOCKED`, `CONNECTING`, `WRONG_NETWORK`, `SWITCHING_NETWORK`, `CONNECTED`, `ERROR`
- Use wagmi's `useAccount` + `useChainId` together. A connected wallet on the wrong chain is NOT "connected" for wizard purposes.
- Handle `UserRejectedRequestError` explicitly with a "Try again" prompt and explanation
- Detect "no wallet" by checking `window.ethereum === undefined` separately from "wallet not connected"
- Use wagmi's `reconnect` on page load to restore previous sessions
- Persist wizard step progress in Convex (keyed to wallet address) so users can resume after page refresh

**Detection (warning signs):**
- Testing only with MetaMask pre-installed and pre-connected
- No error boundary or error state in the wallet connection component
- `useChainId()` not checked after `useAccount()` reports connected

**Phase relevance:** Phase 1 (wallet connection step). Must be the first thing built correctly since every subsequent step depends on it.

---

### Pitfall 3: `wallet_addEthereumChain` / `wallet_switchEthereumChain` Silent Failures

**What goes wrong:** When the wizard tries to switch the user to GOAT Testnet3 (Chain ID 48816), the RPC calls `wallet_switchEthereumChain` and `wallet_addEthereumChain` can fail silently, throw inconsistent errors across wallets, or succeed but not actually switch. MetaMask, Rabby, and Coinbase Wallet all handle these calls differently. Some wallets show a popup that users dismiss without reading. Some throw error code 4902 (chain not added), others throw -32603 (internal error), and some resolve the promise but do not switch.

**Why it happens:** The EIP-3085 (`wallet_addEthereumChain`) and EIP-3326 (`wallet_switchEthereumChain`) specs leave error handling to wallet implementations. There is no standardized error code for "user closed the popup." Wagmi's `useSwitchChain` wraps this but still surfaces wallet-specific error objects.

**Consequences:**
- User clicks "Switch to GOAT Testnet3," nothing visible happens, wizard appears broken
- Chain added but not switched to -- user proceeds on wrong network
- RPC URL rejected by wallet (some wallets validate RPC endpoints before adding)
- Custom testnet networks with non-standard chain IDs trigger extra security warnings in some wallets

**Prevention:**
- After calling `switchChain`, poll `useChainId()` for 2-3 seconds to confirm the switch actually happened. Do not trust the resolved promise alone.
- Provide manual fallback instructions: "If automatic switching didn't work, add GOAT Testnet3 manually" with copy-paste RPC details (already in PROJECT.md).
- Wrap the switch call in try/catch with specific handling for error codes: 4902 (add chain first, then switch), 4001 (user rejected -- show retry), -32603 (show manual instructions).
- Test with at least MetaMask and one alternative wallet (Rabby recommended -- it handles chain switching differently).
- Show the current chain name/ID in the UI so users can verify they are on the right network.

**Detection (warning signs):**
- No fallback UI for manual network addition
- No chain ID verification after the switch call resolves
- Only tested with one wallet extension

**Phase relevance:** Phase 1 (wallet connection step, network switching substep).

---

### Pitfall 4: Convex Auth Without a Standard Auth Provider

**What goes wrong:** The project uses "wallet-only auth" where the wallet address IS the identity. But Convex's built-in auth system expects a JWT-based auth provider (Clerk, Auth0, etc.). Without one, developers either skip Convex auth entirely (making all data publicly readable/writable) or try to roll custom auth by passing wallet addresses as function arguments (which any client can spoof).

**Why it happens:** Convex documentation focuses on Clerk/Auth0 integration. "Wallet address = identity" is a valid Web3 pattern but does not map cleanly to Convex's auth model. The temptation is to just pass `walletAddress` as a string argument to mutations and use it as the user identifier, but any client can call that mutation with any wallet address.

**Consequences:**
- Any user can read/write any other user's progress data by calling Convex functions with a spoofed wallet address
- Merchant credentials stored per-user become accessible to anyone who guesses a wallet address
- No way to distinguish authenticated requests from unauthenticated ones

**Prevention:**
- Implement SIWE (Sign-In With Ethereum) to verify wallet ownership. The flow: user signs a message with their wallet, the signed message is verified server-side (in a Convex HTTP action or Next.js API route), and a session token or Convex auth token is issued.
- Use Convex custom auth with a JWT: after SIWE verification, mint a JWT with the wallet address as the subject, configure Convex to validate it. This gives you `ctx.auth.getUserIdentity()` in all Convex functions.
- Alternatively, for hackathon speed: use a Convex HTTP action that accepts the SIWE signature, verifies it, and returns a short-lived token stored in the client. Less robust but faster to implement.
- At minimum, if skipping proper auth for hackathon speed, add a disclaimer and ensure no truly sensitive data (merchant secrets) is gated only by wallet address arguments.

**Detection (warning signs):**
- Convex mutations that take `walletAddress: string` as a parameter and use it as the identity
- No signature verification anywhere in the auth flow
- `ctx.auth` never used in Convex functions

**Phase relevance:** Phase 1 (architecture decision). Must be decided before building any data storage. Can be simplified for hackathon but the pattern must be correct.

---

### Pitfall 5: On-Chain Polling That Hammers the RPC or Misses State

**What goes wrong:** Step 2 (ERC-8004 identity verification) and Step 5 (demo transaction) require polling on-chain state -- checking whether an identity NFT was minted, or whether a transaction was confirmed. Naive implementations either poll too aggressively (hitting RPC rate limits on the testnet), poll too infrequently (user waits 30+ seconds staring at a spinner), or miss the state change entirely because they poll the wrong block or check the wrong contract method.

**Why it happens:** GOAT Testnet3 is a testnet with potentially lower rate limits and slower/variable block times compared to mainnet. Developers test against local nodes or well-provisioned testnets (Sepolia, Goerli) where aggressive polling works fine, then deploy against GOAT Testnet3 where the RPC throttles them. Additionally, polling for NFT minting requires knowing the exact contract address and method signature for ERC-8004, which may differ from standard ERC-721.

**Consequences:**
- RPC rate limiting causes the entire wizard to fail mid-flow (all steps depend on RPC)
- User sees "Waiting for confirmation..." forever because the poll interval is too long or the check logic is wrong
- Multiple browser tabs or users on the same IP exhaust RPC limits for everyone
- Transaction confirmed but poll misses it due to reorgs or skipped blocks on testnet

**Prevention:**
- Use exponential backoff for polling: start at 2 seconds, back off to 10 seconds, cap at 30 seconds. Reset when user takes an action.
- Use viem's `waitForTransactionReceipt` for transaction confirmation instead of manual polling -- it handles retries and reorgs correctly.
- For ERC-8004 identity status, prefer event-based detection (`watchContractEvent` in viem) over polling a view function, if the contract emits events on registration.
- Cache the RPC provider instance (do NOT create a new `publicClient` on every poll cycle).
- Add a visible timeout with manual retry: "Still waiting? Click to check again" after 30 seconds.
- Consider a WebSocket RPC connection if GOAT Testnet3 supports it, for real-time event subscription instead of polling.
- Rate-limit your own polling: a single `setInterval` that multiple components subscribe to, rather than each component creating its own timer.

**Detection (warning signs):**
- Multiple `setInterval` or `useEffect` timers polling the same RPC independently
- No error handling on RPC calls (network errors crash the polling loop)
- Polling interval under 2 seconds for a testnet RPC
- No timeout or manual retry affordance in the UI

**Phase relevance:** Phase 2 (ERC-8004 identity step) and Phase 3 (demo transaction step). Build a shared polling utility early.

---

## Moderate Pitfalls

---

### Pitfall 6: Credential Paste UX That Loses Data or Confuses Users

**What goes wrong:** Step 3 requires users to DM `@goathackbot` on Telegram, receive `.env` values, and paste them into the wizard. The paste step is where most users fail: they paste the entire `.env` block into a single field, include extra whitespace or newline characters, paste markdown-formatted text from Telegram (with backtick wrappers), or paste the wrong values into the wrong fields.

**Why it happens:** Telegram formats messages with code blocks, and copy-paste from Telegram includes invisible formatting characters on some platforms. Users are not developers accustomed to `.env` files -- they copy the entire bot response including labels and paste it into the first field they see.

**Consequences:**
- Credentials silently invalid (extra whitespace breaks API calls)
- User thinks they completed the step but demo transaction fails in Step 5 with a cryptic error
- Support burden: "I pasted my keys but nothing works"

**Prevention:**
- Accept a single textarea for the ENTIRE `.env` block and parse it automatically. Regex for `KEY=value` pairs, strip whitespace, strip backticks and markdown formatting.
- Validate each credential immediately on paste: format check (length, character set), and if possible a lightweight API ping to verify the key is valid.
- Show a confirmation UI: "We found 4 credentials: API URL [check], API Key [check], API Secret [check], Merchant ID [check]" with green/red indicators.
- Trim all whitespace from pasted values before storing.
- Provide a "Copy from bot" instruction with a screenshot showing exactly what to copy from the Telegram conversation.

**Detection (warning signs):**
- Separate input fields for each credential with no auto-parsing
- No validation on paste (accepts any string silently)
- Demo transaction step shows raw API errors instead of "Invalid credentials -- go back to Step 3"

**Phase relevance:** Phase 2 (merchant setup step). The parsing logic is simple but the UX around it makes or breaks the 2-minute target.

---

### Pitfall 7: Demo Transaction Fails with Unhelpful Errors

**What goes wrong:** Step 5 (the "Hello GOAT" demo transaction) is the culmination of all prior steps. It requires: correct network, funded wallet, valid ERC-8004 identity, valid x402 merchant credentials, and a working Telegram connection. When any of these prerequisites is broken, the demo transaction fails -- but the error message is a raw HTTP 402, 500, or a vague "transaction failed" with no indication of WHICH prerequisite is broken.

**Why it happens:** The x402 payment flow involves multiple systems (wallet, blockchain, x402 API, merchant backend). Each can fail independently, and error messages propagate through multiple layers of abstraction. A missing USDC approval looks like a transaction revert. An expired merchant key looks like a 401 from the x402 API. An identity not yet confirmed on-chain looks like a 402 with no payment method.

**Consequences:**
- User reaches Step 5 (the payoff moment) and hits a wall
- Time-to-first-success exceeds 2 minutes as user debugs
- User gives up and leaves the hackathon flow incomplete
- Judges see a broken demo

**Prevention:**
- Build a pre-flight check before executing the demo transaction. Verify each prerequisite independently:
  1. Correct chain? (check chainId)
  2. Sufficient balance? (check USDC/USDT balance >= transaction amount + gas)
  3. Identity registered? (check ERC-8004 contract)
  4. Credentials valid? (ping x402 API with a health check)
  5. Token approval? (check USDC allowance for the x402 contract)
- Show the pre-flight results as a checklist with green/red status for each item
- Map known error codes to human-readable messages: "Your wallet doesn't have enough USDC. Get test tokens from the faucet." with a direct link.
- Wrap the demo transaction in a try/catch that parses the error and routes back to the specific step that needs fixing.

**Detection (warning signs):**
- Demo transaction step has a single try/catch that shows `error.message`
- No pre-flight validation before initiating the transaction
- Error states say "Transaction failed" without actionable next steps

**Phase relevance:** Phase 3 (demo transaction step). The troubleshooter panel mentioned in PROJECT.md should be built alongside this step, not after.

---

### Pitfall 8: Convex Real-Time Subscriptions Causing Unnecessary Re-renders

**What goes wrong:** Convex queries are reactive by default -- they re-run whenever the underlying data changes. In a wizard with progress tracking, every progress update triggers a re-render of every component subscribed to the builder's progress record. This causes UI flicker, resets form state, interrupts user input, and in the worst case creates an infinite loop (component updates progress on render, which triggers re-render, which updates progress...).

**Why it happens:** Convex's reactivity is a feature, but wizard-style UIs need stable state during user interaction. If the progress record updates frequently (e.g., storing intermediate form data), every keystroke in a credential field triggers a Convex mutation, which triggers a reactive update, which re-renders the form.

**Consequences:**
- Form fields lose focus or reset while the user is typing
- Wizard step indicator flickers as progress updates propagate
- Performance degradation from excessive re-renders
- Potential infinite update loops

**Prevention:**
- Use local React state for in-progress form data. Only write to Convex on step completion (not on every keystroke).
- Use `useQuery` selectively: subscribe only to the fields each component needs, or use Convex's `useQuery` with a query that returns a narrow slice.
- Debounce progress writes: if you must sync intermediate state, debounce with 500ms+ delay.
- Memoize components that display progress data (`React.memo` with a custom comparator).
- Separate concerns: credential input form should NOT be subscribed to the same Convex query that the progress tracker uses.

**Detection (warning signs):**
- `useMutation` called inside a `useEffect` that depends on reactive Convex data
- Form inputs backed directly by Convex query results
- Multiple components all subscribing to the full builder progress document

**Phase relevance:** Phase 2 onward (once Convex stores progress data). Establish the pattern early.

---

### Pitfall 9: Testnet Faucet as a Single Point of Failure

**What goes wrong:** The wizard flow requires test tokens (USDC/USDT on GOAT Testnet3) for the demo transaction. The faucet (`bridge.testnet3.goat.network/faucet`) is an external service that can be rate-limited, down, or drained. If the faucet is unavailable during the hackathon, every builder's onboarding stops at "insufficient funds."

**Why it happens:** Testnet faucets are notoriously unreliable during high-traffic events like hackathons. They often have per-address or per-IP rate limits, can run out of testnet tokens, or simply go down under load.

**Consequences:**
- Entire wizard blocked at the funding step
- Users cannot complete Step 5 (demo transaction) even if all other steps pass
- Hackathon momentum killed for all builders simultaneously

**Prevention:**
- In the wizard, check token balance EARLY (Step 1 or Step 2, not Step 5). If balance is zero, prompt for faucet immediately rather than discovering the problem at demo time.
- Cache-bust the balance check: do not rely on a stale cached balance.
- Provide alternative funding instructions: "If the faucet is down, ask in the hackathon Discord for test tokens" or document the `@goathackbot` as an alternative source if it can fund wallets.
- If `@goathackbot` provisions test tokens (as PROJECT.md suggests: "funds wallet with test tokens"), make this the PRIMARY funding path and faucet the fallback. This reduces external dependency.
- Show the required token amounts upfront so users request enough on the first faucet attempt.
- Consider pre-funding: if feasible, the wizard backend could maintain a funded wallet and drip small amounts to new builders (adds complexity but eliminates the single point of failure).

**Detection (warning signs):**
- No balance check until Step 5
- Faucet link presented without any "what if this doesn't work" fallback
- No detection of "faucet rate limit" errors (they often return 429 or a custom error page)

**Phase relevance:** Phase 1-2 (integrate balance check early). The troubleshooter panel should specifically handle "no funds" as a detected error state.

---

### Pitfall 10: Not Handling the "Wallet Connected but No Account Access" State

**What goes wrong:** Modern wallet extensions (MetaMask 11+, Rabby) separate "site connected" from "account exposed." A user can connect to the site but revoke account access later, or the wallet can be in a state where `eth_accounts` returns an empty array even though `eth_requestAccounts` previously succeeded. The wizard shows "Connected" (because the provider exists) but has no wallet address to key progress against.

**Why it happens:** MetaMask's permission model changed in 2023-2024 to require explicit account exposure per site. wagmi handles this through `useAccount`, but if you check `isConnected` without also checking that `address` is defined, you get false positives.

**Consequences:**
- Wizard proceeds past Step 1 without a wallet address
- Convex progress record created with `undefined` as the wallet key
- Steps 2-5 fail in confusing ways because there is no wallet to sign transactions

**Prevention:**
- Always gate on `address !== undefined` (not just `isConnected === true`)
- Use wagmi's `useAccount` and check both `isConnected` and `address` before proceeding
- Handle the `onDisconnect` callback to reset wizard state and return to Step 1
- Listen for the `accountsChanged` event to detect when a user switches accounts mid-flow (this should reset progress or prompt to load the new account's progress)

**Detection (warning signs):**
- Step 1 completion check only uses `isConnected` without verifying `address`
- No handler for `accountsChanged` or `disconnect` events
- TypeScript types allow `address: string | undefined` to pass unchecked into downstream functions

**Phase relevance:** Phase 1 (wallet connection step).

---

## Minor Pitfalls

---

### Pitfall 11: ERC-8004 Identity Deep Link Returning to Wrong State

**What goes wrong:** Step 2 uses a deep link to register/verify ERC-8004 identity. After the user completes the external registration flow, they need to return to the wizard. But the wizard has no way to detect the return (especially if it happened in a different tab), and the user lands back on Step 1 or a blank page instead of Step 2 with a "Verifying..." status.

**Prevention:**
- Use `window.addEventListener('focus', checkIdentityStatus)` to poll when the user returns to the wizard tab.
- Store the "pending verification" state in Convex so even a page refresh resumes at Step 2 with polling active.
- Consider opening the deep link in a popup window rather than a new tab, so the wizard remains visible in the background.
- Add a manual "I've completed registration, check my status" button as a fallback.

**Phase relevance:** Phase 2 (identity step).

---

### Pitfall 12: Next.js API Routes and Convex HTTP Actions Competing

**What goes wrong:** The project uses both Next.js (with API routes) and Convex (with HTTP actions). Developers are unsure which to use for server-side logic, leading to credential reads split across both, inconsistent error handling, and CORS issues when Convex HTTP actions are called from the Next.js frontend deployed on a different domain.

**Prevention:**
- Establish a clear rule: Convex HTTP actions for anything that reads/writes Convex data. Next.js API routes for anything that needs server-side secrets not in Convex (e.g., the x402 SDK call if using `process.env`).
- Alternatively, put ALL server-side logic in Convex (store x402 secrets as Convex environment variables, run the x402 SDK call as a Convex action). This eliminates the split-brain problem.
- Document the boundary clearly so future contributors know where to put new endpoints.

**Phase relevance:** Phase 1 (architecture decision).

---

### Pitfall 13: Shareable Proof Page Leaking Sensitive Data

**What goes wrong:** The shareable proof page ("This agent is live") is a public URL. If it renders data from the builder's Convex record without filtering, it could expose credentials, internal state, or wallet-specific data that should remain private.

**Prevention:**
- Create a dedicated Convex query for the proof page that returns ONLY public data: agent name, identity status, last transaction hash, explorer link.
- No credentials, no internal progress state, no wallet private data on the proof page.
- The proof page should be read-only and not require authentication.
- Validate that the `builderId` or `walletAddress` in the URL actually has a completed flow before rendering (avoid enumeration attacks that reveal which wallets are registered).

**Phase relevance:** Phase 3 (proof page).

---

### Pitfall 14: Hardcoded Chain Configuration Breaks on Network Updates

**What goes wrong:** GOAT Testnet3 parameters (RPC URL, chain ID, contract addresses) are hardcoded throughout the codebase. When the network updates (RPC URL changes, contracts redeploy, explorer URL changes), every hardcoded reference must be found and updated. Missed references cause silent failures.

**Prevention:**
- Define ALL chain configuration in a single `config/chain.ts` file. Import from there everywhere.
- Include contract addresses (USDC, USDT, ERC-8004 registry) in the same config object.
- Use wagmi's `defineChain` to create a custom chain object that can be used across all wagmi hooks.
- Never inline `48816`, `https://rpc.testnet3.goat.network`, or contract addresses in component code.

**Phase relevance:** Phase 1 (project setup).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Wallet Connection (Step 1) | Silent failures on network switch (#3), false "connected" state (#2, #10) | Explicit state machine, chain ID verification after switch, manual fallback instructions |
| Identity Registration (Step 2) | Polling hammers RPC (#5), deep link return state lost (#11) | Exponential backoff polling, persist pending state in Convex, focus-event re-check |
| Merchant Setup (Step 3) | Credential paste errors (#6), secrets leaked to browser (#1) | Auto-parse `.env` block, validate on paste, store via Convex mutation with no client-readable query |
| Telegram Wiring (Step 4) | No pitfalls unique to this step beyond credential handling | Reuse credential patterns from Step 3 |
| Demo Transaction (Step 5) | Unhelpful errors (#7), faucet down (#9), insufficient funds | Pre-flight checklist, error-to-step mapping, early balance check |
| Auth & Data Layer | Spoofable wallet identity (#4), re-render storms (#8) | SIWE or at minimum signature verification, local state for forms |
| Proof Page | Data leakage (#13) | Dedicated public-only query, filter sensitive fields |
| General Architecture | Credential security (#1), split backend confusion (#12), hardcoded config (#14) | Single server-side credential path, choose one backend pattern, centralized chain config |

---

## Sources

- wagmi documentation (useAccount, useSwitchChain, useChainId hooks and their edge cases) -- MEDIUM confidence (training data, not live-verified)
- viem documentation (waitForTransactionReceipt, watchContractEvent) -- MEDIUM confidence
- Convex documentation (auth patterns, reactive queries, HTTP actions, environment variables) -- MEDIUM confidence
- EIP-3085 (wallet_addEthereumChain) and EIP-3326 (wallet_switchEthereumChain) specifications -- HIGH confidence (stable specs)
- MetaMask documentation (permission model, accountsChanged event) -- MEDIUM confidence
- SIWE (Sign-In With Ethereum, EIP-4361) -- HIGH confidence (stable spec)
- Common Web3 hackathon failure patterns -- MEDIUM confidence (training data from ecosystem experience)

**Note:** WebSearch and WebFetch tools were unavailable during this research session. All findings are based on training data knowledge of these technologies. Confidence levels are MEDIUM rather than HIGH because live verification against current documentation was not possible. The GOAT-specific pitfalls (ERC-8004 behavior, x402 SDK error codes, `@goathackbot` capabilities) should be validated against the official GOAT docs at `docs.goat.network` during implementation.
