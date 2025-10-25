# Payment Flow Comparison: Current Implementation vs Coinbase Commerce API

## Overview
This document compares the **current StreakPets payment implementation** with the **Coinbase Commerce API checkout flow** to identify differences, improvements, and potential migration paths.

---

## Current Implementation (StreakPets Pet Store)

### Architecture
**Direct Blockchain Integration** using Coinbase SDK & Paymaster

### Payment Flow

```
User clicks Buy
    ↓
1. Wallet Validation
   - Check wallet address format
   - Verify wallet exists in MongoDB
   - Check wallet has walletData field
    ↓
2. Balance Check (Client-side)
   - Query USDC balance via Viem public client
   - Compare balance vs item price
   - Show insufficient funds error if needed
    ↓
3. Payment Execution
   - Call executeGasFreePayment() in lib/wallet.ts
   - Make API request to /api/wallet/transfer
    ↓
4. Server-side Transfer (/api/wallet/transfer)
   - Connect to MongoDB
   - Load wallet from database
   - Parse walletData (exported Coinbase wallet)
   - Import wallet using Coinbase SDK
   - Execute wallet.invokeContract():
     * contractAddress: USDC_ADDRESSES['base-sepolia']
     * method: 'transfer'
     * args: { to, value }
   - Wait for transaction broadcast
   - Get transaction hash
    ↓
5. Transaction Recording
   - Save to MongoDB Transaction collection
   - Log to ActivityLog collection
   - Background polling for confirmation
    ↓
6. Purchase Recording
   - API call to /api/pets/inventory
   - Add item to UserInventory
   - Update pet XP/mood/stats
   - Check for evolution eligibility
    ↓
7. Auto-Evolution Check
   - Call /api/pets/auto-evolve
   - Apply pending evolutions
   - Return updated pet state
    ↓
Success: Show success message, update UI
```

### Key Components

**Frontend:**
- `BasePayButton.tsx` - Payment button with loading/success/error states
- `PetStoreModal.tsx` - Store UI with wallet status indicator
- `lib/wallet.ts` - Client-side wallet utilities
- `lib/paymaster.ts` - Paymaster configuration & USDC utilities

**Backend:**
- `/api/wallet/transfer` - Execute USDC transfers using Coinbase SDK
- `/api/wallet` (repairWallet action) - Fix wallets missing walletData
- `/api/pets/inventory` - Record purchases
- `/api/pets/auto-evolve` - Handle evolution logic

**Database (MongoDB):**
- `Wallet` - Stores wallet ID, address, network, walletData (exported)
- `Transaction` - Records all transfers with hash, from, to, amount, status
- `ActivityLog` - Logs user actions for analytics
- `UserInventory` - Tracks purchased items per user/pet
- `Pet` - Pet data with XP, mood, stats, stage

### Technical Details

**Blockchain:**
- Network: Base Sepolia (Chain ID: 84532) - LOCKED
- Token: USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- Gas: Sponsored via Paymaster endpoint
- Wallet: Coinbase SDK with Account Abstraction (ERC-4337)

**Payment Execution:**
```typescript
// Server-side (Coinbase SDK)
const transfer = await wallet.invokeContract({
  contractAddress: usdcAddress,
  method: 'transfer',
  args: { to: toAddress, value: amount }
});
await transfer.wait();
const transactionHash = transfer.getTransactionHash();
```

**Recipient:**
- Store wallet: `0x226710d13E6c16f1c99F34649526bD3bF17cd010`
- All purchases go to this single address

**Error Handling:**
- Error codes: `WALLET_DATA_MISSING`, `WALLET_NEEDS_REPAIR`
- Automatic wallet repair on payment failure
- Manual "Reconnect Wallet" button
- Multi-level recovery (auto-repair → manual reconnect → page refresh)

**Price Format:**
- Stored in cents (e.g., 100 = $1.00)
- Converted to wei: `cents * 10^4` (USDC has 6 decimals)

---

## Coinbase Commerce API Implementation

### Architecture
**Hosted Checkout Pages** with Commerce API

### Payment Flow (based on API docs)

