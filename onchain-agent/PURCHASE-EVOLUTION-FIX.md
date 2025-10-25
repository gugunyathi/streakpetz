# 🛍️ Pet Store Purchase & Evolution System - FIXED

## ❌ Previous Issues

### Problem 1: No Database Persistence
- **Issue**: Pet store used in-memory `Map<string, UserInventory>` storage
- **Impact**: All purchases lost on server restart
- **Symptoms**: 
  - Payments successful but items not saved
  - Evolution items purchased but pet didn't evolve
  - Inventory disappeared after page refresh

### Problem 2: Pet Stats Not Saved
- **Issue**: Pet XP, mood, and stats updated in memory only
- **Impact**: Changes not persisted to MongoDB
- **Symptoms**:
  - Pet appeared to gain XP but reverted on reload
  - Evolution requirements met but evolution didn't trigger

### Problem 3: Evolution Logic Broken
- **Issue**: Evolution checked in-memory inventory that was empty
- **Impact**: Could never evolve even with items
- **Symptoms**:
  - "Pet has all items" but evolution unavailable
  - Items purchased but `canEvolve` always false

---

## ✅ Solution Implemented

### 1. **Created Database Model for Inventory**
**File**: `lib/models/UserInventory.ts`

```typescript
interface IUserInventory {
  userId: string;           // Wallet address
  petId: string;            // Reference to Pet
  items: IInventoryItem[];  // Array of owned items
  totalValue: number;       // Total spent in USDC cents
  lastUpdated: Date;
}

interface IInventoryItem {
  storeItemId: string;      // Reference to store item
  quantity: number;         // How many owned
  purchaseDate: Date;       // When purchased
  purchasePrice: number;    // Price paid
  used: boolean;            // Consumed or not
  transactionHash?: string; // Blockchain transaction
}
```

**Methods**:
- `addItem()` - Add purchased item to inventory
- `useItem()` - Consume items (for evolution)
- `hasItem()` - Check if user owns item
- `getItemCount()` - Get quantity of specific item

---

### 2. **Created Purchase Recording API**
**File**: `app/api/pets/inventory/route.ts`

#### POST `/api/pets/inventory` - Record Purchase
Records purchase in database and applies item effects to pet.

**Request Body**:
```json
{
  "userId": "0x1234...",
  "petId": "pet_id_here",
  "itemId": "premium_steak",
  "quantity": 1,
  "price": 100,
  "transactionHash": "0xabc123..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Purchase recorded successfully",
  "inventory": {
    "userId": "0x1234...",
    "petId": "pet_id",
    "items": [
      {
        "storeItemId": "premium_steak",
        "quantity": 1,
        "purchaseDate": "2025-10-17T...",
        "purchasePrice": 100,
        "used": false,
        "transactionHash": "0xabc123..."
      }
    ],
    "totalValue": 100,
    "lastUpdated": "2025-10-17T..."
  },
  "pet": {
    "id": "pet_id",
    "name": "Fluffy",
    "stage": "egg",
    "mood": "happy",
    "xp": 20,
    "stats": {
      "happiness": 95,
      "health": 100,
      "level": 1,
      "energy": 100
    }
  }
}
```

**What It Does**:
1. Validates pet belongs to user
2. Fetches store item details
3. Finds or creates user inventory in MongoDB
4. Adds item to inventory using `inventory.addItem()`
5. Applies item effects to pet (XP, mood, health, energy)
6. Saves both inventory and pet to database
7. Returns updated data

#### GET `/api/pets/inventory` - Fetch Inventory
Gets user's current inventory from database.

**Query Params**: `?userId=0x1234&petId=pet_id`

**Response**: Same inventory structure as POST

---

### 3. **Created Evolution API**
**File**: `app/api/pets/evolve/route.ts`

#### POST `/api/pets/evolve` - Evolve Pet
Checks requirements, consumes items, and evolves pet.

