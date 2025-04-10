import { NextRequest, NextResponse } from 'next/server';
import { formatApiError } from '@/utils/api';
// Import using require syntax for CommonJS compatibility
const { generateUserSummary, generateTradingArchetype } = require('@/utils/perplexity');

// Simple in-memory cache
interface CacheEntry {
  timestamp: number;
  data: any;
}

// Cache responses for 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000; 
const summaryCache = new Map<string, CacheEntry>();
const archetypeCache = new Map<string, CacheEntry>();

// Interface for the user profile summary response
interface UserSummaryResponse {
  description: string;
}

// Interface for the trading archetype response
interface TradingArchetypeResponse {
  archetype: string;
}

/**
 * API handler for enriching user profiles with Perplexity AI
 * POST /api/profile-enrichment
 * Body: { username: string, topHoldings: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { username, topHoldings } = body;

    // Validate inputs
    if (!username) {
      return NextResponse.json(
        { error: 'Missing username parameter' },
        { status: 400 }
      );
    }

    console.log(`Enriching profile for username: ${username}`);
    
    // Check cache for summary
    let summary: string;
    const cachedSummary = summaryCache.get(username);
    
    if (cachedSummary && (Date.now() - cachedSummary.timestamp < CACHE_TTL)) {
      console.log(`Using cached summary for ${username}`);
      summary = cachedSummary.data;
    } else {
      // Generate new summary
      summary = await generateUserSummary(username);
      // Update cache
      summaryCache.set(username, {
        timestamp: Date.now(),
        data: summary
      });
    }
    
    // Check cache for archetype if topHoldings are provided
    let archetype: string = '';
    
    if (topHoldings && topHoldings.length > 0) {
      const holdingsKey = topHoldings.sort().join(',');
      const cachedArchetype = archetypeCache.get(holdingsKey);
      
      if (cachedArchetype && (Date.now() - cachedArchetype.timestamp < CACHE_TTL)) {
        console.log(`Using cached archetype for ${holdingsKey}`);
        archetype = cachedArchetype.data;
      } else {
        // Generate new archetype
        archetype = await generateTradingArchetype(topHoldings);
        // Update cache
        archetypeCache.set(holdingsKey, {
          timestamp: Date.now(),
          data: archetype
        });
      }
    }
    
    console.log(`Profile enrichment complete for ${username}`);
    
    return NextResponse.json({
      summary,
      archetype,
      username
    });
  } catch (error) {
    console.error('Error in profile-enrichment API:', error);
    const formattedError = formatApiError(error);
    return NextResponse.json(
      { error: formattedError.message },
      { status: formattedError.status }
    );
  }
} 