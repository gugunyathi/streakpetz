# 🚀 Quick Integration Guide

## Chat Message Storage - READY TO USE ✅

### Frontend Usage
```typescript
// Load chat history (automatic on mount in ChatInterface)
const response = await fetch(`/api/chats?userId=${userId}&petId=${petId}&limit=50`);
const { messages } = await response.json();

// Send and save message
await fetch('/api/chats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    petId,
    sender: 'user',
    content: messageText,
    metadata: {}
  })
});

// Mark messages as read
await fetch('/api/chats', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    petId,
    markAllAsRead: true
  })
});
```

---

## Transaction Tracking - READY FOR INTEGRATION 🔄

### How to Integrate in Wallet Transfer

**File**: `app/api/wallet/transfer/route.ts`

Add this after successful transaction:
```typescript
// Record transaction in database
await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionHash: txHash,
    from: fromAddress,
    to: toAddress,
    amount: amount.toString(),
    token: 'USDC',
    network: 'base-sepolia',
    type: 'transfer',
    status: 'pending',
    userId: userId,
    petId: petId,
    metadata: {
      note: 'User transfer'
    }
  })
});

// Later, update status when confirmed
await fetch('/api/transactions', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionHash: txHash,
    status: 'confirmed',
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    gasFee: receipt.effectiveGasPrice.mul(receipt.gasUsed).toString()
  })
});
```

### How to Integrate in Pet Store

**File**: `app/api/pets/inventory/route.ts` or store purchase endpoint

Add after successful purchase:
```typescript
await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionHash: txHash,
    from: userWalletAddress,
    to: STORE_TREASURY_ADDRESS,
    amount: itemPrice.toString(),
    token: 'USDC',
    network: 'base-sepolia',
    type: 'purchase',
    status: 'pending',
    userId: userId,
    petId: petId,
    metadata: {
      itemId: item.id,
      itemName: item.name,
      itemType: item.type,
      quantity: 1
    }
  })
});
```

---

## Activity Logging - READY FOR INTEGRATION 🔄

### Authentication Events

**File**: `app/api/auth/[...nextauth]/route.ts` or `lib/auth.ts`

```typescript
import ActivityLog from '@/lib/models/ActivityLog';

// On login
await ActivityLog.logActivity(
  userId,
  'user_login',
  'auth',
  { method: 'google' },
  null,
  { ipAddress, userAgent }
);

// On logout
await ActivityLog.logActivity(
  userId,
  'user_logout',
  'auth',
  {},
  null,
  { ipAddress, userAgent }
);

// On registration
await ActivityLog.logActivity(
  userId,
  'user_registered',
  'auth',
  { method: 'credentials' },
  null,
  { ipAddress, userAgent }
);
```

### Pet Interactions

**Files**: Pet action endpoints (feed, play, groom, evolve)

```typescript
// After feeding pet
await ActivityLog.logActivity(
  userId,
  'pet_fed',
  'pet',
  { 
    itemUsed: 'premium_food',
    hungerBefore: 50,
    hungerAfter: 100
  },
  petId
);

// After playing with pet
await ActivityLog.logActivity(
  userId,
  'pet_played',
  'pet',
  { 
    activityType: 'fetch',
    happinessBefore: 60,
    happinessAfter: 85,
    xpGained: 10
  },
  petId
);

// After grooming
await ActivityLog.logActivity(
  userId,
  'pet_groomed',
  'pet',
  { 
    cleannessBefore: 40,
    cleannessAfter: 100
  },
  petId
);

// After evolution
await ActivityLog.logActivity(
  userId,
  'pet_evolved',
  'pet',
  { 
    fromStage: 'egg',
    toStage: 'baby',
    xpLevel: 50
  },
  petId
);
```

### Wallet Operations

```typescript
// After transfer
await ActivityLog.logActivity(
  userId,
  'wallet_transfer',
  'wallet',
  { 
    to: recipientAddress,
    amount: amount.toString(),
    token: 'USDC',
    transactionHash: txHash
  },
  petId
);

// After receiving funds
await ActivityLog.logActivity(
  userId,
  'wallet_received',
  'wallet',
  { 
    from: senderAddress,
    amount: amount.toString(),
    token: 'USDC',
    transactionHash: txHash
  },
  petId
);
```

### Social Interactions

**File**: Friend management endpoints

```typescript
// After adding friend
await ActivityLog.logActivity(
  userId,
  'friend_added',
  'social',
  { 
    friendAddress: friendAddress,
    friendName: friendName
  }
);

// After removing friend
await ActivityLog.logActivity(
  userId,
  'friend_removed',
  'social',
  { 
    friendAddress: friendAddress
  }
);

// After sending XMTP message
await ActivityLog.logActivity(
  userId,
  'message_sent',
  'social',
  { 
    to: friendAddress,
    messageLength: message.length
  }
);
```

### Purchase Events

**File**: Store purchase endpoints

```typescript
await ActivityLog.logActivity(
  userId,
  'item_purchased',
  'purchase',
  { 
    itemId: item.id,
    itemName: item.name,
    itemType: item.type,
    price: item.price,
    currency: 'USDC',
    transactionHash: txHash
  },
  petId
);
```

