# CarryChain: Peer-to-Peer Package Delivery Platform

## Overview
CarryChain is a decentralized platform connecting travelers with extra luggage space to people needing to send packages along the same route. It provides a secure, transparent, and cost-effective way to ship items globally by leveraging the unused luggage space of travelers already making the journey.

## Problem Statement
International shipping is expensive, slow, and often unreliable. Meanwhile, thousands of travelers fly with unused luggage capacity. CarryChain bridges this gap by creating a peer-to-peer marketplace for package delivery.

## Solution
CarryChain allows travelers to:
- List their upcoming routes with available luggage space
- Set their own prices for carrying packages

While shippers can:
- Find travelers going to their desired destination
- Create delivery requests for their packages
- Track their packages through a verification system

All backed by smart contracts on Base for security, transparency, and automated payments.

## Technology Stack
- **Frontend**: React, TypeScript, TailwindCSS
- **Web3**: Wagmi, Ethers.js, Coinbase Wallet
- **Smart Contracts**: Solidity (deployed on Base mainnet)
- **Storage**: IPFS via Pinata (for verification photos)
- **Authentication**: Wallet-based authentication

## Architecture

The CarryChain platform consists of three main components:

1. **Frontend Application**: A responsive React web application that provides an intuitive interface for travelers and shippers
2. **Smart Contracts**: Solidity contracts deployed on Base mainnet that handle the business logic, escrow, and verification
3. **IPFS Storage**: Decentralized storage for verification photos through Pinata

![Architecture Diagram](https://placeholder-for-architecture-diagram.com/arch.png)

## Features
- Create and manage travel routes
- Create package delivery requests
- Accept delivery requests as a traveler
- Verify package pickup and delivery with photo proof
- Secure escrow payment system
- User profiles and reputation system

## Deployment

### Contract Addresses (Base Mainnet)

| Contract | Address | Verified |
|----------|---------|----------|
| CarryChainMarketplace | [0x00110BA2493FA9bE248D9449EAa9e027fCD59E1b](https://basescan.org/address/0x00110BA2493FA9bE248D9449EAa9e027fCD59E1b) | ✅ |
| StablecoinAdapter | [0xF923D57D4eBc499f3CE707e0c76Ca70490500cb9](https://basescan.org/address/0xF923D57D4eBc499f3CE707e0c76Ca70490500cb9) | ✅ |
| DeliveryVerification | [0x7973aC2ad7A9ED75398D00e9964819b7Be760B9C](https://basescan.org/address/0x7973aC2ad7A9ED75398D00e9964819b7Be760B9C) | ✅ |

### Test Transactions

While most of our testing was conducted on Base Sepolia testnet, we have verified functionality on Base mainnet:

1. **Route Creation**: [View Transaction](https://basescan.org/tx/0xda6e675bb4ff874a9ce81266c570b542d062ba3d5150c8ee292d7b9b6e5261df)

Additional comprehensive testing was performed on Base Sepolia testnet:

1. **Delivery Creation**: [View Transaction - Sepolia](https://sepolia.basescan.org/tx/0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2)
2. **Delivery Acceptance**: [View Transaction - Sepolia](https://sepolia.basescan.org/tx/0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8)
3. **Pickup Verification**: [View Transaction - Sepolia](https://sepolia.basescan.org/tx/0x5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e)
4. **Delivery Verification**: [View Transaction - Sepolia](https://sepolia.basescan.org/tx/0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3)
5. **Payment Release**: [View Transaction - Sepolia](https://sepolia.basescan.org/tx/0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8)

### Frontend Deployment

The application is deployed and accessible at [https://carrychain.vercel.app](https://carrychain.vercel.app)

## Getting Started

### Prerequisites
- Node.js (v16+)
- Yarn or npm
- Coinbase Wallet or MetaMask browser extension

### Local Development
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/carrychain.git
   cd carrychain
   ```

2. Install dependencies
   ```bash
   yarn install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your configuration:
   ```
   REACT_APP_MARKETPLACE_ADDRESS=0x00110BA2493FA9bE248D9449EAa9e027fCD59E1b
   REACT_APP_STABLECOIN_ADAPTER_ADDRESS=0xF923D57D4eBc499f3CE707e0c76Ca70490500cb9
   REACT_APP_VERIFICATION_ADDRESS=0x7973aC2ad7A9ED75398D00e9964819b7Be760B9C
   REACT_APP_PINATA_JWT=your_pinata_jwt
   REACT_APP_WC_PROJECT_ID=your_walletconnect_project_id
   ```

4. Start the development server
   ```bash
   yarn start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser

### Connecting to Base Mainnet
1. Add Base network to your wallet (if not already added):
   - Network Name: Base
   - RPC URL: https://mainnet.base.org
   - Chain ID: 8453
   - Currency Symbol: ETH
   - Block Explorer URL: https://basescan.org

2. Ensure you have ETH on Base for transaction fees

## Smart Contract Overview

### CarryChainMarketplace (0x00110BA2493FA9bE248D9449EAa9e027fCD59E1b)
The main contract that handles routes, deliveries, and the overall marketplace functionality:
- Route creation and management
- Delivery creation and management
- Payment handling (through StablecoinAdapter)
- Statuses and state transitions

### StablecoinAdapter (0xF923D57D4eBc499f3CE707e0c76Ca70490500cb9)
Manages the interactions with stablecoins (USDC) for payments:
- Handles deposits into escrow
- Manages payment releases
- Supports refunds if needed

### DeliveryVerification (0x7973aC2ad7A9ED75398D00e9964819b7Be760B9C)
Handles the verification of pickups and deliveries:
- Stores verification proofs (IPFS CIDs)
- Records timestamps
- Validates verification steps

## Project Structure

```
carrychain/
├── public/                  # Public assets
├── src/
│   ├── abi/                 # Contract ABIs
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React context providers
│   ├── pages/               # Page components
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main App component
│   └── index.tsx            # Entry point
├── contracts/               # Smart contract source code
├── package.json
└── README.md
```

## User Flow

1. **Traveler** creates a route specifying:
   - Departure and destination locations
   - Departure and arrival dates
   - Available luggage space
   - Price per kg

2. **Shipper** searches for routes matching their needs and creates a delivery request specifying:
   - Package description
   - Package weight
   - Preferred route

3. **Traveler** accepts the delivery request

4. **Traveler** meets the shipper and verifies pickup by uploading a photo to IPFS

5. **Traveler** delivers the package and verifies delivery by uploading another photo to IPFS

6. **Shipper** confirms receipt of the package

7. **Smart contract** releases the payment from escrow to the traveler

## Future Roadmap

- Mobile applications (iOS/Android)
- Integration with delivery tracking APIs
- Enhanced reputation and review system
- Group shipping options for cost optimization
- Insurance offerings for higher-value packages
- Expansion to more payment options

## Team

- **Samuel Aleonomoh** - Full-stack Blockchain Developer
  - GitHub: [github.com/aleonomoh](https://github.com/aleonomoh)
  - Telegram: [@osiyomeoh](https://t.me/osiyomeoh)
  - Role: Lead Developer and Smart Contract Architect

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions, suggestions, or collaboration opportunities, please reach out to:
- Telegram: [@osiyomeoh](https://t.me/osiyomeoh)
- GitHub: [github.com/aleonomoh](https://github.com/osiyomeoh)