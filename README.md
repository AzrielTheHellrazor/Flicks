# 🎨 Flicks - AI Image Generator

**Prompt-to-Image Website** - Users pay $1 USDC to receive 5 AI-generated images

Flicks is an AI image generator built for the Farcaster ecosystem. Users can generate high-quality images with DALL-E 3 by entering text prompts.

## ✨ Features

- 🎨 **AI Image Generation**: 5 high-quality images with OpenAI DALL-E 3
- 💰 **Crypto Payment**: Pay with $1 USDC (Base Mainnet)
- 🔗 **Wallet Integration**: Easy wallet connection with OnchainKit
- 📱 **Farcaster Ready**: Compatible with Farcaster frames
- 🖼️ **Instant Download**: Download generated images instantly

## 🔗 Architecture

1. **Frontend (Next.js + Tailwind + OnchainKit)**
   - Landing page with prompt input + "Generate" button
   - Wallet connection (MetaMask, Coinbase Wallet, etc.)
   - Payment modal with USDC approval and payment flow
   - Image display with download functionality

2. **Smart Contract (Solidity)**
   - Deployed on Base Mainnet
   - Accepts exactly 1 USDC per generation request
   - Emits `ImageRequested` event with requestId
   - No storage, just payment processing

3. **Backend (Node.js/Express + Ethers.js + OpenAI SDK)**
   - Listens to contract events (`ImageRequested`)
   - Calls OpenAI DALL·E API with user's prompt
   - Generates 5 images and returns base64 data
   - No database, temporary in-memory storage

4. **OpenAI DALL·E 3**
   - Model: `dall-e-3`
   - Output: 5 images (1024×1024)
   - Returns base64 to backend

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- Bun (preferred package manager)
- OpenAI API key
- Base mainnet private key for deployment

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Setup

Copy `env.example` to `.env` and fill in the values:

```bash
cp env.example .env
```

Required environment variables:
```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Blockchain Configuration
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here

# Contract Address (fill after deployment)
CONTRACT_ADDRESS=

# USDC Contract Address on Base
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Backend Configuration
BACKEND_PORT=3000
NODE_ENV=development
```

### 3. Deploy Smart Contract

```bash
# Compile contracts
bun run compile

# Deploy to Base mainnet
bun run deploy
```

After deployment, update `CONTRACT_ADDRESS` in your `.env` file.

### 4. Start Development Servers

Terminal 1 - Frontend:
```bash
bun dev
```

Terminal 2 - Backend:
```bash
bun run backend
```

## 🚀 Usage Flow

1. **User visits website** → enters prompt → clicks "Generate"
2. **Frontend**:
   - Connects wallet
   - Submits prompt to backend
   - Shows payment modal
3. **Smart Contract**:
   - User approves USDC spending
   - User pays 1 USDC
   - Emits `ImageRequested` event with `requestId`
4. **Backend**:
   - Listens for events
   - Matches `requestId` with prompt
   - Calls OpenAI to generate 5 images
   - Returns base64 images to frontend
5. **Frontend**:
   - Displays the 5 images in a grid
   - Provides download buttons

## 💸 Pricing & Costs

- **User pays**: $1 USDC
- **OpenAI cost**: ~$0.40–$0.60 per request (5 images)
- **Profit margin**: ~$0.40–$0.60 per request

## 🛠️ Tech Stack

- **Frontend**: Next.js + Tailwind + OnchainKit (wallet connection)
- **Smart Contract**: Solidity (ERC20 payment, event emit)
- **Backend**: Node.js/Express + Ethers.js (event listener) + OpenAI SDK
- **AI API**: OpenAI DALL·E-3
- **Network**: Base Mainnet
- **Payment**: USDC (ERC-20)

## 📁 Project Structure

```
├── app/
│   ├── components/
│   │   └── PaymentModal.tsx      # Payment flow modal
│   ├── page.tsx                  # Main frontend page
│   └── layout.tsx               # App layout
├── backend/
│   └── server.js                # Express server with event listener
├── contracts/
│   └── ImageGenerator.sol       # Smart contract
├── scripts/
│   └── deploy.js                # Deployment script
├── hardhat.config.js            # Hardhat configuration
└── package.json                 # Dependencies
```

## 🚫 What's NOT Included

- ❌ AWS/S3 storage
- ❌ Database (job data only in memory)
- ❌ Retry queue
- ❌ Image history
- ❌ User accounts
- ❌ Persistent storage

## 🔒 Security Notes

- Private keys should be stored securely
- API keys should never be exposed to frontend
- Smart contract is non-upgradeable for security
- USDC approval is limited to exact amount needed

## 📝 License

MIT License - feel free to use this code for your own projects!

## 🔗 Repository

GitHub: [https://github.com/AzrielTheHellrazor/Flicks.git](https://github.com/AzrielTheHellrazor/Flicks.git)

---

**Flicks - AI Image Generation for Farcaster** 🎨✨