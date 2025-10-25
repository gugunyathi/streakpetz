import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// USDC ABI - just the balanceOf function
const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
] as const;

// Create viem client for reading blockchain data
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address format' },
        { status: 400 }
      );
    }

    console.log(`💰 Fetching USDC balance for ${address}...`);

    // Read USDC balance from contract
    const balanceWei = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    }) as bigint;

    // Convert from wei (6 decimals) to dollars, then to cents
    const dollars = parseFloat(formatUnits(balanceWei, 6));
    const balanceInCents = Math.floor(dollars * 100);

    console.log(`✅ Balance: ${dollars} USDC (${balanceInCents} cents)`);

    return NextResponse.json({
      success: true,
      balanceInCents,
      balanceInDollars: dollars
    });

  } catch (error: any) {
    console.error('❌ Error fetching balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch balance',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
