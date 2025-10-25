# CDP Send Transaction Implementation Guide

**Date**: December 2024  
**API Reference**: https://docs.cdp.coinbase.com/api-reference/v2/rest-api/evm-accounts/send-a-transaction  
**Current Status**: Using Coinbase SDK (recommended approach)

---

## Overview

The StreakPets app currently uses the **Coinbase SDK** to handle wallet transactions, which is the recommended approach over direct REST API calls. The SDK abstracts away the complexity of:
- JWT token generation
- RLP encoding
- Nonce management
- Gas estimation
- Transaction signing

---

## Current Implementation

### Method Used
**Coinbase SDK** → `wallet.invokeContract()`

```typescript
const transfer = await wallet.invokeContract({
  contractAddress: usdcAddress,
  method: 'transfer',
  args: {
    to: toAddress,
    value: transferAmount,
  },
});
```

### Why SDK vs Direct REST API?

| Approach | Pros | Cons |
|----------|------|------|
| **SDK (Current)** | ✅ Automatic authentication<br>✅ Built-in nonce management<br>✅ Gas estimation<br>✅ Error handling<br>✅ TypeScript support | ⚠️ Abstraction may hide issues |
| **Direct REST API** | ✅ Full control<br>✅ Detailed error messages | ❌ Manual JWT generation<br>❌ Manual RLP encoding<br>❌ More code to maintain |

**Decision**: Continue using SDK (industry best practice)

---

## CDP API Requirements (For Reference)

If we ever need to switch to direct API calls, here are the requirements:

### Endpoint
```
POST https://api.cdp.coinbase.com/platform/v2/evm/accounts/{address}/send/transaction
```

### Headers Required
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json',
  'X-Wallet-Auth': '<WALLET_JWT_TOKEN>',
  'X-Idempotency-Key': '<UUID_V4>' // Optional
}
```

### Request Body
```json
{
  "network": "base-sepolia",
  "transaction": "0x..." // RLP-encoded EIP-1559 transaction
}
```

### RLP Transaction Format (EIP-1559)
```typescript
{
  "to": "0x...",              // Required
  "chainId": 84532,           // Ignored, uses network param
  "nonce": 0,                 // Optional, auto-assigned
  "maxPriorityFeePerGas": "", // Optional, auto-estimated
  "maxFeePerGas": "",         // Optional, auto-estimated
  "gasLimit": "",             // Optional, auto-estimated
  "value": "0",               // Optional, wei amount
  "data": "0x...",            // Optional, contract call data
  "accessList": []            // Optional
}
```

---

## Environment Variables Required

### Current `.env` Configuration

```bash
# API Authentication
CDP_API_KEY_ID=8b9c7025-d97a-4dfb-9b87-ac820a1065a0
CDP_API_KEY_SECRET=VMJbUNqws9w9nwfZ2DQZAQBcPn2abswh5bcPn9HCCBKuqVS1K7Yi4H5VLr3N39VGpOsQwmh3Lb5oWV6y1W1++Q==

# Wallet Signing
CDP_WALLET_SECRET=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgT0q0oVGko6ANSOhN97LNr91KvhZjozp6w3rzoJTytDOhRANCAAREeHnFguBp8r2Gu+CFb/A+A9O22vLH6EFZ3GepuMyP9P5ZcrWefafm/vs0ey54dKxBbhbpvsOddrIe+vDWNry0

# Client API Key (for paymaster/bundler)
CDP_CLIENT_API_KEY=hPe1vPn9H3lkH0Cr8YT4WDgQEsuW17Hy

# Network Configuration
NETWORK_ID=base-sepolia

# Gas-Free Transaction Support
PAYMASTER_ENDPOINT=https://api.developer.coinbase.com/rpc/v1/base-sepolia/hPe1vPn9H3lkH0Cr8YT4WDgQEsuW17Hy
BUNDLER_ENDPOINT=https://api.developer.coinbase.com/rpc/v1/base-sepolia/hPe1vPn9H3lkH0Cr8YT4WDgQEsuW17Hy
```

---

## Authentication Flow

### 1. SDK Configuration (Current)
```typescript
Coinbase.configure({
  apiKeyName: process.env.CDP_API_KEY_ID,
  privateKey: process.env.CDP_API_KEY_SECRET,
});
```

The SDK automatically:
- Generates JWT tokens
- Signs requests
- Manages authentication headers

### 2. Manual JWT Generation (If needed)
```typescript
import jwt from 'jsonwebtoken';

// Generate Bearer Token
const bearerToken = jwt.sign(
  {
    sub: process.env.CDP_API_KEY_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
  },
  Buffer.from(process.env.CDP_API_KEY_SECRET, 'base64'),
  { algorithm: 'ES256' }
);

