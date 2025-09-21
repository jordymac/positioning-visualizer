// Clear generation cache to test updated prompts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearCache() {
  console.log('🧹 Clearing generation cache...');
  
  try {
    // Check current cache entries
    const { count: beforeCount } = await supabase
      .from('generation_cache')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Found ${beforeCount || 0} cached entries`);
    
    // Clear all cache entries
    const { error } = await supabase
      .from('generation_cache')
      .delete()
      .gt('id', 0);
    
    if (error) {
      console.error('❌ Failed to clear cache:', error);
      return;
    }
    
    // Verify cache is cleared
    const { count: afterCount } = await supabase
      .from('generation_cache')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Cache cleared! ${beforeCount || 0} → ${afterCount || 0} entries`);
    console.log('🎯 Now try generating positioning again - it will use the updated prompt');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

clearCache();