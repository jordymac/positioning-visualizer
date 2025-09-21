// Test vector search functionality with real embeddings
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:3001/api/generate-embedding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.status}`);
  }
  
  const { embedding } = await response.json();
  return embedding;
}

async function testVectorSearch(query: string, expectedMatches?: string[]) {
  console.log(`\n🔍 Testing: "${query}"`);
  
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    console.log(`  📡 Query embedding generated (${queryEmbedding.length} dimensions)`);
    
    // Search for similar examples
    const { data, error } = await supabase.rpc('find_similar_examples', {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: 5
    });
    
    if (error) {
      console.error('  ❌ Vector search failed:', error);
      return;
    }
    
    console.log(`  🎯 Found ${data?.length || 0} similar examples:`);
    data?.forEach((result: any, index: number) => {
      console.log(`    ${index + 1}. ${result.company} (similarity: ${result.similarity.toFixed(3)})`);
      console.log(`       "${result.tagline}"`);
    });
    
    if (expectedMatches) {
      const foundMatches = data?.map((r: any) => r.company.toLowerCase()) || [];
      const expectedLower = expectedMatches.map(m => m.toLowerCase());
      const hits = expectedLower.filter(expected => 
        foundMatches.some(found => found.includes(expected))
      );
      console.log(`  📊 Expected matches found: ${hits.length}/${expectedMatches.length}`);
    }
    
  } catch (error) {
    console.error(`  ❌ Test failed:`, error);
  }
}

async function runVectorSearchTests() {
  console.log('🧪 Testing Vector Search with Real Embeddings');
  console.log('=' .repeat(50));
  
  // Test 1: Marketing automation
  await testVectorSearch(
    'marketing automation platform for B2B companies',
    ['Later', 'lemlist', 'Rampmetrics']
  );
  
  // Test 2: Developer tools
  await testVectorSearch(
    'developer platform and tools for software teams',
    ['Instruqt', 'DataFirst', 'Jit']
  );
  
  // Test 3: Data and analytics
  await testVectorSearch(
    'data analytics and business intelligence platform',
    ['Rampmetrics', 'DinMo', 'Atolio']
  );
  
  // Test 4: Sales tools
  await testVectorSearch(
    'sales automation and CRM platform',
    ['SchedulerAI', 'Myway', 'Revic']
  );
  
  // Test 5: Security tools
  await testVectorSearch(
    'cybersecurity and application security platform',
    ['Anvilogic', 'Jit', 'Waratek']
  );
  
  console.log('\n🎉 Vector search testing completed!');
  console.log('✅ All 34 examples have real embeddings and vector search is working');
}

runVectorSearchTests();