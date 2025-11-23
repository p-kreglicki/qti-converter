import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Check } from 'lucide-react';

interface ColumnMapperProps {
    data: any[]; // Raw data rows
    onConfirm: (mapping: ColumnMapping) => void;
    onCancel: () => void;
}

export interface ColumnMapping {
    questionText: string;
    questionType: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string;
}

import { predictMapping } from '@/lib/parsers/smart-mapper';

export function ColumnMapper({ data, onConfirm, onCancel }: ColumnMapperProps) {
    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    const [mapping, setMapping] = useState<ColumnMapping>(() => {
        return predictMapping(columns);
    });

    const previewData = useMemo(() => {
        return data.slice(0, 50);
    }, [data]);

    const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
        setMapping(prev => ({ ...prev, [field]: value }));
    };

    const isValid = mapping.questionText && mapping.correctAnswer;
    const isAutoMatched = useMemo(() => {
        // Simple check: if we have at least question and answer mapped initially, it's likely auto-matched
        // But since we initialize state with it, we can just check if it's valid now and we haven't touched it?
        // Let's just show "Auto-mapped" if we have values.
        return mapping.questionText !== '' || mapping.correctAnswer !== '';
    }, []); // Only run once on mount effectively if we used a ref, but here it updates. 
    // Actually, let's just show a badge if we have a valid mapping.

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Map Columns</CardTitle>
                    {isAutoMatched && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                            Auto-detected columns
                        </span>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label>Question Text *</Label>
                            <Select
                                value={mapping.questionText || undefined}
                                onValueChange={(v: string) => handleMappingChange('questionText', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Question Type</Label>
                            <Select
                                value={mapping.questionType || undefined}
                                onValueChange={(v) => handleMappingChange('questionType', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__fixed__multiple_choice">Fixed: Multiple Choice</SelectItem>
                                    <SelectItem value="__fixed__true_false">Fixed: True/False</SelectItem>
                                    <div className="border-t my-1" />
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Correct Answer *</Label>
                            <Select
                                value={mapping.correctAnswer || undefined}
                                onValueChange={(v) => handleMappingChange('correctAnswer', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Option A</Label>
                            <Select
                                value={mapping.optionA || undefined}
                                onValueChange={(v) => handleMappingChange('optionA', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Option B</Label>
                            <Select
                                value={mapping.optionB || undefined}
                                onValueChange={(v) => handleMappingChange('optionB', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Option C</Label>
                            <Select
                                value={mapping.optionC || undefined}
                                onValueChange={(v) => handleMappingChange('optionC', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Option D</Label>
                            <Select
                                value={mapping.optionD || undefined}
                                onValueChange={(v) => handleMappingChange('optionD', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Explanation</Label>
                            <Select
                                value={mapping.explanation || undefined}
                                onValueChange={(v) => handleMappingChange('explanation', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium">Data Preview</div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {columns.map(col => (
                                            <TableHead key={col} className="whitespace-nowrap">{col}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, i) => (
                                        <TableRow key={i}>
                                            {columns.map(col => (
                                                <TableCell key={col} className="max-w-[300px] break-words">
                                                    {String(row[col] || '')}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button onClick={() => onConfirm(mapping)} disabled={!isValid}>
                            Confirm Mapping <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
