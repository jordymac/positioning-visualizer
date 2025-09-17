import { pipeline, env } from '@xenova/transformers';
import type { CoreMessaging, GeneratedContent } from '@/types';
import { positioningExamples } from '@/data/positioningExamples';

// Configure Transformers.js to work in browser
env.allowLocalModels = false;
env.allowRemoteModels = true;

class LLMService {
  private generator: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize() {
    try {
      console.log('Initializing LLM model...');
      
      // Use a smaller, faster model for text generation
      this.generator = await pipeline(
        'text-generation',
        'Xenova/distilgpt2',
        { 
          progress_callback: (progress: any) => {
            if (progress.status === 'downloading') {
              console.log(`Downloading model: ${Math.round(progress.progress || 0)}%`);
            }
          }
        }
      );
      
      this.isInitialized = true;
      console.log('LLM model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LLM model:', error);
      throw error;
    }
  }

  private findSimilarExamples(coreMessaging: CoreMessaging) {
    const examples = positioningExamples.filter(example => {
      // Match by anchor type first
      const anchorTypeMatch = example.anchorType === coreMessaging.primaryAnchor.type;
      
      // Look for keyword similarities in problem/differentiator
      const problemKeywords = coreMessaging.problem.toLowerCase().split(' ');
      const diffKeywords = coreMessaging.differentiator.toLowerCase().split(' ');
      
      const hasKeywordMatch = [...problemKeywords, ...diffKeywords].some(keyword => 
        keyword.length > 3 && (
          example.problem.toLowerCase().includes(keyword) ||
          example.differentiator.toLowerCase().includes(keyword) ||
          example.tags.some(tag => tag.toLowerCase().includes(keyword))
        )
      );
      
      // Prefer high effectiveness examples
      const isHighEffectiveness = example.effectiveness === 'high';
      
      return (anchorTypeMatch || hasKeywordMatch) && isHighEffectiveness;
    });

    // Sort by relevance and take best matches
    return examples.slice(0, 3);
  }

  private buildPrompt(coreMessaging: CoreMessaging): string {
    const examples = this.findSimilarExamples(coreMessaging);
    
    let prompt = `You are an expert positioning copywriter. Study these successful positioning examples and create similar compelling copy.

SUCCESSFUL POSITIONING EXAMPLES:
`;

    examples.forEach((example, index) => {
      prompt += `
${index + 1}. ${example.company} (${example.anchorType})
   Primary Anchor: "${example.primaryAnchor}"
   Tagline: "${example.tagline}" 
   Problem: ${example.problem}
   Differentiator: ${example.differentiator}
   Structure: ${example.structure}
   Tone: ${example.tone}
`;
    });

    prompt += `
YOUR POSITIONING TASK:
Primary Anchor: ${coreMessaging.primaryAnchor.content} (${coreMessaging.primaryAnchor.type})
Secondary Anchor: ${coreMessaging.secondaryAnchor.content} (${coreMessaging.secondaryAnchor.type})
Problem: ${coreMessaging.problem}
Differentiator: ${coreMessaging.differentiator}

Based on the successful examples above, create a compelling tagline that:
- Uses the same proven patterns and structures
- Addresses the specific problem and differentiator
- Is clear, memorable, and action-oriented
- Follows successful positioning formulas

Generate tagline:`;
    
    return prompt;
  }

  async generatePositioning(coreMessaging: CoreMessaging): Promise<GeneratedContent> {
    try {
      await this.initialize();

      if (!this.generator) {
        throw new Error('LLM model not initialized');
      }

      const prompt = this.buildPrompt(coreMessaging);
      
      console.log('Generating positioning with prompt:', prompt);

      // Generate headline
      const headlineResult = await this.generator(prompt, {
        max_new_tokens: 50,
        do_sample: true,
        temperature: 0.7,
        top_p: 0.9,
        pad_token_id: 50256
      });

      const generatedText = headlineResult[0]?.generated_text || '';
      const headline = this.extractHeadline(generatedText, prompt);

      // Create structured output
      const generatedContent: GeneratedContent = {
        headline: headline || this.createFallbackHeadline(coreMessaging),
        subheadline: this.createSubheadline(coreMessaging),
        thesis: this.enhanceThesis(coreMessaging.thesis),
        risks: this.enhanceRisks(coreMessaging.risks),
        opportunity: this.createOpportunity(coreMessaging)
      };

      return generatedContent;
    } catch (error) {
      console.error('LLM generation failed, using fallback:', error);
      return this.createFallbackContent(coreMessaging);
    }
  }

