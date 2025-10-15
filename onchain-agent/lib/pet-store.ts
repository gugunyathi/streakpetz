import { Wallet } from '@coinbase/coinbase-sdk';

// Store Item Interface
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number; // in USDC cents
  category: 'food' | 'clothing' | 'accessories' | 'toys' | 'furniture' | 'consumables';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  effects?: {
    experienceBoost?: number;
    moodBoost?: string;
    levelRequirement?: number;
    healthBoost?: number;
    energyBoost?: number;
  };
  inStock: boolean;
  limitedEdition?: boolean;
  expiresAt?: Date;
  featured?: boolean;
  maxQuantity?: number;
}

// User Inventory Interface
export interface UserInventory {
  userId: string;
  items: InventoryItem[];
  totalValue: number; // in USDC cents
  lastUpdated: Date;
}

export interface InventoryItem {
  storeItemId: string;
  quantity: number;
  purchaseDate: Date;
  purchasePrice: number;
  used?: boolean;
}

// Purchase Request Interface
export interface PurchaseRequest {
  userId: string;
  petId: string;
  itemId: string;
  quantity?: number;
  paymentMethod: 'usdc' | 'base-pay';
  walletAddress: string;
}

// Purchase Result Interface
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  item: StoreItem;
  totalCost: number;
  newBalance: number;
  error?: string;
}

// Pet Store Class
export class PetStore {
  private storeItems: StoreItem[] = [
    // Food Items
    {
      id: 'premium_steak',
      name: 'Premium Steak',
      description: 'A juicy premium steak that makes your pet extremely happy and boosts experience significantly',
      price: 100, // $1.00
      category: 'food',
      rarity: 'common',
      image: '🥩',
      effects: {
        experienceBoost: 20,
        moodBoost: 'excited',
        healthBoost: 15
      },
      inStock: true,
      featured: true
    },
    {
      id: 'golden_treat',
      name: 'Golden Treat',
      description: 'A legendary golden treat that provides massive experience boost',
      price: 500, // $5.00
      category: 'food',
      rarity: 'legendary',
      image: '🏆',
      effects: {
        experienceBoost: 100,
        moodBoost: 'ecstatic',
        healthBoost: 50
      },
      inStock: true,
      limitedEdition: true,
      featured: true
    },
    {
      id: 'energy_kibble',
      name: 'Energy Kibble',
      description: 'Special kibble that restores energy and provides steady experience',
      price: 75, // $0.75
      category: 'food',
      rarity: 'common',
      image: '🍖',
      effects: {
        experienceBoost: 15,
        energyBoost: 25,
        moodBoost: 'happy'
      },
      inStock: true
    },

    // Clothing Items
    {
      id: 'rainbow_bandana',
      name: 'Rainbow Bandana',
      description: 'A colorful bandana that makes your pet look stylish and feel happy',
      price: 150, // $1.50
      category: 'clothing',
      rarity: 'rare',
      image: '🌈',
      effects: {
        moodBoost: 'happy',
        experienceBoost: 10
      },
      inStock: true
    },
    {
      id: 'royal_crown',
      name: 'Royal Crown',
      description: 'A majestic crown fit for pet royalty - requires high level',
      price: 1000, // $10.00
      category: 'clothing',
      rarity: 'legendary',
      image: '👑',
      effects: {
        experienceBoost: 50,
        moodBoost: 'royal',
        levelRequirement: 20
      },
      inStock: true,
      featured: true
    },
    {
      id: 'cozy_sweater',
      name: 'Cozy Sweater',
      description: 'A warm, comfortable sweater perfect for chilly days',
      price: 200, // $2.00
      category: 'clothing',
      rarity: 'common',
      image: '🧥',
      effects: {
        moodBoost: 'cozy',
        healthBoost: 10
      },
      inStock: true
    },

    // Toys & Accessories
    {
      id: 'puzzle_box',
      name: 'Puzzle Box',
      description: 'An intelligent toy that challenges your pet and boosts their smarts',
      price: 200, // $2.00
      category: 'toys',
      rarity: 'rare',
      image: '🧩',
      effects: {
        experienceBoost: 30,
        moodBoost: 'focused'
      },
      inStock: true
    },
    {
      id: 'friendship_bracelet',
      name: 'Friendship Bracelet',
      description: 'A special bracelet that strengthens the bond between you and your pet',
      price: 300, // $3.00
      category: 'accessories',
      rarity: 'epic',
      image: '💝',
      effects: {
        experienceBoost: 25,
        moodBoost: 'loved'
      },
      inStock: true,
      featured: true
    },
    {
      id: 'magic_wand',
      name: 'Magic Wand',
      description: 'A mystical wand that provides magical experience boosts',
      price: 400, // $4.00
      category: 'toys',
      rarity: 'epic',
      image: '🪄',
      effects: {
        experienceBoost: 40,
        moodBoost: 'magical'
      },
      inStock: true,
      limitedEdition: true
    },

    // Furniture
    {
      id: 'luxury_bed',
      name: 'Luxury Pet Bed',
      description: 'An ultra-comfortable bed that helps your pet rest and recover',
      price: 250, // $2.50
      category: 'furniture',
      rarity: 'rare',
      image: '🛏️',
      effects: {
        moodBoost: 'sleepy',
        healthBoost: 20,
        energyBoost: 30
      },
      inStock: true
    },
    {
      id: 'play_castle',
      name: 'Play Castle',
      description: 'A magnificent castle for your pet to explore and play in',
      price: 800, // $8.00
      category: 'furniture',
      rarity: 'legendary',
      image: '🏰',
      effects: {
        experienceBoost: 60,
        moodBoost: 'adventurous',
        levelRequirement: 15
      },
      inStock: true,
      featured: true
    },

    // Consumables
    {
      id: 'health_potion',
      name: 'Health Potion',
      description: 'A magical potion that instantly restores your pet\'s health',
      price: 150, // $1.50
      category: 'consumables',
      rarity: 'rare',
      image: '🧪',
      effects: {
        healthBoost: 50,
        moodBoost: 'refreshed'
      },
      inStock: true
    },
    {
      id: 'experience_elixir',
      name: 'Experience Elixir',
      description: 'A powerful elixir that provides massive experience gains',
      price: 350, // $3.50
      category: 'consumables',
      rarity: 'epic',
      image: '⚗️',
      effects: {
        experienceBoost: 75,
        moodBoost: 'energized'
      },
      inStock: true,
      limitedEdition: true
    }
  ];

