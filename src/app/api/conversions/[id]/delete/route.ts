import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getConversionWithExports, softDeleteConversion, createAuditLog } from '@/lib/db/queries';
import { deleteConversionFiles } from '@/lib/storage/cleanup';

/**
 * DELETE /api/conversions/[id]/delete
 * Manually delete a conversion before its 24-hour expiry
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: conversionId } = await params;

        // Create Supabase client with service role for storage deletion
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

        console.log('Attempting to delete conversion:', conversionId);

        // Get conversion with exports (this will check RLS automatically)
        let conversionData;
        try {
            conversionData = await getConversionWithExports(
                conversionId,
                supabaseService
            );
        } catch (error: any) {
            console.error('Error fetching conversion:', error);
            return NextResponse.json(
                { error: error.message || 'Conversion not found' },
                { status: 404 }
            );
        }

        const { conversion, exports } = conversionData;

        if (!conversion) {
            console.log('Conversion not found:', conversionId);
            return NextResponse.json(
                { error: 'Conversion not found' },
                { status: 404 }
            );
        }

        // Check if already deleted
        if (conversion.deleted_at) {
            console.log('Conversion already deleted:', conversionId);
            return NextResponse.json(
                { error: 'Conversion already deleted' },
                { status: 410 }
            );
        }

        // Delete files from storage
        const exportFileUrls = exports.map(e => e.file_url);
        const deleteResult = await deleteConversionFiles(
            supabaseService as any,
            conversionId,
            conversion.file_url,
            exportFileUrls
        );

        // Soft delete the conversion
        const deletedConversion = await softDeleteConversion(conversionId, supabaseService);

        // Create audit log
        await createAuditLog({
            user_id: conversion.user_id,
            action: 'manual_delete',
            resource_type: 'conversion',
            resource_id: conversionId,
            metadata: {
                files_deleted: deleteResult.filesDeleted,
                deletion_errors: deleteResult.errors
            }
        }, supabaseService);

        return NextResponse.json({
            success: true,
            deletedAt: deletedConversion.deleted_at,
            filesDeleted: deleteResult.filesDeleted
        });

    } catch (error: any) {
        console.error('Error deleting conversion:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete conversion' },
            { status: 500 }
        );
    }
}
