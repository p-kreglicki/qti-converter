# Product Requirements Document: CSV/Excel to QTI Converter

**Version:** 1.0  
**Date:** 2025-01-19  
**Target:** AI-assisted development (Cursor, GitHub Copilot, etc.)  
**Project Code Name:** QTI-Convert-Pro

---

## Executive Summary

Build a web application that converts assessment question banks from CSV/Excel format to QTI 2.1 standard with AI-powered quality enhancement and automatic PII protection. Privacy-first architecture with 24-hour data retention.

**Tech Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, shadcn/ui
- Backend: Next.js API Routes, PostgreSQL (Supabase)
- AI: Anthropic Claude 3.5 Sonnet
- Hosting: Vercel
- Payments: Stripe

---

## 1. Project Structure

```
qti-converter/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/                   # Auth routes group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # Protected routes group
│   │   │   ├── dashboard/
│   │   │   ├── conversions/
│   │   │   ├── editor/
│   │   │   └── layout.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── upload/
│   │   │   ├── convert/
│   │   │   ├── pii-detect/
│   │   │   ├── enhance/
│   │   │   ├── export/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── upload/
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ColumnMapper.tsx
│   │   │   └── FormatValidator.tsx
│   │   ├── pii/
│   │   │   ├── PIIDetector.tsx
│   │   │   ├── PIIReviewModal.tsx
│   │   │   └── AnonymizationDiff.tsx
│   │   ├── editor/
│   │   │   ├── QuestionEditor.tsx
│   │   │   ├── QualityScoreCard.tsx
│   │   │   └── BloomsTaxonomyChart.tsx
│   │   └── export/
│   │       ├── ExportModal.tsx
│   │       └── FormatSelector.tsx
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── csvParser.ts
│   │   │   ├── excelParser.ts
│   │   │   └── validator.ts
│   │   ├── pii/
│   │   │   ├── regexDetector.ts
│   │   │   ├── aiDetector.ts
│   │   │   └── anonymizer.ts
│   │   ├── ai/
│   │   │   ├── claude.ts
│   │   │   ├── qualityEnhancer.ts
│   │   │   └── bloomsClassifier.ts
│   │   ├── qti/
│   │   │   ├── generator.ts
│   │   │   ├── validator.ts
│   │   │   └── templates/
│   │   ├── export/
│   │   │   ├── pdfExporter.ts
│   │   │   ├── csvExporter.ts
│   │   │   ├── wordExporter.ts
│   │   │   └── jsonExporter.ts
│   │   ├── db/
│   │   │   ├── supabase.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   └── utils/
│   │       ├── encryption.ts
│   │       ├── logger.ts
│   │       └── helpers.ts
│   ├── types/
│   │   ├── question.ts
│   │   ├── conversion.ts
│   │   ├── pii.ts
│   │   └── api.ts
│   └── config/
│       ├── constants.ts
│       └── env.ts
├── public/
│   ├── templates/
│   │   └── question-bank-template.xlsx
│   └── docs/
├── scripts/
│   ├── cleanup-old-files.ts        # Cron job: 24-hour deletion
│   └── seed-db.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local
├── .env.example
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 2. Database Schema (PostgreSQL via Supabase)

```sql
-- Users table (handled by Supabase Auth)
-- Built-in: id, email, created_at, etc.

-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  organization TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversions
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File info
  original_filename TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_url TEXT NOT NULL,  -- Supabase Storage URL
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Metadata
  total_questions INTEGER,
  pii_detected BOOLEAN DEFAULT FALSE,
  pii_detection_results JSONB,  -- Store detected PII details
  quality_score NUMERIC(4,2),  -- 0-100
  blooms_distribution JSONB,  -- {"remember": 20, "understand": 30, ...}
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,  -- created_at + 24 hours
  deleted_at TIMESTAMPTZ,  -- Soft delete for audit
  
  -- Settings
  conversion_mode TEXT DEFAULT 'privacy' CHECK (conversion_mode IN ('privacy', 'basic', 'review')),
  ai_enhancement_enabled BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_conversions_user_id ON conversions(user_id);
