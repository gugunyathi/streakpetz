````markdown
# StreakPets - AI-Powered Digital Pet Companion

A production-ready digital pet application built on Base Sepolia testnet with AI agents, autonomous evolution, on-chain wallet management, and real-time features.

## 🌟 Current Status

**Version**: 0.1.0 (Beta)  
**Network**: Base Sepolia Testnet (Chain ID: 84532)  
**Status**: ✅ Production-Ready Core Features | ⚠️ Testing Phase  
**Last Updated**: October 2025

### ✅ Production Features
- Complete pet lifecycle (Egg → Unicorn)
- Autonomous evolution system with auto-detection
- USDC-based pet store with on-chain transactions
- Wallet-to-wallet chat via XMTP
- Real-time AI interactions with OpenAI
- MongoDB database persistence
- Friend system with invitation codes
- Activity logging and transaction history
- Basename registration (.basetest.eth)

### � In Development
- Chat message persistence
- Advanced analytics dashboard
- Notification system
- Enhanced social features

## 🎯 Core Features

### 🐾 Dynamic Pet System
- **5 Evolution Stages**: Egg → Hatchling → Teen → Adult → Unicorn
- **Auto-Evolution**: Automatic progression detection even when offline
- **Real-time Stats**: Health, Energy, Happiness, Level, XP tracking
- **Personality Traits**: Each pet has unique AI-driven personality
- **Blockchain State**: Pet data persisted on Base Sepolia

### 💰 On-Chain Economy
- **Pet Store**: Purchase items with USDC (testnet)
- **Gasless Transactions**: Paymaster integration for fee-free transfers
- **Evolution Items**: 10+ items per stage, 15 for final evolution
- **Inventory System**: Track purchases with transaction hashes
- **Wallet Management**: Separate user and pet wallets

### 💬 Decentralized Messaging
- **XMTP Integration**: Wallet-to-wallet encrypted chat
- **AI Responses**: Context-aware pet conversations via OpenAI
- **Friend System**: Chat with friends through XMTP
- **Real-time Updates**: Live message synchronization

### 🤖 AI Intelligence
- **OpenAI GPT-4**: Advanced language model for pet interactions
- **Personality System**: Unique response patterns per pet
- **Context Awareness**: Remembers pet stats and mood
- **Action Responses**: Dynamic feedback for feeding, playing, grooming

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Gradient Aesthetics**: Beautiful purple-blue gradient theme
- **Framer Motion**: Smooth animations and transitions
- **Safe Areas**: iOS notch and home indicator support
- **Modal System**: Layered modals with proper z-index management

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 15.5.3 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4.1
- **Animations**: Framer Motion 12.23.24
- **State Management**: React Hooks + Context API
- **Icons**: Lucide React 0.545.0
- **Markdown**: React Markdown 10.0.0

#### Blockchain & Web3
- **Wallet SDK**: Coinbase AgentKit (latest)
- **Authentication**: Privy 3.1.0
- **Ethereum Client**: Viem 2.24.1, Ethers 5.7.2
- **Wagmi**: 2.11.0 (@tanstack/react-query 5.90.2)
- **Messaging**: XMTP JS 13.0.4
- **Network**: Base Sepolia Testnet (Chain ID: 84532)

