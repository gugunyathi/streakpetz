import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryItem {
  storeItemId: string;
  quantity: number;
  purchaseDate: Date;
  purchasePrice: number;
  used: boolean;
  transactionHash?: string;
}

export interface IUserInventory extends Document {
  userId: string; // wallet address
  petId: string;
  items: IInventoryItem[];
  totalValue: number; // Total value in USDC cents
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema({
  storeItemId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  used: {
    type: Boolean,
    default: false
  },
  transactionHash: {
    type: String,
    trim: true
  }
}, { _id: false });

const UserInventorySchema = new Schema<IUserInventory>({
  userId: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  petId: {
    type: String,
    required: true,
    ref: 'Pet',
    index: true
  },
  items: {
    type: [InventoryItemSchema],
    default: []
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
UserInventorySchema.index({ userId: 1, petId: 1 }, { unique: true });
UserInventorySchema.index({ 'items.storeItemId': 1 });
UserInventorySchema.index({ lastUpdated: -1 });

// Method to add item to inventory
UserInventorySchema.methods.addItem = function(
  storeItemId: string,
  quantity: number,
  price: number,
  transactionHash?: string
) {
  const existingItem = this.items.find((item: IInventoryItem) => item.storeItemId === storeItemId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      storeItemId,
      quantity,
      purchaseDate: new Date(),
      purchasePrice: price,
      used: false,
      transactionHash
    });
  }
  
  this.totalValue += price * quantity;
  this.lastUpdated = new Date();
  
  return this;
};

// Method to use/consume item
UserInventorySchema.methods.useItem = function(storeItemId: string, quantity: number = 1) {
  const item = this.items.find((item: IInventoryItem) => item.storeItemId === storeItemId);
  
  if (!item) {
    throw new Error('Item not found in inventory');
  }
  
  if (item.quantity < quantity) {
    throw new Error('Insufficient quantity');
  }
  
  item.quantity -= quantity;
  item.used = true;
  this.lastUpdated = new Date();
  
  return this;
};

// Method to check if user has item
UserInventorySchema.methods.hasItem = function(storeItemId: string, quantity: number = 1): boolean {
  const item = this.items.find((item: IInventoryItem) => item.storeItemId === storeItemId);
  return item ? item.quantity >= quantity : false;
};

// Method to get item count
UserInventorySchema.methods.getItemCount = function(storeItemId: string): number {
  const item = this.items.find((item: IInventoryItem) => item.storeItemId === storeItemId);
  return item ? item.quantity : 0;
};

export default mongoose.models.UserInventory || mongoose.model<IUserInventory>('UserInventory', UserInventorySchema);
