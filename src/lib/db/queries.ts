import { supabase } from './supabase';
import type {
    Conversion,
    ConversionInsert,
    ConversionUpdate,
    Question,
    QuestionInsert,
    QuestionUpdate,
    Export,
    ExportInsert,
    Profile,
    ProfileInsert,
    ProfileUpdate,
    AuditLog,
    AuditLogInsert,
    UsageTracking,
    UsageTrackingInsert,
} from './types';

// Profile Queries

export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data as Profile;
}

export async function createProfile(profile: ProfileInsert) {
    const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single();

    if (error) throw error;
    return data as Profile;
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data as Profile;
}

// Conversion Queries

export async function getConversion(conversionId: string, client?: SupabaseClient) {
    const sb = client || supabase;
    const { data, error } = await sb
        .from('conversions')
        .select('*')
        .eq('id', conversionId)
        .single();

    if (error) throw error;
    return data as Conversion;
}

import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserConversions(userId: string, client?: SupabaseClient) {
    const sb = client || supabase;
    const { data, error } = await sb
        .from('conversions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Conversion[];
}

export async function getActiveConversions(userId: string) {
    const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Conversion[];
}

export async function createConversion(conversion: ConversionInsert) {
    const { data, error } = await supabase
        .from('conversions')
        .insert(conversion)
        .select()
        .single();

    if (error) throw error;
    return data as Conversion;
}

export async function updateConversion(conversionId: string, updates: ConversionUpdate) {
    const { data, error } = await supabase
        .from('conversions')
        .update(updates)
        .eq('id', conversionId)
        .select()
        .single();

    if (error) throw error;
    return data as Conversion;
}

export async function deleteConversion(conversionId: string) {
    const { error } = await supabase
        .from('conversions')
        .delete()
        .eq('id', conversionId);

    if (error) throw error;
}

export async function softDeleteConversion(conversionId: string, client?: any) {
    const supabaseClient = client || supabase;
    const { data, error } = await supabaseClient
        .from('conversions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', conversionId)
        .select()
        .maybeSingle();

    if (error) {
        console.error('Error soft deleting conversion:', error);
        throw error;
    }

    if (!data) {
        throw new Error('Conversion not found or already deleted');
    }

    return data as Conversion;
}

// Question Queries

export async function getQuestion(questionId: string) {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();

    if (error) throw error;
    return data as Question;
}

export async function getConversionQuestions(conversionId: string, client?: SupabaseClient) {
    const sb = client || supabase;
    const { data, error } = await sb
        .from('questions')
        .select('*')
        .eq('conversion_id', conversionId)
        .order('original_row_number', { ascending: true });

    if (error) throw error;
    return data as Question[];
}

export async function createQuestion(question: QuestionInsert) {
    const { data, error } = await supabase
        .from('questions')
        .insert(question)
        .select()
        .single();

    if (error) throw error;
    return data as Question;
}

export async function createQuestions(questions: QuestionInsert[]) {
    const { data, error } = await supabase
        .from('questions')
        .insert(questions)
        .select();

    if (error) throw error;
    return data as Question[];
}

export async function updateQuestion(questionId: string, updates: QuestionUpdate, client?: SupabaseClient) {
    const sb = client || supabase;
    const { data, error } = await sb
        .from('questions')
        .update(updates)
        .eq('id', questionId)
        .select()
        .single();

    if (error) throw error;
    return data as Question;
}

export async function deleteQuestion(questionId: string) {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

    if (error) throw error;
}

// Export Queries

export async function getExport(exportId: string) {
    const { data, error } = await supabase
        .from('exports')
        .select('*')
        .eq('id', exportId)
        .single();

    if (error) throw error;
    return data as Export;
}

export async function getConversionExports(conversionId: string) {
    const { data, error } = await supabase
        .from('exports')
        .select('*')
        .eq('conversion_id', conversionId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Export[];
}

export async function createExport(exportData: ExportInsert) {
    const { data, error } = await supabase
        .from('exports')
        .insert(exportData)
        .select()
        .single();

    if (error) throw error;
    return data as Export;
}

// Audit Log Queries

export async function createAuditLog(log: AuditLogInsert, client?: any) {
    const supabaseClient = client || supabase;
    const { data, error } = await supabaseClient
        .from('audit_logs')
        .insert(log)
        .select()
        .single();

    if (error) throw error;
    return data as AuditLog;
}

export async function getUserAuditLogs(userId: string, limit = 100) {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as AuditLog[];
}

// Usage Tracking Queries

export async function getUserUsage(userId: string, month: string) {
    const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data as UsageTracking | null;
}

export async function createOrUpdateUsage(usage: UsageTrackingInsert) {
    const { data, error } = await supabase
        .from('usage_tracking')
        .upsert(usage, { onConflict: 'user_id,month' })
        .select()
        .single();

    if (error) throw error;
    return data as UsageTracking;
}

export async function incrementUsage(
    userId: string,
    month: string,
    questionsConverted = 0,
    aiEnhancementsUsed = 0
) {
    // First, try to get existing usage
    const existing = await getUserUsage(userId, month);

    if (existing) {
        // Update existing
        const { data, error } = await supabase
            .from('usage_tracking')
            .update({
                questions_converted: existing.questions_converted + questionsConverted,
                ai_enhancements_used: existing.ai_enhancements_used + aiEnhancementsUsed,
            })
            .eq('user_id', userId)
            .eq('month', month)
            .select()
            .single();

        if (error) throw error;
        return data as UsageTracking;
    } else {
        // Create new
        return createOrUpdateUsage({
            user_id: userId,
            month,
            questions_converted: questionsConverted,
            ai_enhancements_used: aiEnhancementsUsed,
        });
    }
}

/**
 * Get all expired conversions that haven't been deleted yet
 */
export async function getExpiredConversions(
    client: any
) {
    const { data, error } = await client
        .from('conversions')
        .select('*')
        .is('deleted_at', null)
        .lt('expires_at', new Date().toISOString());

    if (error) throw error;
    return data as Conversion[];
}

/**
 * Get a conversion with all its export files
 */
export async function getConversionWithExports(
    conversionId: string,
    client: any
) {
    const { data: conversion, error: conversionError } = await client
        .from('conversions')
        .select('*')
        .eq('id', conversionId)
        .maybeSingle();

    if (conversionError) {
        console.error('Error fetching conversion:', conversionError);
        throw conversionError;
    }

    if (!conversion) {
        throw new Error('Conversion not found');
    }

    const { data: exports, error: exportsError } = await client
        .from('exports')
        .select('*')
        .eq('conversion_id', conversionId);

    if (exportsError) {
        console.error('Error fetching exports:', exportsError);
        throw exportsError;
    }

    return {
        conversion: conversion as Conversion,
        exports: (exports || []) as Export[]
    };
}
