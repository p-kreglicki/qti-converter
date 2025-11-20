-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  error_message TEXT,
  
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

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Conversions: Users can only see their own
CREATE POLICY "Users can view own conversions"
  ON conversions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions"
  ON conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversions"
  ON conversions FOR UPDATE
  USING (auth.uid() = user_id);

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

CREATE POLICY "Users can insert questions to own conversions"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = questions.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in own conversions"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = questions.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions from own conversions"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = questions.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

-- Exports: Access through conversion
CREATE POLICY "Users can view exports from own conversions"
  ON exports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = exports.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exports to own conversions"
  ON exports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversions
      WHERE conversions.id = exports.conversion_id
      AND conversions.user_id = auth.uid()
    )
  );

-- Usage tracking: Users can only see their own
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically set expires_at to 24 hours from creation
CREATE OR REPLACE FUNCTION set_conversion_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_conversion_expires_at
  BEFORE INSERT ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION set_conversion_expires_at();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
