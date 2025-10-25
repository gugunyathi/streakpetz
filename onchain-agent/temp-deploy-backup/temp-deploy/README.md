# StreakPets - AI-Powered Digital Pet Companion

A production-ready digital pet application built on Base blockchain with AI agents, XMTP chat, and wallet integration.

## Features

- 🐾 **AI-Powered Pet Companions** - Interactive digital pets with personality-driven responses
- 💬 **XMTP Chat Integration** - Real-time messaging with your pet using decentralized chat
- 🔗 **Blockchain Integration** - Pet state management on Base blockchain
- 💰 **Wallet Integration** - Coinbase Smart Wallet and Privy authentication
- 🤖 **OpenAI Integration** - Dynamic AI responses and pet interactions
- 🎨 **Modern UI** - Beautiful gradient design with responsive layout
- 🛡️ **Production Ready** - Comprehensive error handling and fallback systems

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Coinbase Developer Platform account
- Privy account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd onchain-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables (see Environment Setup below)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Setup

Create a `.env.local` file with the following variables:

### Required Variables

```env
# Coinbase Developer Platform
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_PRIVATE_KEY=your_cdp_private_key
NEXT_PUBLIC_NETWORK_ID=base-sepolia

# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Base Network RPC URLs
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Application Configuration
NEXT_PUBLIC_APP_NAME=StreakPets
NEXT_PUBLIC_APP_DESCRIPTION=Your AI-powered digital companion
```

### Optional Variables

```env
# Database (if using persistent storage)
DATABASE_URL=your_database_url

# Additional API Keys
ALCHEMY_API_KEY=your_alchemy_key
INFURA_PROJECT_ID=your_infura_project_id

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

## Getting API Keys

### 1. Coinbase Developer Platform

1. Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project
3. Generate API credentials
4. Copy the API Key Name and Private Key

### 2. Privy Authentication

1. Visit [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new application
3. Configure your app settings
4. Copy the App ID and App Secret

### 3. OpenAI API

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Copy the API key

## Production Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Architecture

### Core Components

- **AuthProvider** - Handles Privy and Wagmi authentication
- **PetDisplay** - Interactive pet visualization and stats
- **ChatInterface** - XMTP-powered chat with AI responses
- **ErrorBoundary** - Production-ready error handling

### Key Libraries

- **Next.js 14** - React framework with App Router
- **Privy** - Wallet authentication and management
- **Wagmi** - Ethereum interactions
- **XMTP** - Decentralized messaging
- **Coinbase AgentKit** - Blockchain agent framework
- **OpenAI SDK** - AI response generation
- **Tailwind CSS** - Styling and responsive design

### Data Flow

1. User authenticates via Privy
2. Wallet is created/connected via Coinbase SDK
3. Pet is initialized with blockchain wallet
4. XMTP client connects for messaging
5. AI responses generated via OpenAI
6. Pet state updates stored on-chain

## Features in Detail

### Pet System

- **Health & Energy** - Dynamic stats that change with interactions
- **Happiness & XP** - Progression system for engagement
- **AI Personality** - Each pet has unique response patterns
- **Blockchain State** - Pet data stored on Base network

### Chat System

- **XMTP Integration** - Decentralized, encrypted messaging
- **AI Responses** - Context-aware pet conversations
- **Message History** - Persistent conversation storage
- **Real-time Updates** - Live message synchronization

### Wallet Integration

- **Smart Wallets** - Coinbase-powered wallet creation
- **Multi-network** - Support for Base Sepolia and Mainnet
- **Transaction Handling** - Automated blockchain interactions
- **Error Recovery** - Graceful fallbacks for wallet issues

## Error Handling

The application includes comprehensive error handling:

- **Network Issues** - Automatic retries and fallbacks
- **Wallet Errors** - Demo mode when wallet unavailable
- **AI Failures** - Graceful degradation of AI features
- **XMTP Issues** - Chat fallbacks and reconnection
- **User-Friendly Messages** - Clear error communication

## Development

### Project Structure

```
onchain-agent/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utility libraries and integrations
├── public/             # Static assets
└── styles/             # Global styles
```

### Key Files

- `lib/auth.ts` - Authentication configuration
- `lib/wallet.ts` - Blockchain wallet management
- `lib/xmtp.ts` - XMTP chat integration
- `lib/openai.ts` - AI response generation
- `lib/pet.ts` - Pet logic and state management
- `lib/error-handler.ts` - Error handling utilities

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the GitHub Issues
- Review the error handling documentation
- Ensure all environment variables are properly configured

## Security

- Never commit API keys or private keys
- Use environment variables for all sensitive data
- Regularly update dependencies
- Follow blockchain security best practices
