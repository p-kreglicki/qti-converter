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
}

export function ColumnMapper({ data, onConfirm, onCancel }: ColumnMapperProps) {
    const [mapping, setMapping] = useState<ColumnMapping>({
        questionText: '',
        questionType: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: '',
    });

    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    const previewData = useMemo(() => {
        return data.slice(0, 5);
    }, [data]);

    const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
        setMapping(prev => ({ ...prev, [field]: value }));
    };

    const isValid = mapping.questionText && mapping.correctAnswer;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Map Columns</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label>Question Text *</Label>
                            <Select onValueChange={(v: string) => handleMappingChange('questionText', v)}>
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
                            <Select onValueChange={(v) => handleMappingChange('questionType', v)}>
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
                            <Select onValueChange={(v) => handleMappingChange('correctAnswer', v)}>
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
                            <Select onValueChange={(v) => handleMappingChange('optionA', v)}>
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
                            <Select onValueChange={(v) => handleMappingChange('optionB', v)}>
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
                            <Select onValueChange={(v) => handleMappingChange('optionC', v)}>
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
                            <Select onValueChange={(v) => handleMappingChange('optionD', v)}>
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
                                                <TableCell key={col} className="whitespace-nowrap max-w-[200px] truncate">
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
