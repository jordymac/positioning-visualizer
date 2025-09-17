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
    return positioningExamples.filter(example => {
      // Match by anchor types
      const primaryMatch = example.primaryAnchor.type === coreMessaging.primaryAnchor.type;
      const secondaryMatch = example.secondaryAnchor.type === coreMessaging.secondaryAnchor.type;
      
      // Prefer high effectiveness examples
      const isHighEffectiveness = example.effectiveness === 'high';
      
      return (primaryMatch || secondaryMatch) && isHighEffectiveness;
    }).slice(0, 2); // Limit to 2 examples for context
  }

  private buildPrompt(coreMessaging: CoreMessaging): string {
    const examples = this.findSimilarExamples(coreMessaging);
    
    let prompt = `Generate compelling positioning copy based on these inputs:

Primary Anchor: ${coreMessaging.primaryAnchor.content} (${coreMessaging.primaryAnchor.type})
Secondary Anchor: ${coreMessaging.secondaryAnchor.content} (${coreMessaging.secondaryAnchor.type})
Problem: ${coreMessaging.problem}
Differentiator: ${coreMessaging.differentiator}

`;

    if (examples.length > 0) {
      prompt += `Reference examples:\n`;
      examples.forEach((example, index) => {
        prompt += `${index + 1}. ${example.generatedContent.headline}\n`;
      });
      prompt += '\n';
    }

    prompt += `Create a compelling headline that positions ${coreMessaging.primaryAnchor.content} for ${coreMessaging.secondaryAnchor.content}:`;
    
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
    if (coreMessaging.secondaryAnchor.content) {
      return `${coreMessaging.primaryAnchor.content} for ${coreMessaging.secondaryAnchor.content}`;
    }
    return `${coreMessaging.primaryAnchor.content} - Advanced Positioning Strategy`;
  }

  private createSubheadline(coreMessaging: CoreMessaging): string {
    const problem = coreMessaging.problem.substring(0, 80);
    const differentiator = coreMessaging.differentiator.substring(0, 60);
    return `Solving ${problem}... through ${differentiator}...`;
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