import { NextRequest, NextResponse } from 'next/server';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { parseUnits } from 'viem';
import Wallets from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';
import ActivityLog from '@/lib/models/ActivityLog';
import connectDB from '@/lib/database';
import { rateLimiters } from '@/lib/rate-limiter';

// USDC contract address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Configure Coinbase SDK
let isConfigured = false;

function ensureCoinbaseConfigured() {
  if (!isConfigured) {
    try {
      if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
        throw new Error('CDP_API_KEY_ID and CDP_API_KEY_SECRET must be set');
      }

      const config: any = {
        apiKeyName: process.env.CDP_API_KEY_ID,
        privateKey: process.env.CDP_API_KEY_SECRET,
      };

      Coinbase.configure(config);
      isConfigured = true;
      console.log('✅ Coinbase SDK configured');
    } catch (error) {
      console.error('Failed to configure Coinbase SDK:', error);
      throw error;
    }
  }
  return true;
}

/**
 * Simplified payment endpoint using CDP SDK's sendTransaction
 * This handles USDC transfers with automatic gas sponsorship via paymaster
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  const requestId = `pay_${requestStartTime}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`💳 SIMPLE PAYMENT STARTED [${requestId}]`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Ensure SDK is configured
    ensureCoinbaseConfigured();
    
    // Rate limiting
    const rateLimitResponse = rateLimiters.transaction(request);
    if (rateLimitResponse) {
      console.log(`❌ Rate limit exceeded [${requestId}]`);
      return rateLimitResponse;
    }
    
    const body = await request.json();
    const { fromAddress, toAddress, amountInCents, network = 'base-sepolia', userId, petId } = body;
    
    console.log(`📋 Payment Details [${requestId}]:`, {
      from: fromAddress,
      to: toAddress,
      amount: `$${(amountInCents / 100).toFixed(2)}`,
      network
    });
    
    // Validate inputs
    if (!fromAddress || !toAddress || !amountInCents) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Get wallet from database
    const walletRecord = await Wallets.findOne({ 
      address: fromAddress.toLowerCase() 
    });
    
    if (!walletRecord) {
      console.error(`❌ Wallet not found [${requestId}]: ${fromAddress}`);
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Wallet found [${requestId}]`);
    
    // Import wallet from stored data
    if (!walletRecord.walletData) {
      console.error(`❌ Wallet missing walletData [${requestId}]`);
      return NextResponse.json(
        { success: false, error: 'Wallet not properly initialized' },
        { status: 400 }
      );
    }
    
    let wallet;
    try {
      const walletData = JSON.parse(walletRecord.walletData);
      wallet = await Wallet.import(walletData);
      console.log(`✅ Wallet imported [${requestId}]`);
    } catch (importError: any) {
      console.error(`❌ Failed to import wallet [${requestId}]:`, importError);
      return NextResponse.json(
        { success: false, error: 'Failed to import wallet for signing' },
        { status: 500 }
      );
    }
    
    // Convert cents to USDC wei (6 decimals)
    const dollars = amountInCents / 100;
    const amountInWei = parseUnits(dollars.toString(), 6);
    
    console.log(`💰 Transfer amount: ${amountInWei} wei (${dollars} USDC)`);
    
    // Invoke USDC contract transfer method
    console.log(`📤 Invoking USDC transfer [${requestId}]...`);
    
    const contractInvocation = await wallet.invokeContract({
      contractAddress: USDC_ADDRESS,
      method: 'transfer',
      args: {
        to: toAddress,
        value: amountInWei.toString()
      }
    });
    
    // Wait for transaction to be broadcast
    await contractInvocation.wait();
    
    const transactionHash = contractInvocation.getTransactionHash();
    
    console.log(`✅ Transaction sent! [${requestId}]`);
    console.log(`   Hash: ${transactionHash}`);
    console.log(`   Explorer: https://sepolia.basescan.org/tx/${transactionHash}`);
    
    // Record transaction in database
    if (userId) {
      try {
        await Transaction.create({
          transactionHash,
          from: fromAddress.toLowerCase(),
          to: toAddress.toLowerCase(),
          amount: amountInWei.toString(),
          token: 'USDC',
          network,
          type: 'store_purchase',
          status: 'confirmed',
          timestamp: new Date(),
          userId,
          petId,
          metadata: {
            note: 'Pet store purchase - gas-free via CDP paymaster',
            usdcAmount: dollars.toString(),
            paymasterSponsored: true
          }
        });
        
        // Log activity
        await ActivityLog.logActivity(
          userId,
          'store_purchase',
          'purchase',
          {
            to: toAddress,
            amount: dollars.toString(),
            token: 'USDC',
            transactionHash
          },
          petId,
          {
            success: true,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
          }
        );
        
        console.log(`📝 Transaction recorded [${requestId}]`);
      } catch (dbError) {
        console.error('Error recording transaction:', dbError);
        // Continue even if logging fails
      }
    }
    
    const duration = Date.now() - requestStartTime;
    console.log(`\n✅ PAYMENT COMPLETED [${requestId}] in ${duration}ms`);
    console.log(`${'='.repeat(80)}\n`);
    
    return NextResponse.json({
      success: true,
      transactionHash,
      message: 'Payment successful'
    });
    
  } catch (error: any) {
    const duration = Date.now() - requestStartTime;
    console.error(`\n❌ PAYMENT FAILED [${requestId}] after ${duration}ms:`, error);
    console.log(`${'='.repeat(80)}\n`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Payment failed'
      },
      { status: 500 }
    );
  }
}