#### AI & Backend
- **AI SDK**: Vercel AI 4.1.54, OpenAI SDK
- **LangChain**: Core 0.3.19, LangGraph 0.2.21, OpenAI 0.3.14
- **AgentKit**: Coinbase AgentKit + LangChain integration
- **Database**: MongoDB (Mongoose 8.19.1)
- **Auth**: NextAuth 4.24.11, bcrypt.js 3.0.2
- **SMS**: Twilio 5.10.2

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Next.js App │  │ React Hooks  │  │ Framer Motion│  │
│  │   (Page.tsx) │  │ (useAuth,    │  │  Animations  │  │
│  │              │  │ useAutoEvo)  │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                 Authentication Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Privy     │  │  NextAuth    │  │   Twilio     │  │
│  │   (Wallet)   │  │   (Google,   │  │   (SMS OTP)  │  │
│  │              │  │  Credentials)│  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                   API Layer (Next.js)                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
│  │  /pets │ │ /wallet│ │ /agent │ │ /chats │ │/auth │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────────┐│
│  │/friends│ │/activity│ │/trans- │ │  Auto-Evolution  ││
│  │        │ │        │ │actions │ │   /pets/auto-    ││
│  │        │ │        │ │        │ │   evolve         ││
│  └────────┘ └────────┘ └────────┘ └──────────────────┘│
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pet Logic  │  │ Wallet Logic │  │  AI Engine   │  │
│  │   (lib/pet)  │  │ (lib/wallet) │  │(lib/openai)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Evolution    │  │   Pet Store  │  │ XMTP Client  │  │
│  │   System     │  │ (lib/pet-    │  │ (lib/xmtp)   │  │
│  │              │  │   store)     │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                   Data Layer (MongoDB)                   │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  User  │ │  Pet   │ │  Wallet  │ │UserInventory │  │
│  │  Model │ │  Model │ │  Model   │ │    Model     │  │
│  └────────┘ └────────┘ └──────────┘ └──────────────┘  │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Chat  │ │Activity│ │Transaction│ │    Friend    │  │
│  │ Message│ │  Log   │ │  Model    │ │    Model     │  │
│  └────────┘ └────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│               External Services Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Coinbase CDP │  │  OpenAI API  │  │ Base Sepolia │  │
│  │  (AgentKit)  │  │   (GPT-4)    │  │   Testnet    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     XMTP     │  │    Twilio    │  │  Paymaster   │  │
│  │   Network    │  │     SMS      │  │  (Gasless)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. User Authentication Flow
```
User → Privy/Google/SMS → NextAuth Session → Create User Wallet
    → Store in MongoDB → Return JWT Token
```

#### 2. Pet Creation Flow
```
Authenticated User → POST /api/pets → Create Pet Record
    → Create Pet Wallet via Coinbase AgentKit
    → Store Wallet Data → Link to Pet → Return Pet Object
```

#### 3. Chat Interaction Flow
```
User Message → POST /api/agent → OpenAI GPT-4
    → Generate Response (Pet Context) → Update Pet Stats
    → Store Message (ChatMessage Model) → Return AI Response
```

#### 4. Purchase Flow
```
Select Item → POST /api/pets/inventory
    → Validate USDC Balance → Sign Transaction (Server-side)
    → Paymaster (Gasless) → Transfer USDC → Record Purchase
    → Update Inventory → Check Auto-Evolution → Return Receipt
```

#### 5. Auto-Evolution Flow
```
App Opens / Reconnect / Purchase → useAutoEvolution Hook
    → GET /api/pets/auto-evolve (Check) → Calculate Eligible Evolutions
    → POST /api/pets/auto-evolve (Apply) → Consume Items
    → Update Pet Stage → Boost Stats → Return Evolution Log
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **MongoDB** database (local or Atlas)
- **Coinbase Developer Platform** account ([portal.cdp.coinbase.com](https://portal.cdp.coinbase.com/))
- **Privy** account ([dashboard.privy.io](https://dashboard.privy.io/))
- **OpenAI API** key ([platform.openai.com](https://platform.openai.com/))
- **Twilio** account (optional, for SMS auth)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd onchain-agent
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

4. **Configure environment** (see Environment Setup below)

5. **Run development server**:
```bash
npm run dev
```

6. **Open browser**:
```
http://localhost:3000
```

## 🔑 Environment Setup

Create a `.env.local` file with the following variables:

### Core Configuration

```env
# === Coinbase Developer Platform (CDP) ===
# Get from: https://portal.cdp.coinbase.com/
CDP_API_KEY_ID=organizations/xxx/apiKeys/xxx
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----\n"

# Network locked to Base Sepolia (testnet only)
NEXT_PUBLIC_NETWORK_ID=base-sepolia
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# === Privy Authentication ===
# Get from: https://dashboard.privy.io/
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxx
PRIVY_APP_SECRET=xxxxx

# === OpenAI API ===
# Get from: https://platform.openai.com/
OPENAI_API_KEY=sk-proj-xxxxx

# === MongoDB Database ===
# Local: mongodb://localhost:27017/streakpets
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/streakpets
MONGODB_URI=mongodb://localhost:27017/streakpets

# === NextAuth Configuration ===
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here-min-32-chars

