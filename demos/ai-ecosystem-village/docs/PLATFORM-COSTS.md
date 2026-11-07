# Platform cost reference for a real-estate game or metaverse build

Reference supplied by Ariel Shapira on 2026-11-07 for deciding whether the Ecosystem Village stays a canvas demo or grows into an engine, metaverse, or on-chain product. Prices are as quoted on that date and move; check the official links before committing spend.

## 1. Game engines and metaverse world builders

| Platform | Official link | Licensing and platform costs | Notes for real estate games |
|---|---|---|---|
| Unreal Engine 5 | unrealengine.com | Free to develop and publish. 5% royalty on gross lifetime game revenue above $1,000,000. Non-game archviz or enterprise use takes a separate $1,850 per seat per year license once company revenue exceeds $1M. | Best for photorealistic properties. No upfront software fees for indies or startups. |
| Unity | unity.com | Unity Personal: free for teams under $200k per year in revenue or funding. Unity Pro: about $210 per month or $2,310 per year per seat above that. Zero runtime royalties. | Top choice for browser (WebGL) and mobile real estate builders. |
| The Sandbox Creator Tools | sandbox.game/en/create | Game Maker and VoxEdit are free. Publishing requires owning or renting a LAND parcel (secondary floor roughly 0.02 to 0.05 ETH, about $40 to $120). 5% marketplace fee on secondary asset trades. | No-code world builder with an existing metaverse audience. |
| Decentraland SDK | docs.decentraland.org | SDK and CLI are free and open source. Publishing to LAND requires owning or leasing a parcel (floor roughly 0.2 to 0.4 ETH). Publishing to Worlds is cheaper: a Decentraland NAME (about 100 MANA, roughly $30 to $40). | Browser-native, TypeScript. No gas fee to deploy scenes once land or name is owned. |

## 2. Blockchain networks for deeds and real estate NFTs

| Network | Official link | Deployment and transaction costs | Fit |
|---|---|---|---|
| Polygon (PoS / zkEVM) | polygon.technology | Contract deployment about $0.50 to $3.00 in POL. Player transactions under $0.01. | High liquidity, immediate OpenSea support. |
| Immutable zkEVM | immutable.com | Deployment at standard L2 gas. Player gas can be fully sponsored ($0 for players) with the gas-free pass system. | Smoothest onboarding and secondary land trading without gas friction. |
| Solana | solana.com | Program deployment about $15 to $40 in SOL for account rent. Transactions under $0.001. | Real-time rent harvesting and micro-transactions. |
| Avalanche Subnets | avax.network | C-Chain deployment about $1 to $5. A custom subnet needs staked AVAX, typically a $5,000 to $25,000 or more commitment for dedicated validators. | Enterprise-grade MMO metaverses needing isolated network speed. |
| Plume Network | plume.org | Modular L2 gas, fractions of a cent. | Purpose-built for tokenizing real-world assets. |

## 3. Web3 middleware: wallets and gasless sessions

| Platform | Official link | Pricing | Purpose |
|---|---|---|---|
| Thirdweb | thirdweb.com | Starter: $0 per month, basic SDKs, prebuilt contracts, first 1,000 wallets free. Growth: $99 per month with custom auth, account abstraction, managed RPCs. In-app wallets $0.015 per monthly active wallet after the free tier. Gas sponsorship about $1 per 1,000 sponsored transactions plus a 2.5% surcharge. | Drop-in ERC-721 land contracts and email or social login wallets. |
| Openfort | openfort.io | Free: up to 2,000 operations per month. Growth: $99 per month for 25,000 operations, then $0.008 per operation. Pro: $249 per month for 100,000 operations. | Session keys so players do not see a wallet prompt on every build, decorate, or rent action. |
| Privy | privy.io | Free up to 1,000 monthly active users. Scale from about $99 per month for social wallet logins and embedded sign-in. | Quickest onboarding for users without a crypto wallet. |

## Budget as quoted

- Prototype or MVP: $0 to $150 total. Unity Personal or Unreal (free), Thirdweb free tier, contracts on a testnet (Polygon Amoy or Sepolia) at $0.
- Production launch: about $100 to $350 per month. Thirdweb or Openfort Growth at $99 per month for gas sponsorship and account abstraction, plus $5 to $20 of on-chain deployment on Polygon or Solana.

## How this relates to the village

The village in this directory is a zero-dependency canvas page and costs nothing to host on Cloudflare Pages. None of the platforms above is needed to keep improving it. They become relevant only if the decision is to turn it into a playable product with owned parcels or on-chain deeds; the $0 prototype path (Unity Personal, Thirdweb free tier, Polygon Amoy testnet) is the one that fits the current spend ceiling, and any paid tier above $10 per month is an explicit approval item under the team's operating rules.

## Stack guidance (second reference, same date)

Two platform layers are involved: a world-building layer (visual world, 3D space, physics, gameplay) and a blockchain layer (parcels, contracts, deeds, rental yields).

### World-building layer

- **Unreal Engine 5.** AAA photorealistic worlds, digital twins, luxury archviz. Nanite and Lumen make virtual architecture read as real. Web3 via Thirdweb, Moralis, or the ChainSafe Gaming SDK to read wallet holdings and gate building access on NFT ownership.
- **Unity.** Cross-platform (mobile, browser, PC, VR) and casual simulations. Deepest off-the-shelf Web3 tooling; light enough for WebGL in a browser or iOS and Android without large downloads.
- **The Sandbox Game Maker and VoxEdit.** No-code voxel development on an existing player base; buy or lease parcels and script mini-games, social hubs, quests.
- **Decentraland SDK.** Browser-native, open source, TypeScript scenes. Suited to galleries, leased storefronts, and kiosks that open instantly in a browser.

### Blockchain layer

Real estate games are built from frequent micro-actions (rent, decorating, leasing, upgrades, maintenance), so mainnet gas breaks the economy. Chains with fast finality and negligible fees:

| Network | Advantage | Cost per action | Scope |
|---|---|---|---|
| Polygon (PoS / zkEVM) | Liquidity, EVM native, every major NFT market | under $0.01 | Browser and mobile land simulators, virtual shops |
| Immutable zkEVM | Zero-gas minting, gamer pass, unified orderbook | gas-free or subsidized for players | Dedicated gaming ecosystems with heavy asset trading |
| Solana | Sub-second finality, cheap high-frequency state | under $0.001 | High-velocity rent economies |
| Avalanche Subnets | Dedicated blockspace, no congestion spikes | configurable, custom token | Large MMOs with custom transaction rules |

### Middleware layer

- **Thirdweb.** ERC-721 and ERC-1155 parcel and rental contract templates, embedded social-login wallets, Unity and Unreal SDKs.
- **Openfort or Biconomy (ERC-4337 account abstraction).** Sponsored gas and session keys so players never sign a wallet prompt per action.
- **Plume Network.** L2 built for compliant real-world asset tokenization; the fit when the game merges physical rental properties with token distributions.

### Recommended stacks as quoted

- High-end visual metaverse (PC, VR): Unreal Engine 5 + Immutable zkEVM or Polygon + Thirdweb SDK + Openfort.
- Web or mobile real estate simulator: Unity (WebGL, mobile) + Solana or Polygon + Privy + Thirdweb Engine.
- Rapid low-code prototype: The Sandbox Game Maker or Decentraland SDK.

### Open decision

The source asked whether the focus is purely virtual metaverse land or gamified fractional ownership of real-world properties. That is a product decision for the owner; the note in the section above stands either way.
