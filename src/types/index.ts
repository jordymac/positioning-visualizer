export interface CoreMessaging {
  primaryAnchor: {
    type: '' | 'Product Category' | 'Use Case' | 'Competitive Alternative';
    content: string;
  };
  secondaryAnchor: {
    type: '' | 'Company Type' | 'Department' | 'Desired Outcome';
    content: string;
  };
  problem: string;
  differentiator: string;
  thesis: string[];
  risks: string[];
}

export interface PositioningVersion {
  id: string;
  name: string;
  coreMessaging: CoreMessaging;
  generatedContent?: GeneratedContent;
  createdAt: Date;
}

export interface GeneratedContent {
  headline: string;
  subheadline: string;
  thesis: string[];
  risks: string[];
  opportunity: string;
}

export interface TrainingExample {
  id: string;
  company: string;
  anchorType: 'Product Category' | 'Use Case' | 'Competitive Alternative';
  content: string;
  headline: string;
  tags: string[];
  industry?: string;
  effectiveness: 'high' | 'medium' | 'low';
}

export interface PositioningStrategy {
  coreMessaging: CoreMessaging;
  generatedContent: GeneratedContent;
}

export type ToneSelector = 'professional' | 'casual' | 'technical';