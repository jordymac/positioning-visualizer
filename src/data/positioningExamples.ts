export interface PositioningExample {
  id: string;
  company: string;
  industry: string;
  primaryAnchor: {
    type: 'Product Category' | 'Use Case' | 'Competitive Alternative';
    content: string;
  };
  secondaryAnchor: {
    type: 'Company Type' | 'Department' | 'Desired Outcome';
    content: string;
  };
  problem: string;
  differentiator: string;
  thesis: string[];
  risks: string[];
  generatedContent: {
    headline: string;
    subheadline: string;
    opportunity: string;
  };
  tags: string[];
  effectiveness: 'high' | 'medium' | 'low';
}

export const positioningExamples: PositioningExample[] = [
  {
    id: '1',
    company: 'Slack',
    industry: 'Technology',
    primaryAnchor: {
      type: 'Product Category',
      content: 'Team Communication Platform'
    },
    secondaryAnchor: {
      type: 'Company Type',
      content: 'Knowledge Workers'
    },
    problem: 'Email chains and scattered conversations make team collaboration inefficient and information hard to find',
    differentiator: 'Organized channels, searchable history, and integrated workflows that replace email for internal communication',
    thesis: [
      'Teams using email for internal communication lose productivity to inbox clutter',
      'Searchable conversation history prevents repeated questions and lost knowledge',
      'Channel-based organization makes project communication transparent and accessible'
    ],
    risks: [
      'Notification overload can create new distraction problems',
      'Channel proliferation can fragment communication instead of centralizing it'
    ],
    generatedContent: {
      headline: 'Team Communication Platform for Knowledge Workers',
      subheadline: 'Replace email chaos with organized, searchable team conversations',
      opportunity: 'Transform scattered email threads into organized, searchable team communication'
    },
    tags: ['B2B', 'SaaS', 'Communication', 'Productivity'],
    effectiveness: 'high'
  },
  {
    id: '2',
    company: 'Zoom',
    industry: 'Technology',
    primaryAnchor: {
      type: 'Use Case',
      content: 'Remote Video Meetings'
    },
    secondaryAnchor: {
      type: 'Company Type',
      content: 'Distributed Teams'
    },
    problem: 'Traditional conference calling creates barriers to natural communication and collaboration for remote teams',
    differentiator: 'HD video quality, screen sharing, and reliable connection that makes remote meetings feel as natural as in-person',
    thesis: [
      'Video communication builds stronger relationships than audio-only calls',
      'Screen sharing enables real-time collaboration regardless of location',
      'Reliable technology reduces meeting friction and technical frustrations'
    ],
    risks: [
      'Video fatigue from constant face-to-face digital interaction',
      'Bandwidth requirements may exclude some users or regions'
    ],
    generatedContent: {
      headline: 'Remote Video Meetings for Distributed Teams',
      subheadline: 'Make remote collaboration as natural as being in the same room',
      opportunity: 'Enable distributed teams to collaborate effectively through high-quality video meetings'
    },
    tags: ['B2B', 'Remote Work', 'Communication', 'Collaboration'],
    effectiveness: 'high'
  },
  {
    id: '3',
    company: 'Stripe',
    industry: 'FinTech',
    primaryAnchor: {
      type: 'Product Category',
      content: 'Payment Processing API'
    },
    secondaryAnchor: {
      type: 'Company Type',
      content: 'Online Businesses'
    },
    problem: 'Setting up online payments requires complex integrations, lengthy approval processes, and navigating financial regulations',
    differentiator: 'Developer-friendly APIs, instant activation, and handling compliance automatically so businesses can start accepting payments in minutes',
    thesis: [
      'Developers prefer clean, well-documented APIs over complex payment interfaces',
      'Fast time-to-market is crucial for online business validation and growth',
      'Automatic compliance handling reduces legal and operational overhead'
    ],
    risks: [
      'Dependence on a single payment provider creates business risk',
      'Developer-focused positioning may alienate non-technical decision makers'
    ],
    generatedContent: {
      headline: 'Payment Processing API for Online Businesses',
      subheadline: 'Accept payments in minutes with developer-friendly APIs',
      opportunity: 'Simplify online payment setup for businesses through developer-focused APIs'
    },
    tags: ['B2B', 'FinTech', 'API', 'E-commerce'],
    effectiveness: 'high'
  },
  {
    id: '4',
    company: 'Notion',
    industry: 'Productivity',
    primaryAnchor: {
      type: 'Competitive Alternative',
      content: 'All-in-one workspace replacing multiple tools'
    },
    secondaryAnchor: {
      type: 'Company Type',
      content: 'Small to medium teams'
    },
    problem: 'Teams juggle multiple tools for notes, docs, tasks, and databases, creating information silos and context switching overhead',
    differentiator: 'Flexible blocks-based system that combines notes, databases, and project management in one customizable workspace',
    thesis: [
      'Tool switching disrupts workflow and fragments information',
      'Customizable workspaces adapt to team-specific processes better than rigid tools',
      'Unified information architecture improves team knowledge sharing'
    ],
    risks: [
      'All-in-one tools can become complex and overwhelming for simple use cases',
      'Performance may suffer compared to specialized single-purpose tools'
    ],
    generatedContent: {
      headline: 'All-in-one Workspace for Small to Medium Teams',
      subheadline: 'Replace multiple tools with one flexible, customizable workspace',
      opportunity: 'Eliminate tool switching overhead by consolidating team workflows in one platform'
    },
    tags: ['B2B', 'Productivity', 'Workspace', 'Collaboration'],
    effectiveness: 'medium'
  },
  {
    id: '5',
    company: 'Figma',
    industry: 'Design Tools',
    primaryAnchor: {
      type: 'Use Case',
      content: 'Collaborative Design'
    },
    secondaryAnchor: {
      type: 'Department',
      content: 'Design Teams'
    },
    problem: 'Design tools force designers to work in isolation, creating version control issues and slowing feedback cycles',
    differentiator: 'Browser-based collaborative design with real-time multiplayer editing and seamless stakeholder review',
    thesis: [
      'Real-time collaboration reduces design iteration cycles',
      'Browser-based access removes software installation barriers for stakeholders',
      'Version control issues disappear when everyone works on the same live file'
    ],
    risks: [
      'Internet dependency makes the tool unusable offline',
      'Browser performance may lag behind native desktop applications'
    ],
    generatedContent: {
      headline: 'Collaborative Design for Design Teams',
      subheadline: 'Design together in real-time, review seamlessly in the browser',
      opportunity: 'Transform isolated design workflows into collaborative, feedback-rich processes'
    },
    tags: ['B2B', 'Design', 'Collaboration', 'Creative Tools'],
    effectiveness: 'high'
  }
];

export const getExamplesByAnchorType = (anchorType: string) => {
  return positioningExamples.filter(example => 
    example.primaryAnchor.type === anchorType || 
    example.secondaryAnchor.type === anchorType
  );
};

export const getExamplesByIndustry = (industry: string) => {
  return positioningExamples.filter(example => 
    example.industry.toLowerCase().includes(industry.toLowerCase()) ||
    example.tags.some(tag => tag.toLowerCase().includes(industry.toLowerCase()))
  );
};

export const getHighEffectivenessExamples = () => {
  return positioningExamples.filter(example => example.effectiveness === 'high');
};