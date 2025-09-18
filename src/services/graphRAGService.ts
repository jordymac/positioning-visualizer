// Removed OpenAI import - now using backend proxy
import type { CoreMessaging, GeneratedContent } from '@/types';
import { positioningExamples } from '@/data/positioningExamples';

// Knowledge Graph Types
interface KnowledgeNode {
  id: string;
  type: 'company' | 'pattern' | 'industry' | 'problem' | 'solution' | 'structure' | 'icp';
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

interface KnowledgeEdge {
  from: string;
  to: string;
  relationship: 'implements' | 'addresses' | 'competes_with' | 'targets' | 'uses_structure' | 'similar_to' | 'serves_icp';
  weight: number;
}

interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
}

class GraphRAGService {
  private backendUrl: string;
  private knowledgeGraph: KnowledgeGraph;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.knowledgeGraph = {
      nodes: new Map(),
      edges: []
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize() {
    try {
      console.log('Initializing GraphRAG service...');
      
      // Check backend health and availability
      try {
        const healthResponse = await fetch(`${this.backendUrl}/health`);
        const healthData = await healthResponse.json();
        console.log('Backend status:', healthData);
      } catch (error) {
        console.warn('Backend not available. Using fallback generation.');
      }

      // Build knowledge graph from positioning examples
      await this.buildKnowledgeGraph();
      
      this.isInitialized = true;
      console.log('GraphRAG service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GraphRAG service:', error);
      this.isInitialized = true; // Still mark as initialized to use fallback
    }
  }

  private async buildKnowledgeGraph() {
    console.log('Building knowledge graph from positioning examples...');

    // Create nodes for each example
    for (const example of positioningExamples) {
      // Company node
      const companyNode: KnowledgeNode = {
        id: `company_${example.id}`,
        type: 'company',
        content: example.company,
        metadata: {
          tagline: example.tagline,
          industry: example.industry,
          effectiveness: example.effectiveness,
          anchorType: example.anchorType
        }
      };
      this.knowledgeGraph.nodes.set(companyNode.id, companyNode);

      // Problem node
      const problemNode: KnowledgeNode = {
        id: `problem_${example.id}`,
        type: 'problem',
        content: example.problem,
        metadata: {
          company: example.company,
          industry: example.industry
        }
      };
      this.knowledgeGraph.nodes.set(problemNode.id, problemNode);

      // Solution node
      const solutionNode: KnowledgeNode = {
        id: `solution_${example.id}`,
        type: 'solution',
        content: example.differentiator,
        metadata: {
          company: example.company,
          primaryAnchor: example.primaryAnchor
        }
      };
      this.knowledgeGraph.nodes.set(solutionNode.id, solutionNode);

      // Structure pattern node
      const structureNode: KnowledgeNode = {
        id: `structure_${example.structure}`,
        type: 'structure',
        content: example.structure,
        metadata: {
          examples: [example.company],
          tone: example.tone
        }
      };
      
      // Merge with existing structure node if it exists
      const existingStructure = this.knowledgeGraph.nodes.get(structureNode.id);
      if (existingStructure) {
        existingStructure.metadata.examples.push(example.company);
      } else {
        this.knowledgeGraph.nodes.set(structureNode.id, structureNode);
      }

      // Industry node
      const industryNode: KnowledgeNode = {
        id: `industry_${example.industry.replace(/\s+/g, '_')}`,
        type: 'industry',
        content: example.industry,
        metadata: {
          companies: [example.company]
        }
      };

      const existingIndustry = this.knowledgeGraph.nodes.get(industryNode.id);
      if (existingIndustry) {
        existingIndustry.metadata.companies.push(example.company);
      } else {
        this.knowledgeGraph.nodes.set(industryNode.id, industryNode);
      }

      // ICP nodes - create one for each ICP segment
      const icpNodeIds: string[] = [];
      for (const icpSegment of example.icp) {
        const icpNode: KnowledgeNode = {
          id: `icp_${icpSegment.replace(/\s+/g, '_').toLowerCase()}`,
          type: 'icp',
          content: icpSegment,
          metadata: {
            companies: [example.company],
            industries: [example.industry]
          }
        };

        const existingICP = this.knowledgeGraph.nodes.get(icpNode.id);
        if (existingICP) {
          if (!existingICP.metadata.companies.includes(example.company)) {
            existingICP.metadata.companies.push(example.company);
          }
          if (!existingICP.metadata.industries.includes(example.industry)) {
            existingICP.metadata.industries.push(example.industry);
          }
        } else {
          this.knowledgeGraph.nodes.set(icpNode.id, icpNode);
        }
        
        icpNodeIds.push(icpNode.id);
      }

      // Create edges (relationships)
      const companyEdges: KnowledgeEdge[] = [
        {
          from: companyNode.id,
          to: problemNode.id,
          relationship: 'addresses' as const,
          weight: 1.0
        },
        {
          from: companyNode.id,
          to: solutionNode.id,
          relationship: 'implements' as const,
          weight: 1.0
        },
        {
          from: companyNode.id,
          to: structureNode.id,
          relationship: 'uses_structure' as const,
          weight: 1.0
        },
        {
          from: companyNode.id,
          to: industryNode.id,
          relationship: 'targets' as const,
          weight: 1.0
        }
      ];

      // Add ICP relationships
      for (const icpNodeId of icpNodeIds) {
        companyEdges.push({
          from: companyNode.id,
          to: icpNodeId,
          relationship: 'serves_icp' as const,
          weight: 1.0
        });
      }

      this.knowledgeGraph.edges.push(...companyEdges);
    }

    // Create similarity edges between examples with similar patterns
    this.createSimilarityEdges();

    console.log(`Knowledge graph built: ${this.knowledgeGraph.nodes.size} nodes, ${this.knowledgeGraph.edges.length} edges`);
  }

  private createSimilarityEdges() {
    const companies = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'company');

    for (let i = 0; i < companies.length; i++) {
      for (let j = i + 1; j < companies.length; j++) {
        const similarity = this.calculateSimilarity(companies[i], companies[j]);
        if (similarity > 0.3) { // Threshold for similarity
          this.knowledgeGraph.edges.push({
            from: companies[i].id,
            to: companies[j].id,
            relationship: 'similar_to' as const,
            weight: similarity
          });
        }
      }
    }
  }

