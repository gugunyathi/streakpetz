import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

// Initialize Coinbase SDK
export const initializeCoinbase = () => {
  return Coinbase.configure({
    apiKeyName: process.env.NEXT_PUBLIC_CDP_API_KEY_ID!,
    privateKey: process.env.CDP_API_KEY_SECRET!,
  });
};

// Create a new user wallet (Base Account)
export const createUserWallet = async (): Promise<Wallet> => {
  const coinbase = initializeCoinbase();
  const wallet = await Wallet.create();
  return wallet;
};

// Create a new pet wallet (owned by user + operator)
export const createPetWallet = async (userWalletId: string): Promise<Wallet> => {
  const coinbase = initializeCoinbase();
  const petWallet = await Wallet.create();
  
  // Store the relationship between user and pet wallet
  // This would typically be stored in a database
  console.log(`Pet wallet ${petWallet.getId()} created for user wallet ${userWalletId}`);
  
  return petWallet;
};

// Get wallet by ID
export const getWallet = async (walletId: string): Promise<Wallet> => {
  const coinbase = initializeCoinbase();
  return await Wallet.fetch(walletId);
};

// Get wallet address
export const getWalletAddress = async (wallet: Wallet): Promise<string> => {
  const address = await wallet.getDefaultAddress();
  return address.getId();
};

// Fund wallet from faucet (testnet only)
export const fundWalletFromFaucet = async (wallet: Wallet): Promise<void> => {
  try {
    const address = await wallet.getDefaultAddress();
    const faucetTx = await address.faucet();
    console.log(`Faucet transaction: ${faucetTx.getTransactionHash()}`);
  } catch (error) {
    console.error('Error funding wallet from faucet:', error);
  }
};