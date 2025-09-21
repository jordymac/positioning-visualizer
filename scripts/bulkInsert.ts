// Bulk insert examples.json data without embeddings first
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
  effectiveness: 'high' | 'medium' | 'low' | 'very_high';
  problem: string;
  differentiator: string;
  breadth_scale: number;
  icp: string[];
  metadata: any;
}

function parseExamplesFile(): ExampleRecord[] {
  try {
    const fileContent = readFileSync('/Users/placeos/positioning-visualizer/examples.json', 'utf-8');
    
    // Parse as individual JSON objects separated by newlines
    const lines = fileContent.split('\n').filter(line => line.trim());
    const examples: ExampleRecord[] = [];
    
    let currentObject = '';
    let braceCount = 0;
    
    for (const line of lines) {
      currentObject += line + '\n';
      
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
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

async function insertExample(example: ExampleRecord): Promise<boolean> {
  console.log(`Inserting: ${example.company}`);
  
  try {
    // Map effectiveness values
    const mappedEffectiveness = example.effectiveness === 'very_high' ? 'high' : example.effectiveness;

    // Extract tags
    const tags = [
      example.industry,
      example.anchor_type.toLowerCase().replace(' ', '-'),
      mappedEffectiveness,
      ...(example.metadata.key_features?.slice(0, 3) || [])
    ].filter(Boolean);

    // Insert into Supabase without embedding (we'll add those later)
    const { error } = await supabase
      .from('positioning_examples_v2')
      .insert({
        company: example.company,
        tagline: example.tagline,
        anchor_type: example.anchor_type,
        primary_anchor: example.tagline,
        industry: example.industry,
        effectiveness: mappedEffectiveness,
        problem: example.problem,
        differentiator: example.differentiator,
        icp: example.icp,
        tags: tags,
        tone: 'professional',
        structure: 'problem-solution',
        secondary_anchors: {
          homepage_url: example.homepage_url,
          breadth_scale: example.breadth_scale,
          competitive_positioning: example.metadata.competitive_positioning
        },
        embedding: new Array(1536).fill(0), // Placeholder embedding
        metadata: {
          original_id: example.id,
          inserted_at: new Date().toISOString(),
          main_value_props: example.metadata.main_value_props,
          use_cases: example.metadata.use_cases,
          social_proof: example.metadata.social_proof,
          key_features: example.metadata.key_features,
          homepage_url: example.homepage_url,
          breadth_scale: example.breadth_scale,
          needs_embedding: true // Flag to indicate embedding is needed
        }
      });

    if (error) {
      console.error(`Failed to insert ${example.company}:`, error);
      return false;
    }

    console.log(`✅ Successfully inserted: ${example.company}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${example.company}:`, error);
    return false;
  }
}

async function runBulkInsert() {
  console.log('🚀 Starting bulk insert of examples.json...');

  // Check if Supabase table is accessible
  const { error: testError } = await supabase
    .from('positioning_examples_v2')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Cannot access positioning_examples_v2 table:', testError);
    return;
  }

  // Clear existing data
  console.log('🧹 Clearing existing examples...');
  await supabase.from('positioning_examples_v2').delete().neq('id', 0);

  // Parse and insert examples
  const examples = parseExamplesFile();
  console.log(`Found ${examples.length} examples to insert`);

  let successCount = 0;
  let failCount = 0;

  // Process all examples quickly (no API calls needed)
  for (const example of examples) {
    try {
      const success = await insertExample(example);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.error(`Failed to process ${example.company}:`, error);
      failCount++;
    }
  }

  console.log('\n📊 Bulk Insert Summary:');
  console.log(`✅ Successfully inserted: ${successCount}`);
  console.log(`❌ Failed insertions: ${failCount}`);
  
  // Verify final count
  const { count: finalCount } = await supabase
    .from('positioning_examples_v2')
    .select('*', { count: 'exact', head: true });
  
  console.log(`🔍 Database verification: ${finalCount || 0} records found`);
  console.log('💡 Next step: Run a separate script to generate embeddings in batches');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBulkInsert()
    .then(() => {
      console.log('\n✨ Bulk insert completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bulk insert failed:', error);
      process.exit(1);
    });
}

export { runBulkInsert };