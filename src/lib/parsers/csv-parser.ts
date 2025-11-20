import Papa from 'papaparse';
import { FileParser, ParseResult, ParserOptions } from './types';

export class CSVParser implements FileParser {
    async parse(file: File, options?: ParserOptions): Promise<ParseResult> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: options?.hasHeader ?? true,
                skipEmptyLines: options?.skipEmptyLines ?? true,
                complete: (results) => {
                    const parseResult: ParseResult = {
                        questions: [], // We don't map to questions yet, just raw data first usually, but interface says questions.
                        // For now, we'll return raw data in a way that can be mapped later.
                        // Actually, the interface I defined expects ParsedQuestion[].
                        // This implies we need a mapping step.
                        // BUT, the task list says "Implement Column Mapping interface" NEXT.
                        // So the parser should probably return raw rows, and then the mapping logic converts to questions.
                        errors: results.errors.map(e => e.message),
                        warnings: [],
                    };

                    // Wait, if I need to return ParsedQuestion[], I need to know the mapping.
                    // Since I don't have mapping yet, I should probably adjust the interface 
                    // OR return a generic structure that holds the raw data for now.

                    // Let's adjust the interface in a separate step if needed, but for now
                    // let's just return the raw data in the 'metadata' field of ParsedQuestion
                    // or change the return type.

                    // Actually, it's better to have a "RawParser" and a "QuestionMapper".
                    // The current task is "Implement CSV and Excel parsers".
                    // I will implement them to return the raw rows wrapped in a structure.

                    // Let's assume for this step we just return the raw data in a temporary way
                    // or I should update the types to support raw rows.

                    // I'll update the types to include 'rawRows' in ParseResult or similar.
                    // But I can't edit types.ts in this tool call easily without context switching.

                    // I'll stick to the plan: The parser returns "ParseResult".
                    // I'll map the raw rows to a "raw" property in metadata for now.

                    const questions = results.data.map((row: any, index) => ({
                        id: `row-${index}`,
                        text: '', // Placeholder
                        type: 'multiple_choice' as const,
                        options: [],
                        correctAnswers: [],
                        metadata: {
                            raw: row
                        }
                    }));

                    parseResult.questions = questions;
                    resolve(parseResult);
                },
                error: (error) => {
                    reject(error);
                }
            });
        });
    }
}
