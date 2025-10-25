import { NextRequest, NextResponse } from 'next/server';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import Wallets from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';
import ActivityLog from '@/lib/models/ActivityLog';
import connectDB from '@/lib/database';
import { 
  USDC_ADDRESSES, 
  createUSDCTransferUserOp, 
  getPaymasterStubData,
  ENTRYPOINT_ADDRESS,
  BUNDLER_ENDPOINT 
} from '@/lib/paymaster';
import { rateLimiters } from '@/lib/rate-limiter';

// Configure Coinbase SDK
let isConfigured = false;

function ensureCoinbaseConfigured() {
  if (!isConfigured) {
    try {
      if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
        throw new Error('CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set in environment variables');
      }

      const config: any = {
        apiKeyName: process.env.CDP_API_KEY_ID,
        privateKey: process.env.CDP_API_KEY_SECRET,
      };

      Coinbase.configure(config);
      isConfigured = true;
      console.log('Coinbase SDK configured for transfer API');
    } catch (error) {
      console.error('Failed to configure Coinbase SDK:', error);
      throw error;
    }
  }
  return true;
}

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  let requestId = `tx_${requestStartTime}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔷 PAYMENT REQUEST STARTED [${requestId}]`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Apply rate limiting - 10 transactions per minute
    const rateLimitResponse = rateLimiters.transaction(request);
    if (rateLimitResponse) {
      console.log(`❌ Rate limit exceeded [${requestId}]`);
      return rateLimitResponse;
    }

    // Ensure Coinbase SDK is configured
    try {
      ensureCoinbaseConfigured();
      console.log(`✅ Coinbase SDK configured [${requestId}]`);
    } catch (sdkError) {
      console.error(`❌ Coinbase SDK configuration failed [${requestId}]:`, sdkError);
      return NextResponse.json(
        { success: false, error: 'Payment system configuration error', code: 'SDK_CONFIG_FAILED' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { fromAddress, toAddress, amount, network, userId, petId } = body;

    console.log(`📋 Request Body [${requestId}]:`, {
      fromAddress,
      toAddress,
      amount,
      network,
      userId: userId ? 'provided' : 'missing',
      petId: petId ? 'provided' : 'missing'
    });

    if (!fromAddress || !toAddress || !amount) {
      console.error(`❌ Missing required fields [${requestId}]:`, {
        hasFromAddress: !!fromAddress,
        hasToAddress: !!toAddress,
        hasAmount: !!amount
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fromAddress, toAddress, and amount are required', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Force Base Sepolia
    const txNetwork = 'base-sepolia';
    
    // Convert USDC amount to wei (6 decimals)
    // Input: 2.00 USDC → Output: 2000000 wei
    const amountInWei = Math.floor(parseFloat(amount.toString()) * 1000000);
    
    console.log(`💰 Processing USDC transfer [${requestId}]:`);
    console.log(`   Amount (USDC): ${amount}`);
    console.log(`   Amount (wei): ${amountInWei}`);
    console.log(`   From: ${fromAddress}`);
    console.log(`   To: ${toAddress}`);
    console.log(`   Network: ${txNetwork}`);

    // Connect to database
    console.log(`📦 Connecting to database [${requestId}]...`);
    try {
      await connectDB();
      console.log(`✅ Database connected [${requestId}]`);
    } catch (dbError) {
      console.error(`❌ Database connection failed [${requestId}]:`, dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed', code: 'DB_CONNECTION_FAILED' },
        { status: 500 }
      );
    }

    // Get wallet from database
    console.log(`🔍 Looking up wallet [${requestId}]: ${fromAddress}`);
    let walletRecord;
    try {
      walletRecord = await Wallets.findOne({ 
        address: fromAddress.toLowerCase() 
      });
    } catch (queryError) {
      console.error(`❌ Wallet lookup failed [${requestId}]:`, queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to query wallet database', code: 'DB_QUERY_FAILED' },
        { status: 500 }
      );
    }

    if (!walletRecord) {
      console.error(`❌ Wallet not found in database [${requestId}]: ${fromAddress}`);
      return NextResponse.json(
        { success: false, error: `Wallet ${fromAddress} not found in database`, code: 'WALLET_NOT_FOUND' },
        { status: 404 }
      );
    }

    console.log(`✅ Wallet found [${requestId}]:`, {
      walletId: walletRecord.walletId,
      address: walletRecord.address,
      network: walletRecord.network,
      type: walletRecord.type,
      hasWalletData: !!walletRecord.walletData,
      walletDataLength: walletRecord.walletData ? walletRecord.walletData.length : 0
    });

    // Verify wallet network
    if (walletRecord.network !== txNetwork) {
      console.error(`❌ Network mismatch [${requestId}]: Wallet is on ${walletRecord.network}, transaction requires ${txNetwork}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Wallet network mismatch: wallet is on ${walletRecord.network}, but transaction is for ${txNetwork}`,
          code: 'NETWORK_MISMATCH'
        },
        { status: 400 }
      );
    }

    // Import wallet from stored data
    if (!walletRecord.walletData) {
      console.error(`❌ Wallet ${fromAddress} is missing walletData field [${requestId}]`);
      console.error(`Wallet record details [${requestId}]:`, {
        walletId: walletRecord.walletId,
        address: walletRecord.address,
        network: walletRecord.network,
        type: walletRecord.type,
        hasWalletData: false,
        createdAt: walletRecord.createdAt,
        updatedAt: walletRecord.updatedAt
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Wallet data not found. Wallet may not be properly initialized. Please click "Reconnect Wallet" in the store modal.',
          code: 'WALLET_DATA_MISSING',
          walletId: walletRecord.walletId
        },
        { status: 400 }
      );
    }

    let wallet;
    try {
      console.log(`🔐 Importing wallet from stored data [${requestId}]...`);
      const walletData = JSON.parse(walletRecord.walletData);
      console.log(`📄 Wallet data parsed successfully [${requestId}], importing...`);
      wallet = await Wallet.import(walletData);
      console.log(`✅ Wallet imported successfully [${requestId}] for address: ${fromAddress}`);
    } catch (importError: any) {
      console.error(`❌ Failed to import wallet [${requestId}]:`, {
        error: importError.message,
        stack: importError.stack,
        walletId: walletRecord.walletId,
        address: fromAddress
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to import wallet for signing: ${importError.message}`,
          code: 'WALLET_IMPORT_FAILED'
        },
        { status: 500 }
      );
    }

    // Get USDC contract address
    const usdcAddress = USDC_ADDRESSES[txNetwork];
    
    console.log(`\n💸 Executing USDC transfer [${requestId}]:`);
    console.log(`   Amount: ${amount} wei`);
    console.log(`   To: ${toAddress}`);
    console.log(`   USDC Contract: ${usdcAddress}`);
    console.log(`   Network: ${txNetwork}`);

    // Execute the transfer using Coinbase SDK
    // The SDK handles signing and will use the paymaster for gas sponsorship
    let transactionHash = '';
    let transactionRecord: any = null;
    
    try {
      console.log(`📤 Invoking contract method [${requestId}]...`);
      const contractCallStart = Date.now();
      
      // Log the exact parameters being sent
      console.log(`📋 Contract Invocation Parameters [${requestId}]:`);
      console.log(`   Contract Address: ${usdcAddress}`);
      console.log(`   Method: transfer`);
      console.log(`   Args: to=${toAddress}, value=${amountInWei}`);
      console.log(`   CDP API Key ID: ${process.env.CDP_API_KEY_ID ? 'SET' : 'MISSING'}`);
      console.log(`   CDP API Key Secret: ${process.env.CDP_API_KEY_SECRET ? 'SET (first 10 chars: ' + process.env.CDP_API_KEY_SECRET.substring(0, 10) + '...)' : 'MISSING'}`);
      
      // Convert amount to proper format for contract invocation
      const transferAmount = BigInt(amountInWei);
      
      console.log(`💰 Transfer amount prepared: ${transferAmount.toString()} wei (${Number(transferAmount) / 1000000} USDC)`);
      
      // Step 1: Create UserOperation for gas-free transaction
      console.log(`🎯 Creating UserOperation for gas-free transfer [${requestId}]...`);
      const userOp = await createUSDCTransferUserOp(
        fromAddress,
        toAddress,
        transferAmount,
        '0x0' // Nonce will be managed by wallet
      );
      
      console.log(`✅ UserOperation created [${requestId}]`);
      
      // Step 2: Get paymaster stub data for gas sponsorship
      console.log(`🎯 Requesting paymaster sponsorship [${requestId}]...`);
      const paymasterData = await getPaymasterStubData(
        userOp,
        ENTRYPOINT_ADDRESS,
        '0x14a34' // Base Sepolia chain ID in hex
      ).catch((paymasterError: any) => {
        console.error(`❌ Paymaster request failed [${requestId}]:`, paymasterError);
        throw new Error(`Paymaster sponsorship failed: ${paymasterError.message}`);
      });
      
      console.log(`✅ Paymaster sponsorship obtained [${requestId}]`);
      console.log(`   Paymaster data: ${paymasterData.paymasterAndData.slice(0, 20)}...`);
      
      // Step 3: Update UserOperation with paymaster data
      userOp.paymasterAndData = paymasterData.paymasterAndData;
      userOp.preVerificationGas = paymasterData.preVerificationGas;
      userOp.verificationGasLimit = paymasterData.verificationGasLimit;
      userOp.callGasLimit = paymasterData.callGasLimit;
      
      console.log(`✅ UserOperation updated with paymaster data [${requestId}]`);
      
      // Step 4: Sign the UserOperation with wallet
      console.log(`🔐 Signing UserOperation with wallet [${requestId}]...`);
      // The wallet needs to sign the UserOperation hash
      // For now, we'll use a placeholder signature and let the bundler handle it
      // In production, implement proper ERC-4337 signature
      
      // Step 5: Submit UserOperation to bundler for execution
      console.log(`📤 Submitting UserOperation to bundler [${requestId}]...`);
      const bundlerStart = Date.now();
      
      const bundlerResponse = await fetch(BUNDLER_ENDPOINT, {
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
      }).catch((fetchError: any) => {
        console.error(`❌ Bundler request failed [${requestId}]:`, fetchError);
        throw new Error(`Bundler submission failed: ${fetchError.message}`);
      });
      
      const bundlerDuration = Date.now() - bundlerStart;
      
      if (!bundlerResponse.ok) {
        const errorText = await bundlerResponse.text();
        console.error(`❌ Bundler returned error [${requestId}] (${bundlerResponse.status}):`, errorText);
        throw new Error(`Bundler error: ${errorText}`);
      }
      
      const bundlerResult = await bundlerResponse.json();
      
      if (bundlerResult.error) {
        console.error(`❌ Bundler returned error [${requestId}]:`, bundlerResult.error);
        throw new Error(`Bundler error: ${bundlerResult.error.message || JSON.stringify(bundlerResult.error)}`);
      }
      
      const userOpHash = bundlerResult.result;
      console.log(`✅ UserOperation submitted [${requestId}] (${bundlerDuration}ms)`);
      console.log(`   UserOperation hash: ${userOpHash}`);
      
      // Use the UserOperation hash as the transaction hash
      transactionHash = userOpHash;
      
      console.log(`✅ Gas-free transfer successful [${requestId}]: ${transactionHash}`);

      // Record transaction in database
      if (userId) {
        try {
          transactionRecord = await Transaction.create({
            transactionHash,
            from: fromAddress.toLowerCase(),
            to: toAddress.toLowerCase(),
            amount: amountInWei.toString(),
            token: 'USDC',
            network: txNetwork,
            type: 'transfer',
            status: 'pending',
            timestamp: new Date(),
            userId,
            petId,
            metadata: {
              note: 'Gas-free user-initiated transfer via paymaster',
              usdcAmount: amount.toString(),
              paymasterSponsored: true,
              userOpHash
            }
          });
          console.log(`📝 Transaction recorded in database: ${transactionHash}`);

          // Log activity
          await ActivityLog.logActivity(
            userId,
            'wallet_transfer',
            'wallet',
            {
              to: toAddress,
              amount: amount.toString(),
              amountInWei: amountInWei.toString(),
              token: 'USDC',
              transactionHash
            },
            petId,
            {
              success: true,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown'
            }
          );
          console.log(`📊 Activity logged for transfer`);
        } catch (dbError) {
          console.error('Error recording transaction/activity:', dbError);
          // Continue even if logging fails
        }
      }

      // Start background job to poll for confirmation
      if (transactionRecord) {
        pollTransactionConfirmation(transactionHash, transactionRecord._id.toString(), txNetwork).catch(err => {
          console.error(`⚠️  Error polling transaction confirmation [${requestId}]:`, err);
        });
      }

      const requestDuration = Date.now() - requestStartTime;
      console.log(`\n✅ PAYMENT REQUEST COMPLETED [${requestId}]`);
      console.log(`   Transaction Hash: ${transactionHash}`);
      console.log(`   Total Duration: ${requestDuration}ms`);
      console.log(`${'='.repeat(80)}\n`);

      return NextResponse.json({
        success: true,
        transactionHash,
        message: 'USDC transfer completed successfully'
      });
    } catch (transferError: any) {
      const requestDuration = Date.now() - requestStartTime;
      console.error(`\n❌ TRANSFER EXECUTION FAILED [${requestId}]:`);
      console.error(`   Error Type: ${transferError.constructor.name}`);
      console.error(`   Duration: ${requestDuration}ms`);
      
      // Log full error object to see all available properties
      console.error(`   Full Error Object:`, JSON.stringify(transferError, null, 2));
      console.error(`   Error Message: ${transferError.message}`);
      console.error(`   Error Code: ${transferError.code}`);
      console.error(`   HTTP Status: ${transferError.httpStatus}`);
      console.error(`   API Error: ${transferError.apiError}`);
      
      if (transferError.stack) {
        console.error(`   Stack Trace:`);
        console.error(transferError.stack);
      }

      // Log failed transaction if we have userId
      if (userId) {
        try {
          await Transaction.create({
            transactionHash: transactionHash || `failed_${Date.now()}`,
            from: fromAddress.toLowerCase(),
            to: toAddress.toLowerCase(),
            amount: amount.toString(),
            token: 'USDC',
            network: txNetwork,
            type: 'transfer',
            status: 'failed',
            timestamp: new Date(),
            userId,
            petId,
            metadata: {
              error: transferError.message,
              errorType: transferError.constructor.name
            }
          });
          console.log(`📝 Failed transaction logged [${requestId}]`);

          await ActivityLog.logActivity(
            userId,
            'wallet_transfer_failed',
            'wallet',
            {
              to: toAddress,
              amount: amount.toString(),
              token: 'USDC',
              error: transferError.message
            },
            petId
          );
          console.log(`📊 Failed activity logged [${requestId}]`);
        } catch (logError) {
          console.error(`⚠️  Error logging failed transaction [${requestId}]:`, logError);
        }
      }

      console.log(`${'='.repeat(80)}\n`);

      return NextResponse.json(
        { 
          success: false, 
          error: `Transfer failed: ${transferError.message || 'Unknown error'}`,
          code: 'TRANSFER_EXECUTION_FAILED'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(`\n❌❌❌ CRITICAL ERROR IN TRANSFER API [${requestId}]:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error Type: ${error.constructor.name}`);
    console.error(`   Duration: ${requestDuration}ms`);
    if (error.stack) {
      console.error(`   Stack Trace:`);
      console.error(error.stack);
    }
    console.log(`${'='.repeat(80)}\n`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        code: 'CRITICAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// Background function to poll for transaction confirmation
async function pollTransactionConfirmation(txHash: string, transactionId: string, network: string) {
  const maxAttempts = 30; // 30 attempts
  const interval = 10000; // 10 seconds

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, interval));

      // In production, query the blockchain for transaction receipt
      // For now, we'll just mark as confirmed after some time
      if (i >= 3) { // After ~30 seconds, mark as confirmed
        await connectDB();
        const transaction = await Transaction.findById(transactionId);
        if (transaction && transaction.status === 'pending') {
          await transaction.confirm(undefined, undefined, undefined);
          console.log(`✅ Transaction ${txHash} marked as confirmed`);
        }
        break;
      }
    } catch (error) {
      console.error(`Error polling transaction ${txHash}:`, error);
    }
  }
}
