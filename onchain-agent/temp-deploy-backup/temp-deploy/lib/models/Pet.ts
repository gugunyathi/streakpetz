import mongoose, { Document, Schema } from 'mongoose';

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

export interface IPet extends Document {
  _id: string;
  name: string;
  ownerId: string; // Reference to User ID
  userWalletAddress: string;
  petWalletAddress?: string;
  petWalletId?: string;
  basename?: string;
  stage: PetStage;
  mood: PetMood;
  xp: number;
  streak: number;
  lastInteraction: Date;
  personality: string[];
  stats: {
    happiness: number;
    health: number;
    level: number;
    energy: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PetSchema = new Schema<IPet>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    minlength: 1
  },
  ownerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userWalletAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  petWalletAddress: {
    type: String,
    trim: true,
    lowercase: true
  },
  petWalletId: {
    type: String,
    trim: true
  },
  basename: {
    type: String,
    trim: true
  },
  stage: {
    type: String,
    enum: Object.values(PetStage),
    default: PetStage.EGG,
    required: true
  },
  mood: {
    type: String,
    enum: Object.values(PetMood),
    default: PetMood.CONTENT,
    required: true
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  personality: {
    type: [String],
    default: ['curious', 'playful']
  },
  stats: {
    happiness: {
      type: Number,
      default: 80,
      min: 0,
      max: 100
    },
    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    energy: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better performance
PetSchema.index({ ownerId: 1 });
PetSchema.index({ userWalletAddress: 1 });
PetSchema.index({ petWalletAddress: 1 });
PetSchema.index({ stage: 1 });
PetSchema.index({ lastInteraction: -1 });
PetSchema.index({ createdAt: -1 });
PetSchema.index({ isActive: 1, ownerId: 1 });

// Virtual for calculating pet age
PetSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)); // Age in days
});

// Method to update pet after interaction
PetSchema.methods.updateAfterInteraction = function(action: string) {
  this.lastInteraction = new Date();
  
  switch (action) {
    case 'feed':
      this.stats.happiness = Math.min(100, this.stats.happiness + 15);
      this.stats.health = Math.min(100, this.stats.health + 10);
      this.stats.energy = Math.min(100, this.stats.energy + 5);
      this.xp += 10;
      break;
    case 'play':
      this.stats.happiness = Math.min(100, this.stats.happiness + 20);
      this.stats.energy = Math.max(0, this.stats.energy - 10);
      this.xp += 15;
      break;
    case 'rest':
      this.stats.energy = Math.min(100, this.stats.energy + 30);
      this.stats.health = Math.min(100, this.stats.health + 5);
      this.xp += 5;
      break;
    default:
      this.xp += 5;
  }
  
  // Update mood based on stats
  if (this.stats.happiness >= 80) {
    this.mood = PetMood.HAPPY;
  } else if (this.stats.happiness >= 60) {
    this.mood = PetMood.CONTENT;
  } else if (this.stats.happiness >= 40) {
    this.mood = PetMood.GRUMPY;
  } else {
    this.mood = PetMood.LONELY;
  }
  
  // Note: Evolution is now handled separately and requires evolution items
  // No automatic stage progression based on XP alone
  
  return this;
};

// Method to calculate required stage from XP (for reference only)
PetSchema.methods.calculateStageFromXP = function(xp: number): string {
  if (xp >= 1000) return PetStage.UNICORN;
  if (xp >= 500) return PetStage.ADULT;
  if (xp >= 200) return PetStage.TEEN;
  if (xp >= 50) return PetStage.HATCHLING;
  return PetStage.EGG;
};

// Method to handle evolution with item requirements
PetSchema.methods.attemptEvolution = function(hasRequiredItems: boolean): boolean {
  const currentXP = this.xp;
  const newStage = this.calculateStageFromXP(currentXP);
  
  // Check if pet has enough XP and user has required items
  if (newStage !== this.stage && hasRequiredItems) {
    this.stage = newStage;
    return true;
  }
  
  return false;
};

export default mongoose.models.Pet || mongoose.model<IPet>('Pet', PetSchema);