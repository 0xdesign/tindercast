# Neynar API: Using Signers for Follow Actions

This document explains how to use Neynar's Signer feature to perform follow actions on the Farcaster network.

## Overview
To follow a user on Farcaster, we need:
1. Create a Neynar signer for a user
2. Register and approve the signer
3. Use the approved signer to execute the follow action

## Signer Management

### 1. Create a Signer

**Endpoint:** `POST https://api.neynar.com/v2/farcaster/signer`

**Headers:**
```javascript
headers: {
  'accept': 'application/json',
  'api_key': 'NEYNAR_API_KEY',
  'content-type': 'application/json'
}
```

**Request Body:**
```json
{
  "fid": 123, // User's Farcaster ID
  "deadline": 1764021327613 // Optional: Unix timestamp (ms) deadline for signer
}
```

**Response:**
```json
{
  "public_key": "0x23367d85edce8209b4382501d80ffa339abf2551d3b833b815c3d0f8d01cb4de",
  "signer_uuid": "2d9880fd-49ad-4086-9067-c79b7a79abee",
  "status": "pending_approval",
  "deadline": 1764021327613
}
```

### 2. Check Signer Status

**Endpoint:** `GET https://api.neynar.com/v2/farcaster/signer?signer_uuid=<SIGNER_UUID>`

**Headers:**
```javascript
headers: {
  'accept': 'application/json',
  'api_key': 'NEYNAR_API_KEY'
}
```

**Response:**
```json
{
  "signer_uuid": "2d9880fd-49ad-4086-9067-c79b7a79abee",
  "status": "approved", // pending_approval, approved, revoked
  "public_key": "0x23367d85edce8209b4382501d80ffa339abf2551d3b833b815c3d0f8d01cb4de",
  "signer_approval_url": "https://warpcast.com/~/sign-key?id=...",
  "deadline": 1764021327613
}
```

### 3. Approval Process
For a signer to be approved, the user needs to complete the approval on Warpcast:

1. After creating a signer, get the `signer_approval_url` from the status check
2. Have the user visit this URL (typically by redirecting them or showing a QR code)
3. User approves the signer on Warpcast
4. Check signer status until it shows "approved"

## Following a User

Once the signer is approved, you can use it to follow a user:

**Endpoint:** `POST https://api.neynar.com/v2/farcaster/user/follow`

**Headers:**
```javascript
headers: {
  'accept': 'application/json',
  'api_key': 'NEYNAR_API_KEY',
  'content-type': 'application/json'
}
```

**Request Body:**
```json
{
  "signer_uuid": "2d9880fd-49ad-4086-9067-c79b7a79abee",
  "target_fids": [456] // FID of the user(s) to follow (can be multiple)
}
```

**Success Response:**
```json
{
  "success": true
}
```

## Implementation Example

```typescript
// 1. Create a signer
async function createSigner(fid: number) {
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/signer', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || '',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        fid: fid
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating signer:', error);
    throw error;
  }
}

// 2. Check signer status
async function checkSignerStatus(signerUuid: string) {
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking signer status:', error);
    throw error;
  }
}

// 3. Follow a user
async function followUser(signerUuid: string, targetFid: number) {
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/user/follow', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || '',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        target_fids: [targetFid]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}
```

## Important Considerations

1. **Signer Persistence**:
   - Store signer_uuid in your database or local storage to reuse for future actions
   - Check signer status before reusing to ensure it hasn't been revoked

2. **Error Handling**:
   - 401: Unauthorized (invalid API key)
   - 403: Forbidden (signer not approved)
   - 404: Not found (invalid signer_uuid or FID)
   - 429: Rate limit exceeded
   - 500: Server error

3. **User Experience**:
   - Provide clear instructions for the approval process
   - Implement polling to detect when approval is complete
   - Display appropriate loading/success/error states 