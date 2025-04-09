/**
 * Utility functions for wallet data processing and comparison
 */

export interface Asset {
  type: 'token';
  address: string;
  network: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUSD: number;
  price: number;
  imgUrl?: string;
}

export interface CommonAsset {
  symbol: string;
  name: string;
  network: string;
  address: string;
  type: 'token';
  imgUrl?: string;
  user1Balance: {
    balance: string;
    balanceUSD: number;
  };
  user2Balance: {
    balance: string;
    balanceUSD: number;
  };
  totalBalanceUSD: number;
}

export interface SimilarityMetrics {
  assetCountSimilarity: number;
  valueOverlap: number;
  user1TotalUSD: number;
  user2TotalUSD: number;
  commonAssetsUSD: number;
}

/**
 * Extracts token assets from a portfolio
 * @param portfolio Portfolio data from Zapper API
 * @returns Array of token assets
 */
export function extractTokenAssets(portfolio: any): Asset[] {
  if (!portfolio || !portfolio.tokenBalances || !portfolio.tokenBalances.byToken) {
    return [];
  }

  const assets: Asset[] = [];
  const tokenEdges = portfolio.tokenBalances.byToken.edges || [];
  
  tokenEdges.forEach((edge: any) => {
    const token = edge.node;
    if (token) {
      assets.push({
        type: 'token',
        address: token.tokenAddress,
        network: token.network?.name || 'unknown',
        symbol: token.symbol,
        name: token.name || token.symbol || 'Unknown Token',
        balance: token.balance || '0',
        balanceUSD: token.balanceUSD || 0,
        price: token.price || 0,
        imgUrl: token.imgUrlV2 || ''
      });
    }
  });
  
  return assets;
}

/**
 * Creates a unique key for an asset
 * @param asset Asset data
 * @returns Unique identifier string
 */
export function getAssetKey(asset: Asset): string {
  // For tokens, use address and network
  return `${asset.network}:${asset.address}`;
}

/**
 * Finds common assets between two portfolios
 * @param assets1 Assets from first user
 * @param assets2 Assets from second user
 * @returns Array of common assets
 */
export function findCommonAssets(assets1: Asset[], assets2: Asset[]): CommonAsset[] {
  const common: CommonAsset[] = [];
  const asset2Map = new Map();
  
  // Create a map of asset2 for faster lookup
  assets2.forEach(asset => {
    const key = getAssetKey(asset);
    asset2Map.set(key, asset);
  });
  
  // Find matches
  assets1.forEach(asset1 => {
    const key = getAssetKey(asset1);
    const match = asset2Map.get(key);
    
    if (match) {
      common.push({
        symbol: asset1.symbol,
        name: asset1.name,
        network: asset1.network,
        address: asset1.address,
        type: 'token',
        imgUrl: asset1.imgUrl,
        user1Balance: {
          balance: asset1.balance,
          balanceUSD: asset1.balanceUSD
        },
        user2Balance: {
          balance: match.balance,
          balanceUSD: match.balanceUSD
        },
        totalBalanceUSD: asset1.balanceUSD + match.balanceUSD
      });
    }
  });
  
  // Sort by value (highest first)
  return common.sort((a, b) => b.totalBalanceUSD - a.totalBalanceUSD);
}

/**
 * Calculates similarity metrics between two portfolios
 * @param user1Assets Assets from first user
 * @param user2Assets Assets from second user
 * @param commonAssets Common assets between users
 * @param portfolio1 Full portfolio data for first user
 * @param portfolio2 Full portfolio data for second user
 * @returns Similarity metrics
 */
export function calculateSimilarity(
  user1Assets: Asset[],
  user2Assets: Asset[],
  commonAssets: CommonAsset[],
  portfolio1: any,
  portfolio2: any
): SimilarityMetrics {
  // Calculate total values
  const user1Total = portfolio1?.tokenBalances?.totalBalanceUSD || 
    user1Assets.reduce((sum, asset) => sum + (asset.balanceUSD || 0), 0);
  
  const user2Total = portfolio2?.tokenBalances?.totalBalanceUSD || 
    user2Assets.reduce((sum, asset) => sum + (asset.balanceUSD || 0), 0);
  
  const commonTotal = commonAssets.reduce((sum, asset) => sum + asset.totalBalanceUSD / 2, 0);
  
  // Calculate percentage metrics
  const valueOverlap = (commonTotal / ((user1Total + user2Total) / 2)) * 100;
  const assetCountSimilarity = (commonAssets.length / Math.max(user1Assets.length, user2Assets.length)) * 100;
  
  return {
    assetCountSimilarity,
    valueOverlap,
    user1TotalUSD: user1Total,
    user2TotalUSD: user2Total,
    commonAssetsUSD: commonTotal
  };
} 