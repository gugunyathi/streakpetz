import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email?: string;
  phone?: string;
  password: string;
  name: string;
  walletId?: string;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        if (!email) return true; // Allow empty email if phone is provided
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  phone: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    validate: {
      validator: function(phone: string) {
        if (!phone) return true; // Allow empty phone if email is provided
        return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
      },
      message: 'Invalid phone number format'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  walletId: {
    type: String,
    sparse: true
  },
  walletAddress: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: unknown, ret: Record<string, unknown>) {
      delete ret.password;
      return ret;
    }
  }
});

// Ensure either email or phone is provided
UserSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone number is required'));
  } else {
    next();
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes for better performance
// Note: email, phone, and walletAddress already have indexes due to unique: true
UserSchema.index({ createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);