'use client';

import { useState, useMemo } from "react";
import { Question } from "@/lib/db/types";
import { QuestionEditor } from "./question-editor";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowUpDown } from "lucide-react";

interface QuestionListProps {
    questions: Question[];
}

export function QuestionList({ questions }: QuestionListProps) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<"original" | "updated">("original");

    const filteredQuestions = useMemo(() => {
        return questions
            .filter(q => {
                const matchesSearch = q.question_text.toLowerCase().includes(search.toLowerCase());
                const matchesType = typeFilter === "all" || q.question_type === typeFilter;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                if (sortOrder === "updated") {
                    return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
                }
                return (a.original_row_number || 0) - (b.original_row_number || 0);
            });
    }, [questions, search, typeFilter, sortOrder]);

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <p>No questions found.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 border-b bg-white flex items-center gap-4 sticky top-0 z-10">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                        <SelectItem value="multiple_response">Multiple Response</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                    <SelectTrigger className="w-[180px]">
                        <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="original">Original Order</SelectItem>
                        <SelectItem value="updated">Last Updated</SelectItem>
                    </SelectContent>
                </Select>
                <div className="ml-auto text-sm text-muted-foreground">
                    Showing {filteredQuestions.length} of {questions.length}
                </div>
            </div>

            {/* List */}
            <div className="divide-y">
                {filteredQuestions.map((question, index) => (
                    <QuestionEditor
                        key={question.id}
                        question={question}
                        index={sortOrder === 'original' ? (question.original_row_number || index + 1) - 1 : index}
                    />
                ))}
                {filteredQuestions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No questions match your filters.
                    </div>
                )}
            </div>
        </div>
    );
}
