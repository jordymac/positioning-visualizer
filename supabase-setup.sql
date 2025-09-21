-- Supabase Vector Setup for Positioning Tool
-- Run these commands in your Supabase SQL Editor

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create new vector-enabled table for positioning examples
CREATE TABLE positioning_examples_v2 (
  id SERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  tagline TEXT,
  anchor_type TEXT CHECK (anchor_type IN ('Product Category', 'Use Case', 'Competitive Alternative')),
  primary_anchor TEXT,
  industry TEXT,
  effectiveness TEXT CHECK (effectiveness IN ('high', 'medium', 'low')) DEFAULT 'high',
  problem TEXT,
  differentiator TEXT,
  icp JSONB, -- Store ICP array as JSON
  tags JSONB, -- Store tags array as JSON
  tone TEXT,
  structure TEXT,
  secondary_anchors JSONB, -- Store secondary anchors object as JSON
  embedding VECTOR(1536), -- OpenAI ada-002 embeddings
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Embedding cache to reduce API costs
CREATE TABLE embedding_cache (
  id SERIAL PRIMARY KEY,
  text TEXT UNIQUE NOT NULL,
  text_hash TEXT UNIQUE NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generation cache for positioning outputs
CREATE TABLE generation_cache (
  id SERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  hit_count INTEGER DEFAULT 1
);

-- Indexes for performance
CREATE INDEX idx_positioning_embedding ON positioning_examples_v2 USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_positioning_anchor ON positioning_examples_v2(anchor_type);
CREATE INDEX idx_positioning_industry ON positioning_examples_v2(industry);
CREATE INDEX idx_embedding_hash ON embedding_cache(text_hash);
CREATE INDEX idx_generation_cache_key ON generation_cache(cache_key);
CREATE INDEX idx_generation_expires ON generation_cache(expires_at);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION find_similar_examples(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE(
  id integer,
  company text,
  tagline text,
  anchor_type text,
  primary_anchor text,
  problem text,
  differentiator text,
  industry text,
  effectiveness text,
  icp jsonb,
  tags jsonb,
  tone text,
  structure text,
  secondary_anchors jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.company,
    p.tagline,
    p.anchor_type,
    p.primary_anchor,
    p.problem,
    p.differentiator,
    p.industry,
    p.effectiveness,
    p.icp,
    p.tags,
    p.tone,
    p.structure,
    p.secondary_anchors,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM positioning_examples_v2 p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM generation_cache WHERE expires_at < NOW();
END;
$$;

-- Cache hit counter function
CREATE OR REPLACE FUNCTION increment_cache_hit(cache_key text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE generation_cache 
  SET hit_count = hit_count + 1 
  WHERE cache_key = increment_cache_hit.cache_key;
END;
$$;

-- Optional: Row Level Security (if needed)
-- ALTER TABLE positioning_examples_v2 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE generation_cache ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed)
-- GRANT ALL ON positioning_examples_v2 TO authenticated;
-- GRANT ALL ON embedding_cache TO authenticated;
-- GRANT ALL ON generation_cache TO authenticated;