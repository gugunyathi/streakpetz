import { Wallet } from '@coinbase/coinbase-sdk';
import { PetStage } from './pet';

/**
 * PET STORE - TEST MODE ENABLED
 * 
 * Simplified evolution requirements for testing:
 * - EGG -> HATCHLING: Automatic on first chat message
 * - HATCHLING -> TEEN: After 1 purchase (any item)
 * - TEEN -> ADULT: After 2 total purchases (any items)
 * - ADULT -> UNICORN: After 4 total purchases (any items)
 * 
 * Note: In production, you would require specific evolution items.
 * This test mode just counts total purchases for easier testing.
 */

// Store Item Interface
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number; // in USDC cents
  category: 'food' | 'clothing' | 'accessories' | 'toys' | 'furniture' | 'consumables';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  requiredStage?: PetStage; // Stage requirement for evolution items
  evolutionItem?: boolean; // Mark items required for evolution
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

// Evolution Requirements Interface
export interface EvolutionRequirements {
  [PetStage.EGG]: string[]; // Item IDs required to evolve from EGG to HATCHLING
  [PetStage.HATCHLING]: string[]; // Item IDs required to evolve from HATCHLING to TEEN
  [PetStage.TEEN]: string[]; // Item IDs required to evolve from TEEN to ADULT
  [PetStage.ADULT]: string[]; // Item IDs required to evolve from ADULT to UNICORN
  [PetStage.UNICORN]: string[]; // Items for UNICORN maintenance
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
      price: 100, // $1.00 - Minimum price
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
    },

    // Evolution Items - EGG to HATCHLING (2 items required)
    {
      id: 'incubation_lamp',
      name: 'Incubation Lamp',
      description: 'A warm, magical lamp that helps eggs hatch safely',
      price: 100, // $1.00 - Minimum price
      category: 'consumables',
      rarity: 'common',
      image: '🪔',
      requiredStage: PetStage.EGG,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'hatching_powder',
      name: 'Hatching Powder',
      description: 'Special powder that strengthens the shell-breaking process',
      price: 100, // $1.00 - Minimum price
      category: 'consumables',
      rarity: 'common',
      image: '✨',
      requiredStage: PetStage.EGG,
      evolutionItem: true,
      inStock: true
    },

    // Evolution Items - HATCHLING to TEEN (5 items required)
    {
      id: 'growth_formula',
      name: 'Growth Formula',
      description: 'Nutritious formula that accelerates healthy growth',
      price: 700, // $7.00
      category: 'food',
      rarity: 'rare',
      image: '🍼',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'nutrition_supplement',
      name: 'Nutrition Supplement',
      description: 'Advanced nutritional supplement for optimal pet development',
      price: 650, // $6.50
      category: 'consumables',
      rarity: 'rare',
      image: '💊',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'energy_booster',
      name: 'Energy Booster',
      description: 'Powerful energy enhancement formula for active pets',
      price: 800, // $8.00
      category: 'consumables',
      rarity: 'rare',
      image: '⚡',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'vitamin_complex',
      name: 'Vitamin Complex',
      description: 'Complete vitamin complex for comprehensive pet health',
      price: 750, // $7.50
      category: 'consumables',
      rarity: 'rare',
      image: '🧪',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'development_catalyst',
      name: 'Development Catalyst',
      description: 'Specialized catalyst that accelerates pet evolution process',
      price: 900, // $9.00
      category: 'consumables',
      rarity: 'epic',
      image: '🔬',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'learning_blocks',
      name: 'Learning Blocks',
      description: 'Educational toys that develop cognitive abilities',
      price: 125, // $1.25
      category: 'toys',
      rarity: 'common',
      image: '🧱',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'comfort_blanket',
      name: 'Comfort Blanket',
      description: 'A soft blanket that provides security during growth',
      price: 100, // $1.00 - Minimum price
      category: 'accessories',
      rarity: 'common',
      image: '🧸',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'vitamin_drops',
      name: 'Vitamin Drops',
      description: 'Essential vitamins for proper development',
      price: 100, // $1.00 - Minimum price
      category: 'consumables',
      rarity: 'common',
      image: '💊',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'exercise_wheel',
      name: 'Exercise Wheel',
      description: 'A fun wheel that builds strength and coordination',
      price: 150, // $1.50
      category: 'toys',
      rarity: 'rare',
      image: '🎡',
      requiredStage: PetStage.HATCHLING,
      evolutionItem: true,
      inStock: true
    },

    // Evolution Items - TEEN to ADULT (10 items required)
    {
      id: 'maturity_serum',
      name: 'Maturity Serum',
      description: 'Advanced serum that triggers adult development',
      price: 200, // $2.00
      category: 'consumables',
      rarity: 'rare',
      image: '🧬',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'wisdom_crystal',
      name: 'Wisdom Crystal',
      description: 'A mystical crystal that enhances intelligence',
      price: 250, // $2.50
      category: 'accessories',
      rarity: 'rare',
      image: '💎',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'strength_potion',
      name: 'Strength Potion',
      description: 'A powerful potion that builds physical prowess',
      price: 180, // $1.80
      category: 'consumables',
      rarity: 'rare',
      image: '💪',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'confidence_charm',
      name: 'Confidence Charm',
      description: 'A magical charm that boosts self-assurance',
      price: 220, // $2.20
      category: 'accessories',
      rarity: 'rare',
      image: '🔮',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'leadership_badge',
      name: 'Leadership Badge',
      description: 'A prestigious badge that develops leadership skills',
      price: 300, // $3.00
      category: 'accessories',
      rarity: 'epic',
      image: '🏅',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'training_weights',
      name: 'Training Weights',
      description: 'Professional weights for advanced physical training',
      price: 275, // $2.75
      category: 'toys',
      rarity: 'rare',
      image: '🏋️',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'focus_headband',
      name: 'Focus Headband',
      description: 'A special headband that improves concentration',
      price: 190, // $1.90
      category: 'clothing',
      rarity: 'rare',
      image: '🎯',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'energy_core',
      name: 'Energy Core',
      description: 'A powerful core that amplifies inner energy',
      price: 350, // $3.50
      category: 'consumables',
      rarity: 'epic',
      image: '⚡',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'skill_manual',
      name: 'Advanced Skill Manual',
      description: 'A comprehensive guide to mastering advanced abilities',
      price: 240, // $2.40
      category: 'consumables',
      rarity: 'rare',
      image: '📚',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'determination_ring',
      name: 'Ring of Determination',
      description: 'A magical ring that strengthens willpower',
      price: 280, // $2.80
      category: 'accessories',
      rarity: 'epic',
      image: '💍',
      requiredStage: PetStage.TEEN,
      evolutionItem: true,
      inStock: true
    },

    // Evolution Items - ADULT to UNICORN (15 items required)
    {
      id: 'legendary_essence',
      name: 'Legendary Essence',
      description: 'Pure essence required for legendary transformation',
      price: 500, // $5.00
      category: 'consumables',
      rarity: 'legendary',
      image: '🌟',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'rainbow_dust',
      name: 'Rainbow Dust',
      description: 'Magical dust that creates rainbow effects',
      price: 400, // $4.00
      category: 'consumables',
      rarity: 'epic',
      image: '🌈',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'starlight_crystal',
      name: 'Starlight Crystal',
      description: 'A crystal infused with the power of stars',
      price: 600, // $6.00
      category: 'accessories',
      rarity: 'legendary',
      image: '⭐',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'moonbeam_elixir',
      name: 'Moonbeam Elixir',
      description: 'An elixir crafted from pure moonlight',
      price: 450, // $4.50
      category: 'consumables',
      rarity: 'epic',
      image: '🌙',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'phoenix_feather',
      name: 'Phoenix Feather',
      description: 'A rare feather from the legendary phoenix',
      price: 700, // $7.00
      category: 'accessories',
      rarity: 'legendary',
      image: '🪶',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'dragon_scale',
      name: 'Ancient Dragon Scale',
      description: 'A scale from an ancient dragon, pulsing with power',
      price: 650, // $6.50
      category: 'accessories',
      rarity: 'legendary',
      image: '🐉',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'celestial_crown',
      name: 'Celestial Crown',
      description: 'A crown blessed by celestial beings',
      price: 800, // $8.00
      category: 'clothing',
      rarity: 'legendary',
      image: '👑',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'divine_amulet',
      name: 'Divine Amulet',
      description: 'An amulet containing divine energy',
      price: 550, // $5.50
      category: 'accessories',
      rarity: 'legendary',
      image: '🔱',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'ethereal_wings',
      name: 'Ethereal Wings',
      description: 'Translucent wings that shimmer with magic',
      price: 750, // $7.50
      category: 'accessories',
      rarity: 'legendary',
      image: '🦋',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'cosmic_orb',
      name: 'Cosmic Orb',
      description: 'An orb containing the power of the cosmos',
      price: 680, // $6.80
      category: 'accessories',
      rarity: 'legendary',
      image: '🔮',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'harmony_bell',
      name: 'Bell of Harmony',
      description: 'A bell that resonates with universal harmony',
      price: 520, // $5.20
      category: 'accessories',
      rarity: 'epic',
      image: '🔔',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'purity_gem',
      name: 'Gem of Purity',
      description: 'A flawless gem radiating pure energy',
      price: 620, // $6.20
      category: 'accessories',
      rarity: 'legendary',
      image: '💎',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'transformation_scroll',
      name: 'Transformation Scroll',
      description: 'Ancient scroll containing transformation magic',
      price: 580, // $5.80
      category: 'consumables',
      rarity: 'legendary',
      image: '📜',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'miracle_potion',
      name: 'Miracle Potion',
      description: 'A potion capable of miraculous transformations',
      price: 720, // $7.20
      category: 'consumables',
      rarity: 'legendary',
      image: '🧪',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'infinity_stone',
      name: 'Infinity Stone',
      description: 'A stone containing infinite possibilities',
      price: 900, // $9.00
      category: 'accessories',
      rarity: 'legendary',
      image: '♾️',
      requiredStage: PetStage.ADULT,
      evolutionItem: true,
      inStock: true
    },

    // UNICORN Maintenance Items (25 items for ongoing care)
    {
      id: 'unicorn_nectar',
      name: 'Unicorn Nectar',
      description: 'Divine nectar that maintains unicorn powers',
      price: 300, // $3.00
      category: 'food',
      rarity: 'epic',
      image: '🍯',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'horn_polish',
      name: 'Horn Polish',
      description: 'Special polish to keep the unicorn horn gleaming',
      price: 200, // $2.00
      category: 'consumables',
      rarity: 'rare',
      image: '✨',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'mane_conditioner',
      name: 'Magical Mane Conditioner',
      description: 'Keeps the unicorn mane silky and flowing',
      price: 250, // $2.50
      category: 'consumables',
      rarity: 'rare',
      image: '🧴',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'rainbow_treats',
      name: 'Rainbow Treats',
      description: 'Colorful treats that unicorns absolutely love',
      price: 180, // $1.80
      category: 'food',
      rarity: 'rare',
      image: '🌈',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'cloud_cushion',
      name: 'Cloud Cushion',
      description: 'A soft cushion made from actual clouds',
      price: 400, // $4.00
      category: 'furniture',
      rarity: 'epic',
      image: '☁️',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'star_dust_bath',
      name: 'Star Dust Bath Salts',
      description: 'Luxurious bath salts infused with star dust',
      price: 350, // $3.50
      category: 'consumables',
      rarity: 'epic',
      image: '⭐',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'magic_mirror',
      name: 'Enchanted Mirror',
      description: 'A mirror that reflects the unicorn\'s true beauty',
      price: 500, // $5.00
      category: 'furniture',
      rarity: 'legendary',
      image: '🪞',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'healing_herbs',
      name: 'Celestial Healing Herbs',
      description: 'Rare herbs that maintain unicorn health',
      price: 280, // $2.80
      category: 'consumables',
      rarity: 'rare',
      image: '🌿',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'golden_horseshoes',
      name: 'Golden Horseshoes',
      description: 'Protective horseshoes made of pure gold',
      price: 600, // $6.00
      category: 'accessories',
      rarity: 'legendary',
      image: '🐴',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'fairy_dust',
      name: 'Fairy Dust',
      description: 'Magical dust collected from friendly fairies',
      price: 220, // $2.20
      category: 'consumables',
      rarity: 'rare',
      image: '🧚',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'moonlight_shampoo',
      name: 'Moonlight Shampoo',
      description: 'Gentle shampoo made from liquid moonlight',
      price: 320, // $3.20
      category: 'consumables',
      rarity: 'epic',
      image: '🌙',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'crystal_water',
      name: 'Crystal Spring Water',
      description: 'Pure water from magical crystal springs',
      price: 150, // $1.50
      category: 'consumables',
      rarity: 'rare',
      image: '💧',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'enchanted_brush',
      name: 'Enchanted Grooming Brush',
      description: 'A magical brush that never tangles the mane',
      price: 380, // $3.80
      category: 'accessories',
      rarity: 'epic',
      image: '🪮',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'sunbeam_vitamins',
      name: 'Sunbeam Vitamins',
      description: 'Vitamins made from concentrated sunbeams',
      price: 260, // $2.60
      category: 'consumables',
      rarity: 'rare',
      image: '☀️',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'dream_catcher',
      name: 'Unicorn Dream Catcher',
      description: 'Catches beautiful dreams for peaceful sleep',
      price: 450, // $4.50
      category: 'accessories',
      rarity: 'epic',
      image: '🕸️',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'magic_saddle',
      name: 'Enchanted Saddle',
      description: 'A comfortable saddle for magical adventures',
      price: 700, // $7.00
      category: 'accessories',
      rarity: 'legendary',
      image: '🏇',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'rainbow_ribbon',
      name: 'Rainbow Ribbon',
      description: 'A beautiful ribbon that shimmers with all colors',
      price: 190, // $1.90
      category: 'accessories',
      rarity: 'rare',
      image: '🎀',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'celestial_blanket',
      name: 'Celestial Blanket',
      description: 'A warm blanket woven from starlight',
      price: 550, // $5.50
      category: 'furniture',
      rarity: 'legendary',
      image: '🌌',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'harmony_crystals',
      name: 'Harmony Crystals',
      description: 'Crystals that maintain emotional balance',
      price: 340, // $3.40
      category: 'accessories',
      rarity: 'epic',
      image: '💎',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'wind_chimes',
      name: 'Magical Wind Chimes',
      description: 'Chimes that play melodies of the wind',
      price: 290, // $2.90
      category: 'accessories',
      rarity: 'rare',
      image: '🎐',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'flower_crown',
      name: 'Eternal Flower Crown',
      description: 'A crown of flowers that never wilt',
      price: 420, // $4.20
      category: 'clothing',
      rarity: 'epic',
      image: '🌸',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'magic_apple',
      name: 'Golden Magic Apple',
      description: 'A golden apple that grants wisdom and health',
      price: 380, // $3.80
      category: 'food',
      rarity: 'epic',
      image: '🍎',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'aurora_essence',
      name: 'Aurora Essence',
      description: 'Essence captured from the northern lights',
      price: 480, // $4.80
      category: 'consumables',
      rarity: 'legendary',
      image: '🌌',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'unicorn_bell',
      name: 'Unicorn Bell',
      description: 'A bell that chimes with pure, magical tones',
      price: 360, // $3.60
      category: 'accessories',
      rarity: 'epic',
      image: '🔔',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    },
    {
      id: 'eternal_flame',
      name: 'Eternal Flame Candle',
      description: 'A candle with a flame that never goes out',
      price: 520, // $5.20
      category: 'furniture',
      rarity: 'legendary',
      image: '🕯️',
      requiredStage: PetStage.UNICORN,
      evolutionItem: true,
      inStock: true
    }
  ];

  // Evolution Requirements Mapping (TEST MODE - Simplified for testing)
  // EGG -> HATCHLING: First chat (handled in chat route)
  // HATCHLING -> TEEN: 1 purchase
  // TEEN -> ADULT: 2 purchases
  // ADULT -> UNICORN: 4 purchases
  private evolutionRequirements: EvolutionRequirements = {
    [PetStage.EGG]: [], // No items needed - evolves on first chat
    [PetStage.HATCHLING]: ['premium_steak'], // Any 1 item purchase
    [PetStage.TEEN]: ['golden_treat', 'premium_steak'], // Any 2 item purchases
    [PetStage.ADULT]: ['legendary_essence', 'rainbow_dust', 'starlight_crystal', 'moonbeam_elixir'], // Any 4 item purchases
    [PetStage.UNICORN]: ['unicorn_nectar', 'horn_polish', 'mane_conditioner', 'rainbow_treats', 'cloud_cushion', 'star_dust_bath', 'magic_mirror', 'healing_herbs', 'golden_horseshoes', 'fairy_dust', 'moonlight_shampoo', 'crystal_water', 'enchanted_brush', 'sunbeam_vitamins', 'dream_catcher', 'magic_saddle', 'rainbow_ribbon', 'celestial_blanket', 'harmony_crystals', 'wind_chimes', 'flower_crown', 'magic_apple', 'aurora_essence', 'unicorn_bell', 'eternal_flame']
  };

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

  // Get evolution items for a specific stage
  getEvolutionItemsForStage(stage: PetStage): StoreItem[] {
    const requiredItemIds = this.evolutionRequirements[stage] || [];
    return requiredItemIds.map(id => this.getItemById(id)).filter(item => item !== null) as StoreItem[];
  }

  // Check if user has all required evolution items for a stage
  // TEST MODE: Simplified - just counts total purchases instead of specific items
  canEvolveFromStage(userId: string, currentStage: PetStage): boolean {
    const requiredItemIds = this.evolutionRequirements[currentStage] || [];
    const inventory = this.getUserInventory(userId);
    
    // TEST MODE: For EGG stage, no items needed (evolves on first chat)
    if (currentStage === PetStage.EGG) {
      return false; // Handled separately in chat route
    }
    
    // TEST MODE: Count total purchases (any items)
    const totalPurchases = inventory.items.reduce((sum, item) => sum + item.quantity, 0);
    const requiredPurchases = requiredItemIds.length;
    
    console.log(`📊 Evolution check for ${currentStage}: ${totalPurchases}/${requiredPurchases} purchases`);
    
    return totalPurchases >= requiredPurchases;
  }

  // Get missing evolution items for a stage
  // TEST MODE: Shows how many more purchases are needed
  getMissingEvolutionItems(userId: string, currentStage: PetStage): StoreItem[] {
    const requiredItemIds = this.evolutionRequirements[currentStage] || [];
    const inventory = this.getUserInventory(userId);
    
    // TEST MODE: Calculate how many more purchases needed
    const totalPurchases = inventory.items.reduce((sum, item) => sum + item.quantity, 0);
    const requiredPurchases = requiredItemIds.length;
    const missingPurchases = Math.max(0, requiredPurchases - totalPurchases);
    
    console.log(`📊 Missing for ${currentStage}: ${missingPurchases} more purchase(s) needed`);
    
    // Return available store items that could be purchased
    if (missingPurchases > 0) {
      return this.getStoreItems().slice(0, missingPurchases);
    }
    
    return [];
  }

  // Consume evolution items (when pet evolves)
  // TEST MODE: No items are actually consumed, just marks evolution eligibility
  consumeEvolutionItems(userId: string, currentStage: PetStage): boolean {
    // Check if evolution is possible
    if (!this.canEvolveFromStage(userId, currentStage)) {
      return false;
    }

    console.log(`✅ Evolution items check passed for ${currentStage}`);
    
    // TEST MODE: Don't actually consume items, just return success
    // In production, you would mark items as used here
    
    return true;
  }

  // Get evolution requirements for display
  getEvolutionRequirements(): EvolutionRequirements {
    return { ...this.evolutionRequirements };
  }
}

// Export singleton instance
export const petStore = new PetStore();