```
Merchant creates checkout
    ↓
1. Create Checkout (POST /checkouts)
   - Send to: https://api.commerce.coinbase.com/checkouts
   - Headers: X-CC-Api-Key: <api-key>
   - Body: {
       name: "Item name",
       description: "Item description",
       pricing_type: "fixed_price",
       local_price: {
         amount: "10.00",
         currency: "USD"
       },
       requested_info: ["email", "name"]
     }
    ↓
2. API Returns Checkout Object
   {
     id: "uuid",
     name: "Item name",
     description: "Item description",
     pricing_type: "fixed_price",
     local_price: { amount: "10.00", currency: "USD" },
     brand_color: "#color",
     brand_logo_url: "url",
     resource: "checkout",
     ...
   }
    ↓
3. Redirect User to Hosted Checkout Page
   - User selects payment method
   - Coinbase handles payment processing
   - User completes payment on Coinbase-hosted page
    ↓
4. Webhooks/Polling for Payment Status
   - Merchant receives webhook when payment completes
   - Or poll for charge status
    ↓
5. Fulfill Order
   - Verify payment received
   - Deliver product/service
```

### Key Components

**API Endpoint:**
- `POST https://api.commerce.coinbase.com/checkouts`

**Authentication:**
- Header: `X-CC-Api-Key: <api-key>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "pricing_type": "fixed_price" | "no_price",
  "local_price": {
    "amount": "string",
    "currency": "string"
  },
  "requested_info": ["name", "email", "address", "phone", "employer", "occupation"]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "pricing_type": "fixed_price",
  "local_price": {
    "amount": "string",
    "currency": "string"
  },
  "organization_name": "string",
  "brand_color": "string",
  "brand_logo_url": "uri",
  "coinbase_managed_merchant": true,
  "resource": "string"
}
```

**Payment Methods Supported:**
- Cryptocurrency (Bitcoin, Ethereum, USDC, etc.)
- Multiple wallets (Coinbase Wallet, MetaMask, etc.)

**Checkout Flow:**
- Hosted on Coinbase servers
- Handles crypto wallet connections
- Manages payment routing
- Provides payment confirmation

---

## Detailed Comparison

### 1. **Payment Initiation**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **UI Location** | In-app modal (PetStoreModal) | Redirect to hosted page |
| **User Experience** | Seamless in-app purchase | External checkout flow |
| **Branding** | Full control (custom UI) | Limited (brand_color, logo_url) |
| **Mobile** | Optimized responsive modal | Coinbase-hosted responsive page |

### 2. **Wallet Connection**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Wallet Type** | Coinbase SDK wallet (pre-created) | User brings own wallet |
| **Account Abstraction** | Yes (ERC-4337) | Depends on user's wallet |
| **Wallet Management** | MongoDB + Coinbase SDK | User manages their own wallet |
| **Gas Fees** | Sponsored via Paymaster | User pays or merchant sponsors |

