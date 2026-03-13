-- LinkedIn Intel - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE source_type AS ENUM ('linkedin', 'perplexity');
CREATE TYPE insight_type AS ENUM ('career_pattern', 'interest', 'achievement', 'talking_point', 'common_ground', 'recent_activity');
CREATE TYPE email_tone AS ENUM ('professional', 'casual', 'enthusiastic', 'concise', 'storytelling');

-- Profiles table: the central entity (shared cache across users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  linkedin_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  name TEXT,
  current_role_title TEXT,
  headline TEXT,
  summary TEXT,
  location TEXT,
  profile_image_url TEXT,
  industry TEXT,
  connection_count INTEGER,
  cached_linkedin_data JSONB,
  synthesis JSONB,
  synthesis_version INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE UNIQUE INDEX idx_profiles_normalized_url ON profiles(normalized_url);

-- Data sources: raw data from each provider
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  raw_data JSONB NOT NULL,
  processed_data JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  relevance_score FLOAT DEFAULT 0.0,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(profile_id, source_type)
);

CREATE INDEX idx_data_sources_profile ON data_sources(profile_id);
CREATE INDEX idx_data_sources_expiry ON data_sources(expires_at);

-- Insights: AI-generated observations
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type insight_type NOT NULL,
  content TEXT NOT NULL,
  relevance_score FLOAT DEFAULT 0.0,
  recency_score FLOAT DEFAULT 0.0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_profile ON insights(profile_id);
CREATE INDEX idx_insights_type ON insights(profile_id, insight_type);

-- Email generations: user-specific email drafts (private per user)
CREATE TABLE email_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outreach_goal TEXT NOT NULL,
  context TEXT,
  sender_info JSONB,
  drafts JSONB NOT NULL,
  tone email_tone DEFAULT 'professional',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_gen_profile ON email_generations(profile_id);
CREATE INDEX idx_email_gen_user ON email_generations(user_id);

-- Usage tracking: rate limiting + analytics
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  api_provider TEXT,
  credits_used INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user_date ON usage_tracking(user_id, created_at);

-- Source collection status (for real-time progress tracking)
CREATE TABLE source_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, source_type)
);

CREATE INDEX idx_source_status_profile ON source_status(profile_id);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_status ENABLE ROW LEVEL SECURITY;

-- Profiles: readable by all authenticated users (shared cache)
CREATE POLICY "Profiles viewable by authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles managed by service role" ON profiles
  FOR ALL TO service_role USING (true);

-- Data sources: shared cache
CREATE POLICY "Data sources viewable by authenticated" ON data_sources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Data sources managed by service role" ON data_sources
  FOR ALL TO service_role USING (true);

-- Insights: shared cache
CREATE POLICY "Insights viewable by authenticated" ON insights
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insights managed by service role" ON insights
  FOR ALL TO service_role USING (true);

-- Email generations: users see only their own
CREATE POLICY "Users see own emails" ON email_generations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own emails" ON email_generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Emails managed by service role" ON email_generations
  FOR ALL TO service_role USING (true);

-- Usage tracking: users see only their own
CREATE POLICY "Users see own usage" ON usage_tracking
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usage managed by service role" ON usage_tracking
  FOR ALL TO service_role USING (true);

-- Source status: readable by all authenticated
CREATE POLICY "Source status viewable by authenticated" ON source_status
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Source status managed by service role" ON source_status
  FOR ALL TO service_role USING (true);

-- Enable realtime for source_status (for SSE/polling progress)
ALTER PUBLICATION supabase_realtime ADD TABLE source_status;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
