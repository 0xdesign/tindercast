import { NextRequest, NextResponse } from 'next/server';
import { formatApiError } from '@/utils/api';

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
 * Makes a request to the Perplexity API
 */
async function perplexityRequest(
  messages: Array<{ role: string; content: string }>,
  responseFormat?: { type: string; json_schema?: any; regex?: any }
) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is not set in environment variables');
    }

    console.log('Making request to Perplexity API');
    
    const requestBody: any = {
      model: "sonar-pro", // Using the best model available
      messages,
    };

    // Add response format if provided
    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API Error:', errorText);
      throw new Error(`Perplexity API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Perplexity Request Error:', error);
    throw error;
  }
}

/**
 * Generates a user profile summary using Perplexity AI
 */
async function generateUserSummary(username: string): Promise<string> {
  try {
    console.log(`Generating user summary for: ${username}`);
    
    // Define the JSON schema for structured output
    const jsonSchema = {
      schema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "A 50-80 character one-sentence summary of the user"
          }
        },
        required: ["description"]
      }
    };
    
    // Create messages for the chat completion
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that generates concise, engaging user descriptions. Your responses should be friendly and positive in tone."
      },
      {
        role: "user",
        content: `Please generate a one-sentence summary (50-80 characters) that describes a person based on the username "${username}" from Farcaster. Focus on likely personality traits, interests, or characteristics someone with this username might have. If you can't infer anything meaningful, provide a generic but positive description.`
      }
    ];
    
    // Make the request with structured output format
    const response = await perplexityRequest(messages, {
      type: "json_schema",
      json_schema: jsonSchema
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    const summary: UserSummaryResponse = JSON.parse(content);
    
    console.log(`Generated summary: ${summary.description}`);
    return summary.description;
  } catch (error) {
    console.error('Error generating user summary:', error);
    // Return a fallback description
    return "A mysterious Farcaster user with unique perspectives.";
  }
}

/**
 * Generates a trading archetype based on the user's top holdings
 */
async function generateTradingArchetype(topHoldings: string[]): Promise<string> {
  try {
    if (!topHoldings || topHoldings.length === 0) {
      return "Crypto Explorer";
    }
    
    const holdingsString = topHoldings.join(", ");
    console.log(`Generating trading archetype for holdings: ${holdingsString}`);
    
    // Define the JSON schema for structured output
    const jsonSchema = {
      schema: {
        type: "object",
        properties: {
          archetype: {
            type: "string",
            description: "A 1-2 word trading archetype that describes the user's investment style"
          }
        },
        required: ["archetype"]
      }
    };
    
    // Create messages for the chat completion
    const messages = [
      {
        role: "system",
        content: "You are a financial analyst who specializes in categorizing traders based on their portfolio holdings. Respond with exactly 1-2 words."
      },
      {
        role: "user",
        content: `Based on these top cryptocurrency holdings: ${holdingsString}, what would be a concise 1-2 word trading archetype that describes this trader's style or focus? Examples might be: 'DeFi Maximalist', 'ETH Whale', 'Meme Trader', etc. Be creative but relevant to the specific tokens.`
      }
    ];
    
    // Make the request with structured output format
    const response = await perplexityRequest(messages, {
      type: "json_schema",
      json_schema: jsonSchema
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    const result: TradingArchetypeResponse = JSON.parse(content);
    
    console.log(`Generated archetype: ${result.archetype}`);
    return result.archetype;
  } catch (error) {
    console.error('Error generating trading archetype:', error);
    // Return a fallback archetype
    return "Crypto Enthusiast";
  }
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