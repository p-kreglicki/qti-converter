'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/upload/file-uploader';
import { ColumnMapper, ColumnMapping } from '@/components/upload/column-mapper';
import { getParserForFile } from '@/lib/parsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Steps } from '@/components/ui/steps'; // Need to create this or use simple text
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function NewConversionPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = async (selectedFile: File) => {
        try {
            setIsProcessing(true);
            setFile(selectedFile);

            const parser = getParserForFile(selectedFile);
            const result = await parser.parse(selectedFile);

            // Extract raw data from metadata
            const rawRows = result.questions.map(q => q.metadata?.raw);

            if (rawRows.length === 0) {
                toast.error("No data found in file");
                setIsProcessing(false);
                return;
            }

            setParsedData(rawRows);
            setStep(2);
        } catch (error) {
            console.error(error);
            toast.error("Failed to parse file");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMappingConfirm = async (mapping: ColumnMapping) => {
        if (!file) return;

        try {
            setIsProcessing(true);
            toast.info("Starting conversion...");

            // 1. Upload file to Supabase Storage
            // We need a client-side supabase instance
            // But wait, we need to use the createBrowserClient from @supabase/ssr usually
            // For now, let's assume we have a helper or use the standard one.
            // I'll use a direct fetch to the API for now to avoid client-side auth complexity if not set up,
            // BUT the API route expects the file to be in storage.
            // So I MUST upload from client.

            // I need to import { createBrowserClient } from '@supabase/ssr'
            // Let's do it properly in a separate file, but for now inline.
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            // Simple client for now
            const { createBrowserClient } = await import('@supabase/ssr');
            const supabase = createBrowserClient(supabaseUrl, supabaseKey);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in");
                return;
            }

            const filePath = `${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // 2. Map data locally
            const mappedQuestions = parsedData.map(row => {
                return {
                    questionText: row[mapping.questionText],
                    questionType: mapping.questionType.startsWith('__fixed__')
                        ? mapping.questionType.replace('__fixed__', '')
                        : row[mapping.questionType] || 'multiple_choice',
                    optionA: row[mapping.optionA],
                    optionB: row[mapping.optionB],
                    optionC: row[mapping.optionC],
                    optionD: row[mapping.optionD],
                    correctAnswer: row[mapping.correctAnswer]
                };
            });

            // 3. Send to API
            const response = await fetch('/api/conversions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name.split('.')[0],
                    filePath,
                    fileName: file.name,
                    fileType: file.name.endsWith('csv') ? 'csv' : 'excel',
                    questions: mappedQuestions,
                    mapping
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Conversion failed');
            }

            const data = await response.json();
            toast.success("Conversion started successfully!");
            router.push(`/dashboard`); // Or to the conversion details page

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">New Conversion</h2>
                <p className="text-muted-foreground">Upload a question bank to convert it to QTI format.</p>
            </div>

            {/* Simple Steps Indicator */}
            <Steps
                currentStep={step}
                steps={[
                    { title: "Upload" },
                    { title: "Map Columns" },
                    { title: "Review" }
                ]}
                className="mb-8"
            />

            {step === 1 && (
                <div className="mt-8">
                    <FileUploader
                        onFileSelect={handleFileSelect}
                        isProcessing={isProcessing}
                    />
                    {isProcessing && (
                        <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing file...
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="mt-8">
                    <ColumnMapper
                        data={parsedData}
                        onConfirm={handleMappingConfirm}
                        onCancel={() => {
                            setStep(1);
                            setFile(null);
                            setParsedData([]);
                        }}
                    />
                    {isProcessing && (
                        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                <p>Uploading and processing...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