### System Events

```typescript
// On error
await ActivityLog.logActivity(
  userId,
  'error_occurred',
  'system',
  { 
    errorType: error.name,
    errorMessage: error.message,
    endpoint: req.url
  },
  petId
);
```

---

## Testing Your Integrations

### 1. Test Chat Storage
```bash
# Terminal
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "petId": "pet456",
    "sender": "user",
    "content": "Hello, pet!"
  }'

# Verify in MongoDB
# db.chatmessages.find({ userId: "user123" })
```

### 2. Test Transaction Tracking
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0x123...",
    "from": "0xabc...",
    "to": "0xdef...",
    "amount": "10.00",
    "token": "USDC",
    "network": "base-sepolia",
    "type": "transfer",
    "userId": "user123",
    "petId": "pet456"
  }'
```

### 3. Test Activity Logging
```bash
curl -X POST http://localhost:3000/api/activity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "action": "pet_fed",
    "category": "pet",
    "details": {
      "itemUsed": "premium_food"
    },
    "petId": "pet456"
  }'
```

---

## Common Patterns

### Error Handling Pattern
```typescript
try {
  // Your code here
  
  // Log success activity
  await ActivityLog.logActivity(
    userId,
    'action_completed',
    'category',
    { details },
    petId
  );
  
} catch (error) {
  console.error('Error:', error);
  
  // Log error activity
  await ActivityLog.logActivity(
    userId,
    'action_failed',
    'system',
    { 
      error: error.message,
      action: 'original_action'
    },
    petId
  );
  
  throw error;
}
```

### Pagination Pattern
```typescript
const limit = parseInt(req.query.limit || '50');
const offset = parseInt(req.query.offset || '0');

const items = await Model.find(query)
  .sort({ timestamp: -1 })
  .skip(offset)
  .limit(limit);

const total = await Model.countDocuments(query);

return {
  items,
  pagination: {
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  }
};
```

### Transaction Status Polling Pattern
```typescript
// Frontend: Poll for transaction status
const pollTransactionStatus = async (txHash: string) => {
  const maxAttempts = 30; // 30 attempts
  const interval = 2000; // 2 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/transactions?hash=${txHash}`);
    const { transaction } = await response.json();
    
    if (transaction.status === 'confirmed') {
      return transaction;
    }
    
    if (transaction.status === 'failed') {
      throw new Error('Transaction failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Transaction timeout');
};
```

---

## Environment Setup

### Required Environment Variables
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/streakpets?retryWrites=true&w=majority

# OpenAI (for chat AI)
OPENAI_API_KEY=sk-...

# Base Sepolia Network
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CHAIN_ID=84532

# Coinbase SDK
CDP_API_KEY_NAME=...
CDP_API_KEY_PRIVATE_KEY=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Store Treasury
NEXT_PUBLIC_STORE_TREASURY_ADDRESS=0x226710d13E6c16f1c99F34649526bD3bF17cd010
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

---

## Monitoring & Debugging

### Check Database Records
```javascript
// In MongoDB shell or Compass

// View recent chat messages
db.chatmessages.find().sort({ timestamp: -1 }).limit(10)

// View recent transactions
db.transactions.find().sort({ timestamp: -1 }).limit(10)

// View recent activity logs
db.activitylogs.find().sort({ timestamp: -1 }).limit(10)

// Get user chat history
db.chatmessages.find({ 
  userId: ObjectId("..."), 
  petId: ObjectId("...") 
}).sort({ timestamp: 1 })

// Get user transaction summary
db.transactions.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $group: { 
    _id: "$type", 
    count: { $sum: 1 },
    totalAmount: { $sum: { $toDouble: "$amount" } }
  }}
])

// Get user activity summary
db.activitylogs.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $group: { 
    _id: "$category", 
    count: { $sum: 1 }
  }}
])
```

### API Testing with curl

```bash
# Get chat messages
curl "http://localhost:3000/api/chats?userId=USER_ID&petId=PET_ID&limit=50"

# Get transactions
curl "http://localhost:3000/api/transactions?userId=USER_ID&limit=20"

# Get activity logs
curl "http://localhost:3000/api/activity?userId=USER_ID&days=7"

# Get activity stats
curl "http://localhost:3000/api/activity/stats?userId=USER_ID&days=30"
```

---

## Next Steps

1. **Integrate Transaction Tracking**
   - Add to wallet transfer endpoint
   - Add to store purchase flow
   - Implement status polling

2. **Add Activity Logging**
   - Auth events (login/logout/register)
   - Pet interactions (feed/play/groom/evolve)
   - Wallet operations
   - Social features

3. **Build UI Components**
   - Transaction history view
   - Activity feed
   - Analytics dashboard

4. **Testing**
   - Unit tests for models
   - Integration tests for APIs
   - E2E tests for critical flows

5. **Documentation**
   - API documentation
   - User guides
   - Developer guides

---

## Support

For questions or issues:
1. Check `PRODUCTION-READINESS-AUDIT.md` for comprehensive analysis
2. Check `IMPLEMENTATION-SUMMARY.md` for detailed feature docs
3. Review model files in `lib/models/`
4. Review API routes in `app/api/`

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Ready for Integration