# === Twilio SMS (Optional) ===
# Get from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# === Application Settings ===
NEXT_PUBLIC_APP_NAME=StreakPets
NEXT_PUBLIC_APP_DESCRIPTION=Your AI-powered digital companion
```

### Contract Addresses (Base Sepolia)

The following are hardcoded in `lib/network-config.ts`:

```typescript
USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
REGISTRAR: 0x49aE3cC2e3AA768B1e99B24EEA346bd13afD6049
L2_RESOLVER: 0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA
```

### Getting API Keys

#### 1. Coinbase Developer Platform (CDP)
1. Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project
3. Navigate to API Keys section
4. Click "Create API Key"
5. Select permissions (need wallet creation, transaction signing)
6. Download the JSON file or copy the credentials
7. Use the `name` field as `CDP_API_KEY_ID`
8. Use the `privateKey` field as `CDP_API_KEY_PRIVATE_KEY`

#### 2. Privy Authentication
1. Visit [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new application
3. Configure settings:
   - Enable Google OAuth
   - Enable Email/Password
   - Add `http://localhost:3000` to allowed domains
4. Copy App ID and App Secret from Settings

#### 3. OpenAI API
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create new secret key
5. Copy the key (starts with `sk-proj-`)
6. Add billing information if needed

#### 4. MongoDB Database
**Local Setup**:
```bash
# Install MongoDB
brew install mongodb-community (macOS)
sudo apt-get install mongodb (Linux)

# Start MongoDB
brew services start mongodb-community
```

**Cloud Setup (MongoDB Atlas)**:
1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP address (0.0.0.0/0 for testing)
5. Get connection string
6. Replace `<password>` with your database password

