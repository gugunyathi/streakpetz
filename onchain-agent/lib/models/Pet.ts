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
    required: [true, 'Pet name is required'],
    trim: true,
    maxlength: [50, 'Pet name cannot exceed 50 characters'],
    minlength: [1, 'Pet name must be at least 1 character']
  },
  ownerId: {
    type: String,
    required: [true, 'Owner ID is required'],
    ref: 'User'
  },
  userWalletAddress: {
    type: String,
    required: [true, 'User wallet address is required'],
    trim: true,
    lowercase: true
  },
  petWalletAddress: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(address: string) {
        if (!address) return true; // Optional field
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      },
      message: 'Invalid pet wallet address format'
    }
  },
  petWalletId: {
    type: String,
    trim: true
  },
  basename: {
    type: String,
    trim: true,
    validate: {
      validator: function(basename: string) {
        if (!basename) return true; // Optional field
        return /^[a-z0-9-]+\.(base|basetest)\.eth$/.test(basename);
      },
      message: 'Invalid basename format. Must end with .base.eth or .basetest.eth'
    }
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
    min: [0, 'XP cannot be negative']
  },
  streak: {
    type: Number,
    default: 0,
    min: [0, 'Streak cannot be negative']
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  personality: {
    type: [String],
    default: ['curious', 'playful'],
    validate: {
      validator: function(personality: string[]) {
        return personality.length > 0 && personality.length <= 10;
      },
      message: 'Pet must have 1-10 personality traits'
    }
  },
  stats: {
    happiness: {
      type: Number,
      default: 80,
      min: [0, 'Happiness cannot be below 0'],
      max: [100, 'Happiness cannot exceed 100']
    },
    health: {
      type: Number,
      default: 100,
      min: [0, 'Health cannot be below 0'],
      max: [100, 'Health cannot exceed 100']
    },
    level: {
      type: Number,
      default: 1,
      min: [1, 'Level cannot be below 1']
    },
    energy: {
      type: Number,
      default: 100,
      min: [0, 'Energy cannot be below 0'],
      max: [100, 'Energy cannot exceed 100']
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
      this.stats.happiness = Math.min(100, this.stats.happiness + 10);
      this.stats.health = Math.min(100, this.stats.health + 5);
      this.xp += 5;
      break;
    case 'play':
      this.stats.happiness = Math.min(100, this.stats.happiness + 15);
      this.stats.energy = Math.max(0, this.stats.energy - 10);
      this.xp += 10;
      break;
    case 'groom':
      this.stats.happiness = Math.min(100, this.stats.happiness + 8);
      this.stats.health = Math.min(100, this.stats.health + 3);
      this.xp += 3;
      break;
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
  
  return this;
};

export default mongoose.models.Pet || mongoose.model<IPet>('Pet', PetSchema);