**Request Body**:
```json
{
  "userId": "0x1234...",
  "petId": "pet_id_here"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "🎉 Fluffy evolved to hatchling!",
  "pet": {
    "id": "pet_id",
    "name": "Fluffy",
    "stage": "hatchling",
    "mood": "happy",
    "xp": 50,
    "stats": {
      "happiness": 100,
      "health": 100,
      "level": 2,
      "energy": 100
    }
  },
  "oldStage": "egg",
  "newStage": "hatchling"
}
```

**Response (Missing Items)**:
```json
{
  "success": false,
  "error": "Missing evolution items: Growth Crystal, Energy Core",
  "missingItems": ["Growth Crystal", "Energy Core"]
}
```

**What It Does**:
1. Fetches pet and inventory from database
2. Gets evolution requirements for current stage
3. Checks if user has all required items
4. Checks if pet has enough XP
5. Consumes evolution items from inventory
6. Updates pet stage (egg → hatchling → teen → adult → unicorn)
7. Resets health/energy to 100
8. Increases pet level
9. Saves everything to database

#### GET `/api/pets/evolve` - Check Evolution Status
Checks if pet can evolve without consuming items.

**Query Params**: `?userId=0x1234&petId=pet_id`

**Response**:
```json
{
  "success": true,
  "canEvolve": true,
  "currentStage": "egg",
  "currentXP": 55,
  "requiredXP": 50,
  "hasEnoughXP": true,
  "itemStatus": [
    {
      "itemId": "growth_crystal",
      "itemName": "Growth Crystal",
      "required": true,
      "owned": true
    },
    {
      "itemId": "energy_core",
      "itemName": "Energy Core",
      "required": true,
      "owned": false
    }
  ],
  "hasAllItems": false
}
```

---

### 4. **Updated PetStoreModal Component**
**File**: `components/PetStoreModal.tsx`

#### New `handlePurchase()` Function

**Before (❌ Broken)**:
```typescript
const handlePurchase = async (item: StoreItem) => {
  // Used in-memory petStore.purchaseItem()
  // Updated local state only
  // No database persistence
  onPurchaseComplete(updatedPet); // Not saved!
}
```

**After (✅ Fixed)**:
```typescript
const handlePurchase = async (item: StoreItem, transactionHash?: string) => {
  // 1. Record purchase in database via API
  const recordResponse = await fetch('/api/pets/inventory', {
    method: 'POST',
    body: JSON.stringify({
      userId: userWalletAddress,
      petId: pet.id,
      itemId: item.id,
      quantity: 1,
      price: item.price,
      transactionHash
    })
  });

  // 2. Get updated pet from API response
  const updatedPet = {
    ...pet,
    xp: recordResult.pet.xp,
    mood: recordResult.pet.mood,
    stats: recordResult.pet.stats
  };

  // 3. Check if pet can now evolve
  if (item.evolutionItem) {
    const evolveCheck = await fetch(`/api/pets/evolve?userId=...&petId=...`);
    
    if (evolveCheck.canEvolve) {
      const shouldEvolve = confirm('🎉 Pet can evolve! Evolve now?');
      
      if (shouldEvolve) {
        const evolveResponse = await fetch('/api/pets/evolve', {
          method: 'POST',
          body: JSON.stringify({ userId, petId })
        });
        
        updatedPet.stage = evolveResult.pet.stage;
        alert(evolveResult.message); // "🎉 Fluffy evolved to hatchling!"
      }
    }
  }

  // 4. Refresh inventory from database
  const inventoryResponse = await fetch(`/api/pets/inventory?userId=...&petId=...`);
  setUserInventory(inventoryResult.inventory);

  // 5. Update parent component with persisted data
  onPurchaseComplete(updatedPet);
}
```

#### Updated Payment Handlers

