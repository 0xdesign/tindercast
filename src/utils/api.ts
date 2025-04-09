/**
 * Utility functions for making API calls to the Zapper GraphQL API
 */

// GraphQL endpoint for Zapper API
export const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql';

/**
 * Makes a GraphQL request to the Zapper API
 * @param query The GraphQL query
 * @param variables The variables for the query
 * @returns The response data
 */
export async function graphqlRequest(query: string, variables: Record<string, any>) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.ZAPPER_API_KEY;
    
    if (!apiKey) {
      throw new Error('ZAPPER_API_KEY is not set in environment variables');
    }

    console.log('Making GraphQL request to Zapper API');
    
    const response = await fetch(ZAPPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': apiKey
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL API Error:', data.errors);
      throw new Error(`API Error: ${data.errors[0].message}`);
    }
    
    return data.data;
  } catch (error) {
    console.error('GraphQL Request Error:', error);
    throw error;
  }
}

/**
 * Formats and handles API errors
 * @param error The error to format
 * @returns A formatted error object
 */
export function formatApiError(error: unknown): { message: string; status: number } {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500
    };
  }
  return {
    message: 'An unknown error occurred',
    status: 500
  };
} 