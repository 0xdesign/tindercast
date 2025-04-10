import { NextRequest, NextResponse } from 'next/server';
import { fetchSuggestedFollows } from '@/utils/neynar';
import { withCache } from '@/utils/cache';
import { graphqlRequest } from '@/utils/api';

// GraphQL query to get user's following
const FOLLOWING_QUERY = `
  query GetFarcasterFollowing($fid: Int!) {
    farcasterProfile(fid: $fid) {
      following(first: 100) {
        edges {
          node {
            fid
          }
        }
      }
    }
  }
`;

// Cache TTLs in seconds
const SUGGESTED_FOLLOWS_CACHE_TTL = 1800; // 30 minutes
const OVERLAP_CACHE_TTL = 86400; // 24 hours
const FOLLOWING_CACHE_TTL = 3600; // 1 hour

/**
 * Calculates portfolio overlap between two users
 * @param userFid Current user's FID
 * @param targetFid Target user's FID
 * @returns Portfolio overlap data
 */
async function calculatePortfolioOverlap(userFid: number, targetFid: number) {
  const cacheKey = `overlap_${userFid}_${targetFid}`;
  
  return withCache(
    cacheKey,
    async () => {
      try {
        // Fetch wallet overlap from existing API
        // Server-side fetch needs absolute URL
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3010'; // Use the latest detected port
        
        const response = await fetch(`${baseUrl}/api/wallet-overlap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userFid,
            targetFid,
            useMockData: false // Explicitly request real data
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch wallet overlap: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Error calculating portfolio overlap between ${userFid} and ${targetFid}:`, error);
        // Return default overlap data on error
        return {
          overlapPercentage: 0,
          topCommonAssets: []
        };
      }
    },
    OVERLAP_CACHE_TTL
  );
}

/**
 * Gets FIDs that the user is already following
 * @param fid User's FID
 * @returns Array of followed FIDs
 */
async function getFollowing(fid: number): Promise<number[]> {
  const cacheKey = `following_${fid}`;
  
  return withCache(
    cacheKey,
    async () => {
      try {
        const data = await graphqlRequest(FOLLOWING_QUERY, { fid });
        const following = data?.farcasterProfile?.following?.edges || [];
        
        return following.map((edge: any) => edge.node.fid);
      } catch (error) {
        console.error(`Error fetching following for FID ${fid}:`, error);
        return [];
      }
    },
    FOLLOWING_CACHE_TTL
  );
}

/**
 * Endpoint for suggested follows with portfolio overlap
 * GET /api/suggested-follows-with-overlap?fid=<fid>&limit=<limit>&useMockData=<true|false>
 */
export async function GET(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('Environment Variables:');
    console.log('NEYNAR_API_KEY exists:', !!process.env.NEYNAR_API_KEY);
    console.log('ZAPPER_API_KEY exists:', !!process.env.ZAPPER_API_KEY);
    
    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get('fid');
    const limitParam = searchParams.get('limit');
    const useMockData = searchParams.get('useMockData') === 'true'; // Only use mock data when explicitly requested
    
    // Validate parameters
    if (!fidParam) {
      return NextResponse.json(
        { error: 'Missing fid parameter' },
        { status: 400 }
      );
    }
    
    const fid = parseInt(fidParam);
    const limit = limitParam ? parseInt(limitParam) : 20;
    
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid fid parameter' },
        { status: 400 }
      );
    }
    
    // Use mock data for testing or when useMockData is true
    if (useMockData) {
      console.log(`[API] Testing suggested follows endpoint for FID: ${fid}, limit: ${limit}`);
      
      // Return test data with realistic overlap values
      const mockUsers = [
        {
          fid: 12345,
          username: 'test_user1',
          displayName: 'Test User 1',
          imageUrl: 'https://placekitten.com/100/100',
          bio: 'This is a test user',
          overlapCalculated: true,
          overlapPercentage: 75,
          topCommonAssets: [
            { symbol: 'ETH', name: 'Ethereum', imgUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
            { symbol: 'SOL', name: 'Solana', imgUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png' }
          ]
        },
        {
          fid: 67890,
          username: 'test_user2',
          displayName: 'Test User 2',
          imageUrl: 'https://placekitten.com/101/101',
          bio: 'Another test user',
          overlapCalculated: true,
          overlapPercentage: 50,
          topCommonAssets: [
            { symbol: 'BTC', name: 'Bitcoin', imgUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' }
          ]
        },
        {
          fid: 13579,
          username: 'test_user3',
          displayName: 'Test User 3',
          imageUrl: 'https://placekitten.com/102/102',
          bio: 'A third test user',
          overlapCalculated: true,
          overlapPercentage: 25,
          topCommonAssets: [
            { symbol: 'USDC', name: 'USD Coin', imgUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }
          ]
        }
      ];
      
      return NextResponse.json({
        users: mockUsers.slice(0, limit),
        totalCount: mockUsers.length,
      });
    }
    
    // Use real API for production
    console.log(`[API] Fetching suggested follows with overlap for FID: ${fid}, limit: ${limit}`);
    
    // Step 1: Fetch suggested follows (cached)
    const suggestedFollowsResult = await withCache(
      `suggested_follows_${fid}_${limit}`,
      async () => fetchSuggestedFollows(fid),
      SUGGESTED_FOLLOWS_CACHE_TTL
    );
    
    const suggestedUsers = suggestedFollowsResult.users || [];
    
    // Step 2: Get users that the current user is already following
    const followingFids = await getFollowing(fid);
    
    // Step 3: Filter out users already followed
    const notFollowedUsers = suggestedUsers.filter(
      user => !followingFids.includes(user.fid)
    );
    
    // Step 4: First, return basic user data for immediate display
    const usersWithBasicData = notFollowedUsers.slice(0, limit).map(user => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      imageUrl: user.pfp_url,
      bio: user.profile?.bio?.text || '',
      overlapCalculated: false,
      overlapPercentage: 0,
      topCommonAssets: [],
    }));
    
    // Step 5: Start portfolio overlap calculations
    const overlapPromises = usersWithBasicData.map(async user => {
      try {
        const overlap = await calculatePortfolioOverlap(fid, user.fid);
        
        return {
          ...user,
          overlapCalculated: true,
          overlapPercentage: overlap.overlapPercentage || 0,
          topCommonAssets: overlap.topCommonAssets || [],
        };
      } catch (error) {
        console.error(`Error calculating overlap for FID ${user.fid}:`, error);
        return user;
      }
    });
    
    // Wait for all overlap calculations to complete
    const usersWithOverlap = await Promise.all(overlapPromises);
    
    // Sort by overlap percentage (highest first)
    const sortedUsers = [...usersWithOverlap].sort(
      (a, b) => b.overlapPercentage - a.overlapPercentage
    );
    
    return NextResponse.json({
      users: sortedUsers,
      totalCount: notFollowedUsers.length,
    });
  } catch (error) {
    console.error('[API] Error in endpoint:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}