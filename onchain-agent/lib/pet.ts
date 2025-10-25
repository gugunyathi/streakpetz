export enum PetStage {
  EGG = 'egg',
  HATCHLING = 'hatchling', 
  TEEN = 'teen',
  ADULT = 'adult',
  UNICORN = 'unicorn'
}

export enum PetMood {
  HAPPY = 'happy',
  CONTENT = 'content',
  GRUMPY = 'grumpy',
  COLD = 'cold',
  LONELY = 'lonely'
}

export interface Pet {
  id: string;
  name: string;
  userWalletAddress: string;
  petWalletAddress?: string;
  petWalletId?: string;
  basename?: string;
  imageUrl?: string;
  stage: PetStage;
  mood: PetMood;
  xp: number;
  streak: number;
  lastInteraction: Date;
  createdAt: Date;
  personality: string[];
  stats: {
    happiness: number;
    health: number;
    level: number;
    energy: number;
  };
}

// XP thresholds for each stage
export const XP_THRESHOLDS = {
  [PetStage.EGG]: 0,
  [PetStage.HATCHLING]: 10,
  [PetStage.TEEN]: 50,
  [PetStage.ADULT]: 150,
  [PetStage.UNICORN]: 300
};

export const calculatePetStage = (xp: number): PetStage => {
  if (xp >= XP_THRESHOLDS[PetStage.UNICORN]) return PetStage.UNICORN;
  if (xp >= XP_THRESHOLDS[PetStage.ADULT]) return PetStage.ADULT;
  if (xp >= XP_THRESHOLDS[PetStage.TEEN]) return PetStage.TEEN;
  if (xp >= XP_THRESHOLDS[PetStage.HATCHLING]) return PetStage.HATCHLING;
  return PetStage.EGG;
};

export const calculateXPGain = (action: string, streak: number): number => {
  const baseXP = {
    feed: 5,
    play: 3,
    groom: 2,
    chat: 1
  };
  
  const multiplier = Math.min(1 + (streak * 0.1), 2); // Max 2x multiplier
  return Math.floor((baseXP[action as keyof typeof baseXP] || 1) * multiplier);
};

export const updatePetMood = (pet: Pet): PetMood => {
  const hoursSinceLastInteraction = (Date.now() - pet.lastInteraction.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastInteraction < 2) return PetMood.HAPPY;
  if (hoursSinceLastInteraction < 12) return PetMood.CONTENT;
  if (hoursSinceLastInteraction < 24) return PetMood.GRUMPY;
  if (hoursSinceLastInteraction < 72) return PetMood.COLD;
  return PetMood.LONELY;
};

export const createPet = (name: string, userWalletAddress: string): Pet => {
  return {
    id: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    userWalletAddress,
    stage: PetStage.EGG,
    mood: PetMood.CONTENT,
    xp: 0,
    streak: 0,
    lastInteraction: new Date(),
    createdAt: new Date(),
    personality: ['curious', 'playful'],
    stats: {
      happiness: 80,
      health: 100,
      level: 1,
      energy: 100
    }
  };
};

export const updatePetAfterInteraction = (pet: Pet, action: string): Pet => {
  const now = new Date();
  const xpGain = calculateXPGain(action, pet.streak);
  const newXP = pet.xp + xpGain;
  const newStage = calculatePetStage(newXP);
  
  // Update streak if interaction is within 24 hours
  const hoursSinceLastInteraction = (now.getTime() - pet.lastInteraction.getTime()) / (1000 * 60 * 60);
  const newStreak = hoursSinceLastInteraction <= 24 ? pet.streak + 1 : 1;
  
  // Update stats based on action
  let happinessChange = 0;
  let healthChange = 0;
  
  switch (action) {
    case 'feed':
      happinessChange = 10;
      healthChange = 5;
      break;
    case 'play':
      happinessChange = 15;
      healthChange = -2; // Playing can be tiring
      break;
    case 'groom':
      happinessChange = 8;
      healthChange = 3;
      break;
    case 'chat':
      happinessChange = 5;
      break;
  }
  
  const updatedPet: Pet = {
    ...pet,
    xp: newXP,
    stage: newStage,
    mood: PetMood.HAPPY, // Always happy after interaction
    streak: newStreak,
    lastInteraction: now,
    stats: {
      ...pet.stats,
      happiness: Math.min(100, Math.max(0, pet.stats.happiness + happinessChange)),
      health: Math.min(100, Math.max(0, pet.stats.health + healthChange)),
      level: Math.floor(newXP / 10) + 1
    }
  };
  
  return updatedPet;
};

// Enhanced pet creation with wallet initialization
export const createPetWithWallet = async (
  name: string, 
  userWalletAddress: string,
  initializeWallet: (userAddress: string, petName: string) => Promise<{ address: string; walletId: string }>
): Promise<Pet> => {
  const pet = createPet(name, userWalletAddress);
  
  try {
    // Initialize pet wallet when first chat occurs (hatchling stage)
    if (pet.stage === PetStage.EGG) {
      const walletInfo = await initializeWallet(userWalletAddress, name);
      pet.petWalletAddress = walletInfo.address;
      pet.petWalletId = walletInfo.walletId;
      pet.stage = PetStage.HATCHLING; // Hatch when wallet is created
      pet.xp = XP_THRESHOLDS[PetStage.HATCHLING];
    }
  } catch (error) {
    console.error('Error creating pet wallet:', error);
    // Pet can still exist without wallet, but with limited functionality
  }
  
  return pet;
};