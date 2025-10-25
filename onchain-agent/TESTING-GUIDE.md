# Testing Guide for Critical Fixes

## Quick Start
After the fixes, test these three features to ensure everything works:

---

## 1. Test Pet Evolution 🎉

### Steps:
1. **Start the app**: `npm run dev`
2. **Login** with your account
3. **Check initial pet stage** in the UI (should show current stage like "egg", "hatchling", etc.)
4. **Open browser console** (F12) to monitor logs

### Test Auto-Evolution on App Load:
1. **Feed your pet** multiple times to gain XP:
   - Click "Feed" button 5-10 times
   - Each feed gives 10 XP
2. **Check console logs** for:
   ```
   🚀 Initial auto-evolution check on mount
   🔍 Checking for auto-evolution...
   🎯 Evolution available: X evolution(s)
   🎉 Auto-evolution applied!
   ```
3. **You should see an alert** if evolution occurred
4. **Verify pet stage updated** in the UI

### Expected XP Thresholds:
- **Egg → Hatchling**: 50 XP (5 feeds)
- **Hatchling → Teen**: 200 XP (20 feeds total)
- **Teen → Adult**: 500 XP (50 feeds total)
- **Adult → Unicorn**: 1000 XP (100 feeds total)

### Console Logs to Look For:
```javascript
✅ "🔍 Checking for auto-evolution..."
✅ "🎯 Evolution available: 1 evolution(s)"
✅ "Evolution path: ['egg → hatchling']"
✅ "🎉 Auto-evolution applied!"
✅ "Evolution log: egg → hatchling"
```

### What to Verify:
- [ ] Evolution check runs automatically on page load
- [ ] Alert shows evolution message
- [ ] Pet stage updates in UI
- [ ] Pet stats refresh (happiness, health, energy restored)
- [ ] XP counter updates

---

## 2. Test Pet Wallet Loading 💰

### Steps:
1. **Login** with your account
2. **Check browser console** for wallet creation logs
3. **Look for pet wallet address** in the UI

### Console Logs to Look For:
```javascript
✅ "User wallet created: 0xabc123..." (lowercase)
✅ "Pet has no wallet, creating new wallet for pet: [pet-id]"
✅ "Pet wallet created: 0xdef456..." (lowercase)
✅ "Pet updated with wallet information, address: 0xdef456..."
✅ "PetDisplay - petWalletAddress: 0xdef456..."
```

### What to Verify:
- [ ] User wallet address appears in UI (top right)
- [ ] Pet wallet address appears in PetDisplay component
- [ ] Both wallet addresses are lowercase
- [ ] No "pending-wallet-creation" shown in UI
- [ ] Wallet creation succeeds without errors

### Visual Checks:
1. **Top navigation**: Should show user wallet address (0xabc...123)
2. **Pet card**: Should show pet wallet address or basename
3. **No error messages** about wallet initialization

### If Wallet Doesn't Load:
1. Check MongoDB:
   ```javascript
   // In MongoDB Compass or shell
   db.wallets.find({ type: "pet" })
   db.pets.find({}).pretty()
   ```
2. Verify `petWalletAddress` and `petWalletId` fields exist
3. Check all addresses are lowercase

---

## 3. Test Store Wallet Detection 🛍️

### Steps:
1. **Login** with your account
2. **Wait for app to fully initialize** (wallets created)
3. **Click "Store" button** to open pet store modal

### What to Verify:
- [ ] **Wallet Status**: Shows "Wallet Connected ✓" (green)
- [ ] **USDC Balance**: Loads correctly (shows actual balance or 0)
- [ ] **Purchase buttons**: Are enabled (not grayed out)
- [ ] **No error messages** like "Wallet not found"

### Console Logs to Look For:
```javascript
✅ "Attempting to repair wallet: 0xabc123..."
✅ "Wallet repair successful"
✅ "Wallet Connected ✓"
```

### Test Purchase Flow:
1. **Select an item** from the store (e.g., "Magic Crystal" - 1 USDC)
2. **Click "Buy with USDC"**
3. **Verify transaction** starts processing
4. **Check console** for purchase logs:
   ```javascript
   ✅ "Recording purchase in database: Magic Crystal for pet: Buddy"
   ✅ "✅ Purchase recorded successfully"
   ```

### If Store Shows "Wallet Not Connected":
1. **Check console logs** for wallet check errors
2. **Try clicking "Repair Wallet"** button
3. **Verify wallet exists in database**:
   ```javascript
   db.wallets.find({ address: "0xabc123..." }) // lowercase
   ```
4. **Refresh page** if wallet was just created

---

## 4. End-to-End Test 🎯

### Complete User Flow:
1. **Fresh start**: Create new account or logout and login again
2. **Observe initialization**:
   - User wallet created
   - Pet created (if new user)
   - Pet wallet created
   - All addresses are lowercase
3. **Test evolution**:
   - Feed pet 5 times
   - Refresh page
   - Should see evolution alert
