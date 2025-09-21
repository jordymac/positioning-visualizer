// Quick test to verify the embedding update process works
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEmbeddingUpdate() {
  console.log('🧪 Testing embedding update process...');
  
  // Get one example
  const { data, error } = await supabase
    .from('positioning_examples_v2')
    .select('id, company, metadata')
    .limit(1)
    .single();
  
  if (error || !data) {
    console.error('Failed to get test example:', error);
    return;
  }
  
  console.log(`Testing with: ${data.company} (ID: ${data.id})`);
  
  // Generate a test embedding
  try {
    const response = await fetch('http://localhost:3001/api/generate-embedding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `Test embedding for ${data.company}` })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const { embedding } = await response.json();
    console.log(`✅ Generated embedding: ${embedding.length} dimensions`);
    
    // Update the database
    const updatedMetadata = {
      ...data.metadata,
      needs_embedding: false,
      embedding_generated_at: new Date().toISOString(),
      test_run: true
    };
    
    const { error: updateError } = await supabase
      .from('positioning_examples_v2')
      .update({
        embedding: embedding,
        metadata: updatedMetadata
      })
      .eq('id', data.id);
    
    if (updateError) {
      console.error('❌ Database update failed:', updateError);
    } else {
      console.log('✅ Database update successful!');
      
      // Verify the update
      const { data: verifyData } = await supabase
        .from('positioning_examples_v2')
        .select('metadata')
        .eq('id', data.id)
        .single();
      
      console.log('📊 Updated metadata:', {
        needs_embedding: verifyData?.metadata?.needs_embedding,
        embedding_generated_at: verifyData?.metadata?.embedding_generated_at,
        test_run: verifyData?.metadata?.test_run
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmbeddingUpdate();