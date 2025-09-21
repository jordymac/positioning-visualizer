// Finish the last 3 embeddings manually
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function processRemaining() {
  console.log('🔄 Finishing the last 3 embeddings...');
  
  const remainingIds = [59, 60, 61]; // Administrate, Docfield, Waratek
  
  for (const id of remainingIds) {
    try {
      // Get the example data
      const { data: example, error: fetchError } = await supabase
        .from('positioning_examples_v2')
        .select('id, company, tagline, problem, differentiator, icp, metadata')
        .eq('id', id)
        .single();
      
      if (fetchError || !example) {
        console.error(`Failed to fetch example ${id}:`, fetchError);
        continue;
      }
      
      console.log(`\n🔄 Processing: ${example.company} (ID: ${id})`);
      
      // Create embedding text
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
      const response = await fetch('http://localhost:3001/api/generate-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: embeddingText })
      });
      
      if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.status}`);
      }
      
      const { embedding } = await response.json();
      console.log(`  ✅ Embedding generated (${embedding.length} dimensions)`);
      
      // Update database
      const updatedMetadata = {
        ...example.metadata,
        needs_embedding: false,
        embedding_generated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('positioning_examples_v2')
        .update({
          embedding: embedding,
          metadata: updatedMetadata
        })
        .eq('id', id);
      
      if (updateError) {
        console.error(`  ❌ Database update failed:`, updateError);
      } else {
        console.log(`  ✅ ${example.company} completed successfully`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`Failed to process ID ${id}:`, error);
    }
  }
  
  console.log('\n🎉 All embeddings completed!');
}

processRemaining();