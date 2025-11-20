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
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // API route shouldn't set cookies usually, but needed for auth check
                    },
                    remove(name: string, options: CookieOptions) {
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, filePath, fileName, fileType, questions, mapping } = body;

        if (!title || !filePath || !questions) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Conversion Record
        const { data: conversion, error: conversionError } = await supabase
            .from('conversions')
            .insert({
                user_id: user.id,
                title: title,
                source_format: fileType === 'csv' ? 'csv' : 'excel',
                file_path: filePath,
                file_name: fileName,
                status: 'processing',
                total_questions: questions.length,
                processed_questions: 0,
                mapping_configuration: mapping
            })
            .select()
            .single();

        if (conversionError) {
            console.error('Conversion creation error:', conversionError);
            return NextResponse.json({ error: 'Failed to create conversion' }, { status: 500 });
        }

        // 2. Create Question Records
        // We'll insert them in batches to be safe, though 1000 isn't huge.
        const questionsToInsert = questions.map((q: any, index: number) => ({
            conversion_id: conversion.id,
            user_id: user.id,
            original_text: q.questionText,
            question_type: q.questionType || 'multiple_choice',
            answer_options: {
                options: [
                    { id: 'A', text: q.optionA },
                    { id: 'B', text: q.optionB },
                    { id: 'C', text: q.optionC },
                    { id: 'D', text: q.optionD },
                ],
                correctAnswer: q.correctAnswer
            },
            blooms_level: 'remember', // Default, will be updated by AI
            status: 'pending',
            order_index: index
        }));

        const { error: questionsError } = await supabase
            .from('questions')
            .insert(questionsToInsert);

        if (questionsError) {
            console.error('Questions insertion error:', questionsError);
            // Should probably rollback conversion or mark as error
            await supabase.from('conversions').update({ status: 'error', error_details: { message: 'Failed to save questions' } }).eq('id', conversion.id);
            return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
        }

        // 3. Trigger AI Processing (Background)
        // For MVP, we might just mark it as 'ready_for_review' or trigger a function.
        // Let's mark it as 'pending_analysis' or similar.
        // The task list says "AI-powered PII detection" is next phase.
        // So for now, we just save them.

        return NextResponse.json({ conversionId: conversion.id });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