  private userInventories: Map<string, UserInventory> = new Map();

  // Get all store items
  getStoreItems(): StoreItem[] {
    return this.storeItems.filter(item => item.inStock);
  }

  // Get items by category
  getItemsByCategory(category: string): StoreItem[] {
    if (category === 'all') return this.getStoreItems();
    return this.storeItems.filter(item => item.category === category && item.inStock);
  }

  // Get featured items
  getFeaturedItems(): StoreItem[] {
    return this.storeItems.filter(item => item.featured && item.inStock);
  }

  // Get limited edition items
  getLimitedEditionItems(): StoreItem[] {
    return this.storeItems.filter(item => item.limitedEdition && item.inStock);
  }

  // Get item by ID
  getItemById(itemId: string): StoreItem | null {
    return this.storeItems.find(item => item.id === itemId) || null;
  }

  // Get user inventory
  getUserInventory(userId: string): UserInventory {
    if (!this.userInventories.has(userId)) {
      this.userInventories.set(userId, {
        userId,
        items: [],
        totalValue: 0,
        lastUpdated: new Date()
      });
    }
    return this.userInventories.get(userId)!;
  }

  // Validate purchase request
  private validatePurchase(request: PurchaseRequest): { valid: boolean; error?: string } {
    const item = this.getItemById(request.itemId);
    
    if (!item) {
      return { valid: false, error: 'Item not found' };
    }

    if (!item.inStock) {
      return { valid: false, error: 'Item out of stock' };
    }

    if (item.effects?.levelRequirement) {
      // In a real implementation, you'd check the pet's actual level
      // For now, we'll assume level requirement is met
    }

    const quantity = request.quantity || 1;
    if (item.maxQuantity && quantity > item.maxQuantity) {
      return { valid: false, error: `Maximum quantity is ${item.maxQuantity}` };
    }

    return { valid: true };
  }

