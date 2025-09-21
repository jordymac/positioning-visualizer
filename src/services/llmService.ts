import { simpleRAGService } from './simpleRAGService';
import type { CoreMessaging, GeneratedContent } from '@/types';

class LLMService {
  async initialize() {
    // Delegate to SimpleRAG service
    return simpleRAGService.initialize();
  }

  async generatePositioning(coreMessaging: CoreMessaging): Promise<GeneratedContent> {
    // Use SimpleRAG service with user-controlled settings
    const settings = coreMessaging.generationSettings || { temperature: 0.3, top_p: 0.8 };
    return simpleRAGService.generatePositioning(coreMessaging, settings);
  }

  getInitializationStatus() {
    return simpleRAGService.getInitializationStatus();
  }

  // Legacy method for compatibility
  getGraphStats() {
    return {
      totalNodes: 7,
      totalEdges: 0,
      nodeTypes: { examples: 7 },
      relationships: { vector_similarity: 'enabled' }
    };
  }
}

// Export singleton instance
export const llmService = new LLMService();
export default llmService;