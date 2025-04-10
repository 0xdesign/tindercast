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
    
    // For testing, return mock data based on the target FID
    const useMockData = request.nextUrl.searchParams.get('useMockData') === 'true'; // Only use mock data when explicitly requested
    
    if (useMockData) {
      console.log(`[API] Using mock wallet overlap data for FIDs: ${userFid} and ${targetFid}`);
      
      return getMockWalletOverlap(userFid, targetFid);
    }

    // Real implementation for production
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

// Helper function to generate consistent mock data
function getMockWalletOverlap(userFid: number, targetFid: number) {
  // Use FID to generate a deterministic overlap percentage
  const fidNum = parseInt(targetFid.toString().slice(-3));
  const overlapPercentage = (fidNum % 100);
  
  // Create mock common assets
  const commonTokens = [
    { symbol: 'ETH', name: 'Ethereum', imgUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', network: 'ethereum' },
    { symbol: 'BTC', name: 'Bitcoin', imgUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', network: 'bitcoin' },
    { symbol: 'SOL', name: 'Solana', imgUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png', network: 'solana' },
    { symbol: 'USDC', name: 'USD Coin', imgUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', network: 'ethereum' },
    { symbol: 'ARB', name: 'Arbitrum', imgUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png', network: 'arbitrum' },
    { symbol: 'MATIC', name: 'Polygon', imgUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png', network: 'polygon' }
  ];
  
  // Choose a subset of tokens based on the FID
  const numCommonAssets = Math.max(1, fidNum % 5);
  const selectedTokens = commonTokens.slice(0, numCommonAssets);
  
  // Return mock response
  return NextResponse.json({
    topCommonAssets: selectedTokens,
    overlapPercentage: overlapPercentage,
    totalCommonAssets: numCommonAssets
  });
} 