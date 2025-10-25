# 🧪 Testing Guide

## Running Tests

This guide covers manual and automated testing for the production-ready features.

## 1. Transaction Tracking Tests

### Test Transaction Recording
```bash
# Test wallet transfer transaction recording
curl -X POST http://localhost:3000/api/wallet/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": "0xYourAddress",
    "toAddress": "0xRecipientAddress",
    "amount": "1000000",
    "userId": "user123",
    "petId": "pet456"
  }'

# Verify transaction recorded
curl "http://localhost:3000/api/transactions?userId=user123"
```

### Test Purchase Transaction Recording
```bash
# Make a purchase
curl -X POST http://localhost:3000/api/pets/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "0xYourAddress",
    "petId": "pet456",
    "itemId": "food_premium",
    "quantity": 1,
    "transactionHash": "0x123...",
    "price": 5000000
  }'

# Verify transaction recorded
curl "http://localhost:3000/api/transactions?userId=0xYourAddress&type=purchase"
```

### Test Transaction Status Update
```bash
# Update transaction status
curl -X PUT http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0x123...",
    "status": "confirmed",
    "blockNumber": 12345,
    "gasUsed": "21000",
    "gasFee": "0.001"
  }'
```

## 2. Activity Logging Tests

### Test Pet Interaction Logging
```bash
# Interact with pet (feed)
curl -X POST http://localhost:3000/api/pets \
  -H "Content-Type: application/json" \
  -d '{
    "action": "interactWithPet",
    "userId": "user123",
    "petId": "pet456",
    "interactionType": "feed"
  }'

# Verify activity logged
curl "http://localhost:3000/api/activity?userId=user123&category=pet"
```

### Test User Registration Logging
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "email": "test@example.com",
    "password": "securepassword",
    "name": "Test User"
  }'

# Check activity log
curl "http://localhost:3000/api/activity?userId=<userId>&category=auth"
```

### Test Activity Statistics
```bash
# Get activity statistics
curl "http://localhost:3000/api/activity/stats?userId=user123&days=30"
```

## 3. Rate Limiting Tests

### Test Transaction Rate Limit
```bash
# Rapid fire requests (should hit rate limit after 10)
for i in {1..15}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/wallet/transfer \
    -H "Content-Type: application/json" \
    -d '{
      "fromAddress": "0xYourAddress",
      "toAddress": "0xRecipientAddress",
      "amount": "1000000"
    }'
  echo ""
done
```

### Test Auth Rate Limit
```bash
# Rapid registration attempts (should hit rate limit after 20)
for i in {1..25}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"email\",
      \"email\": \"test${i}@example.com\",
      \"password\": \"password\",
      \"name\": \"Test ${i}\"
    }"
  echo ""
done
```

## 4. Chat Storage Tests

### Test Chat Persistence
```bash
# Send a message
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "petId": "pet456",
    "sender": "user",
    "content": "Hello, my pet!"
  }'

# Retrieve chat history
curl "http://localhost:3000/api/chats?userId=user123&petId=pet456&limit=50"
```

### Test Mark as Read
```bash
# Mark messages as read
curl -X PUT http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "petId": "pet456",
    "markAllAsRead": true
  }'
```

## 5. UI Component Tests

### Test Transaction History Component
1. Open application in browser
2. Navigate to wallet/profile page
3. Verify transaction history displays
4. Test filters (all, purchase, transfer)
5. Test refresh button
6. Click on BaseScan links
7. Verify responsive design on mobile

### Test Activity Feed Component
1. Open application in browser
2. Navigate to dashboard/profile page
3. Verify activity feed displays
4. Test category filters
5. Test refresh button
6. Verify time formatting (Just now, 5m ago, etc.)
7. Verify responsive design on mobile

## 6. Integration Tests

### End-to-End Purchase Flow
1. User logs in
2. User browses pet store
3. User purchases an item
4. Verify:
   - Transaction recorded in database
   - Activity logged
   - Inventory updated
   - Pet stats updated (if applicable)
   - Transaction visible in history
   - Activity visible in feed

### End-to-End Transfer Flow
1. User initiates transfer
2. Transaction is broadcast
3. Verify:
   - Transaction recorded as "pending"
   - Activity logged
   - Background polling started
   - After confirmation:
     - Status updated to "confirmed"
     - Block number recorded
     - Gas fees recorded
   - Transaction visible in history

### End-to-End Pet Evolution Flow
1. User gains enough XP
2. User purchases evolution items
3. User triggers evolution
4. Verify:
   - Items consumed from inventory
   - Pet stage updated
   - Activity logged
   - Stats updated
   - Activity visible in feed

## 7. Performance Tests

### Database Query Performance
```javascript
// In MongoDB shell or Compass

