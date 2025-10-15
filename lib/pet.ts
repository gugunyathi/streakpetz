export enum PetStage {
  EGG = 'egg',
  HATCHLING = 'hatchling',
  PRETEEN = 'preteen',
  TEEN = 'teen',
  ADULT = 'adult',
  UNICORN = 'unicorn'
}

export enum PetMood {
  HAPPY = 'happy',
  CONTENT = 'content',
  GRUMPY = 'grumpy',
  COLD = 'cold',
  LONELY = 'lonely',
  PERISHED = 'perished'
}

export interface Pet {
  id: string;
  name: string;
  walletId: string;
  ownerWalletId: string;
  stage: PetStage;
  mood: PetMood;
  xp: number;
  streakDays: number;
  lastInteraction: Date;
  createdAt: Date;
  personality: {
    friendliness: number; // 0-100
    playfulness: number; // 0-100
    intelligence: number; // 0-100
    loyalty: number; // 0-100
  };
  stats: {
    happiness: number; // 0-100
    health: number; // 0-100
    hunger: number; // 0-100
    energy: number; // 0-100
  };
}

// XP thresholds for each stage
export const XP_THRESHOLDS = {
  [PetStage.EGG]: 0,
  [PetStage.HATCHLING]: 100,
  [PetStage.PRETEEN]: 500,
  [PetStage.TEEN]: 1500,
  [PetStage.ADULT]: 3000,
  [PetStage.UNICORN]: 5000
};

// Calculate pet stage based on XP
export const calculatePetStage = (xp: number): PetStage => {
  if (xp >= XP_THRESHOLDS[PetStage.UNICORN]) return PetStage.UNICORN;
  if (xp >= XP_THRESHOLDS[PetStage.ADULT]) return PetStage.ADULT;
  if (xp >= XP_THRESHOLDS[PetStage.TEEN]) return PetStage.TEEN;
  if (xp >= XP_THRESHOLDS[PetStage.PRETEEN]) return PetStage.PRETEEN;
  if (xp >= XP_THRESHOLDS[PetStage.HATCHLING]) return PetStage.HATCHLING;
  return PetStage.EGG;
};

// Calculate XP gain based on action and streak multiplier
export const calculateXPGain = (action: string, streakDays: number): number => {
  const baseXP = {
    chat: 10,
    feed: 20,
    groom: 15,
    play: 25,
    purchase: 50
  };

  const xp = baseXP[action as keyof typeof baseXP] || 5;
  const streakMultiplier = Math.min(1 + (streakDays * 0.1), 3); // Max 3x multiplier
  
  return Math.floor(xp * streakMultiplier);
};

// Update pet mood based on time since last interaction
export const updatePetMood = (pet: Pet): PetMood => {
  const hoursSinceLastInteraction = (Date.now() - pet.lastInteraction.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastInteraction > 168) return PetMood.PERISHED; // 1 week
  if (hoursSinceLastInteraction > 72) return PetMood.LONELY; // 3 days
  if (hoursSinceLastInteraction > 48) return PetMood.COLD; // 2 days
  if (hoursSinceLastInteraction > 24) return PetMood.GRUMPY; // 1 day
  if (pet.stats.happiness > 80) return PetMood.HAPPY;
  
  return PetMood.CONTENT;
};

// Create a new pet
export const createPet = (name: string, walletId: string, ownerWalletId: string): Pet => {
  return {
    id: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    walletId,
    ownerWalletId,
    stage: PetStage.EGG,
    mood: PetMood.CONTENT,
    xp: 0,
    streakDays: 0,
    lastInteraction: new Date(),
    createdAt: new Date(),
    personality: {
      friendliness: Math.floor(Math.random() * 40) + 60, // 60-100
      playfulness: Math.floor(Math.random() * 40) + 60,
      intelligence: Math.floor(Math.random() * 40) + 60,
      loyalty: Math.floor(Math.random() * 40) + 60,
    },
    stats: {
      happiness: 80,
      health: 100,
      hunger: 50,
      energy: 100,
    }
  };
};

// Update pet after interaction
export const updatePetAfterInteraction = (pet: Pet, action: string): Pet => {
  const xpGain = calculateXPGain(action, pet.streakDays);
  const newXP = pet.xp + xpGain;
  const newStage = calculatePetStage(newXP);
  
  // Update streak if it's a new day
  const lastInteractionDate = new Date(pet.lastInteraction).toDateString();
  const currentDate = new Date().toDateString();
  const streakDays = lastInteractionDate !== currentDate ? pet.streakDays + 1 : pet.streakDays;
  
  // Update stats based on action
  const updatedStats = { ...pet.stats };
  switch (action) {
    case 'feed':
      updatedStats.hunger = Math.max(0, updatedStats.hunger - 30);
      updatedStats.happiness = Math.min(100, updatedStats.happiness + 10);
      break;
    case 'play':
      updatedStats.energy = Math.max(0, updatedStats.energy - 20);
      updatedStats.happiness = Math.min(100, updatedStats.happiness + 15);
      break;
    case 'groom':
      updatedStats.health = Math.min(100, updatedStats.health + 10);
      updatedStats.happiness = Math.min(100, updatedStats.happiness + 5);
      break;
    case 'chat':
      updatedStats.happiness = Math.min(100, updatedStats.happiness + 5);
      break;
  }
  
  return {
    ...pet,
    xp: newXP,
    stage: newStage,
    streakDays,
    lastInteraction: new Date(),
    mood: updatePetMood({ ...pet, lastInteraction: new Date(), stats: updatedStats }),
    stats: updatedStats
  };
};