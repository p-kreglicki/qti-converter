'use client';

import { useState, useMemo } from 'react';
import { PIIEntity, PIIDetectionResult } from '@/lib/pii/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Check, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PiiReviewerProps {
    originalText: string;
    detectionResult: PIIDetectionResult;
    onConfirm: (finalRedactedText: string) => void;
    onCancel: () => void;
}

export function PiiReviewer({ originalText, detectionResult, onConfirm, onCancel }: PiiReviewerProps) {
    // State to track which entities are accepted (true) or rejected (false)
    // Key is the index in the entities array (or a unique ID if we had one)
    const [decisions, setDecisions] = useState<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        detectionResult.entities.forEach((_, i) => {
            initial[i] = true; // Default to accepting all redactions
        });
        return initial;
    });

    const [showRedactedPreview, setShowRedactedPreview] = useState(true);

    const handleToggleEntity = (index: number) => {
        setDecisions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Calculate final text based on decisions
    const finalText = useMemo(() => {
        let text = originalText;
        // Sort entities by start index descending to handle replacements
        const sortedEntities = detectionResult.entities
            .map((e, i) => ({ ...e, originalIndex: i }))
            .sort((a, b) => b.startIndex - a.startIndex);

        for (const entity of sortedEntities) {
            if (decisions[entity.originalIndex]) {
                const before = text.slice(0, entity.startIndex);
                const after = text.slice(entity.endIndex);
                text = `${before}[REDACTED-${entity.type}]${after}`;
            }
        }
        return text;
    }, [originalText, detectionResult.entities, decisions]);

    const stats = useMemo(() => {
        const total = detectionResult.entities.length;
        const accepted = Object.values(decisions).filter(Boolean).length;
        return { total, accepted, rejected: total - accepted };
    }, [detectionResult.entities.length, decisions]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">PII Review</h3>
                    <p className="text-sm text-muted-foreground">
                        Review detected PII entities and confirm redactions.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        {stats.total} Detected
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                        {stats.accepted} Redacting
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Entity List */}
                <Card className="md:col-span-1 flex flex-col min-h-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Detected Entities</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 p-0">
                        <ScrollArea className="h-[400px] md:h-full">
                            <div className="p-4 space-y-3">
                                {detectionResult.entities.length === 0 ? (
                                    <div className="text-center text-sm text-muted-foreground py-8">
                                        No PII detected.
                                    </div>
                                ) : (
                                    detectionResult.entities.map((entity, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-start space-x-3 p-3 rounded-md border transition-colors",
                                                decisions[index] ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200 opacity-60"
                                            )}
                                        >
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant={decisions[index] ? "destructive" : "secondary"} className="text-[10px]">
                                                        {entity.type}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {Math.round(entity.confidence * 100)}% conf.
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium break-all">{entity.value}</p>
                                                <div className="flex items-center space-x-2 pt-1">
                                                    <Label htmlFor={`entity-${index}`} className="text-xs cursor-pointer select-none flex-1">
                                                        {decisions[index] ? 'Redact' : 'Ignore'}
                                                    </Label>
                                                    <Switch
                                                        id={`entity-${index}`}
                                                        checked={decisions[index]}
                                                        onCheckedChange={() => handleToggleEntity(index)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Preview Area */}
                <Card className="md:col-span-2 flex flex-col min-h-0">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Content Preview</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="preview-mode" className="text-xs">Show Redacted</Label>
                            <Switch
                                id="preview-mode"
                                checked={showRedactedPreview}
                                onCheckedChange={setShowRedactedPreview}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 p-0">
                        <ScrollArea className="h-[400px] md:h-full w-full rounded-md border bg-muted/50">
                            <div className="p-4 font-mono text-sm whitespace-pre-wrap">
                                {showRedactedPreview ? (
                                    // We can highlight the redacted parts
                                    finalText.split(/(\[REDACTED-[A-Z_]+\])/g).map((part, i) => {
                                        if (part.startsWith('[REDACTED-')) {
                                            return (
                                                <span key={i} className="bg-red-100 text-red-800 px-1 rounded border border-red-200 select-none">
                                                    {part}
                                                </span>
                                            );
                                        }
                                        return <span key={i}>{part}</span>;
                                    })
                                ) : (
                                    // Highlight detected entities in original text
                                    // This is harder to do efficiently with React without complex mapping
                                    // For MVP, just showing original text is fine, or we could try to highlight
                                    // But let's stick to simple original text for "Raw" view
                                    originalText
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button variant="outline" onClick={onCancel}>Back</Button>
                <Button onClick={() => onConfirm(finalText)}>
                    <Shield className="mr-2 h-4 w-4" />
                    Confirm & Process
                </Button>
            </div>
        </div>
    );
}
