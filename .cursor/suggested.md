# Neynar API: Fetching Suggested Follows

This document outlines how to use Neynar's API to fetch suggested follows for Farcaster users.

## API Endpoint
```
GET https://api.neynar.com/v2/farcaster/following/suggested
```

## Authentication
The API requires authentication using an API key in the request headers:

```javascript
headers: {
  'accept': 'application/json',
  'api_key': 'NEYNAR_API_KEY'  // Replace with your actual API key
}
```

## Response Format
The API returns a list of suggested users to follow, which helps users discover new users on Farcaster.

Sample response:
```json
{
  "users": [
    {
      "fid": 2,
      "username": "dwr.eth",
      "display_name": "Dan Romero",
      "pfp_url": "https://i.imgur.com/OGjzIxG.jpg",
      "profile": {
        "bio": {
          "text": "Farcaster. Prev: Coinbase."
        },
        "location": {
          "description": "Los Angeles, CA"
        }
      },
      "follower_count": 143195,
      "following_count": 1583,
      "active_status": "active",
      "verifications": [
        "0x1019678f7de4f28dc10098ae20dcf9cc139ac93a",
        "0xde54e6e2c05f218db3fe35664c01f62a4a4e6a5f"
      ],
      "verified_addresses": [
        {
          "eth_address": "0x6868375119085447e7f25c52df3108ee1dbf1178"
        }
      ]
    }
    // Additional suggested users...
  ]
}
```

## Implementation
Here's how to implement fetching suggested follows in JavaScript/TypeScript:

```typescript
async function fetchSuggestedFollows() {
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/following/suggested', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error('Error fetching suggested follows:', error);
    throw error;
  }
}
```

## Error Handling
The API may return error responses with the following structure:

```json
{
  "code": "not_found",
  "message": "Resource not found"
}
```

Common errors:
- 401: Unauthorized (invalid API key)
- 404: Not found
- 429: Rate limit exceeded
- 500: Server error

## Integration with Portfolio Overlap
For our application, we will fetch suggested follows and then filter/sort them based on portfolio overlap with the current user. This will help users discover Farcaster users with similar on-chain interests.

Steps:
1. Fetch suggested follows using Neynar API
2. For each suggested user, calculate portfolio overlap using our existing wallet-overlap API
3. Sort users by highest portfolio overlap
4. Display the top matches to the user 