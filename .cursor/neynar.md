# Neynar API: General Documentation

This document provides general information about the Neynar API and its integration in our app.

## Overview
Neynar is a developer platform for building apps on Farcaster. It provides a suite of APIs for accessing and interacting with the Farcaster network without having to run a Hub.

## API Base URL
All Neynar API endpoints use the following base URL:
```
https://api.neynar.com/v2/farcaster
```

## Authentication
All requests to the Neynar API require authentication using an API key provided in the request headers:

```javascript
headers: {
  'accept': 'application/json',
  'api_key': 'NEYNAR_API_KEY'  // Replace with your actual API key
}
```

## Required Environment Variables
For our app, we'll need to add the following environment variable:
```
NEYNAR_API_KEY=your_api_key_here
```

## Rate Limits
Neynar API has rate limits depending on your plan. These limits are applied per API key:
- Free tier: 100 requests per minute
- Growth tier: 1,000 requests per minute
- Enterprise tier: Custom limits

If rate limits are exceeded, the API will return a 429 error.

## Integration with Our App

### 1. Utility Module
We'll create a new utility module for Neynar API interactions:

```typescript
// src/utils/neynar.ts

const NEYNAR_API_BASE_URL = 'https://api.neynar.com/v2/farcaster';

/**
 * Makes a request to the Neynar API
 * @param endpoint The API endpoint (without the base URL)
 * @param options Fetch options (method, body, etc.)
 * @returns The response data
 */
export async function neynarRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY is not set in environment variables');
    }
    
    const url = `${NEYNAR_API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'accept': 'application/json',
        'api_key': apiKey,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Neynar API Error:', error);
    throw error;
  }
}
```

### 2. Local Storage Schema
We'll need to store signer information in local storage for persistence across sessions:

```typescript
interface SignerInfo {
  signer_uuid: string;
  public_key: string;
  status: 'pending_approval' | 'approved' | 'revoked';
  created_at: number; // Timestamp
  deadline?: number; // Optional expiry timestamp
}

// To store in localStorage:
localStorage.setItem('farcaster_signer', JSON.stringify(signerInfo));

// To retrieve:
const signerInfo: SignerInfo | null = JSON.parse(localStorage.getItem('farcaster_signer') || 'null');
```

### 3. API Endpoints to Implement
We'll create the following Next.js API routes:

1. **Create/Get Signer**
   - `POST /api/signer`
   - Creates a new signer or returns an existing one

2. **Check Signer Status**
   - `GET /api/signer/status`
   - Checks the status of a signer

3. **Follow User**
   - `POST /api/follow`
   - Follows a user on Farcaster

4. **Suggested Follows**
   - `GET /api/suggested-follows`
   - Gets suggested users with portfolio overlap

## Error Handling Strategy
To handle API errors consistently:

1. Create typed error responses:
```typescript
interface NeynarApiError {
  code: string;
  message: string;
  status: number;
}
```

2. Create a custom error handler:
```typescript
function handleNeynarError(error: unknown): NeynarApiError {
  if (error instanceof Error) {
    // Try to parse the error message if it's a JSON string
    try {
      const parsedError = JSON.parse(error.message);
      return {
        code: parsedError.code || 'unknown_error',
        message: parsedError.message || error.message,
        status: parsedError.status || 500
      };
    } catch {
      // Not a JSON string, return as is
      return {
        code: 'unknown_error',
        message: error.message,
        status: 500
      };
    }
  }
  
  return {
    code: 'unknown_error',
    message: 'An unknown error occurred',
    status: 500
  };
}
```

## Security Considerations

1. **API Key Security**
   - Never expose your API key in client-side code
   - Always make Neynar API calls from server-side code

2. **User Authorization**
   - Ensure that follow actions are performed only when the user has explicitly requested them
   - Implement proper signer approval flows

3. **Data Persistence**
   - Be cautious about storing signer UUIDs and ensuring they're associated with the correct user

## Useful Resources
- [Neynar API Documentation](https://docs.neynar.com/)
- [Neynar API Reference](https://docs.neynar.com/reference/quickstart)
- [Farcaster Documentation](https://docs.farcaster.xyz/) 