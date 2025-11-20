# Metamask Smart-Account Batch Transaction Tool

Browser-based atomic batch transaction tool built with Next.js, wagmi, and viem. It leverages MetaMask Smart Accounts (EIP‑7702) to send multiple transactions in a single atomic batch, improving UX and often saving gas.

## Features
- Atomic batching: multiple transactions either all succeed or all revert
- Supported transaction types:
  - Native token transfer (ETH/BNB/POL, etc.)
  - ERC‑20 transfer (transfer)
  - ERC‑20 approval (approve, supports unlimited approval)
  - Custom transaction (to/data/value)
- Supported networks: Ethereum, Polygon, BNB Chain, Arbitrum, Base, Optimism
- Wallet: MetaMask (EIP‑7702 Smart Account)
- i18n: Chinese/English (toggle in the top-right corner)
- UX helpers: transaction status, block explorer links, error messages, and guidance

> Note: EIP‑7702 currently supports up to 10 calls per batch. The app automatically takes the first 10 and shows how many remain unprocessed.

## Tech Stack
- Next.js 15 (App Router)
- React 19
- wagmi v2, viem v2
- Tailwind CSS 4

## Project Structure (excerpt)
```
src/
  app/
    layout.tsx         # App layout and global provider
    page.tsx           # Main page with batch form and logic
public/
  <chain logo assets>
```

## Requirements
- Bun (recommended) or Node.js ≥ 18
- MetaMask extension installed and enabled

## Getting Started
Using Bun (recommended):
```bash
# install deps
bun install

# start dev server (http://localhost:3000)
bun run dev

# lint
bun run lint

# build
bun run build

# start production (after build)
bun run start
```

Alternatively with npm:
```bash
npm install
npm run dev
npm run lint
npm run build
npm start
```

## Usage
1. Click "Connect Wallet" (top-right) and choose MetaMask.
2. Select the target network (Ethereum/Polygon/BNB Chain/Arbitrum/Base/Optimism).
3. Configure transactions in the batch form:
   - Native transfer: recipient + amount (ETH/BNB/POL)
   - ERC20 transfer: token address + recipient + amount (with decimals handling)
   - ERC20 approve: token address + spender + amount (leave empty for unlimited)
   - Custom: to + value + data (data must be a 0x-prefixed hex string)
4. Click “Send Batch Transaction” and confirm in MetaMask. Adjust gas in “Advanced Options” if needed.
5. Track hashes and open in block explorers; use “Check Status” to refresh.

## FAQ and Tips
- Smart account incompatibility / need to disable smart account:
  1) MetaMask → Account Details → Smart Account → Disable for the relevant chain
  2) Return and retry; the app may re-upgrade to an EIP‑7702 smart account as needed
- Gas limit exceeded:
  - Some tokens may require unusually high gas. Remove that call or split into smaller batches.
- Gas too high:
  - In MetaMask confirmation, open “Advanced Options” and adjust Gas Price / Gas Limit.
- Validation:
  - Address must be 42 chars starting with 0x; data must be 0x‑hex; amount > 0.
- Batch limit:
  - EIP‑7702 cap is 10 calls. The app shows original/actual/remaining counts.

## Deployment
- Vercel: import the repo, Framework = Next.js, keep default build command `next build`. Add your domain to MetaMask trusted sites as needed.
- Self-hosted:
  - Build: `bun run build` (or `npm run build`)
  - Start: `bun run start` (or `npm start`) — consider PM2/systemd for process management
  - Reverse proxy: Nginx/Caddy for HTTPS, compression, and caching

## Package Scripts
- dev: `next dev`
- build: `next build`
- start: `next start`
- lint: `next lint`

