import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getConversionQuestions, getConversion } from '@/lib/db/queries';
import { QtiGenerator } from '@/lib/export/qti-generator';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Verify ownership
        const conversion = await getConversion(id, supabase);
        if (conversion.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const questions = await getConversionQuestions(id, supabase);
        const format = request.nextUrl.searchParams.get('format') || 'qti';

        let fileBuffer: Buffer;
        let contentType: string;
        let filename: string;

        if (format === 'csv') {
            // Generate CSV
            const headers = ['Question', 'Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Explanation'];
            const rows = questions.map(q => {
                const options = q.answer_options || [];
                const getOpt = (idx: number) => options[idx]?.text || '';
                return [
                    `"${q.question_text.replace(/"/g, '""')}"`,
                    q.question_type,
                    `"${getOpt(0).replace(/"/g, '""')}"`,
                    `"${getOpt(1).replace(/"/g, '""')}"`,
                    `"${getOpt(2).replace(/"/g, '""')}"`,
                    `"${getOpt(3).replace(/"/g, '""')}"`,
                    q.correct_answer || '',
                    `"${(q.explanation || '').replace(/"/g, '""')}"`
                ].join(',');
            });
            const csvContent = [headers.join(','), ...rows].join('\n');
            fileBuffer = Buffer.from(csvContent, 'utf-8');
            contentType = 'text/csv';
            filename = `export-${conversion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;

        } else if (format === 'json') {
            // Generate JSON
            const jsonContent = JSON.stringify(questions, null, 2);
            fileBuffer = Buffer.from(jsonContent, 'utf-8');
            contentType = 'application/json';
            filename = `export-${conversion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

        } else {
            // Default to QTI
            const generator = new QtiGenerator(questions);
            fileBuffer = await generator.generate();
            contentType = 'application/zip';
            filename = `qti-export-${conversion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
        }

        return new Response(fileBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
