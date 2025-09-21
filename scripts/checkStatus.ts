import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkStatus() {
  const { data } = await supabase
    .from('positioning_examples_v2')
    .select('id, company, metadata')
    .order('id');
  
  const needEmbeddings = data?.filter(row => 
    row.metadata?.needs_embedding === true || row.metadata?.needs_embedding === 'true'
  ) || [];
  
  const haveEmbeddings = data?.filter(row => 
    row.metadata?.needs_embedding === false || row.metadata?.needs_embedding === 'false'
  ) || [];
  
  console.log(`📊 Status Summary:`);
  console.log(`✅ Have embeddings: ${haveEmbeddings.length}`);
  console.log(`⏳ Need embeddings: ${needEmbeddings.length}`);
  console.log(`📋 Total examples: ${data?.length || 0}`);
  
  if (needEmbeddings.length > 0) {
    console.log(`\n🔄 Still need embeddings:`);
    needEmbeddings.forEach((e, i) => console.log(`${i+1}. ${e.company} (ID: ${e.id})`));
  }
}

checkStatus();