### 3. **Payment Execution**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Method** | Direct blockchain transaction | Hosted checkout |
| **Smart Contract** | USDC ERC-20 transfer | Multiple cryptocurrencies |
| **Transaction Signing** | Server-side (Coinbase SDK) | Client-side (user's wallet) |
| **Network** | Base Sepolia only | Multiple networks |
| **Confirmation** | Immediate tx hash | Async via webhooks |

### 4. **Backend Integration**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **API Calls** | `/api/wallet/transfer` | `POST /checkouts` |
| **Authentication** | NextAuth (user session) | API Key (X-CC-Api-Key) |
| **Database** | MongoDB (wallet, transaction, inventory) | None (Coinbase manages) |
| **Webhook Support** | Not implemented | Yes (payment events) |

### 5. **Transaction Recording**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Storage** | MongoDB Transaction model | Coinbase dashboard |
| **Data Captured** | Hash, from, to, amount, status, userId, petId | Checkout ID, charge details |
| **Activity Logs** | Custom ActivityLog model | Coinbase analytics |
| **Confirmation Polling** | Custom background job | Webhook-driven |

### 6. **Error Handling**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Wallet Issues** | Auto-repair, reconnect button | User responsible |
| **Insufficient Funds** | Pre-checked, clear error | Shown on checkout page |
| **Failed Transactions** | Logged in DB, error codes | Webhook event |
| **Recovery** | 3-layer system (auto/manual/refresh) | User retries on hosted page |

### 7. **User Experience**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Speed** | Fast (1-2s for tx broadcast) | Slower (redirect + user action) |
| **Friction** | Low (wallet pre-initialized) | Higher (user must connect wallet) |
| **Trust** | App handles payment | Coinbase-branded checkout |
| **Mobile** | Optimized | Responsive hosted page |

### 8. **Pricing & Fees**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Gas Fees** | Sponsored (free to user) | Varies (user or merchant pays) |
| **Transaction Fees** | None (direct transfer) | 1% fee to Coinbase Commerce |
| **Price Format** | Cents (100 = $1.00) | String amount ("10.00") |
| **Currency** | USDC only | USD/crypto conversion |

### 9. **Security**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Key Management** | Server-side (CDP keys) | API key + user wallets |
| **Wallet Custody** | App manages wallets | User manages own wallet |
| **PCI Compliance** | Not needed (no fiat) | Coinbase handles |
| **Rate Limiting** | Custom (10 tx/min) | Coinbase enforced |

### 10. **Flexibility**

| Aspect | Current (StreakPets) | Coinbase Commerce API |
|--------|---------------------|----------------------|
| **Customization** | Full control (UI, flow, logic) | Limited (branding only) |
| **Network Choice** | Base Sepolia locked | Depends on wallet |
| **Token Support** | USDC only | Multiple cryptocurrencies |
| **Post-Payment Logic** | Integrated (inventory, evolution) | Separate (webhook handler) |

---

## Advantages & Disadvantages

### Current Implementation (Direct Integration)

**✅ Advantages:**
1. **Seamless UX** - No redirects, in-app payment flow
2. **Full Control** - Custom UI, branding, error handling
3. **Integrated Logic** - Payment → Inventory → Evolution in one flow
4. **Pre-initialized Wallets** - Users don't need crypto experience
5. **Gas-free** - Paymaster sponsors all transactions
6. **Fast** - Direct blockchain interaction, immediate tx hash
7. **Mobile Optimized** - Responsive modal with touch-friendly UI
8. **Rich Data** - Full transaction history in own database
9. **Testnet Safety** - Locked to Base Sepolia, no mainnet risk

**❌ Disadvantages:**
1. **Complexity** - Must manage wallets, gas, blockchain interactions
2. **Wallet Maintenance** - Need repair mechanisms for edge cases
3. **Single Token** - USDC only (no multi-currency support)
4. **Server Dependency** - Payment requires backend wallet import
5. **Custody Risk** - App controls user wallets (good for UX, risk for security)
6. **No External Wallets** - Users can't use MetaMask, Coinbase Wallet, etc.
7. **Limited Payment Options** - USDC on Base Sepolia only

### Coinbase Commerce API (Hosted Checkout)

**✅ Advantages:**
1. **Easy Setup** - Simple API integration, no blockchain complexity
2. **Trusted Brand** - Coinbase-hosted checkout page
3. **Multiple Currencies** - BTC, ETH, USDC, and more
4. **No Wallet Management** - Users bring their own wallets
5. **PCI Compliance** - Coinbase handles payment security
6. **Webhooks** - Automated payment notifications
7. **Lower Risk** - App doesn't custody funds
8. **Support** - Coinbase provides payment support

**❌ Disadvantages:**
1. **Redirect Required** - User leaves app for checkout
2. **Less Control** - Limited UI customization
3. **Transaction Fees** - 1% fee to Coinbase Commerce
4. **Slower UX** - More steps (redirect, connect wallet, approve)
5. **No Gas Sponsorship** - User pays network fees
6. **Async Flow** - Must handle webhooks for fulfillment
7. **Limited Integration** - Post-payment logic requires separate handling
8. **Higher Friction** - Users need existing crypto wallet

---

## Use Case Fit Analysis

### When to Use Current Implementation (Direct Integration)

✅ **Best For:**
- Web3 gaming apps with in-game economies
- Apps with frequent microtransactions
- Crypto-native users who expect seamless UX
- Applications where gas-free transactions are critical
- Products with integrated inventory/state management
- Apps that need full control over payment flow
- **StreakPets** - Perfect fit for in-app pet store

### When to Use Coinbase Commerce API

✅ **Best For:**
- E-commerce stores accepting crypto
- One-time purchases (not frequent transactions)
- Apps where users already have crypto wallets
- Products sold to crypto enthusiasts
- Merchants wanting Coinbase brand trust
- Apps without blockchain development resources
- **Example:** Digital goods store, SaaS subscriptions

---

## Migration Considerations

### If Migrating to Coinbase Commerce API

**Steps Required:**
1. **Create Commerce Account** - Get API key from Coinbase Commerce
2. **Implement Checkout Creation** - POST to /checkouts endpoint
3. **Redirect Flow** - Redirect user to hosted checkout page
4. **Webhook Handler** - Create endpoint to receive payment events
5. **Verify Payments** - Check webhook signatures
6. **Fulfill Orders** - Process inventory/evolution after confirmation
7. **Remove Wallet Management** - Delete wallet creation/repair logic
8. **Update UI** - Replace BasePayButton with "Checkout" redirect button

**Breaking Changes:**
- No more pre-initialized wallets (users need own wallet)
- Payment happens outside app (redirect)
- Async fulfillment (via webhooks)
- User pays gas fees (no more paymaster sponsorship)
- 1% Coinbase Commerce fee added

**Database Changes:**
- Remove `Wallet.walletData` field (no longer managing wallets)
- Keep `Transaction` model but populate from webhook data
- Add `CheckoutSession` model to track commerce checkouts

**Frontend Changes:**
```tsx
// OLD: Direct payment button
<BasePayButton 
  amount={item.price}
  walletAddress={userWalletAddress}
  onPaymentSuccess={handlePurchase}
/>

// NEW: Redirect to Commerce checkout
<button onClick={async () => {
  const checkout = await createCheckout(item);
  window.location.href = checkout.hosted_url;
}}>
  Checkout with Crypto
</button>
```

**Backend Changes:**
```typescript
// NEW: Create Commerce checkout
async function createCheckout(item: StoreItem) {
  const response = await fetch('https://api.commerce.coinbase.com/checkouts', {
    method: 'POST',
    headers: {
      'X-CC-Api-Key': process.env.COMMERCE_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: item.name,
      description: item.description,
      pricing_type: 'fixed_price',
      local_price: {
        amount: (item.price / 100).toFixed(2),
        currency: 'USD'
      }
    })
  });
  return response.json();
}

// NEW: Webhook handler
export async function POST(request: Request) {
  const signature = request.headers.get('X-CC-Webhook-Signature');
  const payload = await request.text();
  
  // Verify webhook signature
  if (!verifySignature(payload, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(payload);
  
  if (event.type === 'charge:confirmed') {
    // Fulfill order
    await handlePurchase(event.data.metadata.itemId, event.data.metadata.userId);
  }
  
  return new Response('OK', { status: 200 });
}
```

---

## Recommendation

### **KEEP CURRENT IMPLEMENTATION** ✅

**Reasons:**
1. **Perfect for Gaming** - StreakPets is a Web3 game with in-game purchases
2. **Superior UX** - In-app payment is faster and smoother than redirects
3. **Gas-free** - Critical for user adoption (no crypto needed)
4. **Integrated Logic** - Payment → Inventory → Evolution works seamlessly
5. **Mobile Optimized** - Modal works better than external checkout on mobile
6. **Low Friction** - Pre-initialized wallets remove crypto complexity
7. **Cost Effective** - No 1% Coinbase Commerce fee

**What the Current System Does Better:**
- ✅ Faster checkout (1-2s vs 30s+)
- ✅ No user wallet required (app manages)
- ✅ No gas fees for users
- ✅ Seamless mobile experience
- ✅ Integrated inventory/evolution
- ✅ Full control over error handling
- ✅ Rich transaction analytics

**When Commerce API Would Be Better:**
- If selling to users who WANT to use their own wallets
- If building traditional e-commerce (not gaming)
- If wanting Coinbase brand on checkout
- If avoiding custody responsibilities

### Minor Improvements to Current System

**Consider Adding:**
1. **Better Monitoring** - Dashboard for failed payments
2. **Receipt System** - Email/download transaction receipts
3. **Refund Flow** - Admin ability to reverse transactions
4. **Multiple Payment Options** - Add fiat on-ramp via third party
5. **Mainnet Support** - Eventually add production network (with safeguards)

---

## Conclusion

The **current direct blockchain integration** is the **optimal choice for StreakPets** because:

1. It provides a seamless, in-app purchase experience critical for gaming
2. Gas-free transactions via Paymaster eliminate crypto complexity
3. Pre-initialized wallets remove barriers to entry for non-crypto users
4. Integrated payment → inventory → evolution flow is elegant
5. Full control over UX, error handling, and post-payment logic
6. Mobile-optimized modal beats redirect-based checkout

**Coinbase Commerce API** would be appropriate for a traditional e-commerce store selling digital goods to crypto enthusiasts, but would **add friction** to the gaming experience StreakPets delivers.

**Recommendation: Continue with current implementation. No migration needed.** ✅

The existing system is well-architected for the use case and provides superior UX for the target audience (gamers who may not be crypto-native).
