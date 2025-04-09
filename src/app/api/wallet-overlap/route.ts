import { NextRequest, NextResponse } from 'next/server';
import { formatApiError } from '@/utils/api';
import { fetchFarcasterProfile } from '@/utils/farcaster';
import { fetchPortfolio } from '@/utils/portfolio';
import { 
  extractTokenAssets, 
  findCommonAssets, 
  calculateSimilarity 
} from '@/utils/wallet';

/**
 * API handler for wallet overlap calculation
 * POST /api/wallet-overlap
 * Body: { userFid: number, targetFid: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userFid, targetFid } = body;
    
    // Validate FIDs
    if (!userFid || !targetFid) {
      return NextResponse.json(
        { error: 'Missing FID parameters' },
        { status: 400 }
      );
    }
    
    console.log(`Calculating wallet overlap between FIDs: ${userFid} and ${targetFid}`);
    
    // Fetch profiles to get wallet addresses
    const [userProfile, targetProfile] = await Promise.all([
      fetchFarcasterProfile(userFid),
      fetchFarcasterProfile(targetFid)
    ]);
    
    // Get all wallet addresses
    const userAddresses = [
      userProfile.custodyAddress, 
      ...(userProfile.connectedAddresses || [])
    ].filter(Boolean);
    
    const targetAddresses = [
      targetProfile.custodyAddress, 
      ...(targetProfile.connectedAddresses || [])
    ].filter(Boolean);
    
    // Validate addresses
    if (userAddresses.length === 0 || targetAddresses.length === 0) {
      return NextResponse.json(
        { 
          overlapPercentage: 0,
          topCommonAssets: [],
          totalCommonAssets: 0
        }
      );
    }
    
    // Fetch portfolios
    const [userPortfolio, targetPortfolio] = await Promise.all([
      fetchPortfolio(userAddresses),
      fetchPortfolio(targetAddresses)
    ]);
    
    // Extract assets
    const userAssets = extractTokenAssets(userPortfolio);
    const targetAssets = extractTokenAssets(targetPortfolio);
    
    console.log(`Found ${userAssets.length} assets for user and ${targetAssets.length} assets for target`);
    
    // Find common assets
    const commonAssets = findCommonAssets(userAssets, targetAssets);
    
    // Calculate similarity
    const similarity = calculateSimilarity(
      userAssets, 
      targetAssets, 
      commonAssets, 
      userPortfolio, 
      targetPortfolio
    );
    
    // Format response data for display
    const result = {
      // Display top 3 common assets
      topCommonAssets: commonAssets.slice(0, 3).map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        imgUrl: asset.imgUrl,
        network: asset.network
      })),
      // Round to 1 decimal place
      overlapPercentage: Math.round(similarity.valueOverlap * 10) / 10,
      totalCommonAssets: commonAssets.length
    };
    
    console.log(`Wallet overlap calculation complete. Overlap: ${result.overlapPercentage}%, Common assets: ${result.totalCommonAssets}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in wallet-overlap API:', error);
    const formattedError = formatApiError(error);
    return NextResponse.json(
      { error: formattedError.message },
      { status: formattedError.status }
    );
  }
} 