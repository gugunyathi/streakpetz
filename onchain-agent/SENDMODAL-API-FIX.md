# SendModal API Fix

**Date**: December 2024  
**Issue**: "Missing required fields: fromAddress, toAddress, and amount are required"  
**Status**: ✅ Fixed

---

## Problem

The SendModal was sending incorrect field names to the `/api/wallet/transfer` endpoint:

**Sent**:
```json
{
  "walletAddress": "0x...",  // ❌ Wrong field name
  "toAddress": "0x...",
  "amount": 100
}
```

**Expected by API**:
```json
{
  "fromAddress": "0x...",    // ✅ Correct field name
  "toAddress": "0x...",
  "amount": 100
}
```

This caused a **400 Bad Request** error with the message:
> "Missing required fields: fromAddress, toAddress, and amount are required"

---

## Solution

Updated `SendModal.tsx` to send the correct field name:

### Before
```typescript
body: JSON.stringify({
  walletAddress,          // ❌ Wrong
  toAddress: recipientAddress,
  amount: Math.floor(sendAmount * 100),
})
```

### After
```typescript
body: JSON.stringify({
  fromAddress: walletAddress,  // ✅ Correct
  toAddress: recipientAddress,
  amount: Math.floor(sendAmount * 100),
})
```

---

## API Endpoint Requirements

**Endpoint**: `POST /api/wallet/transfer`

**Required Fields**:
- `fromAddress` (string) - Sender's wallet address
- `toAddress` (string) - Recipient's wallet address  
- `amount` (number) - Amount in cents (e.g., 100 = $1.00)

**Optional Fields**:
- `network` (string) - Defaults to 'base-sepolia'
- `userId` (string) - For logging purposes
- `petId` (string) - For logging purposes

---

## Testing

✅ Send modal now sends correct field names  
✅ API accepts the request  
✅ No more 400 Bad Request errors  
✅ Transfers execute successfully  

---

## Summary

Fixed SendModal to use `fromAddress` instead of `walletAddress` when calling the transfer API, resolving the 400 error.
