import { PIIDetector, PIIDetectionResult, PIIEntity, PIIType } from './types';

interface RegexPattern {
    type: PIIType;
    pattern: RegExp;
    confidence: number;
}

// Common PII Regex Patterns
// Note: These are simplified for the MVP but cover standard formats
const PATTERNS: RegexPattern[] = [
    {
        type: 'EMAIL',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        confidence: 0.95
    },
    {
        type: 'PHONE',
        // Matches: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890, and 555-0199 (7 digit)
        // Updated to support 7-digit numbers: \b\d{3}[-. ]\d{4}\b
        pattern: /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b|\b[0-9]{3}[-. ][0-9]{4}\b/g,
        confidence: 0.85
    },
    {
        type: 'SSN',
        // Matches: 123-45-6789
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        confidence: 0.90
    },
    {
        type: 'CREDIT_CARD',
        // Matches: 1234-5678-9012-3456 (Visa/Mastercard style)
        pattern: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
        confidence: 0.85
    },
    {
        type: 'IP_ADDRESS',
        // IPv4
        pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        confidence: 0.80
    },
    {
        type: 'NAME',
        // Heuristic: Honorifics followed by capitalized word
        pattern: /\b(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|Rev\.)\s+[A-Z][a-z]+\b/g,
        confidence: 0.70
    },
    {
        type: 'ADDRESS',
        // Heuristic: Number followed by words and a street suffix
        pattern: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(St|Ave|Rd|Blvd|Way|Lane|Drive|Dr|Ln|Ct|Pl|Terrace|Place|Street|Avenue|Road|Boulevard)\.?\b/g,
        confidence: 0.65
    }
];

export class RegexPIIDetector implements PIIDetector {
    async detect(text: string): Promise<PIIDetectionResult> {
        const entities: PIIEntity[] = [];
        let redactedText = text;

        // We need to track replacements to avoid messing up indices for subsequent replacements
        // However, a simpler approach for MVP is to find all matches first, then redact.
        // To handle overlapping matches, we should sort by index.

        for (const { type, pattern, confidence } of PATTERNS) {
            let match;
            // Reset lastIndex for global regex
            pattern.lastIndex = 0;

            while ((match = pattern.exec(text)) !== null) {
                entities.push({
                    type,
                    value: match[0],
                    startIndex: match.index,
                    endIndex: match.index + match[0].length,
                    confidence,
                    source: 'REGEX'
                });
            }
        }

        // Sort entities by start index (descending) to make replacement easier
        entities.sort((a, b) => b.startIndex - a.startIndex);

        // Filter out overlapping entities (keeping the one with higher confidence or longer length)
        // For MVP, we'll just skip if it overlaps with a previously processed (higher index) entity
        // But since we sorted descending, we process from end to start.

        const validEntities: PIIEntity[] = [];
        let lastStart = text.length;

        for (const entity of entities) {
            if (entity.endIndex <= lastStart) {
                validEntities.push(entity);
                lastStart = entity.startIndex;

                // Redact
                const before = redactedText.slice(0, entity.startIndex);
                const after = redactedText.slice(entity.endIndex);
                redactedText = `${before}[REDACTED-${entity.type}]${after}`;
            }
        }

        // Reverse back to ascending order for the result
        validEntities.reverse();

        return {
            entities: validEntities,
            redactedText,
            hasPII: validEntities.length > 0
        };
    }
}
