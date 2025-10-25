import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  _id: string;
  userId: string; // Reference to User ID
  petId: string; // Reference to Pet ID
  sender: 'user' | 'pet' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    mood?: string;
    xpGained?: number;
    actionTriggered?: string;
    petStage?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true
  },
  petId: {
    type: String,
    required: [true, 'Pet ID is required'],
    ref: 'Pet',
    index: true
  },
  sender: {
    type: String,
    required: [true, 'Sender is required'],
    enum: ['user', 'pet', 'system']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    mood: String,
    xpGained: Number,
    actionTriggered: String,
    petStage: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient queries
ChatMessageSchema.index({ userId: 1, petId: 1, timestamp: -1 });
ChatMessageSchema.index({ userId: 1, timestamp: -1 });
ChatMessageSchema.index({ petId: 1, timestamp: -1 });
ChatMessageSchema.index({ createdAt: -1 });

// Method to mark message as read
ChatMessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
