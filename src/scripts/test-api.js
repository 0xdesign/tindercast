/**
 * Simple script to test the API endpoints directly
 * Run with: node -r dotenv/config src/scripts/test-api.js
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql';
const API_KEY = process.env.ZAPPER_API_KEY;

// Test fetching Farcaster profile
async function testFarcasterProfile() {
  const FID = 1317; // Test with FID 1317 as requested

  const query = `
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

  try {
    console.log(`Testing Farcaster profile fetch for FID: ${FID}`);
    
    const response = await fetch(ZAPPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': API_KEY
      },
      body: JSON.stringify({
        query,
        variables: { fid: FID }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL API Error:', data.errors);
      return;
    }
    
    const profile = data.data?.farcasterProfile;
    
    if (profile) {
      console.log('Farcaster Profile Test: SUCCESS');
      console.log('Username:', profile.username);
      console.log('FID:', profile.fid);
      console.log('Display Name:', profile.metadata?.displayName);
      console.log('Has custody address:', !!profile.custodyAddress);
      console.log('Connected addresses count:', (profile.connectedAddresses || []).length);
      
      // Log the first connected address for portfolio testing
      if (profile.connectedAddresses && profile.connectedAddresses.length > 0) {
        console.log('First connected address:', profile.connectedAddresses[0]);
        return profile.connectedAddresses[0];
      } else if (profile.custodyAddress) {
        console.log('Custody address:', profile.custodyAddress);
        return profile.custodyAddress;
      }
    } else {
      console.log('Farcaster Profile Test: FAILED - No profile found');
    }
    return null;
  } catch (error) {
    console.error('Farcaster Profile Test: ERROR', error);
    return null;
  }
}

// Test fetching following profiles
async function testFollowing() {
  const FID = 1317; // Test with FID 1317 as requested

  const query = `
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

  try {
    console.log(`\nTesting following profiles fetch for FID: ${FID}`);
    
    const response = await fetch(ZAPPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': API_KEY
      },
      body: JSON.stringify({
        query,
        variables: { fid: FID }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL API Error:', data.errors);
      return;
    }
    
    const followingEdges = data.data?.farcasterProfile?.following?.edges || [];
    
    if (followingEdges.length > 0) {
      console.log('Following Test: SUCCESS');
      console.log('Following count:', followingEdges.length);
      console.log('First following profile:', followingEdges[0].node.username);
      return followingEdges;
    } else {
      console.log('Following Test: FAILED - No following profiles found');
    }
    return [];
  } catch (error) {
    console.error('Following Test: ERROR', error);
    return [];
  }
}

// Test fetching portfolio data
async function testPortfolio(address) {
  if (!address) {
    // Use a fallback address if none is provided
    address = '0x3b13f57e6b590f4a350685515d6e4a7276324a88';
  }

  const query = `
    query PortfolioQuery($addresses: [Address!]!) {
      portfolioV2(addresses: $addresses) {
        tokenBalances {
          totalBalanceUSD
          byToken(first: 5) {
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

  try {
    console.log(`\nTesting portfolio fetch for address: ${address}`);
    
    const response = await fetch(ZAPPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': API_KEY
      },
      body: JSON.stringify({
        query,
        variables: { addresses: [address] }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL API Error:', data.errors);
      return null;
    }
    
    const portfolio = data.data?.portfolioV2;
    
    if (portfolio) {
      console.log('Portfolio Test: SUCCESS');
      console.log('Total Balance USD:', portfolio.tokenBalances?.totalBalanceUSD);
      
      const tokens = portfolio.tokenBalances?.byToken?.edges || [];
      console.log('Token count:', tokens.length);
      
      if (tokens.length > 0) {
        console.log('First token:', tokens[0].node.symbol);
      }
      return portfolio;
    } else {
      console.log('Portfolio Test: FAILED - No portfolio data found');
    }
    return null;
  } catch (error) {
    console.error('Portfolio Test: ERROR', error);
    return null;
  }
}

// Test calculating wallet overlap
async function testWalletOverlap(following) {
  if (!following || following.length < 1) {
    console.log('\nSkipping wallet overlap test - no following profiles available');
    return;
  }
  
  try {
    console.log('\nTesting wallet overlap calculation');
    
    // Get a profile from the following list
    const targetProfile = following[0].node;
    
    // Check if we have addresses to work with
    if ((!targetProfile.custodyAddress && (!targetProfile.connectedAddresses || targetProfile.connectedAddresses.length === 0))) {
      console.log('Wallet Overlap Test: SKIPPED - No wallet addresses found');
      return;
    }
    
    // Get user profile (FID 1317)
    const userAddress = await testFarcasterProfile();
    
    if (!userAddress) {
      console.log('Wallet Overlap Test: SKIPPED - No user wallet address found');
      return;
    }
    
    // Get target address
    const targetAddress = targetProfile.custodyAddress || targetProfile.connectedAddresses[0];
    
    // Fetch both portfolios
    const [userPortfolio, targetPortfolio] = await Promise.all([
      testPortfolio(userAddress),
      testPortfolio(targetAddress)
    ]);
    
    if (!userPortfolio || !targetPortfolio) {
      console.log('Wallet Overlap Test: FAILED - Could not fetch portfolios');
      return;
    }
    
    console.log('\nWallet Overlap Test: SUCCESS - Able to fetch both portfolios');
    console.log('User portfolio total USD:', userPortfolio.tokenBalances?.totalBalanceUSD);
    console.log('Target portfolio total USD:', targetPortfolio.tokenBalances?.totalBalanceUSD);
    
    // We would calculate overlap here in a real implementation
    console.log('Note: Full overlap calculation would be implemented in the API');
  } catch (error) {
    console.error('Wallet Overlap Test: ERROR', error);
  }
}

// Run the tests
async function runTests() {
  console.log('Starting API Tests');
  console.log('API Key available:', !!API_KEY);
  
  await testFarcasterProfile();
  const following = await testFollowing();
  await testPortfolio();
  await testWalletOverlap(following);
  
  console.log('\nTests completed');
}

runTests(); 