**Both BasePayButton instances now pass transaction hash**:
```typescript
<BasePayButton
  amount={item.price}
  walletAddress={userWalletAddress}
  recipientAddress="0x226710d13E6c16f1c99F34649526bD3bF17cd010"
  network="base-sepolia"
  onPaymentSuccess={(paymentId: string) => {
    console.log('Payment successful:', paymentId);
    handlePurchase(item, paymentId); // ✅ Pass transaction hash
  }}
  onPaymentError={(error: string) => {
    alert(`Payment failed: ${error}`);
  }}
/>
```

---

## 🔄 Complete Purchase Flow

### **Step 1: User Clicks "Pay"**
```
components/PetStoreModal.tsx
  └─ <BasePayButton onClick={...} />
```

### **Step 2: Payment Processed**
```
components/BasePayButton.tsx
  └─ handlePayment()
      └─ executeGasFreePayment()
          └─ fetch('/api/wallet/transfer')  // Blockchain transaction
              └─ wallet.invokeContract()     // Coinbase SDK signs & sends
                  └─ Returns: transactionHash (0xabc123...)
```

### **Step 3: Payment Success Callback**
```
onPaymentSuccess(transactionHash)
  └─ handlePurchase(item, transactionHash)
```

### **Step 4: Record Purchase in Database**
```
handlePurchase()
  └─ fetch('/api/pets/inventory', {
      method: 'POST',
      body: {
        userId: '0x1234...',
        petId: 'pet_id',
        itemId: 'premium_steak',
        transactionHash: '0xabc123...',
        price: 100
      }
    })
    
MongoDB Operations:
  1. UserInventory.findOne({ userId, petId })
  2. inventory.addItem(itemId, quantity, price, txHash)
  3. inventory.save() ✅ PERSISTED
  4. pet.xp += item.effects.experienceBoost
  5. pet.stats.health += item.effects.healthBoost
  6. pet.save() ✅ PERSISTED
```

### **Step 5: Check Evolution (If Evolution Item)**
```
if (item.evolutionItem) {
  // Check if pet can now evolve
  fetch('/api/pets/evolve?userId=...&petId=...')
    └─ Returns: { canEvolve: true/false, itemStatus: [...] }
  
  if (canEvolve) {
    confirm('🎉 Pet can evolve! Evolve now?')
    
    if (user confirms) {
      fetch('/api/pets/evolve', { method: 'POST' })
        └─ MongoDB Operations:
            1. inventory.useItem(itemId) for each required item
            2. inventory.save() ✅ Items consumed
            3. pet.stage = newStage
            4. pet.stats.health = 100
            5. pet.stats.energy = 100
            6. pet.stats.level += 1
            7. pet.save() ✅ Evolution persisted
    }
  }
}
```

### **Step 6: Refresh UI**
```
// Refresh inventory from database
fetch('/api/pets/inventory?userId=...&petId=...')
  └─ setUserInventory(result.inventory)

// Update parent component
onPurchaseComplete(updatedPet)
  └─ Parent re-renders with new pet stats
```

---

## 📊 Evolution Requirements

### Stage Progression
| Current Stage | XP Required | Next Stage | Items Required |
|--------------|------------|------------|---------------|
| Egg | 50 XP | Hatchling | 10 evolution items |
| Hatchling | 200 XP | Teen | 10 evolution items |
| Teen | 500 XP | Adult | 10 evolution items |
| Adult | 1000 XP | Unicorn | 15 evolution items |
| Unicorn | - | Max Level | Maintenance items |

### Example: Egg → Hatchling Evolution

**Requirements**:
```json
{
  "xp": 50,
  "items": [
    "growth_crystal",
    "energy_core",
    "warmth_stone",
    "nurture_potion",
    "dawn_essence",
    "life_spark",
    "baby_blanket",
    "first_steps_guide",
    "comfort_toy",
    "hatching_powder"
  ]
}
```

**Purchase Items**:
1. Buy all 10 items (payments = 10 transactions)
2. Each purchase saved to database
3. Pet gains XP from experience boosts
4. When XP >= 50 and all 10 items owned → `canEvolve = true`