4. **Test store**:
   - Open store modal
   - Verify wallet connected
   - Attempt purchase (if you have USDC)

---

## 5. Database Verification 📊

### MongoDB Queries:

#### Check User Wallets:
```javascript
db.wallets.find({ type: "user" }).pretty()
```
Expected output:
```json
{
  "walletId": "uuid-v4",
  "address": "0xabc123...", // ✅ Should be lowercase
  "network": "base-sepolia",
  "type": "user",
  "ownerId": "user-mongodb-id"
}
```

#### Check Pet Wallets:
```javascript
db.wallets.find({ type: "pet" }).pretty()
```
Expected output:
```json
{
  "walletId": "uuid-v4",
  "address": "0xdef456...", // ✅ Should be lowercase
  "network": "base-sepolia",
  "type": "pet",
  "ownerId": "user-mongodb-id",
  "petId": "pet-mongodb-id"
}
```

#### Check Pet Data:
```javascript
db.pets.find({}).pretty()
```
Expected output:
```json
{
  "_id": ObjectId("..."),
  "name": "Buddy",
  "petWalletAddress": "0xdef456...", // ✅ Should be lowercase
  "petWalletId": "uuid-v4",
  "stage": "hatchling", // Should match XP level
  "xp": 50,
  "stats": {
    "happiness": 80,
    "health": 100,
    "level": 1,
    "energy": 100
  }
}
```

---

## 6. Common Issues and Solutions

### Issue: Evolution Not Triggering
**Symptom**: Pet stays at same stage despite high XP

**Debug Steps**:
1. Check console for "🔍 Checking for auto-evolution..."
2. If not present, check `useAutoEvolution` hook is enabled
3. Verify pet.id is a string: `console.log(typeof pet.id)`
4. Check XP value: Should be >= threshold

**Solution**: Refresh page to trigger evolution check

---

### Issue: Pet Wallet Not Showing
**Symptom**: Pet wallet address is null or undefined

**Debug Steps**:
1. Check console for "Pet wallet created" log
2. Query MongoDB: `db.pets.find({}).pretty()`
3. Check if `petWalletAddress` field exists

**Solution**: 
- If missing, refresh page to trigger wallet creation
- If still missing, check API logs for wallet creation errors

---

### Issue: Store Shows "Wallet Not Connected"
**Symptom**: Red error message in store modal

**Debug Steps**:
1. Check console for "Wallet connection check failed"
2. Verify user wallet exists in database
3. Check wallet address case: Should be lowercase

**Solution**:
- Click "Repair Wallet" button
- If repair fails, refresh page
- Verify wallet in MongoDB is lowercase

---

## 7. Success Criteria ✅

All tests pass if:
- [x] Evolution triggers automatically when XP threshold met
- [x] Pet wallet address displays in UI
- [x] Store shows "Wallet Connected ✓"
- [x] Purchases can be initiated
- [x] All wallet addresses in database are lowercase
- [x] No TypeScript compilation errors
- [x] No console errors during normal operation

---

## 8. Performance Checks

### Evolution Check Frequency:
- **On mount**: 1 second delay
- **On focus**: With debouncing (max 1/minute)
- **Periodic**: Every 5 minutes
- **On reconnect**: Immediate

### Console Log Expectations:
```javascript
✅ "⏭️ Skipping evolution check (debounced)" // Expected with frequent checks
✅ "✅ No pending evolutions" // Expected when up-to-date
✅ "🎉 Auto-evolution applied!" // Expected when evolving
```

---

## 9. Production Readiness

Before deploying to production:
1. **Run build**: `npm run build`
2. **Test all three features** in development
3. **Verify MongoDB connection** in production environment
4. **Check environment variables** are set correctly
5. **Test with real USDC** (small amounts first)
6. **Monitor error logs** for first 24 hours

---

## 10. Rollback Plan

If issues occur in production:
1. **Check git history**: `git log --oneline`
2. **Revert commit**: `git revert <commit-hash>`
3. **Redeploy** previous version
4. **Investigate logs** for root cause

Files to monitor:
- `app/hooks/useAutoEvolution.ts`
- `app/api/wallet/route.ts`
- `components/PetStoreModal.tsx`
- `app/page.tsx`

---

## Need Help?

**Common Commands**:
```bash
# Start dev server
npm run dev

# Check TypeScript errors
npm run build

# View MongoDB data
mongosh
use streakpets
db.pets.find().pretty()
db.wallets.find().pretty()

# Check git changes
git status
git diff

# View logs
tail -f logs/app.log
```

**Key Logs to Monitor**:
- Browser console (F12)
- Terminal running `npm run dev`
- MongoDB logs
- Next.js build output

---

## Conclusion

These fixes resolve critical issues with:
1. **Pet evolution** (ObjectId → string conversion)
2. **Wallet loading** (lowercase normalization)
3. **Store detection** (consistent address queries)

All features should now work end-to-end. Happy testing! 🎉
