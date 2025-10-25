import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITransaction extends Document {
  _id: string;
  transactionHash: string; // Blockchain transaction hash
  from: string; // Sender wallet address
  to: string; // Recipient wallet address
  amount: string; // Amount in wei or smallest unit
  token: string; // Token symbol (USDC, ETH, etc)
  network: string; // Network (base-sepolia, base-mainnet)
  type: 'purchase' | 'transfer' | 'evolution' | 'gift' | 'basename' | 'other';
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasFee?: string;
  timestamp: Date;
  userId: string; // Reference to User ID
  petId?: string; // Reference to Pet ID (if applicable)
  metadata?: {
    itemId?: string;
    itemName?: string;
    quantity?: number;
    basename?: string;
    evolutionStage?: string;
    description?: string;
  };
  error?: string; // Error message if failed
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  confirm(blockNumber?: number, gasUsed?: string, gasFee?: string): Promise<ITransaction>;
  fail(error: string): Promise<ITransaction>;
}

// Define static methods interface
interface ITransactionModel extends Model<ITransaction> {
  getUserSummary(userId: string): Promise<any[]>;
}

const TransactionSchema = new Schema<ITransaction>({
  transactionHash: {
    type: String,
    required: [true, 'Transaction hash is required'],
    unique: true,
    trim: true,
    index: true
  },
  from: {
    type: String,
    required: [true, 'From address is required'],
    trim: true,
    lowercase: true,
    index: true
  },
  to: {
    type: String,
    required: [true, 'To address is required'],
    trim: true,
    lowercase: true,
    index: true
  },
  amount: {
    type: String,
    required: [true, 'Amount is required']
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    default: 'USDC',
    uppercase: true
  },
  network: {
    type: String,
    required: [true, 'Network is required'],
    enum: ['base-sepolia', 'base-mainnet', 'ethereum', 'polygon'],
    default: 'base-sepolia'
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['purchase', 'transfer', 'evolution', 'gift', 'basename', 'other'],
    index: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  gasUsed: String,
  gasFee: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true
  },
  petId: {
    type: String,
    ref: 'Pet',
    index: true
  },
  metadata: {
    itemId: String,
    itemName: String,
    quantity: Number,
    basename: String,
    evolutionStage: String,
    description: String
  },
  error: String
}, {
  timestamps: true
});

// Create compound indexes for efficient queries
TransactionSchema.index({ userId: 1, timestamp: -1 });
TransactionSchema.index({ userId: 1, type: 1, timestamp: -1 });
TransactionSchema.index({ from: 1, timestamp: -1 });
TransactionSchema.index({ to: 1, timestamp: -1 });
TransactionSchema.index({ status: 1, timestamp: -1 });
TransactionSchema.index({ network: 1, status: 1 });
TransactionSchema.index({ createdAt: -1 });

// Method to confirm transaction
TransactionSchema.methods.confirm = function(blockNumber?: number, gasUsed?: string, gasFee?: string) {
  this.status = 'confirmed';
  if (blockNumber) this.blockNumber = blockNumber;
  if (gasUsed) this.gasUsed = gasUsed;
  if (gasFee) this.gasFee = gasFee;
  return this.save();
};

// Method to mark transaction as failed
TransactionSchema.methods.fail = function(error: string) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

// Static method to get user transaction summary
TransactionSchema.statics.getUserSummary = async function(userId: string) {
  const summary = await this.aggregate([
    { $match: { userId, status: 'confirmed' } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: { $toDouble: '$amount' } }
      }
    }
  ]);
  
  return summary;
};

const Transaction = (mongoose.models.Transaction || 
  mongoose.model<ITransaction, ITransactionModel>('Transaction', TransactionSchema)) as unknown as ITransactionModel;

export default Transaction;
