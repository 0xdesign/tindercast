/**
 * Utility functions for Farcaster profile data
 */
import { graphqlRequest } from './api';

// GraphQL query to get Farcaster profile
const FARCASTER_PROFILE_QUERY = `
  query FarcasterProfileQuery($fid: Int!) {
    farcasterProfile(fid: $fid) {
      username
      fid
      connectedAddresses
      custodyAddress
      metadata {
        displayName
        description
        imageUrl
      }
    }
  }
`;

export interface FarcasterProfile {
  username: string;
  fid: number;
  displayName: string;
  description: string;
  imageUrl: string;
  custodyAddress: string;
  connectedAddresses: string[];
}

/**
 * Fetches a Farcaster profile by FID
 * @param fid Farcaster ID
 * @returns Formatted Farcaster profile data
 */
export async function fetchFarcasterProfile(fid: number): Promise<FarcasterProfile> {
  try {
    const data = await graphqlRequest(FARCASTER_PROFILE_QUERY, { fid });
    
    if (!data?.farcasterProfile) {
      throw new Error(`No Farcaster profile found for FID: ${fid}`);
    }
    
    const profile = data.farcasterProfile;
    
    return {
      username: profile.username,
      fid: profile.fid,
      displayName: profile.metadata?.displayName || profile.username,
      description: profile.metadata?.description || '',
      imageUrl: profile.metadata?.imageUrl || '',
      custodyAddress: profile.custodyAddress || '',
      connectedAddresses: profile.connectedAddresses || []
    };
  } catch (error) {
    console.error(`Error fetching Farcaster profile for FID ${fid}:`, error);
    throw error;
  }
}

/**
 * Fetches wallet addresses for a Farcaster profile
 * @param fid Farcaster ID
 * @returns Array of wallet addresses
 */
export async function fetchWalletAddresses(fid: number): Promise<string[]> {
  const profile = await fetchFarcasterProfile(fid);
  
  const addresses = [];
  
  if (profile.custodyAddress) {
    addresses.push(profile.custodyAddress);
  }
  
  if (profile.connectedAddresses && profile.connectedAddresses.length > 0) {
    addresses.push(...profile.connectedAddresses);
  }
  
  return addresses;
} 