CREATE INDEX idx_conversions_expires_at ON conversions(expires_at);
CREATE INDEX idx_conversions_status ON conversions(status);

-- Questions (extracted from uploaded file)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE CASCADE,
  
  -- Original content
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  
  -- Answers (for multiple choice)
  answer_options JSONB,  -- [{"text": "...", "is_correct": false}, ...]
  correct_answer TEXT,
  explanation TEXT,
  
  -- Metadata
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  blooms_level TEXT CHECK (blooms_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  
  -- PII handling
  had_pii BOOLEAN DEFAULT FALSE,
  pii_anonymized BOOLEAN DEFAULT FALSE,
  pii_changes JSONB,  -- Track what was replaced
  
  -- Quality scores
  quality_score NUMERIC(4,2),
  quality_issues JSONB,  -- [{"type": "weak_distractor", "severity": "medium", ...}]
  ai_suggestions JSONB,
  
  -- Order
  original_row_number INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_conversion_id ON questions(conversion_id);
CREATE INDEX idx_questions_blooms_level ON questions(blooms_level);

-- Export files (QTI, PDF, etc.)
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_id UUID NOT NULL REFERENCES conversions(id) ON DELETE CASCADE,
  
  format TEXT NOT NULL CHECK (format IN ('qti', 'pdf', 'csv', 'word', 'json')),
  file_url TEXT NOT NULL,  -- Supabase Storage URL
  file_size_bytes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL  -- Same as conversion
);

CREATE INDEX idx_exports_conversion_id ON exports(conversion_id);

-- Audit log (no question content, only events)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL,  -- 'upload', 'convert', 'pii_detect', 'export', 'delete', etc.
  resource_type TEXT,  -- 'conversion', 'question', 'export'
  resource_id UUID,
  
  metadata JSONB,  -- Additional context (no PII or question content)
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Usage tracking (for billing)
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  month DATE NOT NULL,  -- First day of month
  questions_converted INTEGER DEFAULT 0,
  ai_enhancements_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, month)
);

CREATE INDEX idx_usage_tracking_user_month ON usage_tracking(user_id, month);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Conversions: Users can only see their own
CREATE POLICY "Users can view own conversions"
  ON conversions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions"
  ON conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversions"
  ON conversions FOR DELETE
  USING (auth.uid() = user_id);

-- Questions: Access through conversion
CREATE POLICY "Users can view questions from own conversions"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = questions.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

-- Similar policies for exports, usage_tracking
```

---

## 3. Core Type Definitions

```typescript
// types/question.ts

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface QualityIssue {
  type: 'weak_distractor' | 'ambiguous_wording' | 'bias_detected' | 'clarity_issue' | 'blooms_mismatch';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
}

export interface PIIDetection {
  type: 'name' | 'email' | 'phone' | 'ssn' | 'address' | 'student_id';
  originalText: string;
  suggestedReplacement: string;
  confidence: number; // 0-1
  location: {
    field: string; // 'question_text', 'answer_options', etc.
    position: number;
  };
}

export interface Question {
  id: string;
  conversionId: string;
  
  // Content
  questionText: string;
  questionType: QuestionType;
  answerOptions?: AnswerOption[];
  correctAnswer: string;
  explanation?: string;
  
  // Metadata
  topic?: string;
  difficulty?: Difficulty;
  bloomsLevel?: BloomsLevel;
  
  // PII
  hadPII: boolean;
  piiAnonymized: boolean;
  piiChanges?: Array<{
    original: string;
    replacement: string;
    type: string;
  }>;
  
  // Quality
  qualityScore?: number;
  qualityIssues?: QualityIssue[];
  aiSuggestions?: {
    improvedQuestionText?: string;
    improvedAnswerOptions?: AnswerOption[];
    improvedExplanation?: string;
    bloomsLevelSuggestion?: BloomsLevel;
    reasoning: string;
  };
  
  // Admin
  originalRowNumber: number;
  createdAt: string;
  updatedAt: string;
}

// types/conversion.ts

export type ConversionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ConversionMode = 'privacy' | 'basic' | 'review';

