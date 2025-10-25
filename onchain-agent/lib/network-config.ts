/**
 * Network Configuration
 * 
 * ⚠️  IMPORTANT: This application is LOCKED to Base Sepolia Testnet (Chain ID: 84532)
 * 
 * All wallet operations, payments, transactions, basename registrations, and 
 * blockchain interactions MUST use Base Sepolia testnet.
 * 
 * Mainnet functionality is intentionally disabled for safety.
 */

// Network identifiers
export const NETWORK_CONFIG = {
  // Default network for ALL operations
  DEFAULT_NETWORK: 'base-sepolia' as const,
  DEFAULT_CHAIN_ID: 84532,
  
  // Supported networks (though only base-sepolia is used)
  NETWORKS: {
    'base-sepolia': {
      name: 'Base Sepolia',
      chainId: 84532,
      rpcUrl: 'https://sepolia.base.org',
      blockExplorer: 'https://sepolia.basescan.org',
      isTestnet: true,
    },
    'base-mainnet': {
      name: 'Base Mainnet',
      chainId: 8453,
      rpcUrl: 'https://mainnet.base.org',
      blockExplorer: 'https://basescan.org',
      isTestnet: false,
      // ⚠️  MAINNET IS BLOCKED - DO NOT USE
    },
  },
  
  // Contract addresses on Base Sepolia
  CONTRACTS: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    REGISTRAR: '0x49aE3cC2e3AA768B1e99B24EEA346bd13afD6049',
    L2_RESOLVER: '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA',
  },
  
  // Basename suffix
  BASENAME_SUFFIX: '.basetest.eth',
} as const;

/**
 * Get the network configuration (always returns Base Sepolia)
 */
export function getNetworkConfig() {
  return NETWORK_CONFIG.NETWORKS['base-sepolia'];
}

/**
 * Get the chain ID (always returns 84532)
 */
export function getChainId(): number {
  return NETWORK_CONFIG.DEFAULT_CHAIN_ID;
}

/**
 * Get the network ID (always returns 'base-sepolia')
 */
export function getNetworkId(): 'base-sepolia' {
  return NETWORK_CONFIG.DEFAULT_NETWORK;
}

/**
 * Validate and force network to Base Sepolia
 * This prevents accidental mainnet usage
 */
export function validateAndForceNetwork(
  network?: string | 'base-mainnet' | 'base-sepolia'
): 'base-sepolia' {
  if (network && network !== 'base-sepolia') {
    console.warn(
      `⚠️  Network "${network}" requested but application is locked to Base Sepolia (Chain ID: 84532)`
    );
  }
  return 'base-sepolia';
}

/**
 * Check if a chain ID is valid (only 84532 is valid)
 */
export function isValidChainId(chainId: number): boolean {
  return chainId === NETWORK_CONFIG.DEFAULT_CHAIN_ID;
}

/**
 * Get contract address on the default network
 */
export function getContractAddress(contract: keyof typeof NETWORK_CONFIG.CONTRACTS): string {
  return NETWORK_CONFIG.CONTRACTS[contract];
}

/**
 * Export constants for convenience
 */
export const DEFAULT_NETWORK = NETWORK_CONFIG.DEFAULT_NETWORK;
export const DEFAULT_CHAIN_ID = NETWORK_CONFIG.DEFAULT_CHAIN_ID;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const USDC_ADDRESS = NETWORK_CONFIG.CONTRACTS.USDC;
export const BASENAME_SUFFIX = NETWORK_CONFIG.BASENAME_SUFFIX;

export default NETWORK_CONFIG;
