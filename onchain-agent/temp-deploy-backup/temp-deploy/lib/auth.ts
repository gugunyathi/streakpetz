import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect, useMemo } from 'react';

// Privy configuration (disabled for now)
export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  config: {
    loginMethods: ['email', 'wallet'],
    appearance: {
      theme: 'dark',
      accentColor: '#676FFF',
    },
  },
};

// XMTP configuration
export const xmtpConfig = {
  env: process.env.NODE_ENV === 'production' ? 'production' : 'dev',
};

// Wagmi configuration
export const wagmiConfig = {
  chains: [],
  transports: {},
};

// Extended NextAuth User interface
declare module "next-auth" {
  interface User {
    phone?: string;
  }
  
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string;
    }
  }
}

// User interface for NextAuth
interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string;
  image?: string | null;
  wallet?: {
    address: string;
  };
}

// Custom hook for authentication with NextAuth
export function useAuth() {
  const { data: session, status } = useSession();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const ready = status !== 'loading';
  const authenticated = status === 'authenticated' && !!session;
  
  // Transform NextAuth user to our format - wrapped in useMemo to prevent dependency issues
  const user: AuthUser | null = useMemo(() => {
    return session?.user ? {
      id: session.user.email || session.user.phone || 'unknown',
      name: session.user.name,
      email: session.user.email,
      phone: session.user.phone,
      image: session.user.image,
      wallet: walletAddress ? { address: walletAddress } : undefined,
    } : null;
  }, [session?.user, walletAddress]);

  useEffect(() => {
    // When user is authenticated, we can create/retrieve their wallet
    if (authenticated && user && !walletAddress) {
      // This will be handled by the wallet creation flow
      // For now, we'll set a placeholder that gets replaced by actual wallet creation
      setWalletAddress('pending-wallet-creation');
    }
  }, [authenticated, user, walletAddress]);

  const login = async () => {
    await signIn(undefined, { callbackUrl: '/' });
  };

  const logout = async () => {
    await signOut();
    setWalletAddress(null);
  };

  const getAccessToken = async () => {
    // NextAuth doesn't expose access tokens directly
    // You might need to implement this based on your provider
    return session ? 'nextauth-session-token' : null;
  };

  const getEmbeddedWallet = () => {
    return user?.wallet || null;
  };

  const exportWallet = async () => {
    return 'wallet-export-not-implemented';
  };

  const createWallet = async () => {
    return 'wallet-creation-handled-separately';
  };

  const getWalletAddress = () => {
    return walletAddress;
  };

  const setUserWalletAddress = (address: string) => {
    setWalletAddress(address);
  };

  return {
    ready,
    authenticated,
    user,
    login,
    logout,
    getAccessToken,
    getEmbeddedWallet,
    exportWallet,
    createWallet,
    walletAddress: getWalletAddress(),
    setUserWalletAddress,
  };
}

// Helper to get user's wallet signer for XMTP
export const getWalletSigner = async () => {
  // This would need to be implemented based on your wallet provider
  throw new Error('Wallet signer not implemented - XMTP integration pending');
};