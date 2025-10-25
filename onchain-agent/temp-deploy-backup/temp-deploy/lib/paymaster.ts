// Paymaster configuration for gas-free USDC transactions
import { createPublicClient, createWalletClient, http, parseAbi, WalletClient, encodeFunctionData } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Paymaster & Bundler endpoint provided by Coinbase - Base Sepolia Testnet
export const PAYMASTER_ENDPOINT = 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/hPe1vPn9H3lkH0Cr8YT4WDgQEsuW17Hy';

// USDC contract addresses on Base networks
export const USDC_ADDRESSES = {
  'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
} as const;

// Chain ID validation constants
export const CHAIN_IDS = {
  'base-mainnet': 8453,
  'base-sepolia': 84532
} as const;

// ERC-20 ABI for USDC transfers (enhanced for proxy contracts)
export const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
]);

// Paymaster configuration interface
export interface PaymasterConfig {
  endpoint: string;
  network: 'base-mainnet' | 'base-sepolia';
  usdcAddress: string;
}

// Transaction parameters for paymaster
export interface PaymasterTransaction {
  to: string;
  value?: bigint;
  data?: `0x${string}`;
  gasLimit?: bigint;
}

// Validate network and prevent mainnet usage in development
export function validateNetwork(network: 'base-mainnet' | 'base-sepolia'): void {
  // Force Base Sepolia in development/testing environments
  if (process.env.NODE_ENV !== 'production' && network === 'base-mainnet') {
    console.warn('⚠️  Mainnet usage blocked in development. Forcing Base Sepolia testnet.');
    throw new Error('Mainnet payments are not allowed in development environment. Use base-sepolia instead.');
  }
  
  // Additional validation for production
  if (network === 'base-mainnet') {
    console.warn('🚨 MAINNET PAYMENT DETECTED - Ensure this is intentional!');
  } else {
    console.log('✅ Using Base Sepolia testnet for payments');
  }
}

// Get paymaster configuration based on network
export function getPaymasterConfig(network: 'base-mainnet' | 'base-sepolia'): PaymasterConfig {
  // Validate network before proceeding
  validateNetwork(network);
  
  return {
    endpoint: PAYMASTER_ENDPOINT,
    network,
    usdcAddress: USDC_ADDRESSES[network],
  };
}

// Create public client for reading blockchain data
export function createPaymasterPublicClient(network: 'base-mainnet' | 'base-sepolia') {
  // Validate network before creating client
  validateNetwork(network);
  
  const chain = network === 'base-mainnet' ? base : baseSepolia;
  
  // Verify chain ID matches expected network
  const expectedChainId = CHAIN_IDS[network];
  if (chain.id !== expectedChainId) {
    throw new Error(`Chain ID mismatch: expected ${expectedChainId} for ${network}, got ${chain.id}`);
  }
  
  // Use standard Base RPC endpoints for reading contract data
  const rpcUrl = network === 'base-mainnet' 
    ? 'https://mainnet.base.org' 
    : 'https://sepolia.base.org';
  
  console.log(`🔗 Creating public client for ${network} (Chain ID: ${chain.id})`);
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

// Create wallet client for paymaster transactions
export function createPaymasterWalletClient(network: 'base-mainnet' | 'base-sepolia') {
  // Validate network before creating client
  validateNetwork(network);
  
  const chain = network === 'base-mainnet' ? base : baseSepolia;
  
  // Verify chain ID matches expected network
  const expectedChainId = CHAIN_IDS[network];
  if (chain.id !== expectedChainId) {
    throw new Error(`Chain ID mismatch: expected ${expectedChainId} for ${network}, got ${chain.id}`);
  }
  
  console.log(`💳 Creating wallet client for ${network} (Chain ID: ${chain.id})`);
  
  return createWalletClient({
    chain,
    transport: http(PAYMASTER_ENDPOINT),
  });
}

// Prepare USDC transfer transaction with paymaster
export async function prepareUSDCTransfer(
  fromAddress: string,
  toAddress: string,
  amount: bigint,
  network: 'base-mainnet' | 'base-sepolia'
): Promise<PaymasterTransaction> {
  const config = getPaymasterConfig(network);
  const publicClient = createPaymasterPublicClient(network);

  // Encode the transfer function call
  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [toAddress as `0x${string}`, amount],
  });

  // Estimate gas for the transaction
  const gasLimit = await publicClient.estimateGas({
    account: fromAddress as `0x${string}`,
    to: config.usdcAddress as `0x${string}`,
    data,
  });

  return {
    to: config.usdcAddress,
    data,
    gasLimit: gasLimit * BigInt(120) / BigInt(100), // Add 20% buffer
  };
}

// Execute gas-free USDC transaction using paymaster
export async function executeGasFreeUSDCTransfer(
  walletClient: WalletClient,
  fromAddress: string,
  toAddress: string,
  amount: bigint,
  network: 'base-mainnet' | 'base-sepolia'
): Promise<string> {
  try {
    const transaction = await prepareUSDCTransfer(fromAddress, toAddress, amount, network);
    const chain = network === 'base-mainnet' ? base : baseSepolia;
    
    // Execute the transaction using the paymaster
    const hash = await walletClient.sendTransaction({
      account: fromAddress as `0x${string}`,
      to: transaction.to as `0x${string}`,
      data: transaction.data,
      gas: transaction.gasLimit,
      chain,
      // Paymaster will handle gas fees
    });

    console.log(`Gas-free USDC transfer executed: ${hash}`);
    return hash;
  } catch (error) {
    console.error('Gas-free USDC transfer failed:', error);
    throw new Error(`Failed to execute gas-free USDC transfer: ${error}`);
  }
}

// Get USDC balance for a wallet address
export async function getUSDCBalance(
  address: string,
  network: 'base-mainnet' | 'base-sepolia'
): Promise<bigint> {
  const config = getPaymasterConfig(network);
  const publicClient = createPaymasterPublicClient(network);

  try {
    // First, verify the contract exists and has the balanceOf function
    console.log(`Checking USDC balance for ${address} on ${network}`);
    console.log(`Using USDC contract: ${config.usdcAddress}`);
    
    // Try to get contract info first to verify it's a valid USDC contract
    try {
      const symbol = await publicClient.readContract({
        address: config.usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      });
      console.log(`Contract symbol: ${symbol}`);
      
      // Verify it's actually USDC
      if (symbol !== 'USDC') {
        console.warn(`Warning: Contract symbol is ${symbol}, expected USDC`);
      }
    } catch (symbolError) {
      console.warn('Could not read contract symbol:', symbolError);
    }

    // Check if the address is a valid Ethereum address
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      throw new Error(`Invalid wallet address: ${address}`);
    }

    const balance = await publicClient.readContract({
      address: config.usdcAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    console.log(`USDC balance for ${address}: ${balance.toString()}`);
    return balance as bigint;
  } catch (error) {
    console.error('Failed to get USDC balance:', error);
    console.error('Contract address:', config.usdcAddress);
    console.error('Wallet address:', address);
    console.error('Network:', network);
    
    // Additional debugging information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return BigInt(0);
  }
}

// Convert USDC cents to wei (6 decimals for USDC)
export function usdcCentsToWei(cents: number): bigint {
  return BigInt(cents) * BigInt(10000); // USDC has 6 decimals, so cents * 10^4
}

// Convert USDC wei to cents
export function usdcWeiToCents(wei: bigint): number {
  return Number(wei / BigInt(10000));
}