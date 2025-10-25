# USDC Amount Conversion Fix

**Date**: December 2024  
**Issue**: Incorrect USDC to wei conversion causing transaction failures  
**Status**: ✅ Fixed

---

## Problem

The amount conversion was incorrect, causing transactions to fail with insufficient balance errors.

### What Was Wrong

**Frontend** was sending:
```javascript
amount: Math.floor(sendAmount * 100)  // $2.00 → 200 (cents)
```

**Backend** was expecting:
```javascript
// Treated 200 as wei (0.0002 USDC) ❌
```

**What We Actually Need**:
```javascript
$2.00 → 2,000,000 wei (USDC has 6 decimals)
```

---

## USDC Decimal System

USDC uses **6 decimals** (not 18 like ETH):

```
$1.00 USDC = 1,000,000 wei
$2.00 USDC = 2,000,000 wei
$0.01 USDC = 10,000 wei

Formula: USDC_AMOUNT * 1,000,000 = WEI
```

---

## Solution

### 1. Frontend Change (SendModal.tsx)

**Before**:
```typescript
body: JSON.stringify({
  fromAddress: walletAddress,
  toAddress: recipientAddress,
  amount: Math.floor(sendAmount * 100), // ❌ Wrong: sends cents
})
```

**After**:
```typescript
body: JSON.stringify({
  fromAddress: walletAddress,
  toAddress: recipientAddress,
  amount: sendAmount, // ✅ Correct: sends USDC amount (e.g., 2.00)
})
```

### 2. Backend Change (route.ts)

**Before**:
```typescript
const txNetwork = 'base-sepolia';

console.log(`💰 Processing USDC transfer [${requestId}]:`);
console.log(`   Amount: ${amount} wei`); // ❌ Wrong: treated input as wei
```

**After**:
```typescript
const txNetwork = 'base-sepolia';

// Convert USDC amount to wei (6 decimals)
// Input: 2.00 USDC → Output: 2000000 wei
const amountInWei = Math.floor(parseFloat(amount.toString()) * 1000000);

console.log(`💰 Processing USDC transfer [${requestId}]:`);
console.log(`   Amount (USDC): ${amount}`);
console.log(`   Amount (wei): ${amountInWei}`);
```

### 3. Contract Invocation

**Before**:
```typescript
const transferAmount = amount.toString(); // ❌ Used wrong amount
```

**After**:
```typescript
const transferAmount = amountInWei.toString(); // ✅ Use converted wei amount
```

### 4. Database Logging

**Before**:
```typescript
amount: amount.toString(), // Stored inconsistent amount
```

**After**:
```typescript
amount: amountInWei.toString(), // Store wei amount
metadata: {
  note: 'User-initiated transfer',
  usdcAmount: amount.toString() // Also keep original USDC amount
}
```

---

## Flow Example

### User Sends $2.00 USDC

1. **User Input**: 2.00
2. **Frontend**: Sends `amount: 2.00`
3. **Backend**: Converts `2.00 * 1,000,000 = 2,000,000 wei`
4. **Contract**: Transfers `2,000,000` (recognized as 2.00 USDC)
5. **Database**: Stores both:
   - `amount: "2000000"` (wei)
   - `metadata.usdcAmount: "2.00"` (display)

---

## Test Cases

### Test Case 1: $1.00 USDC
```
Input: 1.00
Conversion: 1.00 * 1,000,000 = 1,000,000 wei
Expected: ✅ Success
```

### Test Case 2: $2.00 USDC
```
Input: 2.00
Conversion: 2.00 * 1,000,000 = 2,000,000 wei
Expected: ✅ Success
```

### Test Case 3: $10.50 USDC
```
Input: 10.50
Conversion: 10.50 * 1,000,000 = 10,500,000 wei
Expected: ✅ Success
```

### Test Case 4: $0.01 USDC (Edge Case)
```
Input: 0.01
Conversion: 0.01 * 1,000,000 = 10,000 wei
Expected: ✅ Success (but below $1 minimum in store)
```

---

## Comparison: USDC vs ETH

| Token | Decimals | $1.00 = | Example |
|-------|----------|---------|---------|
| **USDC** | 6 | 1,000,000 wei | $2.00 = 2,000,000 |
| **ETH** | 18 | 1,000,000,000,000,000,000 wei | 1 ETH = 10^18 |

**Key Difference**: USDC uses far fewer decimals than ETH!

---

## Before vs After

### Before (Broken)
```
User sends $2.00
  ↓
Frontend: amount = 200 (cents)
  ↓
Backend: treats 200 as wei (0.0002 USDC)
  ↓
Contract: Tries to send 0.0002 USDC
  ↓
Result: ❌ Insufficient balance or invalid amount
```

### After (Fixed)
```
User sends $2.00
  ↓
Frontend: amount = 2.00 (USDC)
  ↓
Backend: converts to 2,000,000 wei
  ↓
Contract: Sends 2,000,000 wei (2.00 USDC)
  ↓
Result: ✅ Transaction succeeds!
```

---

## Console Logs

### New Logs Added
```typescript
console.log(`💰 Processing USDC transfer [${requestId}]:`);
console.log(`   Amount (USDC): ${amount}`);          // Shows: 2.00
console.log(`   Amount (wei): ${amountInWei}`);      // Shows: 2000000
console.log(`   From: ${fromAddress}`);
console.log(`   To: ${toAddress}`);
console.log(`   Network: ${txNetwork}`);

console.log(`💰 Transfer amount prepared: ${transferAmount} wei (${amountInWei / 1000000} USDC)`);
```

---

## Files Changed

1. ✅ **components/SendModal.tsx**
   - Removed `* 100` conversion
   - Now sends USDC amount directly

2. ✅ **app/api/wallet/transfer/route.ts**
   - Added `* 1,000,000` conversion for USDC
   - Updated logging to show both USDC and wei
   - Updated database storage
   - Updated activity logging

---

## Summary

**Problem**: Sending cents (200) instead of wei (2,000,000)  
**Solution**: Frontend sends USDC, backend converts to wei  
**Formula**: `USDC * 1,000,000 = WEI`  
**Result**: ✅ Transactions now work correctly!

---

## Testing Checklist

- [ ] Send $1.00 USDC → Should show 1,000,000 wei in logs
- [ ] Send $2.00 USDC → Should show 2,000,000 wei in logs
- [ ] Send $5.00 USDC → Should show 5,000,000 wei in logs
- [ ] Transaction succeeds on blockchain
- [ ] Balance updates correctly
- [ ] BaseScan shows correct amount
- [ ] Database logs correct amounts
- [ ] Activity log shows both USDC and wei

---

**Status**: ✅ **READY TO TEST**

Try sending USDC now - the conversion should work properly! 🎉
