# Payment Wallet Fix - Pet Store Modal

## Problem Summary

**Error**: `"Wallet data not found. Wallet may not be properly initialized."`

**Location**: Pet Store payment modal → BasePayButton → wallet transfer API

**Root Cause**: User wallets created without the `walletData` field properly populated in the database, preventing the Coinbase SDK from importing the wallet for transaction signing.

## Why This Happened

1. **Wallet Creation**: When user wallets are created via `/api/wallet`, the wallet is properly created with Coinbase SDK
2. **Database Storage**: The wallet is saved to MongoDB with `walletId` and `address` 
3. **Missing walletData**: However, some wallets were created without the `walletData` field (exported wallet JSON) being saved
4. **Payment Failure**: When attempting payment, the `/api/wallet/transfer` endpoint needs to:
   - Import the wallet using `Wallet.import(walletData)`
   - Sign the transaction
   - Without `walletData`, the import fails → payment fails

## The Fix

### 1. Enhanced Error Handling (`lib/wallet.ts`)

**File**: `lib/wallet.ts`  
**Function**: `executeGasFreePayment()`

**Changes**:
- Added validation for wallet address format before API calls
- Enhanced error messages to help users understand the issue
- Added specific error handling for wallet data issues
- Provides clear instructions to users (reconnect wallet, etc.)

```typescript
// Validate wallet address format before API call
if (!fromWalletAddress || !fromWalletAddress.startsWith('0x') || fromWalletAddress.length !== 42) {
  return {
    success: false,
    error: 'Invalid sender wallet address format. Please reconnect your wallet.'
  };
}

// Detailed error response handling
if (errorMsg.includes('Wallet data not found')) {
  return {
    success: false,
    error: 'Your wallet needs to be reinitialized. Please disconnect and reconnect your wallet.'
  };
}
```

### 2. Automatic Wallet Repair (`components/BasePayButton.tsx`)

**File**: `BasePayButton.tsx`  
**Function**: `handlePayment()`

**Changes**:
- Detects when wallet data is missing
- Automatically attempts to repair the wallet by calling the repair endpoint
- Provides clear user feedback

```typescript
// Check if error is related to missing wallet data
if (paymentResult.error?.includes('wallet needs to be reinitialized') || 
    paymentResult.error?.includes('Wallet data not found')) {
  // Attempt to repair the wallet automatically
  console.log('Attempting automatic wallet repair...');
  const repairResponse = await fetch('/api/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'repairWallet',
      walletAddress
    })
  });
  
  if (repairResult.success) {
    throw new Error('Wallet repaired. Please try your payment again.');
  }
}
```

### 3. Wallet Repair Endpoint (`app/api/wallet/route.ts`)

**File**: `app/api/wallet/route.ts`  
**Action**: `repairWallet`

**Purpose**: Repairs existing wallets that don't have `walletData` field

**How it works**:
1. Finds wallet in database by address
2. Checks if `walletData` is missing
3. Fetches the wallet from Coinbase using `Wallet.fetch(walletId)`
4. Exports the wallet data using `wallet.export()`
5. Saves the exported data to the database

```typescript
else if (action === 'repairWallet') {
  const { walletAddress } = body;
  const walletDoc = await WalletModel.findOne({ address: walletAddress.toLowerCase() });
  
  if (!walletDoc.walletData) {
    const wallet = await Wallet.fetch(walletDoc.walletId);
    const walletData = wallet.export();
    walletDoc.walletData = JSON.stringify(walletData);
    await walletDoc.save();
    
    return NextResponse.json({
      success: true,
      message: 'Wallet repaired successfully'
    });
  }
}
```

### 4. User-Friendly Error Messages (`components/PetStoreModal.tsx`)

**File**: `PetStoreModal.tsx`  
**Component**: `BasePayButton` callbacks

**Changes**:
- Different error messages for different scenarios:
  - Wallet repaired → "Try payment again"
  - Wallet needs reinitialization → "Refresh and reconnect"
  - Insufficient balance → "Add more USDC"
  - Other errors → "Contact support"

```typescript
onPaymentError={(error: string) => {
  if (error.includes('Wallet repaired')) {
    alert('Your wallet has been repaired. Please try your payment again.');
  } else if (error.includes('reinitialized') || error.includes('reconnect')) {
    alert(`Wallet Error: ${error}\n\nPlease refresh the page and reconnect your wallet.`);
  } else if (error.includes('Insufficient')) {
    alert(`Insufficient Balance: ${error}\n\nPlease add more USDC to your wallet.`);
  } else {
    alert(`Payment Failed: ${error}\n\nIf the problem persists, please contact support.`);
  }
}}
```

## Payment Flow (After Fix)

```
User clicks "Buy" in Pet Store
         ↓
BasePayButton validates wallet address
         ↓
Calls executeGasFreePayment() in lib/wallet.ts
         ↓
Checks wallet exists via GET /api/wallet?address={address}
         ↓
Validates wallet network matches transaction network
         ↓
Calls POST /api/wallet/transfer with payment details
         ↓
Transfer API imports wallet using walletData
         ↓
   [If walletData missing]
         ↓
   Returns specific error
         ↓
   BasePayButton detects error
         ↓
   Automatically calls repairWallet endpoint
         ↓
   Wallet.fetch() → wallet.export() → save walletData
         ↓
   Returns "Wallet repaired" message
         ↓
   User retries payment (now succeeds)
         ↓
Signs transaction using Coinbase SDK
         ↓
Executes USDC transfer via smart contract
         ↓
Returns transaction hash
         ↓
Payment success! Pet store item purchased
```

## Testing the Fix

### 1. Test Existing Wallet (Without walletData)
```bash
# User has existing wallet but payment fails
# System should auto-repair and ask user to retry
```

### 2. Test New Wallet
```bash
# New wallet should be created with walletData
# Payment should work immediately
```

### 3. Manual Wallet Repair
```bash
# Can manually repair a wallet via API
curl -X POST http://localhost:3000/api/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "action": "repairWallet",
    "walletAddress": "0x..."
  }'
```

## Prevention

Future wallet creations ensure `walletData` is always saved:

**In `/api/wallet` (createUserWallet action)**:
```typescript
// Export wallet data for persistence
const walletData = wallet.export();

// Save wallet with walletData
const walletDoc = new WalletModel({
  walletId: wallet.getId(),
  address: address.getId(),
  network,
  type: 'user',
  ownerId: userId,
  walletData: JSON.stringify(walletData) // ✅ Always include this
});
await walletDoc.save();
```

## Benefits

1. **Automatic Recovery**: Wallets are automatically repaired when payment fails
2. **Better UX**: Clear error messages guide users
3. **No Data Loss**: Existing wallets can be recovered
4. **Prevention**: New wallets always include walletData
5. **Gas-Free**: Maintains paymaster functionality for gas-free transactions

## Configuration

All payments use Base Sepolia testnet (Chain ID: 84532):
- **Network**: base-sepolia (forced, cannot use mainnet)
- **USDC Contract**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Paymaster Endpoint**: `https://api.developer.coinbase.com/rpc/v1/base-sepolia/hPe1vPn9H3lkH0Cr8YT4WDgQEsuW17Hy`

## Summary

The fix ensures that:
1. ✅ Wallets always have `walletData` for signing
2. ✅ Missing `walletData` triggers automatic repair
3. ✅ Clear error messages guide users
4. ✅ Payments work from Pet Store modal
5. ✅ Gas-free transactions via paymaster
6. ✅ Network locked to Base Sepolia testnet
