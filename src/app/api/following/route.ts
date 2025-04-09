import { NextRequest, NextResponse } from 'next/server';
import { graphqlRequest, formatApiError } from '@/utils/api';

// GraphQL query to get Farcaster following profiles
const FOLLOWING_QUERY = `
  query GetFarcasterFollowing($fid: Int!) {
    farcasterProfile(fid: $fid) {
      following(first: 5) {
        edges {
          node {
            fid
            username
            custodyAddress
            connectedAddresses
            metadata {
              displayName
              description
              imageUrl
            }
          }
        }
      }
    }
  }
`;

/**
 * API handler for fetching followers
 * POST /api/following
 * Body: { fid: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { fid } = body;

    // Validate FID
    if (!fid || typeof fid !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid FID parameter' },
        { status: 400 }
      );
    }

    console.log(`Fetching following profiles for FID: ${fid}`);
    
    // Make the GraphQL request
    const data = await graphqlRequest(FOLLOWING_QUERY, { fid });
    
    // Extract following profiles
    const following = data?.farcasterProfile?.following?.edges || [];
    
    // Format the response data
    const followingProfiles = following.map((edge: any) => {
      const profile = edge.node;
      return {
        fid: profile.fid,
        username: profile.username,
        displayName: profile.metadata?.displayName || profile.username,
        description: profile.metadata?.description || '',
        imageUrl: profile.metadata?.imageUrl || '',
        custodyAddress: profile.custodyAddress,
        connectedAddresses: profile.connectedAddresses || []
      };
    });
    
    console.log(`Found ${followingProfiles.length} following profiles`);
    
    return NextResponse.json({ following: followingProfiles });
  } catch (error) {
    console.error('Error in following API:', error);
    const formattedError = formatApiError(error);
    return NextResponse.json(
      { error: formattedError.message },
      { status: formattedError.status }
    );
  }
} 