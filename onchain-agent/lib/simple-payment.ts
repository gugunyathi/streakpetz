// Simplified payment system using CDP SDK and viem
import { http, createPublicClient, parseUnits, encodeFunctionData } from 'viem';
import { baseSepolia } from 'viem/chains';

// USDC contract address on Base Sepolia
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

// Store recipient address - all pet store payments go here
export const STORE_WALLET = '0xF52aA3d9523990320451df68dCC6317e77704d67' as const;

// ERC-20 transfer ABI
const TRANSFER_ABI = [{
  constant: false,
  inputs: [
    { name: '_to', type: 'address' },
    { name: '_value', type: 'uint256' }
  ],
  name: 'transfer',
  outputs: [{ name: '', type: 'bool' }],
  type: 'function'
}] as const;

// Create public client for transaction monitoring
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * Convert USDC amount from cents to wei (6 decimals)
 * @param cents - Amount in cents (e.g., 250 = $2.50)
 * @returns Amount in USDC wei
 */
export function centsToUSDCWei(cents: number): bigint {
  // USDC has 6 decimals, so $1.00 = 1000000 wei
  // cents / 100 = dollars, dollars * 1000000 = wei
  const dollars = cents / 100;
  return parseUnits(dollars.toString(), 6);
}

/**
 * Encode USDC transfer data for transaction
 * @param toAddress - Recipient address
 * @param amountInCents - Amount in cents
 * @returns Encoded transaction data
 */
export function encodeUSDCTransfer(toAddress: string, amountInCents: number): `0x${string}` {
  const amountInWei = centsToUSDCWei(amountInCents);
  
  return encodeFunctionData({
    abi: TRANSFER_ABI,
    functionName: 'transfer',
    args: [toAddress as `0x${string}`, amountInWei]
  });
}

/**
 * Execute a USDC payment using CDP SDK with paymaster (gas-free)
 * This calls the server-side API that has access to wallet signing
 */
export async function executeUSDCPayment(
  fromAddress: string,
  amountInCents: number,
  recipientAddress: string = STORE_WALLET
): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
}> {
  try {
    console.log(`💳 Initiating USDC payment:`);
    console.log(`   From: ${fromAddress}`);
    console.log(`   To: ${recipientAddress}`);
    console.log(`   Amount: $${(amountInCents / 100).toFixed(2)} (${amountInCents} cents)`);

    // Call server-side API that will use CDP SDK to send transaction
    const response = await fetch('/api/wallet/simple-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromAddress,
        toAddress: recipientAddress,
        amountInCents,
        network: 'base-sepolia'
      })
    });

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Payment failed:', result.error);
      return {
        success: false,
        error: result.error || 'Payment failed'
      };
    }

    console.log('✅ Payment successful!');
    console.log(`   Transaction hash: ${result.transactionHash}`);

    return {
      success: true,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('❌ Payment execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed'
    };
  }
}

/**
 * Wait for transaction confirmation
 * @param transactionHash - Transaction hash to monitor
 * @returns Transaction receipt
 */
export async function waitForTransactionConfirmation(transactionHash: `0x${string}`) {
  console.log(`⏳ Waiting for transaction confirmation: ${transactionHash}`);
  
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
    confirmations: 1
  });
  
  console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
  return receipt;
}

/**
 * Get USDC balance for an address
 * @param address - Wallet address
 * @returns Balance in cents
 */
export async function getUSDCBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`/api/wallet/balance?address=${address}&network=base-sepolia`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get balance');
    }
    
    return result.balanceInCents;
  } catch (error) {
    console.error('Failed to get USDC balance:', error);
    throw error;
  }
}
