/**
 * Neynar API utility functions
 * Provides methods for interacting with the Neynar API for Farcaster
 */

// Base URL for Neynar API
const NEYNAR_API_BASE_URL = 'https://api.neynar.com/v2/farcaster';

// Rate limit tracking (Starter plan: 300 RPM per endpoint, 500 RPM global)
interface RateLimitTracker {
  [endpoint: string]: {
    requests: number;
    resetTime: number;
  };
}

// In-memory rate limit tracking
const rateLimits: RateLimitTracker = {};
let globalRequestCount = 0;
let globalResetTime = Date.now() + 60000; // Reset every minute

/**
 * Checks if we're within rate limits before making a request
 * @param endpoint The API endpoint (without the base URL)
 * @returns Whether the request can proceed
 */
function checkRateLimit(endpoint: string): boolean {
  const now = Date.now();
  
  // Reset global counter if needed
  if (now > globalResetTime) {
    globalRequestCount = 0;
    globalResetTime = now + 60000; // Reset every minute
  }
  
  // Reset endpoint counter if needed
  if (!rateLimits[endpoint] || now > rateLimits[endpoint].resetTime) {
    rateLimits[endpoint] = {
      requests: 0,
      resetTime: now + 60000, // Reset every minute
    };
  }
  
  // Check if we're within rate limits
  const isWithinEndpointLimit = rateLimits[endpoint].requests < (
    endpoint === '/frame/validate' ? 5000 : // Special limit for validate
    endpoint.includes('/signer') ? 3000 :   // Special limit for signer
    300                                      // Default limit
  );
  
  const isWithinGlobalLimit = globalRequestCount < 500;
  
  return isWithinEndpointLimit && isWithinGlobalLimit;
}

/**
 * Updates rate limit counters after making a request
 * @param endpoint The API endpoint that was requested
 */
function updateRateLimit(endpoint: string): void {
  rateLimits[endpoint].requests++;
  globalRequestCount++;
  
  // Log warning if approaching limits
  if (rateLimits[endpoint].requests > (
    endpoint === '/frame/validate' ? 4500 :
    endpoint.includes('/signer') ? 2700 :
    270
  )) {
    console.warn(`[Neynar] Approaching rate limit for ${endpoint}`);
  }
  
  if (globalRequestCount > 450) {
    console.warn('[Neynar] Approaching global rate limit');
  }
}

/**
 * Makes a request to the Neynar API with rate limiting
 * @param endpoint The API endpoint (without the base URL)
 * @param options Fetch options (method, body, etc.)
 * @returns The response data
 */