export interface Conversion {
  id: string;
  userId: string;
  
  // File
  originalFilename: string;
  fileSizeBytes: number;
  fileUrl: string;
  
  // Status
  status: ConversionStatus;
  errorMessage?: string;
  
  // Results
  totalQuestions?: number;
  piiDetected: boolean;
  piiDetectionResults?: PIIDetection[];
  qualityScore?: number;
  bloomsDistribution?: Record<BloomsLevel, number>;
  
  // Settings
  conversionMode: ConversionMode;
  aiEnhancementEnabled: boolean;
  
  // Timestamps
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
  deletedAt?: string;
}

// types/api.ts

export interface UploadRequest {
  file: File;
  conversionMode: ConversionMode;
  aiEnhancementEnabled: boolean;
}

export interface UploadResponse {
  conversionId: string;
  status: ConversionStatus;
  totalQuestions: number;
  piiDetected: boolean;
  piiDetectionResults?: PIIDetection[];
}

export interface PIIReviewRequest {
  conversionId: string;
  approvedChanges: Array<{
    detectionId: string;
    approved: boolean;
    customReplacement?: string;
  }>;
}

export interface EnhanceRequest {
  conversionId: string;
  questionIds?: string[]; // If not provided, enhance all
  enhancementLevel: 'basic' | 'standard' | 'auto';
}

export interface ExportRequest {
  conversionId: string;
  format: 'qti' | 'pdf' | 'csv' | 'word' | 'json';
  includeQualityReport: boolean;
  includePIILog: boolean;
}

export interface ExportResponse {
  exportId: string;
  downloadUrl: string;
  expiresAt: string;
}
```

---

## 4. API Routes Specification

### 4.1 POST /api/upload

**Purpose:** Upload and parse CSV/Excel file, perform initial PII detection

**Request:**
```typescript
// multipart/form-data
{
  file: File,
  conversionMode: 'privacy' | 'basic' | 'review',
  aiEnhancementEnabled: boolean
}
```

**Response:**
```typescript
{
  conversionId: string,
  status: 'pending' | 'processing',
  totalQuestions: number,
  piiDetected: boolean,
  piiDetectionResults?: PIIDetection[],
  requiresReview: boolean  // True if PII detected and mode is 'privacy'
}
```

**Implementation Steps:**
1. Validate file (size, format)
2. Upload to Supabase Storage
3. Parse CSV/Excel using appropriate parser
4. Create `conversion` record in DB
5. Create `question` records for each row
6. Run PII detection (regex scan)
7. If PII detected and mode is 'privacy', flag for review
8. Return response with detection results

**Error Handling:**
- 400: Invalid file format
- 413: File too large
- 422: Malformed data in file
- 500: Server error

---

### 4.2 POST /api/pii-detect

**Purpose:** Deep AI-powered PII detection for flagged content

**Request:**
```typescript
{
  conversionId: string,
  questionIds?: string[]  // Specific questions to analyze
}
```

**Response:**
```typescript
{
  detectionResults: Array<{
    questionId: string,
    detections: PIIDetection[],
    suggestedAnonymization: {
      originalText: string,
      anonymizedText: string,
      changes: Array<{original: string, replacement: string}>
    }
  }>
}
```

**Implementation:**
1. Fetch questions from DB
2. For each question, call Claude API with PII detection prompt
3. Parse AI response into structured detections
4. Generate anonymized versions
5. Store results in `questions.pii_changes`
6. Return for user review

**Claude Prompt Template:**
```
You are a PII detection specialist for educational assessments.

Analyze this question and identify any personally identifiable information:
- Full names (first + last)
- Email addresses
- Phone numbers
- Student IDs
- Addresses
- Any information that could identify a specific individual

Question: "{questionText}"
Answer Options: {answerOptions}

Return JSON:
{
  "hasPII": boolean,
  "detections": [
    {
      "type": "name|email|phone|address|student_id",
      "text": "the actual PII found",
      "confidence": 0-1,
      "replacement": "suggested generic replacement"
    }
  ],
  "anonymizedQuestion": "rewritten question with PII replaced"
}