// Generate Wallet Token
const walletToken = jwt.sign(
  {
    sub: walletAddress,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
  },
  Buffer.from(process.env.CDP_WALLET_SECRET, 'base64'),
  { algorithm: 'ES256' }
);
```

---

## Transaction Flow

### Current SDK Flow (Recommended)

```
┌─────────────────────────────────────┐
│ 1. User clicks "Send USDC"          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 2. SendModal sends request to       │
│    /api/wallet/transfer             │
│    - fromAddress                    │
│    - toAddress                      │
│    - amount (in cents)              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 3. API validates inputs             │
│    - Check required fields          │
│    - Verify wallet exists           │
│    - Confirm network match          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 4. Import wallet from DB            │
│    - Decrypt wallet data            │
│    - Initialize SDK wallet          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 5. SDK handles transaction          │
│    ✅ JWT generation                │
│    ✅ RLP encoding                  │
│    ✅ Nonce management              │
│    ✅ Gas estimation                │
│    ✅ Transaction signing           │
│    ✅ Network broadcast             │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 6. Transaction submitted            │
│    - Get transaction hash           │
│    - Save to database               │
│    - Log activity                   │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 7. Return success to frontend       │
│    - Transaction hash               │
│    - BaseScan link                  │
└─────────────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: `insufficient_balance`
**Error**: `apiCode: 'insufficient_balance'`

**Possible Causes**:
1. ❌ Wallet actually has insufficient USDC
2. ❌ Gas fees not covered (need paymaster)
3. ❌ Amount conversion error (cents vs wei)

**Solution**:
```typescript
// Ensure proper conversion
// Frontend sends: 100 (for $1.00)
// API converts to: 1,000,000 wei (USDC has 6 decimals)
const amountInWei = amount * 10000; // cents to wei
```

### Issue 2: `WALLET_DATA_MISSING`
**Error**: Wallet data not found in database

**Solution**:
- User needs to reconnect wallet
- Check wallet was properly created
- Verify `walletData` field exists in MongoDB

### Issue 3: `NETWORK_MISMATCH`
**Error**: Wallet network doesn't match transaction network

**Solution**:
- Ensure all wallets created on `base-sepolia`
- Force network in wallet creation
- Don't allow mainnet operations

---

## USDC Transfer Details

### Contract Address
```
Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Contract Method
```solidity
function transfer(address to, uint256 value) returns (bool)
```

### Amount Conversion
```
User Input: $1.00
    ↓
Cents: 100
    ↓
Wei: 100 × 10,000 = 1,000,000
    ↓
USDC (6 decimals): 1.000000
```

---

## Testing Checklist

### Pre-Transaction
- [ ] Wallet has sufficient USDC balance
- [ ] Recipient address is valid (0x + 40 hex chars)
- [ ] Amount is > $1.00 (minimum)
- [ ] Network is Base Sepolia
- [ ] CDP credentials configured

### During Transaction
- [ ] JWT tokens generated successfully
- [ ] Wallet imported from database
- [ ] Contract invocation succeeds
- [ ] Transaction hash received
- [ ] Transaction recorded in DB

### Post-Transaction
- [ ] Balance updated in wallet
- [ ] Transaction visible on BaseScan
- [ ] Activity logged
- [ ] UI shows success message

---

## Monitoring & Debugging

### Enable Detailed Logging
Current implementation includes:
- Request IDs for tracking
- Timestamp logging
- Parameter validation
- Error stack traces
- CDP API response codes

### Check Transaction Status
```bash
# View on BaseScan
https://sepolia.basescan.org/tx/[TRANSACTION_HASH]

# Check wallet balance
https://sepolia.basescan.org/address/[WALLET_ADDRESS]
```

---

## Recommendations

### Current Setup (Keep)
✅ Use Coinbase SDK for transactions  
✅ Environment variables properly configured  
✅ Comprehensive error logging  
✅ Database transaction recording  
✅ Activity tracking  

### Future Enhancements
🔮 Add transaction status polling  
🔮 Implement retry logic for failed txs  
🔮 Add transaction history UI  
🔮 Support multiple tokens (ETH, WETH, etc.)  
🔮 Add address book for frequent recipients  

---

## Summary

The current implementation using the **Coinbase SDK** is the **correct and recommended approach**. The SDK handles all the complexity shown in the CDP REST API documentation (JWT generation, RLP encoding, signing, etc.) automatically.

**No changes needed** - the implementation is following best practices. Focus should be on:
1. ✅ Ensuring sufficient USDC balance
2. ✅ Proper amount conversion (cents → wei)
3. ✅ Wallet data properly stored in DB
4. ✅ CDP credentials correctly configured

The direct REST API method shown in the documentation is for developers who:
- Cannot use the SDK (e.g., non-Node.js environments)
- Need ultra-fine-grained control
- Are building custom implementations

For a Next.js/TypeScript application like StreakPets, **the SDK is ideal**. ✨
