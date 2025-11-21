'use client';

import { Question } from "@/lib/db/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface QuestionListProps {
    questions: Question[];
}

export function QuestionList({ questions }: QuestionListProps) {
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <p>No questions found.</p>
            </div>
        );
    }

    return (
        <div className="divide-y">
            {questions.map((question, index) => (
                <div key={question.id} className="p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start gap-4">
                        <div className="flex-none w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {index + 1}
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                                <div className="prose prose-sm max-w-none">
                                    <p className="font-medium text-gray-900">{question.question_text}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-none ml-4">
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

                            {/* Answer Options */}
                            <div className="grid gap-2 mt-2">
                                {question.answer_options?.map((option, i) => (
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

                            {/* Metadata Footer */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                {question.topic && <span>Topic: {question.topic}</span>}
                                {question.difficulty && <span>Difficulty: {question.difficulty}</span>}
                                {question.blooms_level && <span>Bloom's: {question.blooms_level}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