Be conservative - flag anything that might be PII.
```

---

### 4.3 POST /api/pii-review

**Purpose:** User approves/rejects PII anonymization suggestions

**Request:**
```typescript
{
  conversionId: string,
  approvals: Array<{
    questionId: string,
    detectionId: string,
    approved: boolean,
    customReplacement?: string
  }>
}
```

**Response:**
```typescript
{
  success: boolean,
  questionsUpdated: number,
  nextStep: 'enhance' | 'convert'  // Based on settings
}
```

**Implementation:**
1. Validate all question IDs belong to conversion
2. For approved changes, update `questions` table
3. Set `pii_anonymized = true`
4. Store change log in `pii_changes` JSON field
5. Update conversion status
6. If AI enhancement enabled, trigger enhancement
7. Otherwise, proceed to QTI generation

---

### 4.4 POST /api/enhance

**Purpose:** AI-powered quality enhancement

**Request:**
```typescript
{
  conversionId: string,
  questionIds?: string[],
  enhancementLevel: 'basic' | 'standard' | 'auto'
}
```

**Response:**
```typescript
{
  jobId: string,
  status: 'queued' | 'processing',
  estimatedTimeSeconds: number
}
```

**Implementation:**
1. Create background job in BullMQ
2. For each question:
   - Call Claude API with enhancement prompt
   - Parse suggestions
   - Calculate quality score
   - Classify Bloom's level
   - Detect quality issues
3. Update `questions` table with results
4. Calculate overall conversion quality score
5. Update `conversion` record

**Claude Enhancement Prompt Template:**
```
You are an assessment quality expert. Analyze this question and provide improvements.

Question Type: {questionType}
Question: "{questionText}"
Answer Options: {answerOptions}
Correct Answer: {correctAnswer}
Current Explanation: "{explanation}"

Evaluate and provide:
1. Quality Score (0-100) based on:
   - Clarity and precision of question
   - Quality of distractors (wrong answers)
   - Appropriateness of correct answer
   - Quality of explanation

2. Bloom's Taxonomy Level:
   - Analyze the cognitive demand
   - Classify as: remember, understand, apply, analyze, evaluate, or create
   - Justify classification

3. Quality Issues:
   - Identify any problems (ambiguous wording, weak distractors, bias, etc.)
   - Assign severity: low, medium, high

4. Improvements:
   - Suggest better question wording (if needed)
   - Suggest better distractors (if weak)
   - Suggest better explanation

Return JSON:
{
  "qualityScore": 0-100,
  "bloomsLevel": "remember|understand|apply|analyze|evaluate|create",
  "bloomsReasoning": "explanation of classification",
  "issues": [
    {
      "type": "weak_distractor|ambiguous_wording|bias_detected|clarity_issue",
      "severity": "low|medium|high",
      "description": "specific issue",
      "affectedElement": "question|optionA|optionB|explanation"
    }
  ],
  "suggestions": {
    "improvedQuestion": "better wording (if needed)",
    "improvedOptions": [
      {"text": "...", "reasoning": "why this is better"}
    ],
    "improvedExplanation": "clearer explanation"
  }
}
```

---

### 4.5 POST /api/convert

**Purpose:** Generate QTI 2.1 XML from questions

**Request:**
```typescript
{
  conversionId: string
}
```

**Response:**
```typescript
{
  success: boolean,
  qtiFileUrl: string,
  expiresAt: string
}
```

**Implementation:**
1. Fetch all questions for conversion
2. Generate QTI XML structure:
   - Assessment test wrapper
   - Assessment items (one per question)
   - Response processing
   - Metadata
3. Validate against QTI 2.1 schema
4. Create ZIP package with manifest
5. Upload to Supabase Storage
6. Create `export` record
7. Return download URL

**QTI Generation Logic:**
```typescript
// Pseudocode structure

function generateQTI(questions: Question[]): string {
  const assessmentTest = {
    identifier: generateUUID(),
    title: "Converted Assessment",
    assessmentItems: questions.map(q => generateAssessmentItem(q))
  };
  
  return xmlBuilder.build(assessmentTest);
}

