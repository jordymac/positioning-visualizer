// Quick script to add new positioning examples
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface NewExample {
  id: string;
  company: string;
  tagline: string;
  anchor_type: 'Product Category' | 'Use Case' | 'Competitive Alternative';
  industry: string;
  effectiveness: 'high' | 'medium' | 'low';
  problem: string;
  differentiator: string;
  icp: string[];
  tags: string[];
  structure?: string;
  tone?: string;
  metadata?: any;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:3001/api/generate-embedding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  
  const data = await response.json();
  return data.embedding;
}

async function addExample(example: NewExample) {
  console.log(`Adding: ${example.company}`);
  
  // Create embedding text
  const embeddingText = [
    example.company,
    example.tagline,
    example.problem,
    example.differentiator,
    example.icp.join(' '),
    example.tags.join(' ')
  ].join(' ');

  // Generate embedding
  const embedding = await generateEmbedding(embeddingText);

  // Insert into Supabase
  const { error } = await supabase
    .from('positioning_examples_v2')
    .insert({
      company: example.company,
      tagline: example.tagline,
      anchor_type: example.anchor_type,
      primary_anchor: example.tagline,
      industry: example.industry,
      effectiveness: example.effectiveness,
      problem: example.problem,
      differentiator: example.differentiator,
      icp: example.icp,
      tags: example.tags,
      tone: example.tone || 'professional',
      structure: example.structure || 'problem-solution',
      secondary_anchors: {},
      embedding: embedding,
      metadata: {
        added_via: 'addExample_script',
        added_at: new Date().toISOString(),
        ...example.metadata
      }
    });

  if (error) {
    console.error('Failed to add example:', error);
    return false;
  }

  console.log(`✅ Added: ${example.company}`);
  return true;
}

// Example usage - paste your JSON here:
const newExample: NewExample = {
  id: "usergems-001",
  company: "UserGems",
  tagline: "The easy button for AI outbound campaigns",
  anchor_type: "Use Case",
  industry: "sales_automation",
  effectiveness: "high",
  problem: "Running effective AI outbound campaigns requires coordinating multiple tools, manually finding triggers, and constantly managing data quality - it's complex and time-consuming",
  differentiator: "Automated pipeline generation that finds buying signals, enriches contacts, generates personalized AI messages, and delivers ready-to-send campaigns - all in one platform",
  icp: [
    "B2B sales teams",
    "revenue operations", 
    "sales development reps",
    "account executives",
    "growth teams"
  ],
  tags: [
    "sales-automation",
    "ai-outbound", 
    "pipeline-generation",
    "contact-tracking",
    "multi-channel",
    "integration-heavy"
  ],
  structure: "use-case-driven",
  tone: "confident-promise",
  metadata: {
    positioning_strength: "strong",
    roi_guarantee: "10x ROI or money back",
    integrations: ["Salesforce", "Outreach", "Salesloft", "HubSpot"]
  }
};



// Run it
if (import.meta.url === `file://${process.argv[1]}`) {
  addExample(newExample)
    .then(() => {
      console.log('Example added successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to add example:', error);
      process.exit(1);
    });
}