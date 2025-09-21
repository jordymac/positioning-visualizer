// Smart batch embedding generator with rate limiting and resume capability
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ExampleToProcess {
  id: number;
  company: string;
  tagline: string;
  problem: string;
  differentiator: string;
  icp: string[];
  metadata: any;
}

async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  📡 Generating embedding (attempt ${attempt}/${retries})...`);
      
      const response = await fetch('http://localhost:3001/api/generate-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : attempt * 10000;
        console.log(`  ⏳ Rate limited, waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`Backend embedding failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`  ✅ Embedding generated successfully`);
      return data.embedding;
    } catch (error) {
      if (attempt === retries) {
        console.error(`  ❌ Failed after ${retries} attempts:`, error);
        throw error;
      }
      console.log(`  🔄 Attempt ${attempt} failed, retrying in 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error('Should not reach here');
}

async function getExamplesNeedingEmbeddings(): Promise<ExampleToProcess[]> {
  console.log('🔍 Finding examples that need embeddings...');
  
  const { data, error } = await supabase
    .from('positioning_examples_v2')
    .select('id, company, tagline, problem, differentiator, icp, metadata')
    .eq('metadata->>needs_embedding', 'true')
    .order('id');

  if (error) {
    console.error('Failed to fetch examples:', error);
    throw error;
  }

  console.log(`📋 Found ${data?.length || 0} examples needing embeddings`);
  return data || [];
}

async function updateExampleEmbedding(id: number, embedding: number[]): Promise<boolean> {
  try {
    // First get the current metadata
    const { data: currentData, error: fetchError } = await supabase
      .from('positioning_examples_v2')
      .select('metadata')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`Failed to fetch current metadata for ID ${id}:`, fetchError);
      return false;
    }

    // Update metadata to mark embedding as complete
    const updatedMetadata = {
      ...currentData.metadata,
      needs_embedding: false,
      embedding_generated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('positioning_examples_v2')
      .update({
        embedding: embedding,
        metadata: updatedMetadata
      })
      .eq('id', id);

    if (error) {
      console.error(`Failed to update embedding for ID ${id}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating embedding for ID ${id}:`, error);
    return false;
  }
}

async function processExample(example: ExampleToProcess): Promise<boolean> {
  console.log(`\n🔄 Processing: ${example.company} (ID: ${example.id})`);
  
  try {
    // Create embedding text from key fields
    const embeddingText = [
      example.company,
      example.tagline,
      example.problem,
      example.differentiator,
      example.icp.join(' '),
      example.metadata?.main_value_props?.join(' ') || '',
      example.metadata?.use_cases?.join(' ') || ''
    ].filter(Boolean).join(' ');

    console.log(`  📝 Text preview: ${embeddingText.substring(0, 100)}...`);
    
    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);
    
    // Update database
    const success = await updateExampleEmbedding(example.id, embedding);
    
    if (success) {
      console.log(`  ✅ ${example.company} completed successfully`);
      return true;
    } else {
      console.log(`  ❌ ${example.company} failed to update database`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ ${example.company} failed:`, error);
    return false;
  }
}

async function checkRateLimit(): Promise<{ remaining: number; resetIn: number }> {
  try {
    const response = await fetch('http://localhost:3001/health');
    const remaining = parseInt(response.headers.get('ratelimit-remaining') || '20');
    const reset = parseInt(response.headers.get('ratelimit-reset') || '0');
    
    return { remaining, resetIn: reset };
  } catch (error) {
    console.warn('Could not check rate limit, assuming 5 remaining');
    return { remaining: 5, resetIn: 0 };
  }
}

async function processBatch(examples: ExampleToProcess[], batchSize: number = 15): Promise<void> {
  console.log(`\n🚀 Starting batch processing (${examples.length} examples, batch size: ${batchSize})`);
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < examples.length; i += batchSize) {
    const batch = examples.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(examples.length / batchSize);
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches}: Processing ${batch.length} examples`);
    console.log(`   Examples: ${batch.map(e => e.company).join(', ')}`);
    
    // Check rate limit before starting batch
    const rateLimitStatus = await checkRateLimit();
    console.log(`   📊 Rate limit: ${rateLimitStatus.remaining} requests remaining`);
    
    if (rateLimitStatus.remaining < batch.length) {
      const waitTime = (rateLimitStatus.resetIn + 10) * 1000; // Add 10s buffer
      console.log(`   ⏳ Not enough rate limit remaining. Waiting ${waitTime/1000}s for reset...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Process each example in the batch
    for (const example of batch) {
      const success = await processExample(example);
      processed++;
      
      if (success) {
        successful++;
      } else {
        failed++;
      }
      
      // Small delay between examples to be gentle on the API
      if (processed < examples.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n📊 Batch ${batchNum} Summary:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Progress: ${processed}/${examples.length} (${Math.round(processed/examples.length*100)}%)`);
    
    // Wait between batches (except for the last one)
    if (i + batchSize < examples.length) {
      console.log(`\n⏱️  Waiting 15 minutes before next batch to respect rate limits...`);
      console.log(`   Next batch starts at: ${new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString()}`);
      
      // Show countdown every 5 minutes
      for (let wait = 15; wait > 0; wait -= 5) {
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        if (wait > 5) console.log(`   ⏳ ${wait - 5} minutes remaining...`);
      }
      
      console.log(`   🔄 Rate limit window reset, continuing...`);
    }
  }
  
  console.log(`\n🎉 All batches completed!`);
  console.log(`   ✅ Total successful: ${successful}`);
  console.log(`   ❌ Total failed: ${failed}`);
  console.log(`   📊 Success rate: ${Math.round(successful/examples.length*100)}%`);
}

async function verifyEmbeddings(): Promise<void> {
  console.log('\n🔍 Verifying embedding generation...');
  
  const { data, error } = await supabase
    .from('positioning_examples_v2')
    .select('id, company, metadata')
    .order('id');

  if (error) {
    console.error('Failed to verify embeddings:', error);
    return;
  }

  const withEmbeddings = data?.filter(row => 
    row.metadata?.needs_embedding === false || row.metadata?.needs_embedding === 'false'
  ).length || 0;
  
  const stillNeedEmbeddings = data?.filter(row => 
    row.metadata?.needs_embedding === true || row.metadata?.needs_embedding === 'true'
  ).length || 0;

  console.log(`✅ Examples with embeddings: ${withEmbeddings}`);
  console.log(`⏳ Examples still needing embeddings: ${stillNeedEmbeddings}`);
  
  if (stillNeedEmbeddings === 0) {
    console.log('🎉 All examples have embeddings generated!');
  }
}

async function runEmbeddingGeneration() {
  console.log('🚀 Starting intelligent embedding generation process...');
  console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}`);
  
  try {
    // Check if backend is running
    const healthResponse = await fetch('http://localhost:3001/health');
    if (!healthResponse.ok) {
      throw new Error('Backend server is not accessible');
    }
    console.log('✅ Backend server is running');

    // Get examples that need embeddings
    const examples = await getExamplesNeedingEmbeddings();
    
    if (examples.length === 0) {
      console.log('🎉 All examples already have embeddings!');
      return;
    }

    // Process in batches
    await processBatch(examples, 15);
    
    // Verify completion
    await verifyEmbeddings();
    
    console.log(`\n✨ Embedding generation completed at: ${new Date().toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEmbeddingGeneration()
    .then(() => {
      console.log('\n🎊 Process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Process failed:', error);
      process.exit(1);
    });
}

export { runEmbeddingGeneration, processBatch, verifyEmbeddings };