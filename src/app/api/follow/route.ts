import { NextRequest, NextResponse } from 'next/server';
import { followUser, checkSignerStatus } from '@/utils/neynar';

/**
 * Follows a user on Farcaster
 * POST /api/follow
 * Body: { signerUuid: string, targetFid: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { signerUuid, targetFid } = body;

    // Debug information
    console.log('[API] Follow Request:');
    console.log('- signerUuid:', signerUuid);
    console.log('- targetFid:', targetFid);
    console.log('- NEYNAR_API_KEY exists:', !!process.env.NEYNAR_API_KEY);

    // Validate parameters
    if (!signerUuid || typeof signerUuid !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid signerUuid parameter' },
        { status: 400 }
      );
    }

    if (!targetFid || typeof targetFid !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid targetFid parameter' },
        { status: 400 }
      );
    }

    console.log(`[API] Following FID ${targetFid} using signer ${signerUuid}`);
    
    // For testing, use a mock response instead of making a real API call
    // Simulate different responses based on the signerUuid
    if (signerUuid === 'test-approved') {
      // Simulate an approved signer
      return NextResponse.json({
        success: true,
        message: `Successfully followed user with FID ${targetFid}`,
        status: 'success'
      });
    } else if (signerUuid === 'test-pending') {
      // Simulate a pending signer
      return NextResponse.json(
        { 
          error: 'Signer is not approved',
          status: 'pending_approval',
          approvalUrl: 'https://warpcast.com/~/approved-signers/approve?token=test-token' 
        },
        { status: 403 }
      );
    } else {
      // Try real API call with actual signerUuid
      try {
        // Check signer status first to ensure it's approved
        const signerStatus = await checkSignerStatus(signerUuid);
        
        if (signerStatus.status !== 'approved') {
          return NextResponse.json(
            { 
              error: 'Signer is not approved',
              status: signerStatus.status,
              approvalUrl: signerStatus.signer_approval_url 
            },
            { status: 403 }
          );
        }
        
        // Follow the user
        const result = await followUser(signerUuid, targetFid);
        
        return NextResponse.json({
          success: true,
          message: `Successfully followed user with FID ${targetFid}`,
          ...result
        });
      } catch (error) {
        console.error('[API] Error with Neynar API:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'API Error' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('[API] Error following user:', error);
    
    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 