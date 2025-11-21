import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { getExpiredConversions, getConversionWithExports, softDeleteConversion, createAuditLog } from '../src/lib/db/queries';
import { deleteConversionFiles } from '../src/lib/storage/cleanup';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing required environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CleanupResult {
    conversionsProcessed: number;
    conversionsDeleted: number;
    filesDeleted: number;
    errors: string[];
}

/**
 * Clean up expired conversions and their associated files
 */
async function cleanupExpiredData(): Promise<CleanupResult> {
    const result: CleanupResult = {
        conversionsProcessed: 0,
        conversionsDeleted: 0,
        filesDeleted: 0,
        errors: []
    };

    try {
        console.log('🧹 Starting cleanup of expired conversions...\n');

        // Get all expired conversions
        const expiredConversions = await getExpiredConversions(supabase);

        if (expiredConversions.length === 0) {
            console.log('✅ No expired conversions found.');
            return result;
        }

        console.log(`Found ${expiredConversions.length} expired conversion(s) to clean up.\n`);

        // Process each expired conversion
        for (const conversion of expiredConversions) {
            result.conversionsProcessed++;
            console.log(`Processing conversion: ${conversion.id}`);
            console.log(`  Title: ${conversion.title}`);
            console.log(`  Expired at: ${conversion.expires_at}`);

            try {
                // Get conversion with all exports
                const { conversion: fullConversion, exports } = await getConversionWithExports(
                    conversion.id,
                    supabase
                );

                // Collect all file URLs
                const exportFileUrls = exports.map(e => e.file_url);

                // Delete files from storage
                const deleteResult = await deleteConversionFiles(
                    supabase as any,
                    conversion.id,
                    fullConversion.file_url,
                    exportFileUrls
                );

                result.filesDeleted += deleteResult.filesDeleted;

                if (deleteResult.errors.length > 0) {
                    console.log(`  ⚠️  File deletion warnings:`);
                    deleteResult.errors.forEach(err => console.log(`     - ${err}`));
                }

                // Soft delete the conversion
                await softDeleteConversion(conversion.id, supabase as any);

                // Create audit log
                await createAuditLog({
                    user_id: conversion.user_id,
                    action: 'auto_delete',
                    resource_type: 'conversion',
                    resource_id: conversion.id,
                    metadata: {
                        reason: 'expired',
                        expires_at: conversion.expires_at,
                        files_deleted: deleteResult.filesDeleted
                    }
                }, supabase as any);

                result.conversionsDeleted++;
                console.log(`  ✅ Conversion deleted successfully\n`);

            } catch (error: any) {
                const errorMsg = `Failed to delete conversion ${conversion.id}: ${error.message}`;
                result.errors.push(errorMsg);
                console.error(`  ❌ ${errorMsg}\n`);
            }
        }

        console.log('\n📊 Cleanup Summary:');
        console.log(`  Conversions processed: ${result.conversionsProcessed}`);
        console.log(`  Conversions deleted: ${result.conversionsDeleted}`);
        console.log(`  Files deleted: ${result.filesDeleted}`);
        console.log(`  Errors: ${result.errors.length}`);

        if (result.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            result.errors.forEach(err => console.log(`  - ${err}`));
        }

        return result;

    } catch (error: any) {
        console.error('\n❌ Cleanup failed:', error.message);
        result.errors.push(error.message);
        throw error;
    }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
    cleanupExpiredData()
        .then((result) => {
            if (result.errors.length > 0) {
                process.exit(1);
            }
            console.log('\n✅ Cleanup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

export { cleanupExpiredData };
