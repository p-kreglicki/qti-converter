export interface ParsedQuestion {
    id: string;
    text: string;
    type: 'multiple_choice' | 'multiple_response' | 'true_false';
    options: string[];
    correctAnswers: string[]; // Indices or values
    feedback?: string;
    metadata?: Record<string, any>;
}

export interface ParseResult {
    questions: ParsedQuestion[];
    errors: string[];
    warnings: string[];
}

export interface ParserOptions {
    hasHeader?: boolean;
    skipEmptyLines?: boolean;
}

export interface FileParser {
    parse(file: File, options?: ParserOptions): Promise<ParseResult>;
}