export async function neynarRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    // Check rate limits
    if (!checkRateLimit(endpoint)) {
      throw new Error(`Rate limit exceeded for ${endpoint}`);
    }
    
    // Get API key from environment variables
    const apiKey = typeof window === 'undefined' 
      ? process.env.NEYNAR_API_KEY  // Server-side
      : process.env.NEXT_PUBLIC_NEYNAR_API_KEY; // Client-side
    
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY is not set in environment variables');
    }
    
    // Build request URL and options
    const url = `${NEYNAR_API_BASE_URL}${endpoint}`;
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'accept': 'application/json',
        'api_key': apiKey,
        ...options.headers,
      },
    };
    
    // Add content-type header for POST/PUT requests if not present
    if (
      (options.method === 'POST' || options.method === 'PUT') && 
      options.body && 
      !options.headers?.['content-type']
    ) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'content-type': 'application/json',
      };
    }
    
    // Make the request
    console.log(`[Neynar] Request: ${options.method || 'GET'} ${endpoint}`);
    const response = await fetch(url, requestOptions);
    
    // Update rate limit counters
    updateRateLimit(endpoint);
    
    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Neynar API error: ${response.status} ${response.statusText}`
      );
    }
    
    // Parse and return response
    return await response.json();
  } catch (error) {
    console.error('[Neynar] API Error:', error);
    throw error;
  }
}

/**
 * Fetches suggested follows for a user
 * @param fid The user's Farcaster ID
 * @returns List of suggested users to follow
 */
export async function fetchSuggestedFollows(fid: number) {
  return neynarRequest<{users: any[]}>(`/following/suggested?fid=${fid}`);
}

/**
 * Creates a signer for a user
 * @param fid The user's Farcaster ID
 * @returns Signer data
 */
export async function createSigner(fid: number) {
  return neynarRequest('/signer', {
    method: 'POST',
    body: JSON.stringify({ fid }),
  });
}

/**
 * Checks the status of a signer
 * @param signerUuid The UUID of the signer
 * @returns Signer status data
 */
export async function checkSignerStatus(signerUuid: string) {
  return neynarRequest(`/signer?signer_uuid=${signerUuid}`);
}

/**
 * Follows a user on Farcaster
 * @param signerUuid The UUID of the approved signer
 * @param targetFid The FID of the user to follow
 * @returns Result of the follow operation
 */
export async function followUser(signerUuid: string, targetFid: number) {
  return neynarRequest('/user/follow', {
    method: 'POST',
    body: JSON.stringify({
      signer_uuid: signerUuid,
      target_fids: [targetFid],
    }),
  });
}

/**
 * Interface for signer information
 */
export interface SignerInfo {
  signer_uuid: string;
  public_key: string;
  status: 'pending_approval' | 'approved' | 'revoked';
  signer_approval_url?: string;
  created_at: number;
  deadline?: number;
}

/**
 * Stores signer information in localStorage
 * @param fid User's Farcaster ID
 * @param signerInfo Signer information to store
 */
export function storeSignerInfo(fid: number, signerInfo: SignerInfo): void {
  try {
    // Get current auth data
    const storedUser = localStorage.getItem('farcasterUser');
    if (!storedUser) {
      throw new Error('No user data found in localStorage');
    }
    
    // Parse and update with signer info
    const userData = JSON.parse(storedUser);
    const updatedData = {
      ...userData,
      signer: signerInfo,
    };
    
    // Store updated data
    localStorage.setItem('farcasterUser', JSON.stringify(updatedData));
    console.log(`[Neynar] Stored signer info for FID ${fid}`);
  } catch (error) {
    console.error('[Neynar] Error storing signer info:', error);
    throw error;
  }
}

/**
 * Retrieves signer information from localStorage
 * @param fid User's Farcaster ID
 * @returns Signer information if available
 */
export function getSignerInfo(fid: number): SignerInfo | null {
  try {
    // Get current auth data
    const storedUser = localStorage.getItem('farcasterUser');
    if (!storedUser) {
      return null;
    }
    
    // Parse and return signer info
    const userData = JSON.parse(storedUser);
    return userData.signer || null;
  } catch (error) {
    console.error('[Neynar] Error retrieving signer info:', error);
    return null;
  }
}

/**
 * Removes signer information from localStorage
 * @param fid User's Farcaster ID
 */
export function removeSignerInfo(fid: number): void {
  try {
    // Get current auth data
    const storedUser = localStorage.getItem('farcasterUser');
    if (!storedUser) {
      return;
    }
    
    // Parse and update without signer info
    const userData = JSON.parse(storedUser);
    const { signer, ...restData } = userData;
    
    // Store updated data
    localStorage.setItem('farcasterUser', JSON.stringify(restData));
    console.log(`[Neynar] Removed signer info for FID ${fid}`);
  } catch (error) {
    console.error('[Neynar] Error removing signer info:', error);
  }
}

/**
 * Checks if a signer is valid and not expired
 * @param signerInfo Signer information to check
 * @returns Whether the signer is valid
 */
export function isSignerValid(signerInfo: SignerInfo | null): boolean {
  if (!signerInfo) return false;
  
  // Check if approved
  if (signerInfo.status !== 'approved') return false;
  
  // Check if expired
  if (signerInfo.deadline && Date.now() > signerInfo.deadline) return false;
  
  return true;
} 