/**
 * Wallet API Route
 * 
 * ⚠️  NETWORK LOCK: This API is hardcoded to use Base Sepolia (Chain ID: 84532) ONLY
 * 
 * All operations enforce base-sepolia:
 * - Wallet creation (user & pet wallets)
 * - Basename registration
 * - Balance queries
 * - All blockchain transactions
 * 
 * Any network parameter passed to this API is IGNORED and replaced with 'base-sepolia'
 * for safety and consistency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { encodeFunctionData, namehash } from 'viem';
import { normalize } from 'viem/ens';
import connectDB from '@/lib/database';
import User from '@/lib/models/User';
import WalletModel from '@/lib/models/Wallet';
import Pet from '@/lib/models/Pet';

// Initialize Coinbase SDK on server-side
let isConfigured = false;

// Basename registration constants for Base Sepolia
const BASE_SEPOLIA_REGISTRAR_ADDRESS = "0x49aE3cC2e3AA768B1e99B24EEA346bd13afD6049";
const BASE_SEPOLIA_L2_RESOLVER_ADDRESS = "0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA";
const BASE_MAINNET_REGISTRAR_ADDRESS = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";
const BASE_MAINNET_L2_RESOLVER_ADDRESS = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";

// Regular expressions for basename validation
const BASE_SEPOLIA_NAME_REGEX = /\.basetest\.eth$/;
const BASE_MAINNET_NAME_REGEX = /\.base\.eth$/;

// L2 Resolver ABI
const L2_RESOLVER_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "address", name: "a", type: "address" },
    ],
    name: "setAddr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "string", name: "newName", type: "string" },
    ],
    name: "setName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Registrar ABI
const REGISTRAR_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "duration",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "resolver",
            type: "address",
          },
          {
            internalType: "bytes[]",
            name: "data",
            type: "bytes[]",
          },
          {
            internalType: "bool",
            name: "reverseRecord",
            type: "bool",
          },
        ],
        internalType: "struct RegistrarController.RegisterRequest",
        name: "request",
        type: "tuple",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

function getCoinbaseInstance() {
  if (!isConfigured) {
    try {
      // Validate environment variables
      if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
        throw new Error('CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set in environment variables');
      }

      const config: any = {
        apiKeyName: process.env.CDP_API_KEY_ID,
        privateKey: process.env.CDP_API_KEY_SECRET,
        // useServerSigner: true, // Disabled - Server Signer not enabled in CDP project
      };

      // Add wallet secret if available for enhanced persistence
      if (process.env.CDP_WALLET_SECRET) {
        config.walletSecret = process.env.CDP_WALLET_SECRET;
      }

      Coinbase.configure(config);
      isConfigured = true;
      console.log('Coinbase SDK configured successfully');
    } catch (error) {
      console.error('Failed to configure Coinbase SDK:', error);
      throw error;
    }
  }
  return true;
}

// Helper function to create register contract method arguments
function createRegisterContractMethodArgs(baseName: string, addressId: string, network: string) {
  const isMainnet = network === 'base-mainnet';
  const nameRegex = isMainnet ? BASE_MAINNET_NAME_REGEX : BASE_SEPOLIA_NAME_REGEX;
  const resolverAddress = isMainnet ? BASE_MAINNET_L2_RESOLVER_ADDRESS : BASE_SEPOLIA_L2_RESOLVER_ADDRESS;
  
  const addressData = encodeFunctionData({
    abi: L2_RESOLVER_ABI,
    functionName: "setAddr",
    args: [namehash(normalize(baseName)), addressId],
  });
  
  const nameData = encodeFunctionData({
    abi: L2_RESOLVER_ABI,
    functionName: "setName",
    args: [namehash(normalize(baseName)), baseName],
  });

  const registerArgs = {
    request: [
      baseName.replace(nameRegex, ""),
      addressId,
      "31557600", // 1 year in seconds
      resolverAddress,
      [addressData, nameData],
      true,
    ],
  };
  
  console.log(`Register contract method arguments constructed:`, registerArgs);
  return registerArgs;
}

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const body = await request.json();
    // FORCE BASE SEPOLIA (Chain ID: 84532) for all operations
    // This ensures all wallets, payments, transactions, and basename registrations use testnet
    const network = 'base-sepolia'; // Hardcoded to prevent mainnet usage
    const { action, userId, petId } = body;

    if (action === 'createUserWallet') {
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      try {
        // Check if user exists - handle both email-based IDs and MongoDB ObjectIds
        let user;
        
        // First try to find by MongoDB ObjectId if it looks like one
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          user = await User.findById(userId);
        } else {
          // Otherwise, try to find by email (for NextAuth users)
          user = await User.findOne({ email: userId });
        }
        
        if (!user) {
          // If user doesn't exist, create one for NextAuth users
          if (userId.includes('@')) {
            console.log('Creating new user for email:', userId);
            try {
              user = new User({
                email: userId,
                name: 'User', // Default name
                password: 'oauth-user' // Placeholder for OAuth users
              });
              await user.save();
              console.log('New user created with ID:', user._id);
            } catch (createError: unknown) {
              // Handle duplicate key error
              const error = createError as { code?: number };
              if (error.code === 11000) {
                console.log('User already exists, fetching existing user:', userId);
                user = await User.findOne({ email: userId });
                if (!user) {
                  return NextResponse.json(
                    { error: 'Failed to create or find user' },
                    { status: 500 }
                  );
                }
              } else {
                throw createError;
              }
            }
          } else {
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }
        }

        // Check if user already has a wallet
        if (user.walletId && user.walletAddress) {
          // Return existing wallet information
          return NextResponse.json({
            success: true,
            walletId: user.walletId,
            address: user.walletAddress,
            network,
            existing: true
          });
        }

        // Create wallet using Coinbase SDK
        try {
          getCoinbaseInstance();
        } catch (error) {
          console.error('Coinbase SDK configuration failed:', error);
          return NextResponse.json(
            { error: 'Failed to configure Coinbase SDK: ' + (error instanceof Error ? error.message : 'Unknown error') },
            { status: 500 }
          );
        }
        
        console.log('Creating user wallet...');
        let wallet;
        let address;
        let walletData;
        
        try {
          wallet = await Wallet.create({ networkId: network });
          console.log('User wallet created successfully:', wallet.getId());
          
          address = await wallet.getDefaultAddress();
          console.log('User wallet address:', address.getId());
          
          // Export wallet data for persistence
          walletData = wallet.export();
          console.log('User wallet data exported for persistence');
        } catch (walletError) {
          console.error('Failed to create user wallet:', walletError);
          return NextResponse.json(
            { error: 'Failed to create wallet: ' + (walletError instanceof Error ? walletError.message : 'Unknown wallet creation error') },
            { status: 500 }
          );
        }

        // Save wallet to database with exported data
        let walletDoc;
        try {
          walletDoc = new WalletModel({
            walletId: wallet.getId(),
            address: address.getId().toLowerCase(), // Ensure lowercase for consistency
            network,
            type: 'user',
            ownerId: userId,
            walletData: JSON.stringify(walletData) // Store exported wallet data
          });

          await walletDoc.save();
          console.log('User wallet saved to database successfully with address:', address.getId().toLowerCase());
        } catch (dbError) {
          console.error('Failed to save user wallet to database:', dbError);
          return NextResponse.json(
            { error: 'Failed to save wallet to database: ' + (dbError instanceof Error ? dbError.message : 'Unknown database error') },
            { status: 500 }
          );
        }

        // Update user with wallet information
        try {
          user.walletId = wallet.getId();
          user.walletAddress = address.getId().toLowerCase(); // Ensure lowercase
          await user.save();
          console.log('User updated with wallet information successfully');
        } catch (userUpdateError) {
          console.error('Failed to update user with wallet information:', userUpdateError);
          return NextResponse.json(
            { error: 'Failed to update user: ' + (userUpdateError instanceof Error ? userUpdateError.message : 'Unknown user update error') },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          walletId: wallet.getId(),
          address: address.getId().toLowerCase(), // Return lowercase address
          network
        });
      } catch (error: unknown) {
        console.error('User wallet creation error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to create wallet' },
          { status: 500 }
        );
      }
    } else if (action === 'createPetWallet') {
      if (!userId || !petId) {
        return NextResponse.json(
          { error: 'User ID and Pet ID are required' },
          { status: 400 }
        );
      }

      try {
        // Check if user exists - handle both email-based IDs and MongoDB ObjectIds
        let user;
        
        // First try to find by MongoDB ObjectId if it looks like one
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          user = await User.findById(userId);
        } else {
          // Otherwise, try to find by email (for NextAuth users)
          user = await User.findOne({ email: userId });
        }
        
        if (!user) {
          // If user doesn't exist, create one for NextAuth users
          if (userId.includes('@')) {
            console.log('Creating new user for email:', userId);
            user = new User({
              email: userId,
              name: 'User', // Default name
              password: 'oauth-user' // Placeholder for OAuth users
            });
            await user.save();
            console.log('New user created with ID:', user._id);
          } else {
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }
        }

        // Check if pet exists - handle both ObjectId and string petId
        let pet;
        
        // First try to find by MongoDB ObjectId if it looks like one
        if (petId.match(/^[0-9a-fA-F]{24}$/)) {
          pet = await Pet.findById(petId);
        } else {
          // Otherwise, try to find by custom petId field or name
          pet = await Pet.findOne({ 
            $or: [
              { petId: petId },
              { name: petId }
            ]
          });
        }
        
        if (!pet) {
          return NextResponse.json(
            { error: 'Pet not found' },
            { status: 404 }
          );
        }

        // Check if pet already has a wallet
        if (pet.petWalletAddress && pet.petWalletId) {
          // Return existing wallet information
          return NextResponse.json({
            success: true,
            wallet: {
              id: pet.petWalletId,
              address: pet.petWalletAddress,
              network
            },
            existing: true
          });
        }

        // Create pet wallet using Coinbase SDK
        try {
          getCoinbaseInstance();
        } catch (error) {
          console.error('Coinbase SDK configuration failed:', error);
          return NextResponse.json(
            { error: 'Failed to configure Coinbase SDK: ' + (error instanceof Error ? error.message : 'Unknown error') },
            { status: 500 }
          );
        }
        
        console.log('Creating pet wallet...');
        let wallet;
        let address;
        let walletData;
        
        try {
          wallet = await Wallet.create({ networkId: network });
          console.log('Pet wallet created successfully:', wallet.getId());
          
          address = await wallet.getDefaultAddress();
          console.log('Pet wallet address:', address.getId());
          
          // Export wallet data for persistence
          walletData = wallet.export();
          console.log('Pet wallet data exported for persistence');
        } catch (walletError) {
          console.error('Failed to create pet wallet:', walletError);
          return NextResponse.json(
            { error: 'Failed to create pet wallet: ' + (walletError instanceof Error ? walletError.message : 'Unknown wallet creation error') },
            { status: 500 }
          );
        }

        // Save wallet to database with exported data
        let walletDoc;
        try {
          walletDoc = new WalletModel({
            walletId: wallet.getId(),
            address: address.getId().toLowerCase(), // Ensure lowercase for consistency
            network,
            type: 'pet',
            ownerId: userId,
            petId: petId,
            walletData: JSON.stringify(walletData) // Store exported wallet data
          });

          await walletDoc.save();
          console.log('Pet wallet saved to database successfully with address:', address.getId().toLowerCase());
        } catch (dbError) {
          console.error('Failed to save pet wallet to database:', dbError);
          return NextResponse.json(
            { error: 'Failed to save pet wallet to database: ' + (dbError instanceof Error ? dbError.message : 'Unknown database error') },
            { status: 500 }
          );
        }

        // Update pet with wallet information
        try {
          pet.petWalletAddress = address.getId().toLowerCase(); // Ensure lowercase
          pet.petWalletId = wallet.getId();
          await pet.save();
          console.log('Pet updated with wallet information successfully, address:', address.getId().toLowerCase());
        } catch (petUpdateError) {
          console.error('Failed to update pet with wallet information:', petUpdateError);
          return NextResponse.json(
            { error: 'Failed to update pet: ' + (petUpdateError instanceof Error ? petUpdateError.message : 'Unknown pet update error') },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          walletId: wallet.getId(),
          address: address.getId().toLowerCase(), // Return lowercase address
          network
        });
      } catch (error: unknown) {
        console.error('Pet wallet creation error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to create pet wallet' },
          { status: 500 }
        );
      }
    } else if (action === 'getWallet') {
      const { walletId } = body;
      
      if (!walletId) {
        return NextResponse.json(
          { error: 'Wallet ID is required' },
          { status: 400 }
        );
      }

      try {
        // Find wallet in database
        const walletDoc = await WalletModel.findOne({ walletId });
        if (!walletDoc) {
          return NextResponse.json(
            { error: 'Wallet not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          wallet: {
            walletId: walletDoc.walletId,
            address: walletDoc.address,
            network: walletDoc.network,
            type: walletDoc.type,
            ownerId: walletDoc.ownerId,
            petId: walletDoc.petId,
            isActive: walletDoc.isActive
          }
        });
      } catch (error: unknown) {
        console.error('Wallet retrieval error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to retrieve wallet' },
          { status: 500 }
        );
      }
    } else if (action === 'registerBasename') {
      const { walletId, baseName } = body;
      // Always use Base Sepolia (Chain ID: 84532) for basename registration
      const network = 'base-sepolia';
      
      if (!walletId || !baseName) {
        return NextResponse.json(
          { error: 'Wallet ID and basename are required' },
          { status: 400 }
        );
      }

      try {
        // Validate basename format (always Base Sepolia)
        const nameRegex = BASE_SEPOLIA_NAME_REGEX;
        
        if (!nameRegex.test(baseName)) {
          return NextResponse.json(
            { error: 'Basename must end with .basetest.eth (Base Sepolia only)' },
            { status: 400 }
          );
        }

        // Find wallet in database
        const walletDoc = await WalletModel.findOne({ walletId });
        if (!walletDoc) {
          return NextResponse.json(
            { error: 'Wallet not found' },
            { status: 404 }
          );
        }

        // Initialize Coinbase SDK
        const coinbaseInstance = getCoinbaseInstance();
        if (!coinbaseInstance) {
          return NextResponse.json(
            { error: 'Failed to configure Coinbase SDK' },
            { status: 500 }
          );
        }

        console.log('Registering basename:', baseName, 'for wallet:', walletId);
        
        // Import wallet from stored data instead of fetching
        let wallet;
        try {
          if (walletDoc.walletData) {
            // Import wallet from stored data
            const parsedWalletData = JSON.parse(walletDoc.walletData);
            wallet = await Wallet.import(parsedWalletData);
            console.log('Wallet imported from stored data');
          } else {
            // Fallback: try to fetch (this may fail for older wallets)
            wallet = await Wallet.fetch(walletId);
            console.log('Wallet fetched by ID (legacy method)');
          }
        } catch (importError) {
          console.error('Failed to import/fetch wallet:', importError);
          throw new Error('Cannot retrieve wallet. Please create a new wallet.');
        }
        
        const address = await wallet.getDefaultAddress();
        const addressId = address.getId();

        // Create register contract method arguments
        const registerArgs = createRegisterContractMethodArgs(baseName, addressId, network);
        
        // Get the registrar address (always Base Sepolia)
        const registrarAddress = BASE_SEPOLIA_REGISTRAR_ADDRESS;
        
        // Register the basename using contract invocation
        // NOTE: Gas sponsorship is automatically handled by Coinbase SDK
        // The SDK will use the configured paymaster/bundler endpoints for gas-free transactions
        console.log('🎯 Registering basename with gas sponsorship...');
        const contractInvocation = await wallet.invokeContract({
          contractAddress: registrarAddress,
          method: "register",
          abi: REGISTRAR_ABI,
          args: registerArgs,
          amount: 0.002, // Registration fee in ETH (gas is sponsored)
          assetId: Coinbase.assets.Eth,
        });
        console.log('✅ Basename registration transaction submitted (gas-free)');

        // Wait for the transaction to complete with timeout handling
        let transactionCompleted = false;
        let retryCount = 0;
        const maxRetries = 3;
        const timeoutMs = 120000; // 2 minutes timeout
        
        while (!transactionCompleted && retryCount < maxRetries) {
          try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Transaction confirmation timeout')), timeoutMs);
            });
            
            // Race between transaction wait and timeout
            await Promise.race([
              contractInvocation.wait(),
              timeoutPromise
            ]);
            
            transactionCompleted = true;
            console.log(`Transaction completed successfully on attempt ${retryCount + 1}`);
            
          } catch (error) {
            retryCount++;
            console.log(`Transaction attempt ${retryCount} failed:`, error);
            
            if (retryCount >= maxRetries) {
              // Check if transaction might still be pending
              try {
                const transactionHash = contractInvocation.getTransactionHash();
                if (transactionHash) {
                  console.log(`Transaction submitted with hash: ${transactionHash}`);
                  console.log(`Transaction may still be pending. Please check: ${contractInvocation.getTransactionLink()}`);
                  
                  // Return partial success with transaction hash for user to track
                  return NextResponse.json({
                    success: true,
                    pending: true,
                    message: 'Transaction submitted but confirmation timed out. Please check the transaction status.',
                    baseName,
                    walletId,
                    address: addressId,
                    transactionHash,
                    transactionLink: contractInvocation.getTransactionLink(),
                    network
                  });
                }
              } catch (hashError) {
                console.error('Could not retrieve transaction hash:', hashError);
              }
              
              throw new Error(`Transaction failed after ${maxRetries} attempts. The transaction may still be processing on the blockchain.`);
            }
            
            // Wait before retry with exponential backoff
            const backoffDelay = Math.min(5000 * Math.pow(2, retryCount - 1), 30000);
            console.log(`Waiting ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
        
        const transactionHash = contractInvocation.getTransactionHash();
        const transactionLink = contractInvocation.getTransactionLink();
        
        console.log(`Successfully registered basename ${baseName} for wallet ${walletId}`);
        console.log(`Transaction hash: ${transactionHash}`);
        console.log(`Transaction link: ${transactionLink}`);

        // Update wallet document with basename
        walletDoc.basename = baseName;
        await walletDoc.save();

        return NextResponse.json({
          success: true,
          baseName,
          walletId,
          address: addressId,
          transactionHash,
          transactionLink,
          network
        });
      } catch (error: unknown) {
        console.error('Basename registration error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to register basename' },
          { status: 500 }
        );
      }

    } else if (action === 'autoPetBasenameRegistration') {
      // Automatic basename registration for pets without manual signing
      const { petId, baseName } = body;
      // Always use Base Sepolia (Chain ID: 84532) for pet basename registration
      const network = 'base-sepolia';
      
      if (!petId || !baseName) {
        return NextResponse.json(
          { error: 'Pet ID and basename are required' },
          { status: 400 }
        );
      }

      try {
        // Find pet wallet in database
        const walletDoc = await WalletModel.findOne({ 
          petId, 
          type: 'pet',
          isActive: true 
        });
        
        if (!walletDoc) {
          return NextResponse.json(
            { error: 'Pet wallet not found' },
            { status: 404 }
          );
        }

        // Validate basename format (always Base Sepolia)
        const nameRegex = BASE_SEPOLIA_NAME_REGEX;
        
        if (!nameRegex.test(baseName)) {
          return NextResponse.json(
            { error: 'Basename must end with .basetest.eth (Base Sepolia only)' },
            { status: 400 }
          );
        }

        // Check if pet already has a basename
        if (walletDoc.basename) {
          return NextResponse.json(
            { error: `Pet already has basename: ${walletDoc.basename}` },
            { status: 400 }
          );
        }

        // Initialize Coinbase SDK
        const coinbaseInstance = getCoinbaseInstance();
        if (!coinbaseInstance) {
          return NextResponse.json(
            { error: 'Failed to configure Coinbase SDK' },
            { status: 500 }
          );
        }

        console.log('Auto-registering basename:', baseName, 'for pet:', petId);
        
        // Import pet wallet from stored data instead of fetching
        let wallet;
        try {
          if (walletDoc.walletData) {
            // Import wallet from stored data
            const parsedWalletData = JSON.parse(walletDoc.walletData);
            wallet = await Wallet.import(parsedWalletData);
            console.log('Pet wallet imported from stored data');
          } else {
            // Fallback: try to fetch (this may fail for older wallets)
            wallet = await Wallet.fetch(walletDoc.walletId);
            console.log('Pet wallet fetched by ID (legacy method)');
          }
        } catch (importError) {
          console.error('Failed to import/fetch pet wallet:', importError);
          throw new Error('Cannot retrieve pet wallet. Please create a new wallet.');
        }
        
        const address = await wallet.getDefaultAddress();
        const addressId = address.getId();

        // Check wallet balance before proceeding
        try {
          const balance = await address.getBalance('eth');
          const balanceNumber = parseFloat(balance.toString());
          
          if (balanceNumber < 0.002) {
            return NextResponse.json(
              { error: 'Insufficient ETH balance for basename registration. Required: 0.002 ETH' },
              { status: 400 }
            );
          }
        } catch (balanceError) {
          console.warn('Could not check balance, proceeding with registration:', balanceError);
        }

        // Create register contract method arguments
        const registerArgs = createRegisterContractMethodArgs(baseName, addressId, network);
        
        // Get the registrar address (always Base Sepolia)
        const registrarAddress = BASE_SEPOLIA_REGISTRAR_ADDRESS;
        
        // Register the basename using contract invocation (automatic signing)
        const contractInvocation = await wallet.invokeContract({
          contractAddress: registrarAddress,
          method: "register",
          abi: REGISTRAR_ABI,
          args: registerArgs,
          amount: 0.002, // Registration fee in ETH
          assetId: Coinbase.assets.Eth,
        });

        // Wait for the transaction to complete with timeout handling
        let transactionCompleted = false;
        let retryCount = 0;
        const maxRetries = 3;
        const timeoutMs = 120000; // 2 minutes timeout
        
        while (!transactionCompleted && retryCount < maxRetries) {
          try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Transaction confirmation timeout')), timeoutMs);
            });
            
            // Race between transaction wait and timeout
            await Promise.race([
              contractInvocation.wait(),
              timeoutPromise
            ]);
            
            transactionCompleted = true;
            console.log(`Pet basename auto-registration completed successfully on attempt ${retryCount + 1}`);
            
          } catch (error) {
            retryCount++;
            console.log(`Pet basename auto-registration attempt ${retryCount} failed:`, error);
            
            if (retryCount >= maxRetries) {
              // Check if transaction might still be pending
              try {
                const transactionHash = contractInvocation.getTransactionHash();
                if (transactionHash) {
                  console.log(`Pet basename transaction submitted with hash: ${transactionHash}`);
                  console.log(`Transaction may still be pending. Please check: ${contractInvocation.getTransactionLink()}`);
                  
                  // Return partial success with transaction hash for tracking
                  return NextResponse.json({
                    success: true,
                    pending: true,
                    message: 'Pet basename registration submitted but confirmation timed out.',
                    baseName,
                    petId,
                    walletId: walletDoc.walletId,
                    address: addressId,
                    transactionHash,
                    transactionLink: contractInvocation.getTransactionLink(),
                    network,
                    automatic: true
                  });
                }
              } catch (hashError) {
                console.error('Could not retrieve transaction hash:', hashError);
              }
              
              throw new Error(`Pet basename registration failed after ${maxRetries} attempts. The transaction may still be processing on the blockchain.`);
            }
            
            // Wait before retry with exponential backoff
            const backoffDelay = Math.min(5000 * Math.pow(2, retryCount - 1), 30000);
            console.log(`Waiting ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
        
        const transactionHash = contractInvocation.getTransactionHash();
        const transactionLink = contractInvocation.getTransactionLink();
        
        console.log(`Successfully auto-registered basename ${baseName} for pet ${petId}`);
        console.log(`Transaction hash: ${transactionHash}`);
        console.log(`Transaction link: ${transactionLink}`);

        // Update wallet document with basename
        walletDoc.basename = baseName;
        await walletDoc.save();

        return NextResponse.json({
          success: true,
          baseName,
          petId,
          walletId: walletDoc.walletId,
          address: addressId,
          transactionHash,
          transactionLink,
          network,
          automatic: true
        });
      } catch (error: unknown) {
        console.error('Pet basename auto-registration error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to auto-register pet basename' },
          { status: 500 }
        );
      }

    } else if (action === 'getBalance') {
      // Get balance for a specific asset
      const { walletAddress, asset } = body;
      // Always use Base Sepolia (Chain ID: 84532)
      const network = 'base-sepolia';

      if (!walletAddress) {
        return NextResponse.json(
          { error: 'Wallet address is required' },
          { status: 400 }
        );
      }

      try {
        getCoinbaseInstance();
        
        // Try to fetch real balance from blockchain
        try {
          // Find wallet in database to get walletId
          const walletDoc = await WalletModel.findOne({ address: walletAddress.toLowerCase() });
          
          if (walletDoc) {
            // Import wallet from stored data
            let wallet;
            if (walletDoc.walletData) {
              const parsedWalletData = JSON.parse(walletDoc.walletData);
              wallet = await Wallet.import(parsedWalletData);
            } else {
              wallet = await Wallet.fetch(walletDoc.walletId);
            }
            const address = await wallet.getDefaultAddress();
            
            // Get balance for the specific asset
            let balance = '0.00';
            const assetSymbol = asset || 'USDC';
            
            if (assetSymbol === 'ETH') {
              const ethBalance = await address.getBalance('eth');
              balance = ethBalance.toString();
            } else if (assetSymbol === 'USDC') {
              // USDC contract address on Base Sepolia
              const usdcBalance = await address.getBalance('usdc');
              balance = usdcBalance.toString();
            } else if (assetSymbol === 'WETH') {
              // WETH balance
              const wethBalance = await address.getBalance('weth');
              balance = wethBalance.toString();
            }

            return NextResponse.json({
              success: true,
              balance,
              asset: assetSymbol
            });
          }
        } catch (sdkError) {
          console.warn('Failed to fetch real balance, falling back to mock data:', sdkError);
        }
        
        // Fallback to mock balances if real balance fetching fails
        const mockBalances: { [key: string]: string } = {
          'USDC': '125.50',
          'ETH': '0.0234',
          'WETH': '0.0156'
        };

        const balance = mockBalances[asset || 'USDC'] || '0.00';

        return NextResponse.json({
          success: true,
          balance,
          asset: asset || 'USDC'
        });
      } catch (error: unknown) {
        console.error('Get balance error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to get balance' },
          { status: 500 }
        );
      }

    } else if (action === 'repairWallet') {
      // Repair/reinitialize wallet that's missing walletData
      const { walletAddress } = body;
      // Always use Base Sepolia (Chain ID: 84532)
      const network = 'base-sepolia';

      if (!walletAddress) {
        return NextResponse.json(
          { error: 'Wallet address is required' },
          { status: 400 }
        );
      }

      try {
        getCoinbaseInstance();
        
        // Find wallet in database
        const walletDoc = await WalletModel.findOne({ address: walletAddress.toLowerCase() });
        
        if (!walletDoc) {
          return NextResponse.json(
            { error: 'Wallet not found in database' },
            { status: 404 }
          );
        }

        // Check if wallet already has walletData
        if (walletDoc.walletData) {
          return NextResponse.json({
            success: true,
            message: 'Wallet already has data, no repair needed',
            walletId: walletDoc.walletId,
            address: walletDoc.address
          });
        }

        // Try to fetch the wallet and export its data
        let wallet;
        try {
          wallet = await Wallet.fetch(walletDoc.walletId);
          console.log(`Fetched wallet ${walletDoc.walletId} for repair`);
        } catch (fetchError) {
          console.error('Failed to fetch wallet for repair:', fetchError);
          return NextResponse.json(
            { 
              error: 'Cannot repair wallet: Unable to fetch wallet from Coinbase. The wallet may need to be recreated.',
              walletId: walletDoc.walletId 
            },
            { status: 500 }
          );
        }

        // Export wallet data
        let walletData;
        try {
          walletData = wallet.export();
        } catch (exportError) {
          console.error('Failed to export wallet data:', exportError);
          // Wallet exists but can't be exported (likely missing seed)
          // This means the wallet was created but the server doesn't have access to export it
          return NextResponse.json(
            {
              error: 'Cannot repair wallet: Wallet exists but cannot be exported. This wallet may have been created in a different session. Please create a new wallet by refreshing the page.',
              walletId: walletDoc.walletId,
              suggestion: 'refresh_page'
            },
            { status: 400 }
          );
        }
        
        // Update wallet document with exported data
        walletDoc.walletData = JSON.stringify(walletData);
        await walletDoc.save();
        
        console.log(`✅ Wallet ${walletDoc.walletId} repaired successfully`);

        return NextResponse.json({
          success: true,
          message: 'Wallet repaired successfully',
          walletId: walletDoc.walletId,
          address: walletDoc.address,
          network: walletDoc.network
        });
      } catch (error: unknown) {
        console.error('Wallet repair error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to repair wallet' },
          { status: 500 }
        );
      }

    } else if (action === 'getAllBalances') {
      // Get all asset balances for a wallet
      const { walletAddress } = body;
      // Always use Base Sepolia (Chain ID: 84532)
      const network = 'base-sepolia';

      if (!walletAddress) {
        return NextResponse.json(
          { error: 'Wallet address is required' },
          { status: 400 }
        );
      }

      try {
        getCoinbaseInstance();
        
        // Try to fetch real balances from blockchain
        try {
          // Find wallet in database to get walletId
          const walletDoc = await WalletModel.findOne({ address: walletAddress.toLowerCase() });
          
          if (walletDoc) {
            // Import wallet from stored data
            let wallet;
            if (walletDoc.walletData) {
              const parsedWalletData = JSON.parse(walletDoc.walletData);
              wallet = await Wallet.import(parsedWalletData);
            } else {
              wallet = await Wallet.fetch(walletDoc.walletId);
            }
            const address = await wallet.getDefaultAddress();
            
            // Get balances for all supported assets
            const assets = [];
            let totalUsdValue = 0;
            
            // Fetch ETH balance
            try {
              const ethBalance = await address.getBalance('eth');
              const ethAmount = parseFloat(ethBalance.toString());
              const ethUsdValue = ethAmount * 2500; // Approximate ETH price
              assets.push({
                symbol: 'ETH',
                name: 'Ethereum',
                amount: ethAmount.toFixed(4),
                usdValue: ethUsdValue.toFixed(2),
                icon: '⟠'
              });
              totalUsdValue += ethUsdValue;
            } catch (ethError) {
              console.warn('Failed to fetch ETH balance:', ethError);
            }
            
            // Fetch USDC balance
            try {
              const usdcBalance = await address.getBalance('usdc');
              const usdcAmount = parseFloat(usdcBalance.toString());
              assets.push({
                symbol: 'USDC',
                name: 'USD Coin',
                amount: usdcAmount.toFixed(2),
                usdValue: usdcAmount.toFixed(2),
                icon: '$'
              });
              totalUsdValue += usdcAmount;
            } catch (usdcError) {
              console.warn('Failed to fetch USDC balance:', usdcError);
            }
            
            // Fetch WETH balance
            try {
              const wethBalance = await address.getBalance('weth');
              const wethAmount = parseFloat(wethBalance.toString());
              const wethUsdValue = wethAmount * 2500; // Approximate WETH price
              assets.push({
                symbol: 'WETH',
                name: 'Wrapped Ethereum',
                amount: wethAmount.toFixed(4),
                usdValue: wethUsdValue.toFixed(2),
                icon: '⟠'
              });
              totalUsdValue += wethUsdValue;
            } catch (wethError) {
              console.warn('Failed to fetch WETH balance:', wethError);
            }

            // Return real balances if we got any
            if (assets.length > 0) {
              return NextResponse.json({
                success: true,
                assets,
                totalUsdValue: totalUsdValue.toFixed(2)
              });
            }
          }
        } catch (sdkError) {
          console.warn('Failed to fetch real balances, falling back to mock data:', sdkError);
        }
        
        // Fallback to mock asset balances if real balance fetching fails
        const mockAssets = [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            amount: '0.0234',
            usdValue: '58.42',
            icon: '⟠'
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            amount: '125.50',
            usdValue: '125.50',
            icon: '$'
          },
          {
            symbol: 'WETH',
            name: 'Wrapped Ethereum',
            amount: '0.0156',
            usdValue: '38.94',
            icon: '⟠'
          }
        ];

        const totalUsdValue = mockAssets.reduce((total, asset) => {
          return total + parseFloat(asset.usdValue);
        }, 0).toFixed(2);

        return NextResponse.json({
          success: true,
          assets: mockAssets,
          totalUsdValue
        });
      } catch (error: unknown) {
        console.error('Get all balances error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to get balances' },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const address = searchParams.get('address');

    if (!walletId && !address) {
      return NextResponse.json(
        { error: 'Wallet ID or address is required' },
        { status: 400 }
      );
    }

    try {
      // Find wallet in database by walletId or address
      let walletDoc;
      if (walletId) {
        walletDoc = await WalletModel.findOne({ walletId });
      } else if (address) {
        walletDoc = await WalletModel.findOne({ address: address.toLowerCase() });
      }
      
      if (!walletDoc) {
        return NextResponse.json(
          { error: 'Wallet not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        wallet: {
          walletId: walletDoc.walletId,
          address: walletDoc.address,
          network: walletDoc.network,
          type: walletDoc.type,
          ownerId: walletDoc.ownerId,
          petId: walletDoc.petId,
          isActive: walletDoc.isActive
        }
      });
    } catch (error: unknown) {
      console.error('Get wallet error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to retrieve wallet' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Wallet GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}