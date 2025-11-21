import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredData } from '../../../../../scripts/cleanup-expired-data';

/**
 * GET /api/cron/cleanup
 * Cron job endpoint for cleaning up expired conversions
 * 
 * This endpoint should be called by Vercel Cron or similar service
 * Protected by authorization header
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Check if request is from Vercel Cron or has valid secret
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('🔄 Cron cleanup job started');

        // Run cleanup
        const result = await cleanupExpiredData();

        console.log('✅ Cron cleanup job completed');

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            result: {
                conversionsProcessed: result.conversionsProcessed,
                conversionsDeleted: result.conversionsDeleted,
                filesDeleted: result.filesDeleted,
                errorCount: result.errors.length,
                errors: result.errors
            }
        });

    } catch (error: any) {
        console.error('❌ Cron cleanup job failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
