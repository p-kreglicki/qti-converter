import { createClient } from '@supabase/supabase-js';

/**
 * Storage cleanup utilities for deleting files from Supabase Storage
 * Requires service role key to bypass RLS
 */

export interface DeleteFileResult {
    success: boolean;
    error?: string;
}

export interface DeleteConversionFilesResult {
    filesDeleted: number;
    errors: string[];
}

/**
 * Delete a single file from Supabase Storage
 */
export async function deleteFile(
    supabase: ReturnType<typeof createClient>,
    bucket: string,
    filePath: string
): Promise<DeleteFileResult> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            // File might not exist, which is okay
            if (error.message.includes('not found') || error.message.includes('does not exist')) {
                return { success: true }; // File already gone
            }
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete all files associated with a conversion
 * This includes the original upload file and all export files
 */
export async function deleteConversionFiles(
    supabase: ReturnType<typeof createClient>,
    conversionId: string,
    fileUrl: string,
    exportFileUrls: string[] = []
): Promise<DeleteConversionFilesResult> {
    const errors: string[] = [];
    let filesDeleted = 0;

    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/uploads/{path}
    const extractPath = (url: string): string | null => {
        try {
            const urlObj = new URL(url);
            const pathMatch = urlObj.pathname.match(/\/object\/(?:public|sign)\/[^/]+\/(.+)/);
            return pathMatch ? pathMatch[1] : null;
        } catch {
            return null;
        }
    };

    // Delete original upload file
    const uploadPath = extractPath(fileUrl);
    if (uploadPath) {
        const result = await deleteFile(supabase, 'uploads', uploadPath);
        if (result.success) {
            filesDeleted++;
        } else if (result.error) {
            errors.push(`Upload file: ${result.error}`);
        }
    } else {
        errors.push(`Could not extract path from upload URL: ${fileUrl}`);
    }

    // Delete all export files
    for (const exportUrl of exportFileUrls) {
        const exportPath = extractPath(exportUrl);
        if (exportPath) {
            const result = await deleteFile(supabase, 'uploads', exportPath);
            if (result.success) {
                filesDeleted++;
            } else if (result.error) {
                errors.push(`Export file: ${result.error}`);
            }
        } else {
            errors.push(`Could not extract path from export URL: ${exportUrl}`);
        }
    }

    return { filesDeleted, errors };
}
