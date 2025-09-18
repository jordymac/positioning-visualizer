import { graphRAGService } from './graphRAGService';
import type { CoreMessaging, GeneratedContent } from '@/types';

class LLMService {
  async initialize() {
    // Delegate to GraphRAG service
    return graphRAGService.initialize();
  }


  async generatePositioning(coreMessaging: CoreMessaging): Promise<GeneratedContent> {
    // Use GraphRAG service for enhanced generation
    return graphRAGService.generatePositioning(coreMessaging);
  }

  getInitializationStatus() {
    return graphRAGService.getInitializationStatus();
  }

  getGraphStats() {
    return graphRAGService.getGraphStats();
  }
}

// Export singleton instance
export const llmService = new LLMService();
export default llmService;