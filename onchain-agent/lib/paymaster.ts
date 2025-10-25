// Paymaster configuration for gas-free USDC transactions
import { createPublicClient, createWalletClient, http, parseAbi, WalletClient, encodeFunctionData } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// IMPORTANT: This application is configured to use Base Sepolia (Chain ID: 84532) ONLY
// Mainnet functionality is disabled for safety

// Paymaster & Bundler endpoint provided by Coinbase - Base Sepolia Testnet
// Endpoint URL confirms this is Base Sepolia (contains /base-sepolia/ in path)
export const PAYMASTER_ENDPOINT = process.env.PAYMASTER_ENDPOINT || 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/hPe1vPn9H3lkH0Cr8YT4WDgQEsuW17Hy';
export const BUNDLER_ENDPOINT = process.env.BUNDLER_ENDPOINT || 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/hPe1vPn9H3lkH0Cr8YT4WDgQEsuW17Hy';

// EntryPoint contract address (ERC-4337 standard)
export const ENTRYPOINT_ADDRESS = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';

// USDC contract addresses on Base networks
export const USDC_ADDRESSES = {
  'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Default for all operations
} as const;

// Chain ID validation constants
// Default Chain: Base Sepolia Testnet (84532)
export const CHAIN_IDS = {
  'base-mainnet': 8453,
  'base-sepolia': 84532 // ✅ DEFAULT - All operations use this chain
} as const;

// Default network for the entire application
export const DEFAULT_NETWORK = 'base-sepolia';
export const DEFAULT_CHAIN_ID = 84532;

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
  // FORCE Base Sepolia for all environments - mainnet is blocked
  if (network === 'base-mainnet') {
    console.error('🚨 MAINNET BLOCKED - This application only supports Base Sepolia testnet');
    throw new Error('Mainnet is not supported. All operations must use base-sepolia (Chain ID: 84532)');
  }
  
  console.log('✅ Using Base Sepolia testnet (Chain ID: 84532) for all operations');
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

// UserOperation interface for ERC-4337
export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

// Paymaster stub data response
export interface PaymasterStubDataResponse {
  paymasterAndData: string;
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
}

/**
 * Get paymaster stub data for gas-free transactions
 * This implements the Coinbase Paymaster API for ERC-4337 UserOperations
 * 
 * @param userOp - The UserOperation object
 * @param entryPoint - EntryPoint contract address (default: 0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789)
 * @param chainId - Chain ID in hex format (default: 0x14a34 for Base Sepolia 84532)
 * @param context - Additional context (optional)
 * @returns PaymasterStubDataResponse with gas sponsorship data
 */
export async function getPaymasterStubData(
  userOp: UserOperation,
  entryPoint: string = ENTRYPOINT_ADDRESS,
  chainId: string = '0x14a34', // Base Sepolia chain ID (84532 in hex)
  context: Record<string, any> = {}
): Promise<PaymasterStubDataResponse> {
  try {
    console.log('🎯 Requesting paymaster stub data...');
    console.log('UserOp sender:', userOp.sender);
    console.log('EntryPoint:', entryPoint);
    console.log('Chain ID:', chainId);

    const response = await fetch(PAYMASTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'pm_getPaymasterStubData',
        params: [
          userOp,
          entryPoint,
          chainId,
          context
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Paymaster request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Paymaster error:', data.error);
      throw new Error(`Paymaster error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    console.log('✅ Paymaster stub data received');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('Paymaster data:', data.result.paymasterAndData);
    console.log('Verification gas limit:', data.result.verificationGasLimit);
    console.log('Call gas limit:', data.result.callGasLimit);
    console.log('Pre-verification gas:', data.result.preVerificationGas);
    
    return data.result as PaymasterStubDataResponse;

  } catch (error) {
    console.error('Failed to get paymaster stub data:', error);
    throw error;
  }
}

/**
 * Create a UserOperation for USDC transfer with gas sponsorship
 * 
 * @param sender - Smart wallet address sending USDC
 * @param recipient - Address receiving USDC
 * @param amount - Amount in USDC wei (6 decimals)
 * @param nonce - Wallet nonce
 * @returns UserOperation ready for paymaster processing
 */
export async function createUSDCTransferUserOp(
  sender: string,
  recipient: string,
  amount: bigint,
  nonce: string = '0x0'
): Promise<UserOperation> {
  // Encode USDC transfer call data
  const transferData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [recipient as `0x${string}`, amount],
  });

  // Create the UserOperation
  const userOp: UserOperation = {
    sender,
    nonce,
    initCode: '0x', // No init code for existing wallets
    callData: transferData,
    callGasLimit: '0x0', // Will be filled by paymaster
    verificationGasLimit: '0x0', // Will be filled by paymaster
    preVerificationGas: '0x0', // Will be filled by paymaster
    maxFeePerGas: '0x0', // Gas-free transaction
    maxPriorityFeePerGas: '0x0', // Gas-free transaction
    paymasterAndData: '0x', // Will be filled by paymaster
    signature: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000041fffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c00000000000000000000000000000000000000000000000000000000000000' // Placeholder signature
  };

  console.log('📝 Created UserOperation for USDC transfer');
  console.log('Sender:', sender);
  console.log('Recipient:', recipient);
  console.log('Amount:', amount.toString());

  return userOp;
}

/**
 * Execute gas-free USDC transfer using Coinbase Paymaster
 * 
 * @param sender - Smart wallet address sending USDC
 * @param recipient - Address receiving USDC  
 * @param amount - Amount in USDC wei (6 decimals)
 * @param network - Network to use (default: base-sepolia)
 * @returns Transaction hash
 */
export async function executeGasFreeUSDCTransferWithPaymaster(
  sender: string,
  recipient: string,
  amount: bigint,
  network: 'base-mainnet' | 'base-sepolia' = 'base-sepolia'
): Promise<string> {
  try {
    validateNetwork(network);
    
    console.log('🚀 Starting gas-free USDC transfer with paymaster...');
    
    // Step 1: Create UserOperation
    const userOp = await createUSDCTransferUserOp(sender, recipient, amount);
    
    // Step 2: Get paymaster stub data (gas sponsorship)
    const paymasterData = await getPaymasterStubData(userOp);
    
    // Step 3: Update UserOperation with paymaster data
    userOp.paymasterAndData = paymasterData.paymasterAndData;
    userOp.preVerificationGas = paymasterData.preVerificationGas;
    userOp.verificationGasLimit = paymasterData.verificationGasLimit;
    userOp.callGasLimit = paymasterData.callGasLimit;
    
    console.log('✅ UserOperation prepared with paymaster sponsorship');
    console.log('Paymaster data:', paymasterData.paymasterAndData.slice(0, 20) + '...');
    
    // Step 4: Send UserOperation to bundler
    const response = await fetch(BUNDLER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendUserOperation',
        params: [userOp, ENTRYPOINT_ADDRESS]
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Bundler error: ${result.error.message || JSON.stringify(result.error)}`);
    }
    
    const userOpHash = result.result;
    console.log('🎉 Gas-free transaction submitted!');
    console.log('UserOperation hash:', userOpHash);
    
    return userOpHash;
    
  } catch (error) {
    console.error('Gas-free USDC transfer failed:', error);
    throw error;
  }
}