#### 5. Twilio SMS (Optional)
1. Visit [Twilio Console](https://console.twilio.com/)
2. Create account and verify phone
3. Get Account SID and Auth Token from Dashboard
4. Purchase a phone number ($1/month)
5. Add credentials to `.env.local`

## 📦 Core Features in Detail

### 🐾 Pet System Architecture

#### Evolution Stages
```typescript
Stage 0: Egg        → 50 XP  + 10 items → Hatchling
Stage 1: Hatchling  → 200 XP + 10 items → Teen
Stage 2: Teen       → 500 XP + 10 items → Adult
Stage 3: Adult      → 1000 XP + 15 items → Unicorn
Stage 4: Unicorn    → Max Level (Final Stage)
```

#### Stats System
- **Health (0-100)**: Decreases with time, restored by feeding
- **Energy (0-100)**: Decreases with play, restored by grooming
- **Happiness (0-100)**: Increases with interactions
- **Level (1-∞)**: Increases with evolutions
- **XP (0-∞)**: Gained from chat, feeding, playing
- **Mood**: Calculated from stats (Happy/Content/Sad/Critical)

#### Auto-Evolution System
**Trigger Events**:
- App opens/mounts
- Wallet reconnects
- Window gains focus
- Network reconnects
- Periodic check (every 5 minutes)
- After any purchase

**How It Works**:
```typescript
// Checks if pet meets requirements
function canEvolve(pet, inventory) {
  const nextStage = getNextStage(pet.stage);
  const xpRequired = XP_THRESHOLDS[pet.stage];
  const itemsRequired = EVOLUTION_ITEMS[pet.stage];
  
  return (
    pet.xp >= xpRequired &&
    inventory.hasAllItems(itemsRequired) &&
    pet.stage !== 'unicorn'
  );
}

// Applies all pending evolutions
async function autoEvolve(pet) {
  let evolutionsApplied = 0;
  while (canEvolve(pet, inventory)) {
    pet = applyEvolution(pet);
    inventory.consumeItems(EVOLUTION_ITEMS[pet.stage]);
    evolutionsApplied++;
  }
  return { pet, evolutionsApplied };
}
```

### 💰 Pet Store & Economy

#### Store Items
```typescript
{
  id: 'food',
  name: 'Premium Food',
  price: 0.10, // USDC
  effect: '+20 Health',
  category: 'consumable'
},
{
  id: 'evolution_item',
  name: 'Evolution Crystal',
  price: 0.05, // USDC
  effect: 'Required for evolution',
  category: 'evolution'
}
```

#### Purchase Flow
1. User selects item from store
2. Frontend validates USDC balance
3. POST to `/api/pets/inventory`
4. Server signs transaction (Coinbase AgentKit)
5. Paymaster covers gas fees
6. Transaction hash stored in inventory
7. Item effects applied immediately
8. Auto-evolution check runs
9. Receipt returned to user

#### Wallet Architecture
```
User Wallet (EOA)
├── USDC Balance
├── Transactions: Purchases, Transfers
└── Managed by: Privy + Coinbase AgentKit

Pet Wallet (Smart Wallet)
├── USDC Balance (received from store)
├── Transactions: Store revenue
├── Basename: .basetest.eth
└── Managed by: Server-side Coinbase AgentKit
```

### 💬 Chat System

#### XMTP Integration
```typescript
// Initialize XMTP client
const xmtpClient = await Client.create(wallet, {
  env: 'production',
  apiUrl: 'https://xmtp.chat/api/v1'
});

// Start conversation
const conversation = await xmtpClient.conversations.newConversation(
  petWalletAddress
);

// Send message
await conversation.send(userMessage);

// Stream messages
for await (const message of await conversation.streamMessages()) {
  handleMessage(message);
}
```

#### AI Response Generation
```typescript
// OpenAI integration
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: `You are a ${pet.stage} stage pet named ${pet.name}.
                Your personality: ${pet.personality}.
                Current mood: ${pet.mood}.
                Stats: Health ${pet.stats.health}, Energy ${pet.stats.energy}`
    },
    {
      role: 'user',
      content: userMessage
    }
  ],
  temperature: 0.8
});
```

### 🔐 Authentication & Security

#### Multi-Provider Auth
```typescript
// Privy (Wallet-based)
<PrivyProvider appId={PRIVY_APP_ID}>
  <WagmiConfig config={wagmiConfig}>
    {children}
  </WagmiConfig>
</PrivyProvider>

// NextAuth (Traditional)
NextAuth({
  providers: [
    GoogleProvider({...}),
    CredentialsProvider({...})
  ]
})

// Twilio SMS
sendVerificationCode(phoneNumber) →
  validateCode(code) →
  createSession(userId)
```

#### Security Measures
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ JWT session tokens
- ✅ Server-side transaction signing
- ✅ Environment variable protection
- ✅ Network validation (testnet only)
- ⚠️ Rate limiting (planned)
- ⚠️ Request validation (planned)

### 📊 Database Schema

#### Collections
```typescript
// Users
{
  _id: ObjectId,
  email: string,
  phone?: string,
  password: string (hashed),
  name: string,
  walletId: string,
  walletAddress: string,
  createdAt: Date,
  updatedAt: Date
}

// Pets
{
  _id: ObjectId,
  name: string,
  ownerId: string,
  userWalletAddress: string,
  petWalletAddress: string,
  petWalletId: string,
  basename?: string,
  stage: 'egg' | 'hatchling' | 'teen' | 'adult' | 'unicorn',
  mood: string,
  xp: number,
  streak: number,
  lastInteraction: Date,
  stats: {
    happiness: number,
    health: number,
    level: number,
    energy: number
  },
  personality: {
    playfulness: number,
    intelligence: number,
    affection: number
  },
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

// Wallets
{
  _id: ObjectId,
  walletId: string, // Coinbase wallet ID
  address: string, // 0x...
  network: 'base-sepolia',
  type: 'user' | 'pet',
  ownerId?: string,
  petId?: string,
  basename?: string,
  walletData?: string, // Exported wallet data
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

// UserInventory
{
  _id: ObjectId,
  userId: string,
  petId: string,
  items: [{
    storeItemId: string,
    quantity: number,
    purchasePrice: string,
    transactionHash: string,
    purchasedAt: Date,
    usedCount: number,
    lastUsedAt?: Date
  }],
  totalSpent: string,
  lastUpdated: Date
}

// ChatMessages
{
  _id: ObjectId,
  conversationId: string,
  userId: string,
  petId: string,
  sender: 'user' | 'pet' | 'system',
  content: string,
  metadata?: {
    xpGained?: number,
    mood?: string
  },
  timestamp: Date
}

// Transactions
{
  _id: ObjectId,
  transactionHash: string,
  from: string,
  to: string,
  amount: string,
  token: string, // USDC
  network: 'base-sepolia',
  type: 'purchase' | 'transfer',
  status: 'pending' | 'confirmed' | 'failed',
  userId: string,
  petId?: string,
  metadata?: object,
  timestamp: Date
}

// ActivityLogs
{
  _id: ObjectId,
  userId: string,
  petId?: string,
  action: string, // 'login', 'purchase', 'feed', 'evolve'
  details: object,
  ipAddress?: string,
  timestamp: Date
}
```

## 🗂️ Project Structure

```
onchain-agent/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main landing page
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles
│   ├── api/                      # API Routes (Next.js)
│   │   ├── activity/             # Activity logging endpoints
│   │   │   └── route.ts          # GET/POST activity logs
│   │   ├── agent/                # AI agent endpoints
│   │   │   └── route.ts          # POST chat with AI
│   │   ├── auth/                 # Authentication
│   │   │   ├── [...nextauth]/   # NextAuth handler
│   │   │   ├── register/        # User registration
│   │   │   └── send-sms/        # SMS verification
│   │   ├── chats/                # Chat management
│   │   │   └── route.ts          # GET/POST chat messages
│   │   ├── friends/              # Friend system
│   │   │   ├── route.ts          # GET/POST friends
│   │   │   └── [id]/             # Individual friend ops
│   │   ├── pets/                 # Pet management
│   │   │   ├── route.ts          # CRUD operations
│   │   │   ├── auto-evolve/     # Auto-evolution system
│   │   │   ├── evolve/          # Manual evolution
│   │   │   └── inventory/       # Purchase & inventory
│   │   ├── transactions/         # Transaction history
│   │   │   └── route.ts          # GET transactions
│   │   └── wallet/               # Wallet operations
│   │       ├── route.ts          # Create wallets
│   │       └── transfer/         # USDC transfers
│   ├── auth/                     # Auth pages
│   │   └── signin/               # Sign-in page
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAgent.ts           # AI agent hook
│   │   └── useAutoEvolution.ts  # Auto-evolution hook
│   └── types/                    # TypeScript types
│       └── api.ts                # API response types
├── components/                   # React Components
│   ├── ActivityFeed.tsx          # Activity feed widget
│   ├── AuthProvider.tsx          # Auth context provider
│   ├── BasenameModal.tsx         # Basename purchase modal
│   ├── BasenameRegistration.tsx  # Basename registration form
│   ├── BasePayButton.tsx         # Base payment button
│   ├── ChatInterface.tsx         # XMTP chat UI
│   ├── ErrorBoundary.tsx         # Error boundary wrapper
│   ├── InviteFriendsModal.tsx    # Friend invitation modal
│   ├── LoadingSpinner.tsx        # Loading indicator
│   ├── LoginButton.tsx           # Auth button
│   ├── PetDisplay.tsx            # Main pet display
│   ├── PetInfoModal.tsx          # Pet stats modal
│   ├── PetStoreModal.tsx         # Store UI
│   ├── ReceiveModal.tsx          # Receive USDC modal
│   ├── SendModal.tsx             # Send USDC modal
│   ├── TransactionHistory.tsx    # Transaction list
│   ├── WalletDropdown.tsx        # Wallet menu
│   └── WalletModal.tsx           # Wallet details modal
├── lib/                          # Business Logic
│   ├── activity-logger.ts        # Activity logging utility
│   ├── api.ts                    # API client wrapper
│   ├── auth.ts                   # Auth configuration
│   ├── database.ts               # MongoDB connection
│   ├── error-handler.ts          # Error handling utility
│   ├── network-config.ts         # Network config (Base Sepolia)
│   ├── openai.ts                 # OpenAI integration
│   ├── paymaster.ts              # Gasless transaction logic
│   ├── pet-store.ts              # Store item definitions
│   ├── pet-wallet-auto.ts        # Automated wallet operations
│   ├── pet.ts                    # Pet logic & calculations
│   ├── rate-limiter.ts           # Rate limiting utility
│   ├── sms.ts                    # Twilio SMS service
│   ├── users.ts                  # User management
│   ├── wallet.ts                 # Wallet operations
│   ├── xmtp.ts                   # XMTP client setup
│   └── models/                   # Mongoose Models
│       ├── ActivityLog.ts        # Activity log schema
│       ├── ChatMessage.ts        # Chat message schema
│       ├── Pet.ts                # Pet schema
│       ├── Transaction.ts        # Transaction schema
│       ├── User.ts               # User schema
│       ├── UserInventory.ts      # Inventory schema
│       └── Wallet.ts             # Wallet schema
├── public/                       # Static Assets
│   └── manifest.json             # PWA manifest
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Manual Commands (if needed)
node --version       # Check Node.js version (should be 18+)
npm install          # Install dependencies
npm update           # Update packages
```

## 🔄 Development Workflow

### 1. Starting Fresh
```bash
# Clone and setup
git clone <repo-url>
cd onchain-agent
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

### 2. Making Changes

**Frontend Changes** (Components, UI):
- Edit files in `components/` or `app/`
- Hot reload automatically applies changes
- Test in browser at `localhost:3000`

**Backend Changes** (APIs, Logic):
- Edit files in `app/api/` or `lib/`
- Save file to restart Next.js server
- Test with API calls or frontend

**Database Changes** (Models):
- Edit schemas in `lib/models/`
- MongoDB automatically validates on save
- No migrations needed (NoSQL)

### 3. Testing Flow
```bash
# 1. Test authentication
# Sign in with Google or email

# 2. Test pet creation
# Should auto-create pet on first login

# 3. Test chat
# Send message to pet, verify AI response

# 4. Test store
# Purchase items with testnet USDC

# 5. Test evolution
# Ensure auto-evolution triggers correctly
```

## 🌐 Production Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push code to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com/)
   - Import GitHub repository
   - Configure project:
     - Framework: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Important: Set `NEXTAUTH_URL` to your production URL

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit deployment URL

### Railway / Render / DigitalOcean

```bash
# Build the application
npm run build

# Start production server
npm start

# Environment variables must be set in platform dashboard
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t streakpets .
docker run -p 3000:3000 --env-file .env.local streakpets
```

## ⚠️ Known Limitations & Roadmap

### Current Limitations

❌ **Testnet Only**
- App is locked to Base Sepolia testnet
- Mainnet deployment requires security audit
- USDC is testnet token (no real value)

⚠️ **Chat Message Persistence**
- Messages not yet fully persisted to database
- ChatMessage model exists but needs integration
- Currently stored in browser memory

⚠️ **Rate Limiting**
- No rate limiting on API endpoints
- Vulnerable to abuse/spam
- Planned for v0.2.0

⚠️ **Analytics Dashboard**
- Basic activity logging exists
- No admin dashboard yet
- Stats not visualized

### Roadmap

**v0.2.0 - Enhanced Persistence** (Q4 2025)
- ✅ Complete chat message persistence
- ✅ Advanced transaction history
- ✅ Comprehensive activity analytics
- ✅ Admin dashboard

**v0.3.0 - Social Features** (Q1 2026)
- ⏳ Friend activity feed
- ⏳ Pet battles/competitions
- ⏳ Leaderboards
- ⏳ Gift/trade system

**v0.4.0 - Mobile App** (Q2 2026)
- ⏳ React Native app
- ⏳ Push notifications
- ⏳ Offline mode
- ⏳ Background pet care

**v1.0.0 - Mainnet Launch** (Q3 2026)
- ⏳ Security audit complete
- ⏳ Mainnet deployment
- ⏳ Real USDC integration
- ⏳ NFT minting for pets

## 🐛 Error Handling & Debugging

### Common Issues

**1. "Failed to initialize wallet"**
```bash
# Check CDP API keys
echo $CDP_API_KEY_ID
echo $CDP_API_KEY_PRIVATE_KEY

# Verify network
# Should be: base-sepolia
echo $NEXT_PUBLIC_NETWORK_ID
```

**2. "Database connection failed"**
```bash
# Check MongoDB is running
mongosh # Should connect

# Verify connection string
echo $MONGODB_URI
```

**3. "OpenAI API error"**
```bash
# Verify API key
echo $OPENAI_API_KEY

# Check quota/billing
# Visit: platform.openai.com/account/usage
```

**4. "XMTP connection failed"**
```bash
# Ensure wallet is created
# Check browser console for errors
# XMTP requires valid Ethereum wallet
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check API responses
# Open browser DevTools → Network tab

# View MongoDB queries
# Set in database.ts:
mongoose.set('debug', true);
```

## 🤝 Contributing

### Guidelines

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** with clear commit messages
4. **Test thoroughly** (manual testing for now)
5. **Submit pull request** with description

### Code Standards

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier (recommended)
- **Comments**: Document complex logic
- **Error Handling**: Always use try-catch

### Areas Needing Help

- 📝 Unit tests (Jest + React Testing Library)
- 🔒 Security audit and rate limiting
- 📱 Mobile responsiveness improvements
- 🌐 Internationalization (i18n)
- 📊 Analytics dashboard UI

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support & Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Questions and community help
- **Documentation**: Check `*.md` files in root directory

## 🔒 Security

### Best Practices

- ✅ Never commit `.env.local` or API keys
- ✅ Use environment variables for all secrets
- ✅ Regularly update dependencies: `npm audit`
- ✅ Test on testnet before mainnet
- ✅ Review transactions before signing
- ⚠️ Be cautious with private keys

### Reporting Vulnerabilities

If you discover a security issue, please email: [security@streakpets.com]
Do not open public GitHub issues for security vulnerabilities.

---

**Built with ❤️ by the StreakPets Team**

**Network**: Base Sepolia Testnet (Chain ID: 84532)  
**Last Updated**: October 2025  
**Version**: 0.1.0 Beta

````
