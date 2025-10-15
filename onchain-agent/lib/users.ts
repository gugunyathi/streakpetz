// Simple in-memory user storage (in production, use a proper database)
export interface User {
  id: string;
  email?: string;
  phone?: string;
  password: string;
  name: string;
  createdAt: Date;
}

// In-memory user storage
const users = new Map<string, User>();

/**
 * Hash password (simple implementation - in production use bcrypt)
 */
function hashPassword(password: string): string {
  // Simple hash for demo - in production use bcrypt
  return Buffer.from(password).toString('base64');
}

/**
 * Verify password
 */
function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

/**
 * Create a new user with email/password
 */
export function createUserWithEmail(email: string, password: string, name: string): { success: boolean; user?: User; error?: string } {
  // Check if user already exists
  for (const user of users.values()) {
    if (user.email === email) {
      return { success: false, error: 'User with this email already exists' };
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  // Validate password strength
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long' };
  }

  const user: User = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    password: hashPassword(password),
    name,
    createdAt: new Date(),
  };

  users.set(user.id, user);
  return { success: true, user };
}

/**
 * Create a new user with phone/password
 */
export function createUserWithPhone(phone: string, password: string, name: string): { success: boolean; user?: User; error?: string } {
  // Check if user already exists
  for (const user of users.values()) {
    if (user.phone === phone) {
      return { success: false, error: 'User with this phone number already exists' };
    }
  }

  // Validate phone format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Validate password strength
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long' };
  }

  const user: User = {
    id: `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    phone,
    password: hashPassword(password),
    name,
    createdAt: new Date(),
  };

  users.set(user.id, user);
  return { success: true, user };
}

/**
 * Authenticate user with email/password
 */
export function authenticateWithEmail(email: string, password: string): { success: boolean; user?: User; error?: string } {
  for (const user of users.values()) {
    if (user.email === email) {
      if (verifyPassword(password, user.password)) {
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid password' };
      }
    }
  }
  return { success: false, error: 'User not found' };
}

/**
 * Authenticate user with phone/password
 */
export function authenticateWithPhone(phone: string, password: string): { success: boolean; user?: User; error?: string } {
  for (const user of users.values()) {
    if (user.phone === phone) {
      if (verifyPassword(password, user.password)) {
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid password' };
      }
    }
  }
  return { success: false, error: 'User not found' };
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  return users.get(id) || null;
}