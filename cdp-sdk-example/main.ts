import { CdpClient } from "@coinbase/cdp-sdk"; 
import { http, createPublicClient, parseEther } from "viem"; 
import { baseSepolia } from "viem/chains"; 
import dotenv from "dotenv"; 
 
dotenv.config(); 
 
const cdp = new CdpClient(); 
 
const publicClient = createPublicClient({ 
  chain: baseSepolia, 
  transport: http(), 
}); 
 
// Step 1: Create a new EVM account. 
const account = await cdp.evm.createAccount(); 
console.log("Successfully created EVM account:", account.address); 
 
// Step 2: Request ETH from the faucet. 
const { transactionHash: faucetTransactionHash } = await cdp.evm.requestFaucet({ 
  address: account.address, 
  network: "base-sepolia", 
  token: "eth", 
}); 
 
const faucetTxReceipt = await publicClient.waitForTransactionReceipt({ 
  hash: faucetTransactionHash, 
}); 
console.log("Successfully requested ETH from faucet:", faucetTxReceipt.transactionHash); 
 
// Step 3: Use the v2 Server Wallet to send a transaction. 
const transactionResult = await cdp.evm.sendTransaction({ 
  address: account.address, 
  transaction: { 
    to: "0x0000000000000000000000000000000000000000", 
    value: parseEther("0.000001"), 
  }, 
  network: "base-sepolia", 
}); 
 
// Step 4: Wait for the transaction to be confirmed 
const txReceipt = await publicClient.waitForTransactionReceipt({ 
  hash: transactionResult.transactionHash, 
}); 
 
console.log( 
  `Transaction sent! Link: https://sepolia.basescan.org/tx/${transactionResult.transactionHash}` 
);