# 🔄 Dynamic Auto-Evolution System

## 🎯 Problem Solved

**Challenge**: Pet evolution status could become out-of-sync when:
- ❌ Wallet disconnects
- ❌ App goes offline
- ❌ User closes browser
- ❌ Network issues occur
- ❌ Multiple items purchased while offline

**Solution**: Automatic evolution checker that evaluates pet status based on accumulated achievements and applies pending evolutions automatically.

---

## ✅ How It Works

### **Automatic Evolution Triggers**

The system checks for pending evolutions in these scenarios:

1. **📱 App Opens** - Initial check when app loads
2. **🔌 Wallet Reconnects** - When user reconnects wallet
3. **🌐 Network Reconnects** - When internet connection restored
4. **👀 Window Focus** - When user returns to the app tab
5. **⏰ Periodic Check** - Every 5 minutes while app is active
6. **🛍️ After Purchase** - When any item is purchased

### **Evolution Evaluation Criteria**

For each stage, the system checks:

| Stage | XP Required | Items Required | Next Stage |
|-------|------------|----------------|------------|
| Egg → Hatchling | 50 XP | 10 evolution items | Hatchling |
| Hatchling → Teen | 200 XP | 10 evolution items | Teen |
| Teen → Adult | 500 XP | 10 evolution items | Adult |
| Adult → Unicorn | 1000 XP | 15 evolution items | Unicorn |

**Requirements**:
- ✅ Pet XP >= required threshold
- ✅ All evolution items owned in inventory
- ✅ Not already at maximum stage (Unicorn)

---

## 🏗️ System Architecture

### **1. Auto-Evolution API**
**File**: `app/api/pets/auto-evolve/route.ts`

#### POST `/api/pets/auto-evolve` - Apply Pending Evolutions

Automatically applies all eligible evolutions:

**Request**:
```json
{
  "userId": "0x1234...",
  "petId": "pet_id_here"
}
```

**Response (Multiple Evolutions)**:
```json
{
  "success": true,
  "evolved": true,
  "evolutionsApplied": 3,
  "message": "🎉 Fluffy evolved 3 time(s)!",
  "evolutionLog": [
    "egg → hatchling",
    "hatchling → teen", 
    "teen → adult"
  ],
  "pet": {
    "id": "pet_id",
    "name": "Fluffy",
    "stage": "adult",
    "xp": 550,
    "stats": { ... }
  },
  "originalStage": "egg",
  "newStage": "adult"
}
```

**Response (No Evolutions)**:
```json
{
  "success": true,
  "evolved": false,
  "message": "Pet is up to date",
  "pet": { ... }
}
```

**What It Does**:
1. Fetches pet and inventory from database
2. Loops through possible evolutions
3. Checks XP and item requirements for each stage
4. Applies all eligible evolutions in sequence
5. Consumes evolution items from inventory
6. Updates pet stats (health, energy, happiness to 100)
7. Increments pet level
8. Returns complete evolution log

#### GET `/api/pets/auto-evolve` - Check Eligibility

Checks how many evolutions are possible without applying them:

**Request**: `?userId=0x1234&petId=pet_id`

**Response**:
```json
{
  "success": true,
  "canAutoEvolve": true,
  "possibleEvolutions": 2,
  "evolutionPath": [
    "egg → hatchling",
    "hatchling → teen"
  ],
  "currentStage": "egg",
  "currentXP": 250,
  "message": "Pet can evolve 2 time(s)!"
}
```

---

### **2. React Hook: useAutoEvolution**
**File**: `app/hooks/useAutoEvolution.ts`

#### Features

**Automatic Triggers**:
- ✅ On component mount (app opens)
- ✅ On wallet address change (reconnection)
- ✅ On window focus (user returns to tab)
- ✅ On network reconnect (online event)
- ✅ Periodic check every 5 minutes

**Debouncing**:
- Prevents excessive API calls
- Maximum 1 check per minute (unless forced)
- Smart caching of last check time

**User Notifications**:
- Shows alert when evolution detected
- Special message for multiple evolutions
- Displays evolution path/log

#### Usage

