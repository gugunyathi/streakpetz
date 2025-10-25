# Payment Error Logging System - Pet Store

## Overview
Comprehensive error logging has been implemented for the Pet Store payment flow to identify and diagnose the 500 error occurring during payments.

---

## Error Tracking

### Request ID System
Every payment request is assigned a unique ID for tracking:
```
Format: tx_[timestamp]_[random]
Example: tx_1729000000000_abc123xyz
```

This ID appears in all console logs for easy correlation.

---

## Logging Checkpoints

### 1. **Request Start**
```
🔷 PAYMENT REQUEST STARTED [tx_xxx]
Time: 2025-10-19T12:34:56.789Z
```

### 2. **Coinbase SDK Configuration**
```
✅ Coinbase SDK configured [tx_xxx]
OR
❌ Coinbase SDK configuration failed [tx_xxx]: [error details]
```

### 3. **Request Body Validation**
```
📋 Request Body [tx_xxx]:
   fromAddress: 0x...
   toAddress: 0x...
   amount: 100000000
   network: base-sepolia
   userId: provided/missing
   petId: provided/missing
```

### 4. **Database Connection**
```
📦 Connecting to database [tx_xxx]...
✅ Database connected [tx_xxx]
OR
❌ Database connection failed [tx_xxx]: [error details]
```

### 5. **Wallet Lookup**
```
🔍 Looking up wallet [tx_xxx]: 0x...
✅ Wallet found [tx_xxx]:
   walletId: [id]
   address: [address]
   network: base-sepolia
   type: user
   hasWalletData: true/false
   walletDataLength: [bytes]
OR
❌ Wallet not found in database [tx_xxx]: 0x...
```

### 6. **Wallet Import**
```
🔐 Importing wallet from stored data [tx_xxx]...
📄 Wallet data parsed successfully [tx_xxx], importing...
✅ Wallet imported successfully [tx_xxx] for address: 0x...
OR
❌ Failed to import wallet [tx_xxx]:
   error: [message]
   stack: [stack trace]
   walletId: [id]
   address: [address]
```

### 7. **Transfer Execution**
```
💸 Executing USDC transfer [tx_xxx]:
   Amount: 100000000 wei
   To: 0x226710d13E6c16f1c99F34649526bD3bF17cd010
   USDC Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
   Network: base-sepolia

📤 Invoking contract method [tx_xxx]...
✅ Contract invoked [tx_xxx] (250ms)
⏳ Waiting for transaction broadcast [tx_xxx]...
✅ Transaction broadcasted [tx_xxx] (1500ms)
✅ Transfer successful [tx_xxx]: 0xabc...def
```

### 8. **Database Recording**
```
📝 Transaction recorded in database: 0xabc...def
📊 Activity logged for transfer
```

### 9. **Request Completion**
```
✅ PAYMENT REQUEST COMPLETED [tx_xxx]
   Transaction Hash: 0xabc...def
   Total Duration: 2500ms
================================================================================
```

---

## Error Codes

### Client-Side Errors (400)
| Code | Meaning | User Action |
|------|---------|-------------|
| `MISSING_FIELDS` | fromAddress, toAddress, or amount not provided | Check wallet connection |
| `WALLET_DATA_MISSING` | Wallet exists but walletData field is empty | Click "Reconnect Wallet" |
| `WALLET_NOT_FOUND` | Wallet address not in database | Refresh page or reconnect |
| `NETWORK_MISMATCH` | Wallet on different network than required | Switch to Base Sepolia |

### Server-Side Errors (500)
| Code | Meaning | Resolution |
|------|---------|------------|
| `SDK_CONFIG_FAILED` | Coinbase SDK configuration failed | Check CDP API keys in .env |
| `DB_CONNECTION_FAILED` | MongoDB connection failed | Check MONGODB_URI in .env |
| `DB_QUERY_FAILED` | Database query error | Check MongoDB status |
| `WALLET_IMPORT_FAILED` | Cannot import wallet from walletData | Wallet may be corrupted, reconnect |
| `TRANSFER_EXECUTION_FAILED` | Contract invocation or broadcast failed | Check network, paymaster endpoint |
| `CRITICAL_ERROR` | Unexpected error outside try-catch blocks | Check server logs |

---

## Error Output Format

