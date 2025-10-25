/**
 * Pet Wallet Automatic Operations
 * Handles automatic signing and transactions for pet wallets
 */

export interface AutoBasenameRegistrationRequest {
  petId: string;
  baseName: string;
  network?: 'base-sepolia' | 'base-mainnet';
}

export interface AutoBasenameRegistrationResult {
  success: boolean;
  baseName?: string;
  petId?: string;
  walletId?: string;
  address?: string;
  transactionHash?: string;
  transactionLink?: string;
  network?: string;
  automatic?: boolean;
  pending?: boolean;
  message?: string;
  error?: string;
}

/**
 * Automatically register a basename for a pet wallet without manual signing
 * This function bypasses the UI modal and directly calls the API
 */
export async function autoRegisterPetBasename(
  request: AutoBasenameRegistrationRequest
): Promise<AutoBasenameRegistrationResult> {
  try {
    console.log('Auto-registering basename for pet:', request.petId, 'basename:', request.baseName);
    
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'autoPetBasenameRegistration',
        petId: request.petId,
        baseName: request.baseName,
        network: request.network || 'base-sepolia'
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to auto-register pet basename'
      };
    }

    console.log('Pet basename auto-registration result:', data);
    return data;
    
  } catch (error) {
    console.error('Pet basename auto-registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-register pet basename'
    };
  }
}

/**
 * Generate a unique basename for a pet based on its name and ID
 */
export function generatePetBasename(petName: string, petId: string, network: 'base-sepolia' | 'base-mainnet' = 'base-sepolia'): string {
  // Clean pet name: lowercase, remove spaces and special chars, limit length
  const cleanName = petName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);
  
  // Use last 6 characters of pet ID for uniqueness
  const uniqueId = petId.slice(-6);
  
  // Combine name and unique ID
  const basename = `${cleanName}${uniqueId}`;
  
  // Add appropriate suffix
  const suffix = network === 'base-mainnet' ? '.base.eth' : '.basetest.eth';
  
  return `${basename}${suffix}`;
}

/**
 * Check if a pet already has a basename registered
 */
export async function checkPetBasename(petId: string): Promise<{ hasBasename: boolean; basename?: string; error?: string }> {
  try {
    const response = await fetch('/api/wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getWallet',
        petId
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        hasBasename: false,
        error: data.error || 'Failed to check pet basename'
      };
    }

    return {
      hasBasename: !!data.wallet?.basename,
      basename: data.wallet?.basename
    };
    
  } catch (error) {
    console.error('Error checking pet basename:', error);
    return {
      hasBasename: false,
      error: error instanceof Error ? error.message : 'Failed to check pet basename'
    };
  }
}

/**
 * Auto-register basename for pet if it doesn't have one
 * This is the main function to call for automatic pet basename registration
 */
export async function ensurePetBasename(
  petId: string, 
  petName: string, 
  network: 'base-sepolia' | 'base-mainnet' = 'base-sepolia'
): Promise<AutoBasenameRegistrationResult> {
  try {
    // First check if pet already has a basename
    const basenameCheck = await checkPetBasename(petId);
    
    if (basenameCheck.error) {
      return {
        success: false,
        error: basenameCheck.error
      };
    }
    
    if (basenameCheck.hasBasename) {
      return {
        success: true,
        baseName: basenameCheck.basename,
        petId,
        message: 'Pet already has a basename registered',
        automatic: true
      };
    }
    
    // Generate a unique basename for the pet
    const basename = generatePetBasename(petName, petId, network);
    
    // Auto-register the basename
    return await autoRegisterPetBasename({
      petId,
      baseName: basename,
      network
    });
    
  } catch (error) {
    console.error('Error ensuring pet basename:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ensure pet basename'
    };
  }
}