```tsx
import { useAutoEvolution } from '@/app/hooks/useAutoEvolution';

function MyComponent() {
  const [pet, setPet] = useState<Pet | null>(null);
  const { walletAddress } = useAuth();

  // Enable auto-evolution
  useAutoEvolution({
    pet,
    userWalletAddress: walletAddress,
    enabled: true,
    onEvolutionDetected: (result) => {
      // Update pet state when evolution happens
      setPet(currentPet => ({
        ...currentPet,
        stage: result.pet.stage,
        stats: result.pet.stats,
        xp: result.pet.xp
      }));
    }
  });

  return <PetDisplay pet={pet} />;
}
```

---

### **3. Integration Points**

#### In `app/page.tsx` (Main Page)

```tsx
import { useAutoEvolution } from '@/app/hooks/useAutoEvolution';

// Enable auto-evolution for main pet display
useAutoEvolution({
  pet,
  userWalletAddress: walletAddress || null,
  enabled: authenticated && !!pet,
  onEvolutionDetected: (result) => {
    // Update pet state automatically
    setPet(currentPet => ({
      ...currentPet,
      stage: result.pet.stage,
      mood: result.pet.mood,
      xp: result.pet.xp,
      stats: result.pet.stats
    }));
  }
});
```

#### In `PetStoreModal.tsx` (After Purchase)

```tsx
// After recording purchase, check for auto-evolution
const autoEvolveResponse = await fetch('/api/pets/auto-evolve', {
  method: 'POST',
  body: JSON.stringify({ userId, petId })
});

const result = await autoEvolveResponse.json();

if (result.evolved) {
  // Multiple evolutions possible!
  updatedPet.stage = result.pet.stage;
  updatedPet.stats = result.pet.stats;
  
  alert(`🎉 ${pet.name} evolved ${result.evolutionsApplied} times!`);
}
```

---

## 🎬 User Experience Flows

### **Flow 1: Offline Evolution**

```
Day 1: User plays, pet gains 150 XP (total: 150 XP)
Day 1: User buys 5 evolution items
Day 1: User closes app

--- App Offline for 2 Days ---

Day 3: User buys 5 more evolution items (total: 10 items)
Day 3: User chats with pet, gains 100 XP (total: 250 XP)
Day 3: User closes app again

Day 4: User reopens app
↓
🔍 Auto-evolution check runs on mount
↓
Evaluation:
- Current: Egg (250 XP)
- Has 10 evolution items ✅
- 250 XP >= 50 XP needed for Hatchling ✅
- Can evolve to Hatchling!
- 250 XP >= 200 XP needed for Teen ✅
- Can evolve to Teen!
↓
🎉 Alert: "Wow! Fluffy evolved 2 times while you were away!"
    - egg → hatchling
    - hatchling → teen
↓
Pet is now Teen stage with updated stats
```

### **Flow 2: Wallet Disconnection**

```
User plays normally
Wallet disconnects (network issue)
User continues browsing (no wallet)

--- 30 minutes later ---

User reconnects wallet
↓
useAutoEvolution detects wallet address change
↓
Triggers evolution check
↓
Applies any pending evolutions
↓
User sees updated pet status
```

### **Flow 3: Background Tab Return**

```
User has app open in background tab
User is working in other tabs for 2 hours
Pet accumulates XP from scheduled tasks

User switches back to pet app tab
↓
Window focus event fires
↓
useAutoEvolution runs check
↓
Detects pending evolution
↓
Applies evolution automatically
↓
User sees notification
```

---

## 🛡️ Safety Features

### **Idempotency**
- Multiple checks won't cause duplicate evolutions
- Evolution only applies if requirements still met
- Database transactions ensure consistency

### **Debouncing**
- Max 1 check per minute (unless forced)
- Prevents excessive API calls
- Reduces server load

### **Error Handling**
- Failed checks logged but don't break app
- Continues normal operation if API fails
- Retry on network reconnect

### **Data Validation**
- Verifies pet belongs to user
- Checks inventory ownership
- Validates XP thresholds
- Ensures items exist before consuming

---

## 📊 Technical Details

### **Evolution Logic**

