/**
 * Utility functions for portfolio data
 */
import { graphqlRequest } from './api';

// Query to fetch portfolio data
const PORTFOLIO_QUERY = `
  query PortfolioQuery($addresses: [Address!]!, $first: Int = 100) {
    portfolioV2(addresses: $addresses) {
      tokenBalances {
        totalBalanceUSD
        byToken(first: $first) {
          totalCount
          edges {
            node {
              symbol
              tokenAddress
              balance
              balanceUSD
              price
              name
              network {
                name
              }
              imgUrlV2
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetches portfolio data for a set of addresses
 * @param addresses Array of wallet addresses
 * @returns Portfolio data
 */
export async function fetchPortfolio(addresses: string[]) {
  try {
    if (!addresses || addresses.length === 0) {
      throw new Error('No addresses provided');
    }
    
    console.log(`Fetching portfolio data for ${addresses.length} addresses`);
    
    const data = await graphqlRequest(PORTFOLIO_QUERY, { addresses });
    
    if (!data?.portfolioV2) {
      throw new Error('Failed to fetch portfolio data');
    }
    
    return data.portfolioV2;
  } catch (error) {
    console.error(`Error fetching portfolio for addresses:`, error);
    throw error;
  }
} 