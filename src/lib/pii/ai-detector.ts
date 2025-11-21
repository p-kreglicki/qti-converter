import Anthropic from '@anthropic-ai/sdk';
import { PIIDetector, PIIDetectionResult, PIIEntity, PIIType } from './types';

export class AIPIIDetector implements PIIDetector {
    private client: Anthropic;

    constructor(apiKey?: string) {
        // Use provided key or fallback to env var (client handles env var automatically too)
        this.client = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        });
    }

    async detect(text: string): Promise<PIIDetectionResult> {
        if (!text || text.trim().length === 0) {
            return { entities: [], redactedText: text, hasPII: false };
        }

        try {
            const prompt = `
You are a PII (Personally Identifiable Information) detection system.
Analyze the following text and identify all PII entities.
Focus on context-dependent PII that regex might miss, such as:
- Names (of people)
- Physical Addresses
- Medical conditions or health data
- Job titles (if specific enough to identify)
- Organization names (if context implies privacy)

Do NOT flag generic terms. Only flag specific entities.

Return the result as a JSON object with this structure:
{
  "entities": [
    {
      "type": "NAME" | "ADDRESS" | "OTHER",
      "value": "exact string found in text",
      "confidence": 0.0 to 1.0
    }
  ]
}

Text to analyze:
"${text}"
`;

            const message = await this.client.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }],
            });

            const contentBlock = message.content[0];
            if (contentBlock.type !== 'text') {
                throw new Error('Unexpected response type from Claude');
            }

            // Extract JSON from response (it might have text around it)
            const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('No JSON found in AI response');
                return { entities: [], redactedText: text, hasPII: false };
            }

            const result = JSON.parse(jsonMatch[0]);
            const entities: PIIEntity[] = [];
            let redactedText = text;

            // Map AI result to PIIEntity
            // Note: AI doesn't give indices reliably, so we find them in the text.
            // This is a limitation: if the same value appears twice, we might flag the wrong one or all of them.
            // For MVP, we'll flag all occurrences of the value.

            for (const item of result.entities) {
                const type = this.mapType(item.type);
                const value = item.value;

                // Find all occurrences
                let startIndex = 0;
                let index;
                while ((index = text.indexOf(value, startIndex)) > -1) {
                    entities.push({
                        type,
                        value,
                        startIndex: index,
                        endIndex: index + value.length,
                        confidence: item.confidence,
                        source: 'AI'
                    });
                    startIndex = index + value.length;
                }
            }

            // Redact
            // Sort descending to handle redaction correctly
            entities.sort((a, b) => b.startIndex - a.startIndex);

            // Filter overlaps (simple approach: if end > lastStart, skip)
            let lastStart = text.length;
            const validEntities: PIIEntity[] = [];

            for (const entity of entities) {
                if (entity.endIndex <= lastStart) {
                    validEntities.push(entity);
                    lastStart = entity.startIndex;

                    const before = redactedText.slice(0, entity.startIndex);
                    const after = redactedText.slice(entity.endIndex);
                    redactedText = `${before}[REDACTED-${entity.type}]${after}`;
                }
            }

            validEntities.reverse();

            return {
                entities: validEntities,
                redactedText,
                hasPII: validEntities.length > 0
            };

        } catch (error) {
            console.error('AI PII Detection failed:', error);
            // Fail open or closed? For PII, usually fail closed (error), but here we might just return empty
            // and rely on regex. Let's return empty with error log for now.
            return { entities: [], redactedText: text, hasPII: false };
        }
    }

    private mapType(aiType: string): PIIType {
        const upper = aiType.toUpperCase();
        if (['NAME', 'ADDRESS', 'EMAIL', 'PHONE', 'SSN', 'CREDIT_CARD', 'IP_ADDRESS', 'URL', 'DATE'].includes(upper)) {
            return upper as PIIType;
        }
        return 'OTHER';
    }
}
