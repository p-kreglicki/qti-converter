import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch { }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, filePath, fileName, fileSize, fileType, questions, mapping } = body;

        if (!title || !filePath || !questions) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Conversion Record
        const { data: conversion, error: conversionError } = await supabase
            .from('conversions')
            .insert({
                user_id: user.id,
                title: title,
                original_filename: fileName,
                file_size_bytes: fileSize || 0,
                file_url: filePath,
                file_type: fileType === 'csv' ? 'csv' : 'excel',
                status: 'processing',
                total_questions: questions.length,
                // processed_questions: 0, // Not in schema
                // mapping_configuration: mapping // Not in schema
                conversion_mode: 'privacy', // Default
                ai_enhancement_enabled: true // Default
            })
            .select()
            .single();

        if (conversionError) {
            console.error('Conversion creation error:', conversionError);
            return NextResponse.json({ error: 'Failed to create conversion: ' + conversionError.message }, { status: 500 });
        }

        // 2. Create Question Records
        const questionsToInsert = questions.map((q: any, index: number) => ({
            conversion_id: conversion.id,
            // user_id: user.id, // Not in schema
            question_text: q.questionText,
            question_type: q.questionType || 'multiple_choice',
            answer_options: [
                { id: 'A', text: q.optionA, is_correct: q.correctAnswer === 'A' },
                { id: 'B', text: q.optionB, is_correct: q.correctAnswer === 'B' },
                { id: 'C', text: q.optionC, is_correct: q.correctAnswer === 'C' },
                { id: 'D', text: q.optionD, is_correct: q.correctAnswer === 'D' },
            ],
            correct_answer: q.correctAnswer,
            blooms_level: 'remember', // Default
            original_row_number: index + 1, // 1-based
            // status: 'pending', // Not in schema
        }));

        const { error: questionsError } = await supabase
            .from('questions')
            .insert(questionsToInsert);

        if (questionsError) {
            console.error('Questions insertion error:', questionsError);
            // Mark as error
            await supabase.from('conversions').update({ status: 'failed', error_message: 'Failed to save questions' }).eq('id', conversion.id);
            return NextResponse.json({ error: 'Failed to save questions: ' + questionsError.message }, { status: 500 });
        }

        // Update status to completed for now since we don't have async processing yet
        await supabase.from('conversions').update({ status: 'completed' }).eq('id', conversion.id);

        return NextResponse.json({ conversionId: conversion.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
