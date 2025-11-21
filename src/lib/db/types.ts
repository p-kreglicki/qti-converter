// Database Types

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ConversionMode = 'privacy' | 'basic' | 'review';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type ExportFormat = 'qti' | 'pdf' | 'csv' | 'word' | 'json';

// Database Tables

export interface Profile {
    id: string;
    full_name: string | null;
    organization: string | null;
    subscription_tier: SubscriptionTier;
    stripe_customer_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Conversion {
    id: string;
    user_id: string;
    title: string;
    original_filename: string;
    file_type: 'csv' | 'excel';
    file_size_bytes: number;
    file_url: string;
    status: ConversionStatus;
    error_message: string | null;
    total_questions: number | null;
    pii_detected: boolean;
    pii_detection_results: PIIDetection[] | null;
    quality_score: number | null;
    blooms_distribution: Record<BloomsLevel, number> | null;
    created_at: string;
    completed_at: string | null;
    expires_at: string;
    deleted_at: string | null;
    conversion_mode: ConversionMode;
    ai_enhancement_enabled: boolean;
}

export interface Question {
    id: string;
    conversion_id: string;
    question_text: string;
    question_type: QuestionType;
    answer_options: AnswerOption[] | null;
    correct_answer: string | null;
    explanation: string | null;
    topic: string | null;
    difficulty: Difficulty | null;
    blooms_level: BloomsLevel | null;
    had_pii: boolean;
    pii_anonymized: boolean;
    pii_changes: PIIChange[] | null;
    quality_score: number | null;
    quality_issues: QualityIssue[] | null;
    ai_suggestions: AISuggestions | null;
    original_row_number: number;
    created_at: string;
    updated_at: string;
}

export interface Export {
    id: string;
    conversion_id: string;
    format: ExportFormat;
    file_url: string;
    file_size_bytes: number | null;
    created_at: string;
    expires_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    metadata: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface UsageTracking {
    id: string;
    user_id: string;
    month: string;
    questions_converted: number;
    ai_enhancements_used: number;
    created_at: string;
    updated_at: string;
}

// Supporting Types

export interface AnswerOption {
    id: string;
    text: string;
    is_correct: boolean;
    feedback?: string;
}

export interface PIIDetection {
    type: 'name' | 'email' | 'phone' | 'ssn' | 'address' | 'student_id';
    original_text: string;
    suggested_replacement: string;
    confidence: number; // 0-1
    location: {
        field: string; // 'question_text', 'answer_options', etc.
        position: number;
    };
}

export interface PIIChange {
    original: string;
    replacement: string;
    type: string;
}

export interface QualityIssue {
    type: 'weak_distractor' | 'ambiguous_wording' | 'bias_detected' | 'clarity_issue' | 'blooms_mismatch';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestion?: string;
    affected_element?: string;
}

export interface AISuggestions {
    improved_question_text?: string;
    improved_answer_options?: AnswerOption[];
    improved_explanation?: string;
    blooms_level_suggestion?: BloomsLevel;
    reasoning: string;
}

// Insert Types (for creating new records)

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;

export type ConversionInsert = Omit<Conversion, 'id' | 'created_at' | 'completed_at' | 'expires_at' | 'deleted_at'> & {
    id?: string;
};

export type QuestionInsert = Omit<Question, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
};

export type ExportInsert = Omit<Export, 'id' | 'created_at'> & {
    id?: string;
};

export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'> & {
    id?: string;
};

export type UsageTrackingInsert = Omit<UsageTracking, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
};

// Update Types (for updating existing records)

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type ConversionUpdate = Partial<Omit<Conversion, 'id' | 'user_id' | 'created_at' | 'expires_at'>>;

export type QuestionUpdate = Partial<Omit<Question, 'id' | 'conversion_id' | 'created_at' | 'updated_at'>>;
