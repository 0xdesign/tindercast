/**
 * Test script for verifying profile enrichment API
 * 
 * Run with: npx ts-node src/scripts/test-profile-enrichment.ts
 */

import 'dotenv/config';
import fetch from 'node-fetch';

// Test data
const testCases = [
  { username: 'vitalik', topHoldings: ['ETH', 'UNI', 'AAVE'] },
  { username: 'elonmusk', topHoldings: ['DOGE', 'SHIB', 'FLOKI'] },
  { username: 'satoshi', topHoldings: ['BTC', 'ETH', 'SOL'] }
];

// Mock server URL (for local testing)
const API_URL = 'http://localhost:3000/api/profile-enrichment';

async function runTests() {
  console.log('🧪 Testing Profile Enrichment API');
  console.log('================================\n');

  for (const testCase of testCases) {
    try {
      console.log(`Testing with username: ${testCase.username}`);
      console.log(`Top holdings: ${testCase.topHoldings.join(', ')}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase)
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('📝 Results:');
      console.log(`Summary: ${data.summary}`);
      console.log(`Archetype: ${data.archetype}`);
      console.log('------------------------\n');
    } catch (error) {
      console.error(`❌ Error testing profile enrichment for ${testCase.username}:`, error);
    }
  }

  console.log('================================');
  console.log('✅ Testing Complete');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 