  private extractHeadline(generatedText: string, originalPrompt: string): string {
    // Remove the original prompt from generated text
    let headline = generatedText.replace(originalPrompt, '').trim();
    
    // Clean up the generated text
    headline = headline.split('\n')[0]; // Take first line
    headline = headline.replace(/^[^\w]*/, ''); // Remove leading non-word chars
    headline = headline.replace(/[^\w\s.,!?-]/g, ''); // Keep only safe characters
    headline = headline.trim();
    
    // Ensure reasonable length
    if (headline.length > 100) {
      headline = headline.substring(0, 100).trim();
    }
    
    return headline;
  }

  private createFallbackHeadline(coreMessaging: CoreMessaging): string {
    // Use patterns from our training data
    const examples = this.findSimilarExamples(coreMessaging);
    
    if (examples.length > 0) {
      const similarExample = examples[0];
      
      // Apply similar structure patterns
      if (similarExample.structure === 'time-comparison' && coreMessaging.differentiator.includes('faster')) {
        return `${coreMessaging.primaryAnchor.content} - faster than traditional solutions`;
      }
      if (similarExample.structure === 'competitor-comparison') {
        return `${coreMessaging.primaryAnchor.content} without the complexity`;
      }
      if (similarExample.structure === 'niche-specialization') {
        return `The ${coreMessaging.primaryAnchor.content} for ${coreMessaging.secondaryAnchor.content}`;
      }
      if (similarExample.structure === 'problem-solution') {
        return `${coreMessaging.primaryAnchor.content} that actually works`;
      }
    }
    
    // Fallback to basic format
    if (coreMessaging.secondaryAnchor.content) {
      return `${coreMessaging.primaryAnchor.content} for ${coreMessaging.secondaryAnchor.content}`;
    }
    return `${coreMessaging.primaryAnchor.content} - Advanced Positioning Strategy`;
  }

  private createSubheadline(coreMessaging: CoreMessaging): string {
    // Create benefit-focused subheadline
    const problem = coreMessaging.problem.substring(0, 100);
    const solution = coreMessaging.differentiator.substring(0, 100);
    
    // Pattern: "Stop [problem]. Start [solution]."
    if (problem.length > 20 && solution.length > 20) {
      return `Stop ${problem.toLowerCase()}. Start ${solution.toLowerCase()}.`;
    }
    
    return `Transform ${coreMessaging.secondaryAnchor.content || 'your business'} with ${coreMessaging.primaryAnchor.content}`;
  }

  private enhanceThesis(thesis: string[]): string[] {
    return thesis.filter(point => point.trim().length > 0).map(point => {
      if (point.length > 200) {
        return point.substring(0, 200) + '...';
      }
      return point;
    });
  }

  private enhanceRisks(risks: string[]): string[] {
    return risks.filter(risk => risk.trim().length > 0).map(risk => {
      if (risk.length > 200) {
        return risk.substring(0, 200) + '...';
      }
      return risk;
    });
  }

  private createOpportunity(coreMessaging: CoreMessaging): string {
    return `Transform ${coreMessaging.secondaryAnchor.content || 'target market'} operations by implementing ${coreMessaging.primaryAnchor.content} to address ${coreMessaging.problem.substring(0, 100)}...`;
  }

  private createFallbackContent(coreMessaging: CoreMessaging): GeneratedContent {
    return {
      headline: this.createFallbackHeadline(coreMessaging),
      subheadline: this.createSubheadline(coreMessaging),
      thesis: this.enhanceThesis(coreMessaging.thesis),
      risks: this.enhanceRisks(coreMessaging.risks),
      opportunity: this.createOpportunity(coreMessaging)
    };
  }

  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: !!this.initializationPromise && !this.isInitialized
    };
  }
}

// Export singleton instance
export const llmService = new LLMService();
export default llmService;