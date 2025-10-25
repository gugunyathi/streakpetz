import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: number }>();

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS verification code
 */
export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate phone number format
    if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store code with 5-minute expiration
    verificationCodes.set(phoneNumber, {
      code,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: `Your StreakPets verification code is: ${code}. This code expires in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`SMS sent successfully to ${phoneNumber}, SID: ${message.sid}`);
    return { success: true };

  } catch (error) {
    console.error('SMS sending failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    };
  }
}

/**
 * Verify the SMS code
 */
export function verifyCode(phoneNumber: string, code: string): boolean {
  const stored = verificationCodes.get(phoneNumber);
  
  if (!stored) {
    return false;
  }

  // Check if code has expired
  if (Date.now() > stored.expires) {
    verificationCodes.delete(phoneNumber);
    return false;
  }

  // Check if code matches
  if (stored.code === code) {
    verificationCodes.delete(phoneNumber); // Remove used code
    return true;
  }

  return false;
}

/**
 * Clean up expired codes (call this periodically)
 */
export function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [phone, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(phone);
    }
  }
}