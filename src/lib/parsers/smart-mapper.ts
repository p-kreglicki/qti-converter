import { ColumnMapping } from '@/components/upload/column-mapper';

// Aliases for each field, lowercased for case-insensitive matching
const ALIASES: Record<keyof ColumnMapping, string[]> = {
    questionText: ['question', 'question text', 'text', 'body', 'prompt', 'stem', 'q', 'question_text', 'statement'],
    questionType: ['type', 'question type', 'format', 'kind', 'q_type', 'question_type'],
    optionA: ['option a', 'choice a', 'a)', 'answer a', 'a', 'option_a', 'distractor 1', 'option 1'],
    optionB: ['option b', 'choice b', 'b)', 'answer b', 'b', 'option_b', 'distractor 2', 'option 2'],
    optionC: ['option c', 'choice c', 'c)', 'answer c', 'c', 'option_c', 'distractor 3', 'option 3'],
    optionD: ['option d', 'choice d', 'd)', 'answer d', 'd', 'option_d', 'distractor 4', 'option 4'],
    correctAnswer: ['correct', 'correct answer', 'answer', 'key', 'solution', 'correct_answer', 'ans', 'correct option'],
    explanation: ['explanation', 'feedback', 'rationale', 'reason', 'why', 'comment', 'notes']
};

export function predictMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {
        questionText: '',
        questionType: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: '',
        explanation: ''
    };

    const usedHeaders = new Set<string>();
    const normalizedHeaders = headers.map(h => ({ original: h, lower: h.toLowerCase().trim() }));

    // Helper to find best match
    const findMatch = (field: keyof ColumnMapping) => {
        const aliases = ALIASES[field];

        // 1. Exact match
        for (const { original, lower } of normalizedHeaders) {
            if (usedHeaders.has(original)) continue;
            if (aliases.includes(lower)) {
                usedHeaders.add(original);
                return original;
            }
        }

        // 2. Partial match (contains) - be careful with short aliases like 'a', 'b'
        for (const { original, lower } of normalizedHeaders) {
            if (usedHeaders.has(original)) continue;
            // Only do partial match if alias is > 2 chars to avoid false positives
            const bestAlias = aliases.find(alias => alias.length > 2 && lower.includes(alias));
            if (bestAlias) {
                usedHeaders.add(original);
                return original;
            }
        }

        return '';
    };

    // Order matters: specific fields first
    mapping.questionText = findMatch('questionText');
    mapping.correctAnswer = findMatch('correctAnswer');
    mapping.questionType = findMatch('questionType');
    mapping.optionA = findMatch('optionA');
    mapping.optionB = findMatch('optionB');
    mapping.optionC = findMatch('optionC');
    mapping.optionD = findMatch('optionD');
    mapping.explanation = findMatch('explanation');

    return mapping;
}
