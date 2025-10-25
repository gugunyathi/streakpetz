import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  _id: string;
  walletId: string; // Coinbase wallet ID
  address: string; // Blockchain address
  network: string; // Network (base-sepolia, base-mainnet, etc.)
  type: 'user' | 'pet'; // Wallet type
  ownerId: string; // Reference to User ID
  petId?: string; // Reference to Pet ID (if pet wallet)
  basename?: string; // Registered basename (e.g., mypet.base.eth)
  walletData?: string; // Exported wallet data (JSON string) for persistence
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>({
  walletId: {
    type: String,
    required: [true, 'Wallet ID is required'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(address: string) {
        // Basic Ethereum address validation
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      },
      message: 'Invalid wallet address format'
    }
  },
  network: {
    type: String,
    required: [true, 'Network is required'],
    enum: ['base-sepolia', 'base-mainnet', 'ethereum', 'polygon'],
    default: 'base-sepolia'
  },
  type: {
    type: String,
    required: [true, 'Wallet type is required'],
    enum: ['user', 'pet']
  },
  ownerId: {
    type: String,
    required: [true, 'Owner ID is required'],
    ref: 'User'
  },
  petId: {
    type: String,
    ref: 'Pet',
    validate: {
      validator: function(petId: string) {
        // Only validate if this is a pet wallet
        if (this.type === 'pet') {
          return petId && petId.length > 0;
        }
        return true;
      },
      message: 'Pet ID is required for pet wallets'
    }
  },
  basename: {
    type: String,
    trim: true,
    validate: {
      validator: function(basename: string) {
        if (!basename) return true; // Optional field
        // Validate basename format for Base networks
        return /\.(base|basetest)\.eth$/.test(basename);
      },
      message: 'Invalid basename format. Must end with .base.eth or .basetest.eth'
    }
  },
  walletData: {
    type: String,
    required: false,
    // Store exported wallet data as JSON string for wallet import
    // This allows us to reconstruct the wallet without relying on Wallet.fetch()
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better performance
// Note: walletId and address already have indexes due to unique: true
WalletSchema.index({ ownerId: 1 });
WalletSchema.index({ petId: 1 });
WalletSchema.index({ type: 1, ownerId: 1 });
WalletSchema.index({ createdAt: -1 });

// Ensure pet wallets have petId
WalletSchema.pre('validate', function(next) {
  if (this.type === 'pet' && !this.petId) {
    next(new Error('Pet ID is required for pet wallets'));
  } else {
    next();
  }
});

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);