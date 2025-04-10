import { NextRequest, NextResponse } from 'next/server';
import { createSigner, checkSignerStatus, SignerInfo } from '@/utils/neynar';
import { memoryCache } from '@/utils/cache';

/**
 * Creates or gets a signer for a user
 * POST /api/signer
 * Body: { fid: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { fid } = body;

    // Debug information
    console.log('[API] Create Signer Request:');
    console.log('- fid:', fid);
    console.log('- NEYNAR_API_KEY exists:', !!process.env.NEYNAR_API_KEY);

    // Validate FID
    if (!fid || typeof fid !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid FID parameter' },
        { status: 400 }
      );
    }

    console.log(`[API] Creating signer for FID: ${fid}`);
    
    // For testing, return a mock response
    if (fid === 1234) {
      // Use a consistent test UUID
      const testSignerUuid = 'test-signer-uuid-123';
      
      const mockSignerData: SignerInfo = {
        signer_uuid: testSignerUuid,
        public_key: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'pending_approval',
        signer_approval_url: 'https://warpcast.com/~/approved-signers/approve?token=test-token',
        created_at: Date.now()
      };
      
      return NextResponse.json(mockSignerData);
    }
    
    // Try the real API call for other FIDs
    try {
      // Create a new signer
      const signerData = await createSigner(fid);
      
      // Cache signer data on server
      const cacheKey = `signer_${fid}`;
      memoryCache.set(cacheKey, signerData, 3600); // Cache for 1 hour
      
      return NextResponse.json(signerData);
    } catch (error) {
      console.error('[API] Error with Neynar API:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API Error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Error creating signer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Gets the status of a signer
 * GET /api/signer?signer_uuid=<uuid>
 */
export async function GET(request: NextRequest) {
  try {
    // Get signer_uuid from query params
    const { searchParams } = new URL(request.url);
    const signerUuid = searchParams.get('signer_uuid');

    // Debug information
    console.log('[API] Check Signer Status Request:');
    console.log('- signerUuid:', signerUuid);
    console.log('- NEYNAR_API_KEY exists:', !!process.env.NEYNAR_API_KEY);

    // Validate signer UUID
    if (!signerUuid) {
      return NextResponse.json(
        { error: 'Missing signer_uuid parameter' },
        { status: 400 }
      );
    }

    console.log(`[API] Checking status for signer: ${signerUuid}`);
    
    // For testing, use mock responses based on the signer UUID
    if (signerUuid === 'test-signer-uuid-123') {
      return NextResponse.json({
        signer_uuid: signerUuid,
        public_key: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'generated',
        signer_approval_url: 'https://warpcast.com/~/approved-signers/approve?token=test-token',
      });
    } else if (signerUuid === 'test-approved') {
      return NextResponse.json({
        signer_uuid: signerUuid,
        public_key: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'approved',
      });
    } else if (signerUuid === 'test-pending') {
      return NextResponse.json({
        signer_uuid: signerUuid,
        public_key: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'pending_approval',
        signer_approval_url: 'https://warpcast.com/~/approved-signers/approve?token=test-token',
      });
    }
    
    // Try real API call for other signer UUIDs
    try {
      // Check signer status
      const signerData = await checkSignerStatus(signerUuid);
      
      return NextResponse.json(signerData);
    } catch (error) {
      console.error('[API] Error with Neynar API:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API Error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Error checking signer status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 