**Trigger Evolution**:
1. User clicks "Evolve" (or prompted after last item purchase)
2. API consumes all 10 items from inventory
3. Pet stage changes: `egg` → `hatchling`
4. Database updated with new stage
5. UI shows evolution animation

---

## 🧪 Testing the Fix

### Test Purchase Flow

1. **Start Server**:
   ```powershell
   npm run dev
   ```

2. **Open Pet Store**:
   - Click on store icon
   - Select an item
   - Click "Pay $X.XX"

3. **Verify Payment**:
   - Check console: "Payment successful: 0xabc123..."
   - Check BaseScan: https://sepolia.basescan.org/tx/0xabc123...

4. **Verify Database**:
   ```javascript
   // In MongoDB
   db.userinventories.findOne({ userId: "0x1234..." })
   // Should show:
   {
     userId: "0x1234...",
     petId: "pet_id",
     items: [
       {
         storeItemId: "premium_steak",
         quantity: 1,
         transactionHash: "0xabc123..."
       }
     ]
   }
   ```

5. **Verify Pet Stats**:
   ```javascript
   db.pets.findOne({ _id: "pet_id" })
   // Should show updated XP, mood, stats
   ```

### Test Evolution Flow

1. **Buy Evolution Items**:
   - Go to "Evolution" tab in pet store
   - Purchase all required items (10 items for egg → hatchling)
   - Each payment creates database record

2. **Check Evolution Status**:
   ```
   GET /api/pets/evolve?userId=0x1234&petId=pet_id
   ```
   Should return:
   ```json
   {
     "canEvolve": true,
     "hasEnoughXP": true,
     "hasAllItems": true
   }
   ```

3. **Trigger Evolution**:
   - After last item purchase, popup asks "Evolve now?"
   - Click "Yes"
   - Evolution API called
   - Pet stage updated in database

4. **Verify Evolution**:
   ```javascript
   db.pets.findOne({ _id: "pet_id" })
   // stage should be "hatchling" now
   
   db.userinventories.findOne({ userId: "0x1234...", petId: "pet_id" })
   // Evolution items should be consumed (quantity = 0 or removed)
   ```

---

## 🔍 Debugging

### Check if Purchase Saved
```javascript
// In browser console after purchase
fetch('/api/pets/inventory?userId=YOUR_WALLET&petId=YOUR_PET_ID')
  .then(r => r.json())
  .then(d => console.log(d.inventory.items));
```

### Check Evolution Status
```javascript
fetch('/api/pets/evolve?userId=YOUR_WALLET&petId=YOUR_PET_ID')
  .then(r => r.json())
  .then(d => console.log('Can evolve:', d.canEvolve, 'Items:', d.itemStatus));
```

### Check Pet Stats
```javascript
fetch('/api/pets?userId=YOUR_WALLET')
  .then(r => r.json())
  .then(d => console.log('Pet:', d.pets[0]));
```

---

## ✅ Summary

### What Was Fixed
1. ✅ **Database Persistence** - All purchases now saved to MongoDB
2. ✅ **Pet Stats Update** - XP, mood, health, energy saved to database
3. ✅ **Evolution System** - Properly checks database inventory
4. ✅ **Transaction Tracking** - Blockchain transaction hashes stored
5. ✅ **Inventory Management** - Full CRUD operations on user inventory

### What Works Now
- ✅ Purchase items → Saved to database
- ✅ Pet gains XP → Persists across reloads
- ✅ Evolution items tracked → Counts toward evolution
- ✅ Evolution triggers → Pet transforms and saves
- ✅ Inventory displays → Shows all owned items
- ✅ Transaction history → Linked to blockchain transactions

### Payment Flow Is Complete
```
User Clicks Pay → Blockchain Transaction → Database Record → Pet Stats Update → Evolution Check → UI Refresh
```

**Everything is now persisted to MongoDB!** 🎉