### Transfer Execution Failure
```
❌ TRANSFER EXECUTION FAILED [tx_xxx]:
   Error: [error message]
   Error Type: [Error class name]
   Duration: 1234ms
   Stack Trace:
   [full stack trace]

📝 Failed transaction logged [tx_xxx]
📊 Failed activity logged [tx_xxx]
================================================================================
```

### Critical Error
```
❌❌❌ CRITICAL ERROR IN TRANSFER API [tx_xxx]:
   Error: [error message]
   Error Type: [Error class name]
   Duration: 456ms
   Stack Trace:
   [full stack trace]
================================================================================
```

---

## Identifying the 500 Error

### Steps to Diagnose

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Attempt a payment**
4. **Look for the Request ID** in console logs (e.g., `tx_1729000000000_abc123`)
5. **Follow the logs** with that Request ID through all checkpoints
6. **Identify where it fails**:
   - ✅ checkmarks = successful step
   - ❌ X marks = failed step

### Common Failure Points

#### 1. SDK Configuration Failure
```
❌ Coinbase SDK configuration failed [tx_xxx]
```
**Cause**: Missing or invalid CDP API keys  
**Fix**: Check `.env` file has valid `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET`

#### 2. Wallet Data Missing
```
❌ Wallet 0x... is missing walletData field [tx_xxx]
```
**Cause**: Wallet created before walletData export was implemented  
**Fix**: User clicks "Reconnect Wallet" button in Pet Store modal

#### 3. Wallet Import Failure
```
❌ Failed to import wallet [tx_xxx]:
   error: Cannot export Wallet without loaded seed
```
**Cause**: Corrupted wallet data or old wallet format  
**Fix**: User needs to refresh page to create new wallet

#### 4. Contract Invocation Failure
```
❌ TRANSFER EXECUTION FAILED [tx_xxx]:
   Error: Contract execution reverted
```
**Cause**: Insufficient balance, contract error, or network issue  
**Fix**: Check USDC balance, verify USDC contract address, check network

#### 5. Database Connection Failure
```
❌ Database connection failed [tx_xxx]
```
**Cause**: MongoDB not running or MONGODB_URI incorrect  
**Fix**: Start MongoDB, verify connection string

---

## Testing the Error Logging

### Test 1: Normal Payment
1. Ensure wallet has USDC balance
2. Click Buy on any item
3. Check console logs for full flow
4. Should see: `✅ PAYMENT REQUEST COMPLETED`

### Test 2: Missing Wallet Data
1. Find wallet in MongoDB with no `walletData` field
2. Attempt payment
3. Should see: `❌ Wallet ... is missing walletData field`
4. Error code: `WALLET_DATA_MISSING`

### Test 3: Invalid Amount
1. Modify request to send negative or zero amount
2. Should see validation error

### Test 4: Network Issue
1. Disconnect internet briefly during payment
2. Should see: `❌ TRANSFER EXECUTION FAILED`
3. Error about network timeout

---

## Monitoring Best Practices

### Development
- Keep Console open during testing
- Use Request ID to track individual payments
- Check both browser and terminal logs
- Save error logs for debugging

### Production (Future)
- Set up logging service (e.g., Sentry, LogRocket)
- Track error codes with analytics
- Alert on critical errors
- Monitor payment success rate

---

## Quick Diagnostics

### If user reports "Payment failing":

1. **Ask for Request ID** from console logs
2. **Check terminal logs** for that Request ID
3. **Identify the last ✅ checkpoint**
4. **Look at the next ❌ error**
5. **Match error code** to resolution table above
6. **Apply fix** based on error code

### Example Log Analysis

```
🔷 PAYMENT REQUEST STARTED [tx_1729_abc]
✅ Coinbase SDK configured [tx_1729_abc]
📋 Request Body [tx_1729_abc]: [valid data]
📦 Connecting to database [tx_1729_abc]...
✅ Database connected [tx_1729_abc]
🔍 Looking up wallet [tx_1729_abc]: 0x123...
✅ Wallet found [tx_1729_abc]: hasWalletData: false  ← PROBLEM HERE
❌ Wallet 0x123... is missing walletData field [tx_1729_abc]
```

**Diagnosis**: Wallet exists but has no walletData  
**Error Code**: `WALLET_DATA_MISSING`  
**Solution**: User clicks "Reconnect Wallet" button

