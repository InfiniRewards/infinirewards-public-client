# InfiniRewards Public Client

A web application for interacting with digital loyalty and reward tokens on the StarkNet blockchain. This project allows users to view, manage, and interact with points (ERC20) and collectible (ERC721) tokens.

## Overview

InfiniRewards provides a user-friendly interface to:

- View points contract details (name, symbol, total supply)
- Explore collectible NFT contracts
- View individual collectible token details and metadata
- See pricing and expiry information for collectible tokens

The application is built using React, TypeScript, and Vite with a modern, responsive UI powered by Tailwind CSS.

## Features

- **Points Contracts**: View ERC20-style points contracts with metadata
- **Collectible Contracts**: Browse lists of collectible NFTs available
- **Token Details**: View comprehensive information about individual tokens
- **Blockchain Integration**: Direct integration with StarkNet through StarkNet.js
- **CBOR Metadata**: Support for CBOR encoded metadata for rich token information

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Routing**: React Router
- **Blockchain**: StarkNet.js for StarkNet blockchain integration
- **Data Format**: CBOR decoding for metadata
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/wms2537/infinirewards-public.git
   cd infinirewards-public
   ```

2. Install dependencies
   ```bash
   npm ci
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

Navigate to specific contract or token pages using the following URL patterns:

- Points Contract: `/points/{contract_address}`
- Collectible Contract: `/collectibles/{contract_address}`
- Collectible Token: `/collectibles/{contract_address}/token/{token_id}`

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment

This project is configured to deploy to Cloudflare Pages via GitHub Actions. When changes are pushed to the main branch, the application is automatically built and deployed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE) 