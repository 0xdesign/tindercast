/**
 * Test script for verifying Perplexity API integration
 * 
 * Run with: npx ts-node src/scripts/test-perplexity.ts
 */

require('dotenv').config();
const perplexityService = require('../utils/perplexity');

// Test usernames
const testUsernames = ['vitalik', 'elonmusk', 'satoshi'];

// Test token holdings
const testHoldings = [
  ['ETH', 'UNI', 'AAVE'],
  ['DOGE', 'SHIB', 'FLOKI'],
  ['BTC', 'ETH', 'SOL']
];

async function runTests() {
  console.log('🧪 Testing Perplexity API Integration');
  console.log('====================================\n');

  // Test user summary generation
  console.log('📝 Testing User Summary Generation:');
  console.log('------------------------------------');
  
  for (const username of testUsernames) {
    try {
      console.log(`Username: ${username}`);
      const summary = await perplexityService.generateUserSummary(username);
      console.log(`Summary: ${summary}`);
      console.log(`Length: ${summary.length} characters\n`);
    } catch (error) {
      console.error(`❌ Error generating summary for ${username}:`, error);
    }
  }

  // Test trading archetype generation
  console.log('\n📊 Testing Trading Archetype Generation:');
  console.log('------------------------------------');
  
  for (let i = 0; i < testHoldings.length; i++) {
    try {
      const holdings = testHoldings[i];
      console.log(`Holdings: ${holdings.join(', ')}`);
      const archetype = await perplexityService.generateTradingArchetype(holdings);
      console.log(`Archetype: ${archetype}\n`);
    } catch (error) {
      console.error(`❌ Error generating archetype for ${testHoldings[i].join(', ')}:`, error);
    }
  }

  console.log('====================================');
  console.log('✅ Testing Complete');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 