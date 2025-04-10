/**
 * Test script for verifying profile enrichment functionality directly
 * 
 * Run with: npx ts-node src/scripts/test-profile-enrichment-direct.ts
 */

require('dotenv').config();
const perplexity = require('../utils/perplexity');

// Test data
const testCases = [
  { username: 'vitalik', topHoldings: ['ETH', 'UNI', 'AAVE'] },
  { username: 'elonmusk', topHoldings: ['DOGE', 'SHIB', 'FLOKI'] },
  { username: 'satoshi', topHoldings: ['BTC', 'ETH', 'SOL'] }
];

async function runTests() {
  console.log('🧪 Testing Profile Enrichment Functionality');
  console.log('==========================================\n');

  for (const testCase of testCases) {
    try {
      console.log(`Testing with username: ${testCase.username}`);
      console.log(`Top holdings: ${testCase.topHoldings.join(', ')}`);
      
      // Use Promise.all to run both API calls in parallel
      const [summary, archetype] = await Promise.all([
        perplexity.generateUserSummary(testCase.username),
        perplexity.generateTradingArchetype(testCase.topHoldings)
      ]);
      
      console.log('📝 Results:');
      console.log(`Summary: ${summary}`);
      console.log(`Summary length: ${summary.length} characters`);
      console.log(`Archetype: ${archetype}`);
      console.log('------------------------\n');
    } catch (error) {
      console.error(`❌ Error testing profile enrichment for ${testCase.username}:`, error);
    }
  }

  console.log('==========================================');
  console.log('✅ Testing Complete');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 