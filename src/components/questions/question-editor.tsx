'use client';

import { useState } from "react";
import { Question, QuestionUpdate } from "@/lib/db/types";
import { updateQuestionAction } from "@/lib/actions/questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface QuestionEditorProps {
    question: Question;
    index: number;
}

export function QuestionEditor({ question, index }: QuestionEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState<Question>(question);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates: QuestionUpdate = {
                question_text: editedQuestion.question_text,
                question_type: editedQuestion.question_type,
                answer_options: editedQuestion.answer_options,
                correct_answer: editedQuestion.correct_answer,
                explanation: editedQuestion.explanation,
                blooms_level: editedQuestion.blooms_level,
                difficulty: editedQuestion.difficulty,
                topic: editedQuestion.topic
            };

            const result = await updateQuestionAction(question.id, updates);
            if (result.success) {
                toast.success("Question updated");
                setIsEditing(false);
            } else {
                toast.error("Failed to update question");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOptionChange = (idx: number, field: 'text' | 'is_correct', value: any) => {
        const newOptions = [...(editedQuestion.answer_options || [])];
        if (!newOptions[idx]) return;

        if (field === 'text') {
            newOptions[idx] = { ...newOptions[idx], text: value };
        } else if (field === 'is_correct') {
            // If setting to true, set others to false (for single choice)
            if (value === true) {
                newOptions.forEach((opt, i) => {
                    opt.is_correct = i === idx;
                });
                // Also update correct_answer field for consistency if used
                // editedQuestion.correct_answer = newOptions[idx].id || String.fromCharCode(65 + idx);
            } else {
                newOptions[idx] = { ...newOptions[idx], is_correct: false };
            }
        }
        setEditedQuestion({ ...editedQuestion, answer_options: newOptions });
    };

    if (!isEditing) {
        return (
            <div className="p-4 hover:bg-gray-50 transition-colors group relative">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3 pr-20">
                            <div className="prose prose-sm max-w-none">
                                <p className="font-medium text-gray-900">{question.question_text}</p>
                            </div>
                            <div className="flex items-center space-x-2 flex-none">
                                <Badge variant="secondary" className="text-xs">
                                    {question.question_type.replace('_', ' ')}
                                </Badge>
                                {question.had_pii && (
                                    <Badge variant="destructive" className="text-xs">
                                        PII Detected
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2 mt-2">
                            {question.answer_options
                                ?.slice(0, question.question_type === 'true_false' ? 2 : undefined)
                                .map((option, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "text-sm p-2 rounded border flex items-center gap-2",
                                            option.is_correct
                                                ? "bg-green-50 border-green-200 text-green-900"
                                                : "bg-white border-gray-200 text-gray-700"
                                        )}
                                    >
                                        {option.is_correct ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-none" />
                                        ) : (
                                            <div className="w-4 h-4 flex-none" />
                                        )}
                                        <span>{option.text}</span>
                                    </div>
                                ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            {question.topic && <span>Topic: {question.topic}</span>}
                            {question.difficulty && <span>Difficulty: {question.difficulty}</span>}
                            {question.blooms_level && <span>Bloom's: {question.blooms_level}</span>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-blue-50/50 border-y border-blue-100">
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Question Text</label>
                            <Textarea
                                value={editedQuestion.question_text}
                                onChange={(e) => setEditedQuestion({ ...editedQuestion, question_text: e.target.value })}
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select
                                    value={editedQuestion.question_type}
                                    onValueChange={(v) => setEditedQuestion({ ...editedQuestion, question_type: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                        <SelectItem value="true_false">True/False</SelectItem>
                                        <SelectItem value="multiple_response">Multiple Response</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Bloom's Level</label>
                                <Select
                                    value={editedQuestion.blooms_level || 'remember'}
                                    onValueChange={(v) => setEditedQuestion({ ...editedQuestion, blooms_level: v as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="remember">Remember</SelectItem>
                                        <SelectItem value="understand">Understand</SelectItem>
                                        <SelectItem value="apply">Apply</SelectItem>
                                        <SelectItem value="analyze">Analyze</SelectItem>
                                        <SelectItem value="evaluate">Evaluate</SelectItem>
                                        <SelectItem value="create">Create</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Answer Options</label>
                            {editedQuestion.answer_options
                                ?.slice(0, editedQuestion.question_type === 'true_false' ? 2 : undefined)
                                .map((option, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8 flex-none",
                                                option.is_correct ? "text-green-600" : "text-gray-300"
                                            )}
                                            onClick={() => handleOptionChange(i, 'is_correct', !option.is_correct)}
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>
                                        <Input
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(i, 'text', e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
