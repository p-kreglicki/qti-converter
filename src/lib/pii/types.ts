export type PIIType =
    | 'EMAIL'
    | 'PHONE'
    | 'SSN'
    | 'CREDIT_CARD'
    | 'IP_ADDRESS'
    | 'URL'
    | 'DATE'
    | 'NAME' // Usually AI detected
    | 'ADDRESS' // Usually AI detected
    | 'OTHER';

export interface PIIEntity {
    type: PIIType;
    value: string;
    startIndex: number;
    endIndex: number;
    confidence: number; // 0-1
    source: 'REGEX' | 'AI';
}

export interface PIIDetectionResult {
    entities: PIIEntity[];
    redactedText: string;
    hasPII: boolean;
}

export interface PIIDetector {
    detect(text: string): Promise<PIIDetectionResult>;
}
