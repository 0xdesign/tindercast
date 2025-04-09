/**
 * Test utilities for API endpoints
 */

/**
 * Test the following API endpoint
 * @param fid Farcaster ID to test with
 */
export async function testFollowingApi(fid: number = 1317) {
  try {
    console.log(`Testing following API with FID: ${fid}`);
    
    const response = await fetch('/api/following', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fid })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.following.length} following profiles`);
    
    // Log the first profile as a sample
    if (data.following.length > 0) {
      console.log('Sample profile:', JSON.stringify(data.following[0], null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

/**
 * Test the wallet overlap API endpoint
 * @param userFid FID of the user
 * @param profileFid FID of the profile to compare with
 */
export async function testWalletOverlapApi(userFid: number = 1317, profileFid: number = 1) {
  try {
    console.log(`Testing wallet overlap API between FIDs: ${userFid} and ${profileFid}`);
    
    const response = await fetch('/api/wallet-overlap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userFid, profileFid })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error}`);
    }
    
    const data = await response.json();
    console.log('Wallet overlap result:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
} 