  private calculateSimilarity(node1: KnowledgeNode, node2: KnowledgeNode): number {
    const example1 = positioningExamples.find(ex => ex.company === node1.content);
    const example2 = positioningExamples.find(ex => ex.company === node2.content);
    
    if (!example1 || !example2) return 0;

    let similarity = 0;
    
    // Industry similarity
    if (example1.industry === example2.industry) similarity += 0.3;
    
    // Anchor type similarity
    if (example1.anchorType === example2.anchorType) similarity += 0.2;
    
    // Structure similarity
    if (example1.structure === example2.structure) similarity += 0.3;
    
    // Tag overlap
    const tagOverlap = example1.tags.filter(tag => example2.tags.includes(tag)).length;
    similarity += (tagOverlap / Math.max(example1.tags.length, example2.tags.length)) * 0.2;
    
    return Math.min(similarity, 1.0);
  }

  private findRelevantContext(coreMessaging: CoreMessaging): string {
    const relevantNodes: KnowledgeNode[] = [];
    const contextParts: string[] = [];

    // Find examples with similar problems
    for (const [_, node] of this.knowledgeGraph.nodes) {
      if (node.type === 'problem') {
        const similarity = this.calculateTextSimilarity(
          coreMessaging.problem.toLowerCase(),
          node.content.toLowerCase()
        );
        if (similarity > 0.2) {
          relevantNodes.push(node);
        }
      }
    }

    // Find examples with similar solutions
    for (const [_, node] of this.knowledgeGraph.nodes) {
      if (node.type === 'solution') {
        const similarity = this.calculateTextSimilarity(
          coreMessaging.differentiator.toLowerCase(),
          node.content.toLowerCase()
        );
        if (similarity > 0.2) {
          relevantNodes.push(node);
        }
      }
    }

    // Find examples with similar ICP
    if (coreMessaging.icp && coreMessaging.icp.length > 0) {
      for (const [_, node] of this.knowledgeGraph.nodes) {
        if (node.type === 'icp') {
          for (const userICP of coreMessaging.icp) {
            const similarity = this.calculateTextSimilarity(
              userICP.toLowerCase(),
              node.content.toLowerCase()
            );
            if (similarity > 0.3) {
              relevantNodes.push(node);
            }
          }
        }
      }
    }

    // Get related company examples
    const relatedCompanies = new Set<string>();
    for (const node of relevantNodes) {
      const companyId = node.id.includes('problem_') 
        ? `company_${node.id.split('_')[1]}`
        : `company_${node.id.split('_')[1]}`;
      
      const companyNode = this.knowledgeGraph.nodes.get(companyId);
      if (companyNode) {
        relatedCompanies.add(node.id.split('_')[1]);
      }
    }

    // Build context from most relevant examples
    const relevantExamples = positioningExamples
      .filter(ex => relatedCompanies.has(ex.id))
      .sort((a, b) => {
        // Prioritize high effectiveness examples
        if (a.effectiveness === 'high' && b.effectiveness !== 'high') return -1;
        if (b.effectiveness === 'high' && a.effectiveness !== 'high') return 1;
        return 0;
      })
      .slice(0, 3);

    for (const example of relevantExamples) {
      contextParts.push(
        `${example.company} (${example.anchorType}): "${example.tagline}"\n` +
        `ICP: ${example.icp.join(', ')}\n` +
        `Problem: ${example.problem}\n` +
        `Solution: ${example.differentiator}\n` +
        `Structure: ${example.structure}`
      );
    }

    return contextParts.join('\n\n');
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/).filter(w => w.length > 3);
    const words2 = text2.split(/\s+/).filter(w => w.length > 3);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  async generatePositioning(coreMessaging: CoreMessaging): Promise<GeneratedContent> {
    try {
      await this.initialize();

      const context = this.findRelevantContext(coreMessaging);
      const prompt = this.buildGraphRAGPrompt(coreMessaging, context);

      console.log('Generating positioning with backend + GraphRAG...');

      // Try backend API first
      try {
        const response = await fetch(`${this.backendUrl}/api/generate-positioning`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            context
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('Generated with ChatGPT via secure backend');
            return this.parseGeneratedContent(data.content, coreMessaging);
          }
        }

        // If backend fails, log and fall through to fallback
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.warn('Backend generation failed:', errorData);
        
      } catch (error) {
        console.warn('Backend request failed:', error);
      }

      // Fallback to enhanced rule-based generation
      console.log('Using enhanced rule-based generation');
      return this.createEnhancedContent(coreMessaging);

    } catch (error) {
      console.error('Generation failed, using enhanced fallback:', error);
      return this.createEnhancedContent(coreMessaging);
    }
  }

  private buildGraphRAGPrompt(coreMessaging: CoreMessaging, context: string): string {
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
- DO NOT REWRITE - only lightly edit for grammar and flow
- HEADLINE must include EXACT primary anchor text: "${coreMessaging.primaryAnchor.content}"
- SUBHEADLINE must combine the actual problem and differentiator text with minimal changes
- Use the user's EXACT phrases from problem: "${coreMessaging.problem.substring(0, 100)}..."
- Use the user's EXACT phrases from differentiator: "${coreMessaging.differentiator.substring(0, 100)}..."
- ONLY add connecting words, fix tense, improve grammar - do NOT add new concepts
- NO generic positioning language: avoid "say goodbye", "transform", "unlock", etc.
- Just make the user's content flow better grammatically

Generate professional positioning copy:

Format your response exactly like this:
HEADLINE: [specific headline using primary anchor + ICP]
SUBHEADLINE: [capture problem + differentiator in 1-2 sentences]
OPPORTUNITY: [market opportunity statement referencing specific segments]`;
  }

  private parseGeneratedContent(generatedText: string, coreMessaging: CoreMessaging): GeneratedContent {
    console.log('Raw ChatGPT Response:', generatedText);
    
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

    console.log('Parsed sections:', { headline, subheadline, opportunity });

    return {
      headline: headline || this.createSmartHeadline(coreMessaging),
      subheadline: subheadline || this.createSmartSubheadline(coreMessaging),
      thesis: this.enhanceThesis(coreMessaging.thesis), // Keep user input
      risks: this.enhanceRisks(coreMessaging.risks), // Keep user input
      opportunity: opportunity || this.createSmartOpportunity(coreMessaging)
    };
  }

  // Enhanced rule-based generation methods (fallback)
  private createEnhancedContent(coreMessaging: CoreMessaging): GeneratedContent {
    return {
      headline: this.createSmartHeadline(coreMessaging),
      subheadline: this.createSmartSubheadline(coreMessaging),
      thesis: this.enhanceThesis(coreMessaging.thesis),
      risks: this.enhanceRisks(coreMessaging.risks),
      opportunity: this.createSmartOpportunity(coreMessaging)
    };
  }

  private createSmartHeadline(coreMessaging: CoreMessaging): string {
    const primaryAnchor = coreMessaging.primaryAnchor.content;
    const secondaryAnchor = coreMessaging.secondaryAnchor.content;
    const differentiator = coreMessaging.differentiator.toLowerCase();

    // Use GraphRAG to find similar patterns
    const similarStructures = Array.from(this.knowledgeGraph.nodes.values())
      .filter(node => node.type === 'structure')
      .sort((a, b) => b.metadata.examples.length - a.metadata.examples.length);

    if (differentiator.includes('all-in-one') && secondaryAnchor) {
      return `The all-in-one ${primaryAnchor.toLowerCase()} for ${secondaryAnchor.toLowerCase()}`;
    }
    
    if (differentiator.includes('faster') || differentiator.includes('hours')) {
      return `${primaryAnchor} in hours, not weeks`;
    }

    if (differentiator.includes('specifically') || differentiator.includes('designed for')) {
      return `${primaryAnchor} built for ${secondaryAnchor?.toLowerCase() || 'your needs'}`;
    }

    // Use most successful structure pattern
    if (similarStructures.length > 0) {
      const topStructure = similarStructures[0].content;
      if (topStructure === 'niche-specialization') {
        return `The ${primaryAnchor.toLowerCase()} for ${secondaryAnchor?.toLowerCase() || 'modern businesses'}`;
      }
    }

    return secondaryAnchor 
      ? `${primaryAnchor} for ${secondaryAnchor.toLowerCase()}`
      : `Professional ${primaryAnchor}`;
  }

  private createSmartSubheadline(coreMessaging: CoreMessaging): string {
    const benefit = this.extractKeyBenefit(coreMessaging.differentiator);
    const painPoint = this.extractPainPoint(coreMessaging.problem);
    
    return `${benefit} without ${painPoint}`;
  }

  private createSmartOpportunity(coreMessaging: CoreMessaging): string {
    const target = coreMessaging.secondaryAnchor.content || 'businesses';
    const solution = coreMessaging.primaryAnchor.content;
    const benefit = this.extractKeyBenefit(coreMessaging.differentiator);
    
    return `${target} can ${benefit.toLowerCase()} by implementing ${solution} to eliminate ${this.extractPainPoint(coreMessaging.problem)} and increase productivity.`;
  }

  private extractKeyBenefit(text: string): string {
    if (text.includes('faster') || text.includes('quick')) return 'Work faster';
    if (text.includes('simple') || text.includes('easy')) return 'Simplify everything';
    if (text.includes('all-in-one') || text.includes('unified')) return 'Manage everything in one place';
    if (text.includes('hours')) return 'Get results in hours';
    return 'Streamline your workflow';
  }

  private extractPainPoint(text: string): string {
    if (text.includes('switching') || text.includes('multiple tools')) return 'tool switching';
    if (text.includes('weeks')) return 'long wait times';
    if (text.includes('complex')) return 'complexity';
    if (text.includes('fragmented')) return 'fragmentation';
    return 'inefficiencies';
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

  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: !!this.initializationPromise && !this.isInitialized,
      backendUrl: this.backendUrl,
      graphSize: this.knowledgeGraph.nodes.size
    };
  }

  getGraphStats() {
    const nodeTypes = Array.from(this.knowledgeGraph.nodes.values())
      .reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalNodes: this.knowledgeGraph.nodes.size,
      totalEdges: this.knowledgeGraph.edges.length,
      nodeTypes,
      relationships: this.knowledgeGraph.edges.reduce((acc, edge) => {
        acc[edge.relationship] = (acc[edge.relationship] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// Export singleton instance
export const graphRAGService = new GraphRAGService();
export default graphRAGService;