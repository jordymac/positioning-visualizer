// Simple RAG Service - replaces the complex GraphRAG implementation
import { createClient } from '@supabase/supabase-js';
import type { CoreMessaging, GeneratedContent, GenerationSettings } from '@/types';
// Use Web Crypto API for browser compatibility

// Configure Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface PositioningExample {
  id: number;
  company: string;
  tagline: string;
  anchor_type: string;
  primary_anchor: string;
  problem: string;
  differentiator: string;
  industry: string;
  effectiveness: string;
  icp: string[];
  tags: string[];
  tone: string;
  structure: string;
  secondary_anchors: Record<string, any>;
  similarity: number;
}

class SimpleRAGService {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  private backendUrl: string;
  private embeddingCache = new Map<string, number[]>();
  private isInitialized = false;

  constructor() {
    this.backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Test Supabase connection
      const { count, error } = await this.supabase
        .from('positioning_examples_v2')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn('Supabase not available, using fallback mode');
      } else {
        console.log(`Connected to Supabase: ${count || 0} examples available`);
      }

      this.isInitialized = true;
      console.log('SimpleRAG service initialized');
    } catch (error) {
      console.error('Failed to initialize SimpleRAG:', error);
      this.isInitialized = true; // Continue with fallback
    }
  }

  // Main RAG generation method
  async generatePositioning(
    coreMessaging: CoreMessaging, 
    settings: GenerationSettings = { temperature: 0.3, top_p: 0.8 }
  ): Promise<GeneratedContent> {
    await this.initialize();

    try {
      // 1. Check cache first
      const cacheKey = await this.generateCacheKey(coreMessaging, settings);
      const cached = await this.getCachedResult(cacheKey);
      if (cached) {
        console.log('Using cached result');
        return cached;
      }

      // 2. Find similar examples via vector search
      const userText = this.buildUserText(coreMessaging);
      const similarExamples = await this.findSimilarExamples(userText, 3);

      // 3. Generate with context and temperature/top_p controls
      const context = this.buildContext(similarExamples);
      const prompt = this.buildPrompt(coreMessaging, context);
      
      const result = await this.generateWithSettings(prompt, settings, coreMessaging);

      // 4. Cache result
      await this.cacheResult(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('RAG generation failed, using fallback:', error);
      return this.createFallbackContent(coreMessaging);
    }
  }

  // Vector similarity search (replaces graph traversal)
  private async findSimilarExamples(userText: string, limit: number): Promise<PositioningExample[]> {
    try {
      // Get embedding for user input (with caching)
      const embedding = await this.getEmbeddingCached(userText);
      
      // Vector search in Supabase
      const { data, error } = await this.supabase.rpc('find_similar_examples', {
        query_embedding: embedding,
        match_threshold: 0.6,
        match_count: limit
      });

      if (error) {
        console.error('Vector search failed:', error);
        return this.getFallbackExamples();
      }

      console.log(`Found ${data?.length || 0} similar examples`);
      return data || this.getFallbackExamples();

    } catch (error) {
      console.error('Similar examples search failed:', error);
      return this.getFallbackExamples();
    }
  }

  // Embedding with caching (saves API costs)
  private async getEmbeddingCached(text: string): Promise<number[]> {
    const textHash = await this.hashString(text.toLowerCase().trim());
    
    // Check memory cache first
    if (this.embeddingCache.has(textHash)) {
      return this.embeddingCache.get(textHash)!;
    }

    try {
      // Check database cache
      const { data } = await this.supabase
        .from('embedding_cache')
        .select('embedding')
        .eq('text_hash', textHash)
        .single();

      if (data) {
        this.embeddingCache.set(textHash, data.embedding);
        return data.embedding;
      }

      // Generate new embedding via backend
      const embedding = await this.generateEmbedding(text);
      
      // Cache in database
      await this.supabase.from('embedding_cache').insert({
        text: text,
        text_hash: textHash,
        embedding: embedding
      });

      this.embeddingCache.set(textHash, embedding);
      return embedding;

    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  // Generate embedding via backend API
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/generate-embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Backend embedding failed: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;

    } catch (error) {
      console.error('Backend embedding request failed:', error);
      throw error;
    }
  }

  // Generate with temperature/top_p controls
  private async generateWithSettings(prompt: string, settings: GenerationSettings, coreMessaging?: CoreMessaging): Promise<GeneratedContent> {
    try {
      const response = await fetch(`${this.backendUrl}/api/generate-positioning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature: settings.temperature,
          top_p: settings.top_p,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('Generated with controlled settings:', settings);
        return this.parseResponse(data.content, coreMessaging);
      }

      throw new Error('Backend returned unsuccessful response');

    } catch (error) {
      console.error('Generation with settings failed:', error);
      throw error;
    }
  }

  // Build user text for embedding
  private buildUserText(coreMessaging: CoreMessaging): string {
    return [
      coreMessaging.primaryAnchor.content,
      coreMessaging.secondaryAnchor.content,
      coreMessaging.problem,
      coreMessaging.differentiator,
      coreMessaging.icp.join(' ')
    ].filter(Boolean).join(' ');
  }

  // Build context from similar examples
  private buildContext(examples: PositioningExample[]): string {
    if (!examples.length) return '';

    return examples.map(example => 
      `${example.company} (${example.anchor_type}): "${example.tagline}"\n` +
      `ICP: ${example.icp.join(', ')}\n` +
      `Problem: ${example.problem}\n` +
      `Solution: ${example.differentiator}\n` +
      `Structure: ${example.structure}`
    ).join('\n\n');
  }

  // Build enhanced prompt with context
  private buildPrompt(coreMessaging: CoreMessaging, context: string): string {
    const icpText = coreMessaging.icp && coreMessaging.icp.length > 0 
      ? `ICP: ${coreMessaging.icp.join(', ')}\n`
      : '';

    return `Based on these successful positioning examples:

${context}

Create positioning for:
Primary Anchor: ${coreMessaging.primaryAnchor.content} (${coreMessaging.primaryAnchor.type})
Secondary Anchor: ${coreMessaging.secondaryAnchor.content} (${coreMessaging.secondaryAnchor.type})
${icpText}Problem: ${coreMessaging.problem}
Differentiator: ${coreMessaging.differentiator}

POSITIONING RULES - CRITICAL:
- HEADLINE must include BOTH anchors: "${coreMessaging.primaryAnchor.content}" for "${coreMessaging.secondaryAnchor.content} ${coreMessaging.icp.join(', ')}"
- Do NOT add extra details like employee counts or company sizes - keep it natural
- SUBHEADLINE must be concise (1-2 sentences max) combining problem + solution
- Keep the core meaning from: "${coreMessaging.problem.substring(0, 80)}..." 
- And solution: "${coreMessaging.differentiator.substring(0, 80)}..."
- CRITICAL: Ensure smooth logical flow between problem and solution
- Use proper transitions: "While X happens, Y solves it" OR "X creates problems. Y provides the solution" 
- Avoid awkward "but" connections that don't flow logically
- Make it flow naturally but KEEP IT CONCISE - avoid long explanations
- NO generic positioning language: avoid "say goodbye", "transform", "unlock", etc.
- Focus on specific, concrete benefits

Generate professional positioning copy:

Format your response exactly like this:
HEADLINE: [primary anchor] for [secondary anchor] [ICP target] (natural phrasing, no extra details)
SUBHEADLINE: [concise problem + solution in 1-2 sentences]
OPPORTUNITY: [market opportunity statement referencing specific segments]`;
  }

  // Parse generated response
  private parseResponse(generatedText: string, coreMessaging?: CoreMessaging): GeneratedContent {
    console.log('Raw generated content:', generatedText);
    
    const lines = generatedText.split('\n').filter(line => line.trim());
    
    let headline = '';
    let subheadline = '';
    let opportunity = '';

    for (const line of lines) {
      if (line.startsWith('HEADLINE:')) {
        headline = line.replace('HEADLINE:', '').trim();
      } else if (line.startsWith('SUBHEADLINE:')) {
        subheadline = line.replace('SUBHEADLINE:', '').trim();
      } else if (line.startsWith('OPPORTUNITY:')) {
        opportunity = line.replace('OPPORTUNITY:', '').trim();
        // Handle multi-line opportunity statements
        const currentIndex = lines.indexOf(line);
        let nextIndex = currentIndex + 1;
        while (nextIndex < lines.length && !lines[nextIndex].includes(':')) {
          opportunity += ' ' + lines[nextIndex].trim();
          nextIndex++;
        }
      }
    }

    // If parsing failed, the content might not be properly formatted
    if (!headline && !subheadline && !opportunity) {
      // Try to extract content from unformatted response
      const cleanedText = generatedText.replace(/^Solve\s*/i, '').trim();
      const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim());
      
      if (sentences.length >= 2) {
        headline = sentences[0].trim();
        subheadline = sentences.slice(1).join('. ').trim();
        // Ensure proper capitalization
        headline = headline.charAt(0).toUpperCase() + headline.slice(1);
        subheadline = subheadline.charAt(0).toUpperCase() + subheadline.slice(1);
      }
    }

    const result = {
      headline: headline || 'Professional solution for your needs',
      subheadline: subheadline || 'Streamline your workflow without complexity', 
      thesis: [], // Keep user input from form
      risks: [], // Keep user input from form
      opportunity: opportunity || 'Significant market opportunity for targeted solutions'
    };

    // Log color mappings for debugging
    if (coreMessaging) {
      this.logColorMappings(result, coreMessaging);
    }
    
    return result;
  }

  // Identify which parts of generated text came from problem vs differentiator
  private identifyGeneratedPhrases(generatedText: string, coreMessaging: CoreMessaging): Array<{text: string, color: string, type: string}> {
    const phrases: Array<{text: string, color: string, type: string}> = [];
    
    // Split generated text into logical sections (split on commas and conjunctions too)
    const sentences = generatedText.split(/[.!?]+|,\s*but\s+|,\s*however\s+|,\s*and\s+our\s+/).filter(s => s.trim());
    
    // Key problem indicators (words that suggest this part is about the problem)
    const problemIndicators = [
      'lack', 'no', 'without', 'difficult', 'challenge', 'issue', 'problem', 'struggle', 
      'fail', 'unable', 'can\'t', 'don\'t', 'until', 'before', 'complain', 'frustrated',
      'slow', 'manual', 'inefficient', 'time-consuming', 'expensive', 'costly'
    ];
    
    // Key solution indicators (words that suggest this part is about the solution)
    const solutionIndicators = [
      'predicts', 'provides', 'enables', 'allows', 'helps', 'gives', 'offers', 'delivers',
      'our platform', 'our solution', 'we', 'automatically', 'proactive', 'advance',
      'real-time', 'instant', 'fast', 'efficient', 'easy', 'simple', 'automated'
    ];
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Count problem vs solution indicators
      const problemScore = problemIndicators.reduce((score, indicator) => 
        score + (lowerSentence.includes(indicator) ? 1 : 0), 0
      );
      
      const solutionScore = solutionIndicators.reduce((score, indicator) => 
        score + (lowerSentence.includes(indicator) ? 1 : 0), 0
      );
      
      // Classify the sentence and break it into meaningful chunks
      if (problemScore > solutionScore && problemScore > 0) {
        // This sentence is about the problem
        const chunks = this.breakIntoChunks(sentence.trim(), 4, 8);
        chunks.forEach(chunk => {
          phrases.push({
            text: chunk,
            color: 'RED',
            type: 'Generated Problem Section'
          });
        });
      } else if (solutionScore > 0) {
        // This sentence is about the solution
        const chunks = this.breakIntoChunks(sentence.trim(), 4, 8);
        chunks.forEach(chunk => {
          phrases.push({
            text: chunk,
            color: 'GREEN',
            type: 'Generated Solution Section'
          });
        });
      }
    });
    
    return phrases;
  }
  
  // Break text into meaningful chunks of specified word length
  private breakIntoChunks(text: string, minWords: number, maxWords: number): string[] {
    const words = text.split(' ').filter(w => w.length > 0);
    const chunks: string[] = [];
    
    // Create overlapping chunks
    for (let i = 0; i <= words.length - minWords; i++) {
      const chunkLength = Math.min(maxWords, words.length - i);
      if (chunkLength >= minWords) {
        const chunk = words.slice(i, i + chunkLength).join(' ');
        chunks.push(chunk);
      }
    }
    
    // Also add the full sentence if it's not too long
    if (words.length <= maxWords) {
      chunks.push(text);
    }
    
    return [...new Set(chunks)]; // Remove duplicates
  }

  // Color mapping debug logger
  private logColorMappings(result: GeneratedContent, coreMessaging: CoreMessaging): void {
    console.log('🎨 COLOR MAPPING DEBUG:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const fullText = `${result.headline} ${result.subheadline}`;
    
    // Define what should be highlighted as what color
    const mappings = [
      { 
        text: coreMessaging.primaryAnchor.content, 
        color: 'YELLOW', 
        type: 'Primary Anchor' 
      },
      { 
        text: coreMessaging.secondaryAnchor.content, 
        color: 'BLUE', 
        type: 'Secondary Anchor' 
      }
    ];
    
    // Add ICP segments
    if (coreMessaging.icp && coreMessaging.icp.length > 0) {
      coreMessaging.icp.forEach(icpSegment => {
        if (icpSegment && icpSegment.trim()) {
          mappings.push({ 
            text: icpSegment.trim(), 
            color: 'BLUE', 
            type: 'ICP Segment' 
          });
        }
      });
    }
    
    // Identify which parts of the GENERATED text came from problem/differentiator
    const generatedPhrases = this.identifyGeneratedPhrases(fullText, coreMessaging);
    generatedPhrases.forEach(phrase => {
      mappings.push(phrase);
    });
    
    // Log each mapping and check if it appears in the generated text
    mappings.forEach(mapping => {
      const found = fullText.toLowerCase().includes(mapping.text.toLowerCase());
      const status = found ? '✅' : '❌';
      console.log(`${status} ${mapping.color}: "${mapping.text}" (${mapping.type}) ${found ? '- FOUND' : '- NOT FOUND'}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Generated Text:', fullText);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Cache management
  private async generateCacheKey(coreMessaging: CoreMessaging, settings: GenerationSettings): Promise<string> {
    const keyData = {
      primary: coreMessaging.primaryAnchor.content.toLowerCase().trim(),
      problem: coreMessaging.problem.substring(0, 50).toLowerCase(),
      diff: coreMessaging.differentiator.substring(0, 50).toLowerCase(),
      temp: Math.round(settings.temperature * 10),
      top_p: Math.round(settings.top_p * 10)
    };
    
    return this.hashString(JSON.stringify(keyData));
  }

  // Helper method for hashing using Web Crypto API
  private async hashString(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getCachedResult(cacheKey: string): Promise<GeneratedContent | null> {
    try {
      const { data } = await this.supabase
        .from('generation_cache')
        .select('content')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (data) {
        // Update hit count (ignore errors if function doesn't exist)
        try {
          await this.supabase.rpc('increment_cache_hit', { cache_key: cacheKey });
        } catch (error) {
          console.log('Cache hit tracking unavailable');
        }
        
        return data.content as GeneratedContent;
      }
    } catch (error) {
      console.log('No cached result found');
    }
    return null;
  }

  private async cacheResult(cacheKey: string, result: GeneratedContent): Promise<void> {
    try {
      await this.supabase.from('generation_cache').upsert({
        cache_key: cacheKey,
        content: result,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });
    } catch (error) {
      console.error('Failed to cache result:', error);
    }
  }

  // Fallback methods when vector search fails
  private getFallbackExamples(): PositioningExample[] {
    // Return hardcoded high-effectiveness examples
    return [
      {
        id: 1,
        company: 'Wynter',
        tagline: 'On-demand market research platform for B2B',
        anchor_type: 'Product Category',
        primary_anchor: 'market research platform',
        problem: 'B2B leaders don\'t know what their target market wants',
        differentiator: 'Get market insights in under 48 hours vs traditional research',
        industry: 'market research',
        effectiveness: 'high',
        icp: ['B2B SaaS founders', 'Product marketing managers'],
        tags: ['speed-focused', 'b2b-saas'],
        tone: 'professional',
        structure: 'problem-solution',
        secondary_anchors: { audience: 'B2B leaders', speed: '48 hours' },
        similarity: 0.8
      }
    ];
  }

  private createFallbackContent(coreMessaging: CoreMessaging): GeneratedContent {
    const primaryAnchor = coreMessaging.primaryAnchor.content;
    const secondaryAnchor = coreMessaging.secondaryAnchor.content;
    
    return {
      headline: secondaryAnchor 
        ? `${primaryAnchor} for ${secondaryAnchor.toLowerCase()}`
        : `Professional ${primaryAnchor}`,
      subheadline: `Solve ${coreMessaging.problem.toLowerCase()} with ${coreMessaging.differentiator.toLowerCase()}`,
      thesis: coreMessaging.thesis,
      risks: coreMessaging.risks,
      opportunity: `${secondaryAnchor || 'Businesses'} can improve efficiency by implementing ${primaryAnchor} solutions.`
    };
  }

  // Cache management methods
  async clearGenerationCache(): Promise<void> {
    try {
      await this.supabase.from('generation_cache').delete().gt('id', 0);
      console.log('Generation cache cleared');
    } catch (error) {
      console.error('Failed to clear generation cache:', error);
    }
  }

  // Status and debugging methods
  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      backendUrl: this.backendUrl,
      cacheSize: this.embeddingCache.size
    };
  }
}

// Export singleton instance
export const simpleRAGService = new SimpleRAGService();
export default simpleRAGService;