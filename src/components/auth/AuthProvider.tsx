'use client';

import { ReactNode } from 'react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import '@farcaster/auth-kit/styles.css';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // Configure AuthKit
  const config = {
    // Use the current domain for authentication
    domain: typeof window !== 'undefined' ? window.location.host : '',
    // Set the OAuth URI to the current page
    siweUri: typeof window !== 'undefined' ? window.location.origin : '',
    // Connect to Optimism Mainnet (the default for Farcaster)
    rpcUrl: 'https://mainnet.optimism.io',
  };

  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  );
} 