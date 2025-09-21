// Migration script to populate Supabase vector database with existing examples
import { createClient } from '@supabase/supabase-js';
import { positioningExamples } from '../data/positioningExamples';
import crypto from 'crypto';

// Import dotenv to load .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Configure your Supabase connection
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
  usage: {
    total_tokens: number;
  };
}

async function generateEmbedding(text: string): Promise<number[]> {
  console.log(`Generating embedding for: ${text.substring(0, 100)}...`);
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data: EmbeddingResponse = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    // Return zero vector as fallback
    return new Array(1536).fill(0);
  }
}

async function getEmbeddingCached(text: string): Promise<number[]> {
  const textHash = crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
  
  // Check if embedding already exists in cache
  const { data: cached } = await supabase
    .from('embedding_cache')
    .select('embedding')
    .eq('text_hash', textHash)
    .single();

  if (cached) {
    console.log('Using cached embedding');
    return cached.embedding;
  }

  // Generate new embedding
  const embedding = await generateEmbedding(text);
  
  // Cache the embedding
  await supabase.from('embedding_cache').insert({
    text: text,
    text_hash: textHash,
    embedding: embedding
  });

  return embedding;
}

async function migrateExample(example: typeof positioningExamples[0]) {
  console.log(`\nMigrating: ${example.company}`);
  
  // Create text for embedding (combine key fields)
  const embeddingText = [
    example.company,
    example.tagline,
    example.description,
    example.problem,
    example.differentiator,
    example.primaryAnchor,
    example.icp.join(' '),
    example.tags.join(' ')
  ].join(' ');

  // Generate embedding
  const embedding = await getEmbeddingCached(embeddingText);

  // Prepare record for insertion
  const record = {
    company: example.company,
    tagline: example.tagline,
    anchor_type: example.anchorType,
    primary_anchor: example.primaryAnchor,
    industry: example.industry,
    effectiveness: example.effectiveness,
    problem: example.problem,
    differentiator: example.differentiator,
    icp: example.icp,
    tags: example.tags,
    tone: example.tone,
    structure: example.structure,
    secondary_anchors: example.secondaryAnchors,
    embedding: embedding,
    metadata: {
      original_id: example.id,
      migrated_at: new Date().toISOString(),
      description: example.description
    }
  };

  // Insert into Supabase
  const { error } = await supabase
    .from('positioning_examples_v2')
    .insert(record);

  if (error) {
    console.error(`Failed to migrate ${example.company}:`, error);
    return false;
  }

  console.log(`✅ Successfully migrated: ${example.company}`);
  return true;
}

async function runMigration() {
  console.log('🚀 Starting migration of positioning examples to vector database...');
  console.log(`Total examples to migrate: ${positioningExamples.length}`);

  // Check if table exists and is accessible
  const { error: testError } = await supabase
    .from('positioning_examples_v2')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Cannot access positioning_examples_v2 table:', testError);
    console.log('Please run the supabase-setup.sql script first');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  // Process examples one by one to avoid rate limits
  for (const example of positioningExamples) {
    try {
      const success = await migrateExample(example);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to process ${example.company}:`, error);
      failCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successCount}`);
  console.log(`❌ Failed migrations: ${failCount}`);
  console.log(`📈 Total examples in database: ${successCount}`);

  // Verify the migration
  const { count: finalCount } = await supabase
    .from('positioning_examples_v2')
    .select('*', { count: 'exact', head: true });
  
  console.log(`🔍 Database verification: ${finalCount || 0} records found`);
}

// Test vector search function
async function testVectorSearch() {
  console.log('\n🧪 Testing vector search...');
  
  const testQueryText = 'B2B SaaS platform for market research';
  const embedding = await getEmbeddingCached(testQueryText);
  
  const { data, error } = await supabase.rpc('find_similar_examples', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 3
  });

  if (error) {
    console.error('Vector search test failed:', error);
    return;
  }

  console.log('🎯 Similar examples found:');
  data?.forEach((result: any, index: number) => {
    console.log(`${index + 1}. ${result.company} (similarity: ${result.similarity.toFixed(3)})`);
    console.log(`   ${result.tagline}`);
  });
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => testVectorSearch())
    .then(() => {
      console.log('\n✨ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration, testVectorSearch };