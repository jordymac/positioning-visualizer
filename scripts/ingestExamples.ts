// Script to ingest examples.json into the vector database
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ExampleRecord {
  id: string;
  company: string;
  tagline: string;
  homepage_url: string;
  anchor_type: 'Product Category' | 'Use Case' | 'Competitive Alternative';
  industry: string;
  effectiveness: 'high' | 'medium' | 'low';
  problem: string;
  differentiator: string;
  breadth_scale: number;
  icp: string[];
  metadata: {
    main_value_props: string[];
    use_cases: string[];
    competitive_positioning: string;
    social_proof: string[];
    key_features: string[];
    [key: string]: any;
  };
}

async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  console.log(`Generating embedding for: ${text.substring(0, 100)}...`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('http://localhost:3001/api/generate-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.status === 429) {
        console.log(`Rate limited, waiting ${attempt * 5} seconds before retry ${attempt}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`Backend embedding failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.embedding;
    } catch (error) {
      if (attempt === retries) {
        console.error('Failed to generate embedding after retries:', error);
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Should not reach here');
}

function parseExamplesFile(): ExampleRecord[] {
  try {
    const fileContent = readFileSync('/Users/placeos/positioning-visualizer/examples.json', 'utf-8');
    
    // The file appears to be a series of JSON objects, not a single JSON array
    // Split by lines and parse each as separate JSON
    const lines = fileContent.split('\n').filter(line => line.trim());
    const examples: ExampleRecord[] = [];
    
    let currentObject = '';
    let braceCount = 0;
    
    for (const line of lines) {
      currentObject += line + '\n';
      
      // Count braces to know when we have a complete object
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      // When braces are balanced, we have a complete object
      if (braceCount === 0 && currentObject.trim()) {
        try {
          const parsed = JSON.parse(currentObject.trim());
          examples.push(parsed);
          currentObject = '';
        } catch (parseError) {
          console.warn('Failed to parse object:', currentObject.substring(0, 100));
        }
      }
    }
    
    console.log(`Parsed ${examples.length} examples from file`);
    return examples;
  } catch (error) {
    console.error('Failed to read examples file:', error);
    throw error;
  }
}

async function ingestExample(example: ExampleRecord): Promise<boolean> {
  console.log(`Ingesting: ${example.company}`);
  
  try {
    // Create embedding text from key fields
    const embeddingText = [
      example.company,
      example.tagline,
      example.problem,
      example.differentiator,
      example.icp.join(' '),
      example.metadata.main_value_props?.join(' ') || '',
      example.metadata.use_cases?.join(' ') || '',
      example.industry
    ].filter(Boolean).join(' ');

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Extract primary anchor from tagline (this is the main positioning statement)
    const primaryAnchor = example.tagline;

    // Prepare tags from various metadata
    const tags = [
      example.industry,
      example.anchor_type.toLowerCase().replace(' ', '-'),
      example.effectiveness,
      ...(example.metadata.key_features?.slice(0, 3) || [])
    ].filter(Boolean);

    // Map effectiveness values to allowed values
    const mappedEffectiveness = example.effectiveness === 'very_high' ? 'high' : example.effectiveness;

    // Insert into Supabase
    const { error } = await supabase
      .from('positioning_examples_v2')
      .insert({
        company: example.company,
        tagline: example.tagline,
        anchor_type: example.anchor_type,
        primary_anchor: primaryAnchor,
        industry: example.industry,
        effectiveness: mappedEffectiveness,
        problem: example.problem,
        differentiator: example.differentiator,
        icp: example.icp,
        tags: tags,
        tone: 'professional', // Default tone
        structure: 'problem-solution', // Default structure
        secondary_anchors: {
          homepage_url: example.homepage_url,
          breadth_scale: example.breadth_scale,
          competitive_positioning: example.metadata.competitive_positioning
        },
        embedding: embedding,
        metadata: {
          original_id: example.id,
          ingested_at: new Date().toISOString(),
          main_value_props: example.metadata.main_value_props,
          use_cases: example.metadata.use_cases,
          social_proof: example.metadata.social_proof,
          key_features: example.metadata.key_features,
          homepage_url: example.homepage_url,
          breadth_scale: example.breadth_scale
        }
      });

    if (error) {
      console.error(`Failed to ingest ${example.company}:`, error);
      return false;
    }

    console.log(`✅ Successfully ingested: ${example.company}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${example.company}:`, error);
    return false;
  }
}

async function runIngestion() {
  console.log('🚀 Starting ingestion of examples.json into vector database...');

  // Check if backend is running
  try {
    const response = await fetch('http://localhost:3001/health');
    if (!response.ok) {
      throw new Error('Backend not accessible');
    }
    console.log('✅ Backend server is running');
  } catch (error) {
    console.error('❌ Backend server is not running. Please start it with: npm run dev:server');
    return;
  }

  // Check if Supabase table is accessible
  const { error: testError } = await supabase
    .from('positioning_examples_v2')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Cannot access positioning_examples_v2 table:', testError);
    console.log('Please run the supabase-setup.sql script first');
    return;
  }

  // Clear existing data (optional - comment out if you want to keep existing)
  console.log('🧹 Clearing existing examples...');
  await supabase.from('positioning_examples_v2').delete().neq('id', 0);

  // Parse and ingest examples
  const allExamples = parseExamplesFile();
  const examples = allExamples.slice(0, 3); // Only process first 3 for testing
  console.log(`Found ${allExamples.length} total examples, processing first ${examples.length} for testing`);

  let successCount = 0;
  let failCount = 0;

  // Process examples with delay to avoid rate limits
  for (const example of examples) {
    try {
      const success = await ingestExample(example);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Longer delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
      console.error(`Failed to process ${example.company}:`, error);
      failCount++;
    }
  }

  console.log('\n📊 Ingestion Summary:');
  console.log(`✅ Successfully ingested: ${successCount}`);
  console.log(`❌ Failed ingestions: ${failCount}`);
  
  // Verify final count
  const { count: finalCount } = await supabase
    .from('positioning_examples_v2')
    .select('*', { count: 'exact', head: true });
  
  console.log(`🔍 Database verification: ${finalCount || 0} records found`);
}

// Test vector search after ingestion
async function testSearch() {
  console.log('\n🧪 Testing vector search...');
  
  const testQuery = 'B2B platform for marketing teams';
  const embedding = await generateEmbedding(testQuery);
  
  const { data, error } = await supabase.rpc('find_similar_examples', {
    query_embedding: embedding,
    match_threshold: 0.6,
    match_count: 5
  });

  if (error) {
    console.error('Vector search test failed:', error);
    return;
  }

  console.log(`🎯 Top matches for "${testQuery}":`);
  data?.forEach((result: any, index: number) => {
    console.log(`${index + 1}. ${result.company} (similarity: ${result.similarity.toFixed(3)})`);
    console.log(`   ${result.tagline}`);
  });
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIngestion()
    .then(() => testSearch())
    .then(() => {
      console.log('\n✨ Ingestion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Ingestion failed:', error);
      process.exit(1);
    });
}

export { runIngestion, testSearch };