  // Process USDC payment
  private async processUSDCPayment(
    walletAddress: string, 
    amount: number, 
    itemId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Simulate USDC payment processing
      // In production, this would integrate with Coinbase SDK or Base Pay
      
      console.log(`Processing USDC payment: ${amount} cents for item ${itemId}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock transaction ID
      const transactionId = `usdc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        transactionId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  // Process Base Pay payment
  private async processBasePayment(
    walletAddress: string, 
    amount: number, 
    itemId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Simulate Base Pay processing
      console.log(`Processing Base Pay: ${amount} cents for item ${itemId}`);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock transaction ID
      const transactionId = `base_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        transactionId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Base Pay processing failed'
      };
    }
  }

  // Purchase an item
  async purchaseItem(request: PurchaseRequest): Promise<PurchaseResult> {
    // Validate purchase
    const validation = this.validatePurchase(request);
    if (!validation.valid) {
      return {
        success: false,
        item: this.getItemById(request.itemId)!,
        totalCost: 0,
        newBalance: 0,
        error: validation.error
      };
    }

    const item = this.getItemById(request.itemId)!;
    const quantity = request.quantity || 1;
    const totalCost = item.price * quantity;

    // Process payment
    let paymentResult;
    if (request.paymentMethod === 'usdc') {
      paymentResult = await this.processUSDCPayment(request.walletAddress, totalCost, request.itemId);
    } else {
      paymentResult = await this.processBasePayment(request.walletAddress, totalCost, request.itemId);
    }

    if (!paymentResult.success) {
      return {
        success: false,
        item,
        totalCost,
        newBalance: 0,
        error: paymentResult.error
      };
    }

    // Add item to user inventory
    const inventory = this.getUserInventory(request.userId);
    const existingItem = inventory.items.find(invItem => invItem.storeItemId === request.itemId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      inventory.items.push({
        storeItemId: request.itemId,
        quantity,
        purchaseDate: new Date(),
        purchasePrice: item.price,
        used: false
      });
    }

    inventory.totalValue += totalCost;
    inventory.lastUpdated = new Date();

    // Apply item effects to pet (in production, this would update the pet in the database)
    await this.applyItemEffects(request.petId, item);

    return {
      success: true,
      transactionId: paymentResult.transactionId,
      item,
      totalCost,
      newBalance: 0, // In production, this would be the actual new balance
    };
  }

  // Apply item effects to pet
  private async applyItemEffects(petId: string, item: StoreItem): Promise<void> {
    if (!item.effects) return;

    console.log(`Applying effects to pet ${petId}:`, item.effects);

    // In production, this would:
    // 1. Fetch the pet from the database
    // 2. Apply the effects (experience boost, mood change, etc.)
    // 3. Update the pet in the database
    // 4. Possibly trigger animations or notifications

    // Mock implementation
    if (item.effects.experienceBoost) {
      console.log(`Pet ${petId} gained ${item.effects.experienceBoost} experience!`);
    }

    if (item.effects.moodBoost) {
      console.log(`Pet ${petId} mood changed to: ${item.effects.moodBoost}`);
    }

    if (item.effects.healthBoost) {
      console.log(`Pet ${petId} health increased by ${item.effects.healthBoost}!`);
    }

    if (item.effects.energyBoost) {
      console.log(`Pet ${petId} energy increased by ${item.effects.energyBoost}!`);
    }
  }

  // Use a consumable item
  async useItem(userId: string, petId: string, inventoryItemId: string): Promise<{ success: boolean; error?: string }> {
    const inventory = this.getUserInventory(userId);
    const inventoryItem = inventory.items.find(item => item.storeItemId === inventoryItemId);

    if (!inventoryItem) {
      return { success: false, error: 'Item not found in inventory' };
    }

    if (inventoryItem.quantity <= 0) {
      return { success: false, error: 'No items remaining' };
    }

    const storeItem = this.getItemById(inventoryItem.storeItemId);
    if (!storeItem) {
      return { success: false, error: 'Store item not found' };
    }

    // Apply effects
    await this.applyItemEffects(petId, storeItem);

    // Reduce quantity for consumables
    if (storeItem.category === 'consumables') {
      inventoryItem.quantity -= 1;
      inventoryItem.used = true;
    }

    return { success: true };
  }

  // Get purchase history
  getPurchaseHistory(userId: string): InventoryItem[] {
    const inventory = this.getUserInventory(userId);
    return inventory.items.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
  }

  // Check if user owns item
  userOwnsItem(userId: string, itemId: string): boolean {
    const inventory = this.getUserInventory(userId);
    const item = inventory.items.find(item => item.storeItemId === itemId);
    return item ? item.quantity > 0 : false;
  }

  // Get total inventory value
  getInventoryValue(userId: string): number {
    const inventory = this.getUserInventory(userId);
    return inventory.totalValue;
  }
}

// Export singleton instance
export const petStore = new PetStore();