---

## Files Modified

### `/app/api/wallet/transfer/route.ts`
- Added request ID generation
- Added checkpoint logging at every step
- Added detailed error logging with error codes
- Added timing measurements
- Added structured error responses

### Error Codes Added
- ✅ `MISSING_FIELDS`
- ✅ `SDK_CONFIG_FAILED`
- ✅ `DB_CONNECTION_FAILED`
- ✅ `DB_QUERY_FAILED`
- ✅ `WALLET_NOT_FOUND`
- ✅ `NETWORK_MISMATCH`
- ✅ `WALLET_DATA_MISSING`
- ✅ `WALLET_IMPORT_FAILED`
- ✅ `TRANSFER_EXECUTION_FAILED`
- ✅ `CRITICAL_ERROR`

---

## Next Steps

1. **Test payment in browser**
2. **Check console for Request ID**
3. **Follow logs to identify failure point**
4. **Report back with**:
   - Request ID
   - Last successful checkpoint (✅)
   - Error message (❌)
   - Error code from response

This will pinpoint exactly where and why the 500 error is occurring.

---

## Expected Output for Successful Payment

```
================================================================================
🔷 PAYMENT REQUEST STARTED [tx_1729000123456_a1b2c3]
Time: 2025-10-19T14:30:45.123Z
✅ Coinbase SDK configured [tx_1729000123456_a1b2c3]
📋 Request Body [tx_1729000123456_a1b2c3]:
   fromAddress: 0xFfB6622382adE411D56137e13b77e7BFe11c8C3C
   toAddress: 0x226710d13E6c16f1c99F34649526bD3bF17cd010
   amount: 100000000
   network: base-sepolia
   userId: provided
   petId: provided
💰 Processing USDC transfer [tx_1729000123456_a1b2c3]:
   Amount: 100000000 wei
   From: 0xFfB6622382adE411D56137e13b77e7BFe11c8C3C
   To: 0x226710d13E6c16f1c99F34649526bD3bF17cd010
   Network: base-sepolia
📦 Connecting to database [tx_1729000123456_a1b2c3]...
✅ Database connected [tx_1729000123456_a1b2c3]
🔍 Looking up wallet [tx_1729000123456_a1b2c3]: 0xFfB6622382adE411D56137e13b77e7BFe11c8C3C
✅ Wallet found [tx_1729000123456_a1b2c3]:
   walletId: abc-def-ghi
   address: 0xffb6622382ade411d56137e13b77e7bfe11c8c3c
   network: base-sepolia
   type: user
   hasWalletData: true
   walletDataLength: 523
🔐 Importing wallet from stored data [tx_1729000123456_a1b2c3]...
📄 Wallet data parsed successfully [tx_1729000123456_a1b2c3], importing...
✅ Wallet imported successfully [tx_1729000123456_a1b2c3] for address: 0xFfB6622382adE411D56137e13b77e7BFe11c8C3C

💸 Executing USDC transfer [tx_1729000123456_a1b2c3]:
   Amount: 100000000 wei
   To: 0x226710d13E6c16f1c99F34649526bD3bF17cd010
   USDC Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
   Network: base-sepolia
📤 Invoking contract method [tx_1729000123456_a1b2c3]...
✅ Contract invoked [tx_1729000123456_a1b2c3] (234ms)
⏳ Waiting for transaction broadcast [tx_1729000123456_a1b2c3]...
✅ Transaction broadcasted [tx_1729000123456_a1b2c3] (1678ms)
✅ Transfer successful [tx_1729000123456_a1b2c3]: 0x9f3c...e4b2
📝 Transaction recorded in database: 0x9f3c...e4b2
📊 Activity logged for transfer

✅ PAYMENT REQUEST COMPLETED [tx_1729000123456_a1b2c3]
   Transaction Hash: 0x9f3c...e4b2
   Total Duration: 2456ms
================================================================================
```

---

## Summary

The comprehensive error logging system is now active. Every payment attempt will be tracked with a unique Request ID and logged at each checkpoint. When the 500 error occurs again, the logs will show exactly where the payment process fails, making it easy to identify and fix the root cause.

**To use**: Simply attempt a payment and check the browser console and server terminal for the detailed logs with the Request ID.