```typescript
while (canContinueEvolving && currentStage !== UNICORN) {
  nextStage = getNextStage(currentStage);
  
  // Check XP
  hasEnoughXP = pet.xp >= xpRequirements[currentStage];
  
  // Check items
  requiredItems = getRequiredItems(currentStage);
  hasAllItems = requiredItems.every(item => inventory.hasItem(item));
  
  if (hasEnoughXP && hasAllItems) {
    // Consume items
    requiredItems.forEach(item => inventory.useItem(item));
    
    // Apply evolution
    pet.stage = nextStage;
    pet.stats.health = 100;
    pet.stats.energy = 100;
    pet.stats.happiness = min(100, pet.stats.happiness + 20);
    pet.stats.level += 1;
    
    evolutionsApplied++;
    currentStage = nextStage;
  } else {
    break; // Can't evolve further
  }
}
```

### **Hook Event Listeners**

```typescript
// On mount
useEffect(() => {
  checkEvolution(true);
}, []);

// On wallet reconnect
useEffect(() => {
  checkEvolution(true);
}, [walletAddress]);

// On window focus
window.addEventListener('focus', () => checkEvolution(false));

// On network reconnect
window.addEventListener('online', () => checkEvolution(true));

// Periodic check
setInterval(() => checkEvolution(false), 5 * 60 * 1000);
```

---

## 🧪 Testing Scenarios

### **Test 1: Multiple Offline Evolutions**

```bash
# Setup
1. Create pet (Egg, 0 XP)
2. Add 300 XP to pet (via chat/actions)
3. Purchase all items for Egg → Hatchling (10 items)
4. Purchase all items for Hatchling → Teen (10 items)
5. Close app

# Test
1. Reopen app
2. Wait for auto-evolution check
3. Should see: "Pet evolved 2 times!"
4. Pet should be Teen stage
5. Items should be consumed
```

### **Test 2: Wallet Reconnection**

```bash
# Setup
1. Pet has 60 XP and 10 evolution items
2. User is logged in

# Test
1. Disconnect wallet (simulate network issue)
2. Wait 1 minute
3. Reconnect wallet
4. Auto-evolution should trigger
5. Pet should evolve from Egg → Hatchling
```

### **Test 3: Purchase Trigger**

```bash
# Setup
1. Pet has 55 XP (above 50 threshold)
2. Pet has 9/10 evolution items

# Test
1. Purchase the 10th evolution item
2. Auto-evolution runs after purchase
3. Pet should immediately evolve
4. Alert should show evolution message
```

---

## 📝 Console Logs

### **Successful Evolution**

```
🔍 Checking for auto-evolution...
🎯 Evolution available: 2 evolution(s)
Evolution path: ['egg → hatchling', 'hatchling → teen']
✅ Auto-evolving: egg → hatchling
✅ Auto-evolving: hatchling → teen
🎉 Applied 2 evolution(s): egg → hatchling → teen
```

### **No Evolution Available**

```
🔍 Checking for auto-evolution...
✅ No pending evolutions
Not enough XP for egg → hatchling: 30/50
```

### **Debounced Check**

```
⏭️ Skipping evolution check (debounced)
Last check was 30 seconds ago
```

---

## ✅ Summary

### **What Was Added**

1. **Auto-Evolution API** (`/api/pets/auto-evolve`)
   - Checks and applies all pending evolutions
   - Handles multiple evolutions in sequence
   - Returns detailed evolution log

2. **React Hook** (`useAutoEvolution`)
   - Monitors app state (mount, focus, online)
   - Triggers evolution checks automatically
   - Updates UI when evolutions occur

3. **Integration**
   - Main page uses hook for continuous monitoring
   - Pet store checks after each purchase
   - Wallet reconnection triggers check

### **Benefits**

✅ **No Lost Progress** - Evolutions apply even after offline periods
✅ **Automatic** - No manual checking required
✅ **Real-time** - Updates immediately on reconnection
✅ **Smart** - Debounced to prevent excessive checks
✅ **Transparent** - Shows evolution log to user
✅ **Reliable** - Multiple failsafes and validation

### **User Experience**

- 🎉 "Your pet evolved while you were away!"
- 📈 Progress never lost due to disconnections
- ⚡ Instant evolution on app reopen
- 🔄 Automatic status synchronization
- 💪 Resilient to network issues

**Your pet's evolution status is now always accurate, regardless of connection status!** 🚀