// Test transaction query with indexes
db.transactions.find({ userId: "user123" }).explain("executionStats")

// Test activity query with indexes
db.activitylogs.find({ userId: "user123", category: "pet" }).explain("executionStats")

// Test chat query with indexes
db.chatmessages.find({ userId: "user123", petId: "pet456" }).sort({ timestamp: -1 }).explain("executionStats")
```

### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Transaction API"
    flow:
      - get:
          url: "/api/transactions?userId=user123&limit=20"
  - name: "Activity API"
    flow:
      - get:
          url: "/api/activity?userId=user123&limit=50"
```

Run:
```bash
npm install -g artillery
artillery run artillery-config.yml
```

## 8. Security Tests

### Test SQL Injection Protection
```bash
# Try SQL injection in userId
curl "http://localhost:3000/api/transactions?userId=' OR '1'='1"

# Should return error or empty results, not all transactions
```

### Test XSS Protection
```bash
# Try XSS in message content
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "petId": "pet456",
    "sender": "user",
    "content": "<script>alert('XSS')</script>"
  }'

# Retrieve and verify script is escaped
curl "http://localhost:3000/api/chats?userId=user123&petId=pet456"
```

### Test Rate Limit Bypass
```bash
# Try bypassing rate limit with different IPs
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/wallet/transfer \
    -H "X-Forwarded-For: 192.168.1.$i" \
    -H "Content-Type: application/json" \
    -d '{"fromAddress":"0x","toAddress":"0x","amount":"1000000"}'
done
```

## 9. Error Handling Tests

### Test Missing Required Fields
```bash
# Transaction without userId
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transactionHash": "0x123...",
    "from": "0xabc...",
    "to": "0xdef..."
  }'
# Should return 400 error
```

### Test Invalid Data Types
```bash
# Activity with invalid category
curl -X POST http://localhost:3000/api/activity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "action": "test",
    "category": "invalid_category"
  }'
# Should return error
```

## 10. Cleanup and Maintenance

### Clear Test Data
```javascript
// In MongoDB shell
db.transactions.deleteMany({ userId: "user123" })
db.activitylogs.deleteMany({ userId: "user123" })
db.chatmessages.deleteMany({ userId: "user123" })
```

### Verify TTL Index Working
```javascript
// Check ActivityLog documents older than 90 days
db.activitylogs.find({
  timestamp: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
}).count()
// Should return 0 or very few (being deleted)
```

## Automated Test Suite (Future)

### Jest Unit Tests
```typescript
// __tests__/api/transactions.test.ts
describe('Transaction API', () => {
  it('should record transaction', async () => {
    // Test implementation
  });
  
  it('should update transaction status', async () => {
    // Test implementation
  });
});
```

### Cypress E2E Tests
```typescript
// cypress/e2e/purchase-flow.cy.ts
describe('Purchase Flow', () => {
  it('should complete purchase and record transaction', () => {
    cy.visit('/store');
    cy.get('[data-testid="item-buy-button"]').first().click();
    cy.get('[data-testid="confirm-purchase"]').click();
    // Verify transaction recorded
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:e2e
```

## Monitoring Checklist

- [ ] Transaction success rate > 95%
- [ ] API response time < 500ms (p95)
- [ ] Activity logging success rate > 99%
- [ ] Rate limit false positive rate < 1%
- [ ] Database query time < 100ms (p95)
- [ ] Chat message delivery success rate > 99%
- [ ] Error rate < 1%

## Production Readiness Checklist

- [ ] All critical APIs have rate limiting
- [ ] All user actions logged to ActivityLog
- [ ] All transactions recorded in Transaction model
- [ ] Chat messages persist across sessions
- [ ] Transaction history displays correctly
- [ ] Activity feed displays correctly
- [ ] Error handling in place for all endpoints
- [ ] Database indexes created and tested
- [ ] TTL index working for ActivityLog
- [ ] Security tests passed
- [ ] Performance tests passed
- [ ] Load tests passed
- [ ] Documentation complete

---

**Last Updated**: 2024  
**Test Coverage**: Core features (transactions, activity, chat, rate limiting)  
**Status**: Ready for Production Testing
