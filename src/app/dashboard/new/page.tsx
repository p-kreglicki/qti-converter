'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/upload/file-uploader';
import { ColumnMapper, ColumnMapping } from '@/components/upload/column-mapper';
import { getParserForFile } from '@/lib/parsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Steps } from '@/components/ui/steps';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { PiiReviewer, PiiReviewItem } from '@/components/pii/pii-reviewer';
import { RegexPIIDetector } from '@/lib/pii/regex-detector';
import { AIPIIDetector } from '@/lib/pii/ai-detector';
import { PIIDetectionResult } from '@/lib/pii/types';

export default function NewConversionPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mappedQuestions, setMappedQuestions] = useState<any[]>([]);
    const [mappingConfig, setMappingConfig] = useState<ColumnMapping | null>(null);

    // PII State
    const [piiReviewQueue, setPiiReviewQueue] = useState<PiiReviewItem[]>([]);
    const [processedQuestions, setProcessedQuestions] = useState<any[]>([]);

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
        setMappingConfig(mapping);
        setIsProcessing(true);
        toast.info("Analyzing for PII...");

        try {
            // Map data locally first
            const mapped = parsedData.map(row => {
                return {
                    questionText: row[mapping.questionText],
                    questionType: mapping.questionType.startsWith('__fixed__')
                        ? mapping.questionType.replace('__fixed__', '')
                        : row[mapping.questionType] || 'multiple_choice',
                    optionA: row[mapping.optionA],
                    optionB: row[mapping.optionB],
                    optionC: row[mapping.optionC],
                    optionD: row[mapping.optionD],
                    correctAnswer: row[mapping.correctAnswer],
                    explanation: row[mapping.explanation]
                };
            });
            setMappedQuestions(mapped);

            const regexDetector = new RegexPIIDetector();
            const queue: PiiReviewItem[] = [];

            // Fields to scan
            const fieldsToScan = [
                { key: 'questionText', label: 'Question Text' },
                { key: 'optionA', label: 'Option A' },
                { key: 'optionB', label: 'Option B' },
                { key: 'optionC', label: 'Option C' },
                { key: 'optionD', label: 'Option D' },
                { key: 'explanation', label: 'Explanation' }
            ];

            for (let i = 0; i < mapped.length; i++) {
                const q = mapped[i];

                for (const field of fieldsToScan) {
                    const text = (q as any)[field.key];
                    if (!text || typeof text !== 'string') continue;

                    const res = await regexDetector.detect(text);
                    if (res.hasPII) {
                        queue.push({
                            questionIndex: i,
                            field: field.key,
                            fieldName: field.label,
                            text: text,
                            result: res
                        });
                    }
                }
            }

            setPiiReviewQueue(queue);

            if (queue.length > 0) {
                setStep(3);
            } else {
                // No PII, proceed directly to upload
                await uploadAndCreateConversion(mapped, mapping);
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Error during PII analysis");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePiiConfirm = async (redactions: Record<string, string>) => {
        // redactions is a map of "questionIndex-field" -> redactedText

        const newMapped = [...mappedQuestions];

        Object.entries(redactions).forEach(([key, redactedText]) => {
            const [qIndexStr, field] = key.split('-');
            const qIndex = parseInt(qIndexStr);

            if (!isNaN(qIndex) && newMapped[qIndex]) {
                newMapped[qIndex] = {
                    ...newMapped[qIndex],
                    [field]: redactedText
                };
            }
        });

        setMappedQuestions(newMapped);
        await uploadAndCreateConversion(newMapped, mappingConfig!);
    };

    const uploadAndCreateConversion = async (questions: any[], mapping: ColumnMapping) => {
        if (!file) return;

        try {
            setIsProcessing(true);
            toast.info("Finalizing conversion...");

            // 1. Upload file
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const { createBrowserClient } = await import('@supabase/ssr');
            const supabase = createBrowserClient(supabaseUrl, supabaseKey);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Unauthorized");

            const filePath = `${user.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            // 2. Send to API
            const response = await fetch('/api/conversions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name.split('.')[0],
                    filePath,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.name.endsWith('csv') ? 'csv' : 'excel',
                    questions: questions,
                    mapping
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Conversion failed');
            }

            toast.success("Conversion started successfully!");
            router.push(`/dashboard`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-none">
                <h2 className="text-3xl font-bold tracking-tight">New Conversion</h2>
                <p className="text-muted-foreground">Upload a question bank to convert it to QTI format.</p>
            </div>

            <Steps
                currentStep={step}
                steps={[
                    { title: "Upload" },
                    { title: "Map Columns" },
                    { title: "PII Review" }
                ]}
                className="mb-8 flex-none"
            />

            <div className="flex-1 min-h-0 relative">
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
                    <div className="mt-8 h-full overflow-auto">
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
                                    <p>Analyzing content...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="h-full flex flex-col">
                        {piiReviewQueue.length > 0 ? (
                            <PiiReviewer
                                items={piiReviewQueue}
                                onConfirm={handlePiiConfirm}
                                onCancel={() => setStep(2)}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {isProcessing && (
                            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                    <p>Processing...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
