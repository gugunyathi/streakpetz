// Client-side wallet utilities that call server-side API
import { retryOperation } from './error-handler';
import { 
  executeGasFreeUSDCTransfer, 
  getUSDCBalance, 
  usdcCentsToWei,
  createPaymasterWalletClient 
} from './paymaster';

export interface WalletInfo {
  id: string;
  address: string;
  network: string;
}

// Create user wallet via API
export async function createUserWallet(): Promise<WalletInfo> {
  return retryOperation(async () => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'createUserWallet' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user wallet');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Wallet creation failed');
      }

      return data.wallet;
    } catch (error) {
      console.error('User wallet creation failed:', error);
      throw error;
    }
  }, 3, 1000);
}

// Create pet wallet via API
export async function createPetWallet(petId: string): Promise<WalletInfo> {
  return retryOperation(async () => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'createPetWallet', petId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create pet wallet');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Pet wallet creation failed');
      }

      return data.wallet;
    } catch (error) {
      console.error('Pet wallet creation failed:', error);
      throw error;
    }
  }, 3, 1000);
}

// Get wallet by ID via API
export async function getWalletById(walletId: string): Promise<WalletInfo> {
  try {
    const response = await fetch(`/api/wallet?walletId=${walletId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to retrieve wallet');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Wallet retrieval failed');
    }

    return data.wallet;
  } catch (error) {
    console.error('Wallet retrieval failed:', error);
    throw error;
  }
}

// Get wallet address (simplified for client-side use)
export async function getWalletAddress(walletId: string): Promise<string> {
  try {
    const wallet = await getWalletById(walletId);
    return wallet.address;
  } catch (error) {
    console.error('Failed to get wallet address:', error);
    throw error;
  }
}

// Mock transaction function for demo purposes
export async function sendTransaction(
  fromWallet: string,
  toAddress: string,
  amount: number,
  asset: string = 'ETH'
): Promise<{ hash: string; status: string }> {
  try {
    // In a real implementation, this would call the blockchain
    console.log(`Mock transaction: ${amount} ${asset} from ${fromWallet} to ${toAddress}`);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: 'confirmed'
    };
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// Mock smart contract deployment for demo
export async function deployPetContract(walletId: string): Promise<{ address: string; hash: string }> {
  try {
    console.log(`Mock contract deployment for wallet: ${walletId}`);
    
    // Simulate deployment delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`
    };
  } catch (error) {
    console.error('Contract deployment failed:', error);
    throw error;
  }
}

// Update pet state on blockchain (mock implementation)
export async function updatePetStateOnChain(
  petWalletId: string,
  petState: PetState
): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    console.log(`Mock pet state update for wallet: ${petWalletId}`, petState);
    
    // Simulate blockchain interaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
    };
  } catch (error) {
    console.error('Pet state update failed:', error);
    return { success: false };
  }
}

// Get ethers signer for XMTP (mock implementation)
export async function getEthersSigner(): Promise<MockEthersSigner> {
  try {
    // In a real implementation, this would return an actual ethers signer
    // For now, return a mock signer object
    return {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      signMessage: async (message: string) => {
        console.log(`Mock signing message: ${message}`);
        return `0x${Math.random().toString(16).substr(2, 130)}`;
      },
      getAddress: async () => `0x${Math.random().toString(16).substr(2, 40)}`
    };
  } catch (error) {
    console.error('Failed to get ethers signer:', error);
    throw error;
  }
}

// Define proper types for pet state and ethers signer
interface PetState {
  happiness: number;
  energy: number;
  hunger: number;
  lastFed: Date;
  lastPlayed: Date;
  [key: string]: unknown;
}

interface MockEthersSigner {
  address: string;
  signMessage: (message: string) => Promise<string>;
  getAddress: () => Promise<string>;
}

// Gas-free USDC payment using paymaster
export async function executeGasFreePayment(
  fromWalletAddress: string,
  toWalletAddress: string,
  amountInCents: number,
  network: 'base-mainnet' | 'base-sepolia' = 'base-sepolia'
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    console.log(`Executing gas-free USDC payment: ${amountInCents} cents from ${fromWalletAddress} to ${toWalletAddress}`);
    
    // Convert cents to USDC wei (6 decimals)
    const amountInWei = usdcCentsToWei(amountInCents);
    
    // Create paymaster wallet client
    const walletClient = createPaymasterWalletClient(network);
    
    // Execute the gas-free transfer
    const transactionHash = await executeGasFreeUSDCTransfer(
      walletClient,
      fromWalletAddress,
      toWalletAddress,
      amountInWei,
      network
    );
    
    return {
      success: true,
      transactionHash
    };
  } catch (error) {
    console.error('Gas-free payment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get USDC balance for a wallet
export async function getWalletUSDCBalance(
  walletAddress: string,
  network: 'base-mainnet' | 'base-sepolia' = 'base-sepolia'
): Promise<{ balance: number; error?: string }> {
  try {
    const balanceInWei = await getUSDCBalance(walletAddress, network);
    const balanceInCents = Number(balanceInWei / BigInt(10000)); // Convert from 6 decimals to cents
    
    return { balance: balanceInCents };
  } catch (error) {
    console.error('Failed to get USDC balance:', error);
    return {
      balance: 0,
      error: error instanceof Error ? error.message : 'Failed to get balance'
    };
  }
}

interface MockEthersSigner {
  address: string;
  signMessage: (message: string) => Promise<string>;
  getAddress: () => Promise<string>;
}