function generateAssessmentItem(question: Question): QTIAssessmentItem {
  return {
    identifier: question.id,
    title: truncate(question.questionText, 50),
    itemBody: {
      choiceInteraction: {
        prompt: question.questionText,
        simpleChoices: question.answerOptions.map(opt => ({
          identifier: opt.id,
          text: opt.text
        }))
      }
    },
    responseDeclaration: {
      identifier: 'RESPONSE',
      cardinality: 'single',
      baseType: 'identifier',
      correctResponse: {
        value: question.answerOptions.find(o => o.isCorrect).id
      }
    },
    outcomeDeclaration: {
      identifier: 'SCORE',
      cardinality: 'single',
      baseType: 'float'
    },
    responseProcessing: {
      // Standard scoring logic
      responseCondition: {
        responseIf: {
          match: ['RESPONSE', 'CORRECT_RESPONSE'],
          setOutcomeValue: {
            identifier: 'SCORE',
            value: 1
          }
        },
        responseElse: {
          setOutcomeValue: {
            identifier: 'SCORE',
            value: 0
          }
        }
      }
    },
    // Metadata
    metadata: {
      'qmd:topic': question.topic,
      'qmd:difficulty': question.difficulty,
      'qmd:bloomsLevel': question.bloomsLevel
    }
  };
}
```

---

### 4.6 POST /api/export

**Purpose:** Export in various formats (PDF, CSV, Word, JSON)

**Request:**
```typescript
{
  conversionId: string,
  format: 'pdf' | 'csv' | 'word' | 'json',
  options: {
    includeQualityReport: boolean,
    includePIILog: boolean,
    includeExplanations: boolean
  }
}
```

**Response:**
```typescript
{
  exportId: string,
  downloadUrl: string,
  expiresAt: string
}
```

**Implementation:**
Each format has dedicated exporter:

**PDF Export:**
- Use `pdfkit` or similar library
- Format: Title page, questions with answers, quality report appendix
- Include charts (Bloom's distribution)

**CSV Export:**
- Same structure as input format
- Additional columns for quality scores, AI suggestions
- Include metadata sheet

**Word Export:**
- Use `docx` library
- Formatted document with styles
- Table of contents
- Separate answer key section

**JSON Export:**
- Full structured data export
- Includes all metadata, scores, suggestions
- For API integrations

---

### 4.7 DELETE /api/conversions/:id

**Purpose:** Manual deletion before 24-hour expiry

**Request:**
```
DELETE /api/conversions/{conversionId}
```

**Response:**
```typescript
{
  success: boolean,
  deletedAt: string
}
```

**Implementation:**
1. Verify user owns conversion
2. Soft delete: Set `deleted_at` timestamp
3. Delete files from Supabase Storage immediately
4. Delete questions and exports (CASCADE)
5. Log audit event
6. Return confirmation

---

## 5. Component Specifications

### 5.1 FileUploader Component

**Path:** `src/components/upload/FileUploader.tsx`

**Props:**
```typescript
interface FileUploaderProps {
  onUploadComplete: (conversion: Conversion) => void;
  onError: (error: Error) => void;
}
```

**Features:**
- Drag-and-drop zone
- File type validation (CSV, XLSX, XLS)
- File size validation (max 10MB)
- Progress bar during upload
- Preview of detected columns

**UI States:**
1. Empty (drop zone)
2. Uploading (progress bar)
3. Parsing (spinner with "Analyzing file...")
4. Success (show summary)
5. Error (clear error message)

**Implementation:**
```typescript
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FileUploader({ onUploadComplete, onError }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    // Validate file
    if (!['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(file.type)) {
      onError(new Error('Invalid file type. Please upload CSV or Excel file.'));
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      onError(new Error('File too large. Maximum size is 10MB.'));
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversionMode', 'privacy');
      formData.append('aiEnhancementEnabled', 'true');
      
      // Simulated progress (real progress would need streaming/websocket)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const result = await response.json();
      onUploadComplete(result);
      
    } catch (error) {
      onError(error as Error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete, onError]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: uploading
  });
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >