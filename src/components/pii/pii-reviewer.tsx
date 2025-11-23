'use client';

import { useState, useMemo } from 'react';
import { PIIEntity, PIIDetectionResult } from '@/lib/pii/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PiiReviewItem {
    questionIndex: number;
    field: string;
    fieldName: string;
    text: string;
    result: PIIDetectionResult;
}

interface PiiReviewerProps {
    items: PiiReviewItem[];
    onConfirm: (decisions: Record<string, string>) => void; // Map of "questionIndex-field" -> redactedText
    onCancel: () => void;
}

export function PiiReviewer({ items, onConfirm, onCancel }: PiiReviewerProps) {
    // Flatten all entities for the list view
    // We need a unique ID for each entity: "itemIndex-entityIndex"
    const allEntities = useMemo(() => {
        return items.flatMap((item, itemIndex) =>
            item.result.entities.map((entity, entityIndex) => ({
                id: `${itemIndex}-${entityIndex}`,
                itemIndex,
                entityIndex,
                entity,
                context: `Q${item.questionIndex + 1} - ${item.fieldName}`
            }))
        );
    }, [items]);

    // Decisions: map of entityId -> boolean (true = redact)
    const [decisions, setDecisions] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        allEntities.forEach(e => {
            initial[e.id] = true; // Default to redact
        });
        return initial;
    });

    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
        allEntities.length > 0 ? allEntities[0].id : null
    );
    const [showRedactedPreview, setShowRedactedPreview] = useState(true);

    // Derived: currently selected item (text block) based on selected entity
    const selectedItemIndex = useMemo(() => {
        if (!selectedEntityId) return 0;
        const [itemIndex] = selectedEntityId.split('-').map(Number);
        return itemIndex;
    }, [selectedEntityId]);

    const selectedItem = items[selectedItemIndex];

    const handleToggleEntity = (id: string) => {
        setDecisions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Calculate redacted text for the CURRENTLY SELECTED item
    // We need to recalculate this whenever decisions change for entities in this item
    const getRedactedText = (itemIndex: number) => {
        const item = items[itemIndex];
        let text = item.text;

        // Get all entities for this item
        const itemEntities = item.result.entities
            .map((e, i) => ({ ...e, id: `${itemIndex}-${i}` }))
            .sort((a, b) => b.startIndex - a.startIndex); // Sort descending

        for (const entity of itemEntities) {
            if (decisions[entity.id]) {
                const before = text.slice(0, entity.startIndex);
                const after = text.slice(entity.endIndex);
                text = `${before}[REDACTED-${entity.type}]${after}`;
            }
        }
        return text;
    };

    const currentPreviewText = useMemo(() => {
        if (!selectedItem) return '';
        return getRedactedText(selectedItemIndex);
    }, [selectedItem, selectedItemIndex, decisions]);

    const handleConfirm = () => {
        // Generate final texts for ALL items
        const results: Record<string, string> = {};

        items.forEach((item, index) => {
            const key = `${item.questionIndex}-${item.field}`;
            results[key] = getRedactedText(index);
        });

        onConfirm(results);
    };

    const stats = useMemo(() => {
        const total = allEntities.length;
        const accepted = Object.values(decisions).filter(Boolean).length;
        return { total, accepted, rejected: total - accepted };
    }, [allEntities.length, decisions]);

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
                                {allEntities.length === 0 ? (
                                    <div className="text-center text-sm text-muted-foreground py-8">
                                        No PII detected.
                                    </div>
                                ) : (
                                    allEntities.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedEntityId(item.id)}
                                            className={cn(
                                                "flex items-start space-x-3 p-3 rounded-md border transition-colors cursor-pointer",
                                                selectedEntityId === item.id ? "ring-2 ring-primary" : "",
                                                decisions[item.id] ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200 opacity-60"
                                            )}
                                        >
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant={decisions[item.id] ? "destructive" : "secondary"} className="text-[10px]">
                                                        {item.entity.type}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {item.context}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium break-all">{item.entity.value}</p>
                                                <div className="flex items-center space-x-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                                    <Label htmlFor={`entity-${item.id}`} className="text-xs cursor-pointer select-none flex-1">
                                                        {decisions[item.id] ? 'Redact' : 'Ignore'}
                                                    </Label>
                                                    <Switch
                                                        id={`entity-${item.id}`}
                                                        checked={decisions[item.id]}
                                                        onCheckedChange={() => handleToggleEntity(item.id)}
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
                        <CardTitle className="text-sm font-medium">
                            Content Preview
                            {selectedItem && <span className="ml-2 text-muted-foreground font-normal text-xs">({selectedItem.fieldName})</span>}
                        </CardTitle>
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
                                {selectedItem ? (
                                    showRedactedPreview ? (
                                        currentPreviewText.split(/(\[REDACTED-[A-Z_]+\])/g).map((part, i) => {
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
                                        selectedItem.text
                                    )
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        Select an entity to preview context.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button variant="outline" onClick={onCancel}>Back</Button>
                <Button onClick={handleConfirm}>
                    <Shield className="mr-2 h-4 w-4" />
                    Confirm All & Process
                </Button>
            </div>
        </div>
    );
}
