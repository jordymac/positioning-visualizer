export interface PositioningExample {
  id: string;
  company: string;
  anchorType: 'Product Category' | 'Use Case' | 'Competitive Alternative';
  primaryAnchor: string;
  tagline: string;
  description: string;
  problem: string;
  differentiator: string;
  secondaryAnchors: {
    audience?: string;
    speed?: string;
    proof?: string;
    outcome?: string;
    features?: string;
    focus?: string;
  };
  icp: string[]; // Ideal Customer Profile - multiple segments supported
  tags: string[];
  tone: string;
  industry: string;
  effectiveness: 'high' | 'medium' | 'low';
  structure: string;
}

export const positioningExamples: PositioningExample[] = [
  {
    id: "wynter-001",
    company: "Wynter",
    anchorType: "Product Category",
    primaryAnchor: "market research platform",
    tagline: "On-demand market research platform for B2B",
    description: "Wynter tells you what your target market wants. We help leaders answer \"what are their pain points?\" and \"what would make them buy from us?\". In under 48 hours.",
    problem: "B2B leaders don't know what their target market wants or what would make them buy",
    differentiator: "Get market insights in under 48 hours vs traditional research that takes weeks",
    secondaryAnchors: {
      audience: "B2B leaders",
      speed: "48 hours"
    },
    icp: ["B2B SaaS founders", "Product marketing managers", "Growth team leads"],
    tags: ["speed-focused", "b2b-saas", "research", "time-sensitive"],
    tone: "professional",
    industry: "market research",
    effectiveness: "high",
    structure: "problem-solution"
  },
  {
    id: "fletch-001", 
    company: "Fletch",
    anchorType: "Use Case",
    primaryAnchor: "fix your confusing positioning",
    tagline: "Let's fix your confusing positioning",
    description: "Fletch has helped over 300 startups discover their ideal product positioning and bring it to life on a newly crafted homepage.",
    problem: "Startups have confusing positioning",
    differentiator: "Complete positioning discovery + homepage execution in one service",
    secondaryAnchors: {
      audience: "startups",
      proof: "300+ companies helped"
    },
    icp: ["Early-stage startup founders", "B2B SaaS companies", "Pre-Series A startups"],
    tags: ["positioning", "startups", "homepage", "service-based"],
    tone: "casual",
    industry: "product marketing",
    effectiveness: "high",
    structure: "direct-promise"
  },
  {
    id: "lemlist-001",
    company: "LemList", 
    anchorType: "Competitive Alternative",
    primaryAnchor: "the only cold outreach tool that helps you reach inboxes and get replies",
    tagline: "The only cold outreach tool that helps you reach inboxes and get replies",
    description: "Build your lead list with verified emails, write and personalize at scale, and send cold emails that actually get customers.",
    problem: "Most cold outreach tools don't actually get replies or reach inboxes",
    differentiator: "Actually reaches inboxes and gets replies (vs tools that just send emails)",
    secondaryAnchors: {
      outcome: "get customers",
      features: "verified emails, personalization at scale"
    },
    icp: ["B2B sales teams", "Agency account managers", "SaaS business development reps"],
    tags: ["differentiation-focused", "sales", "email-marketing", "results-oriented"],
    tone: "confident",
    industry: "sales tech",
    effectiveness: "high", 
    structure: "superiority-claim"
  },
  {
    id: "voltaiq-001",
    company: "Voltaiq",
    anchorType: "Use Case",
    primaryAnchor: "catch battery defects in hours - not weeks", 
    tagline: "Catch battery defects in hours - not weeks",
    description: "Catch quality issues faster with data you already collect. Designed for battery production lines and test labs, used by leading global companies to scale fast and ensure reliability.",
    problem: "Battery defect detection takes weeks, slowing production and risking quality",
    differentiator: "Uses existing data to detect defects in hours instead of weeks",
    secondaryAnchors: {
      audience: "battery manufacturers", 
      proof: "leading global companies"
    },
    icp: ["Battery manufacturing engineers", "Quality assurance managers", "Electric vehicle manufacturers"],
    tags: ["speed-improvement", "manufacturing", "existing-data", "enterprise"],
    tone: "technical",
    industry: "manufacturing",
    effectiveness: "high",
    structure: "time-comparison"
  },
  {
    id: "toro-001",
    company: "ToroTMS",
    anchorType: "Product Category", 
    primaryAnchor: "TMS for bulk haulers",
    tagline: "The TMS for bulk haulers",
    description: "Unlike other TMS systems which create more work for your team, Toro is built specifically to tackle the unique dispatching and back office challenges of bulk hauling.",
    problem: "Other TMS systems create more work and don't handle bulk hauling specifics",
    differentiator: "Built specifically for bulk hauling challenges vs generic TMS systems",
    secondaryAnchors: {
      audience: "bulk haulers",
      focus: "dispatching and back office"
    },
    icp: ["Bulk hauling fleet managers", "Logistics dispatchers", "Transportation company owners"],
    tags: ["niche-specific", "logistics", "industry-focused", "workflow-improvement"],
    tone: "professional",
    industry: "logistics",
    effectiveness: "high",
    structure: "niche-specialization"
  },
  {
    id: "freckle-001",
    company: "Freckle", 
    anchorType: "Competitive Alternative",
    primaryAnchor: "Clay alternative for non-technical users",
    tagline: "It's like Clay... without the learning curve",
    description: "Freckle is the Clay-alternative for non-technical users. Unlock your best outbound campaigns with easy enrichment research and clean up templates for your lead lists.",
    problem: "Clay has a steep learning curve for non-technical users",
    differentiator: "Same power as Clay but without the complexity - designed for non-technical users",
    secondaryAnchors: {
      audience: "non-technical users",
      outcome: "better outbound campaigns"
    },
    icp: ["Marketing managers", "Sales operations specialists", "Small business owners"],
    tags: ["ease-of-use", "competitor-alternative", "accessibility", "sales-tools"],
    tone: "approachable",
    industry: "sales tech", 
    effectiveness: "high",
    structure: "competitor-comparison"
  },
  {
    id: "podia-001",
    company: "Podia",
    anchorType: "Product Category",
    primaryAnchor: "all-in-one for teams-of-one", 
    tagline: "The all-in-one for teams-of-one",
    description: "Join 150,000+ solo business owners who use Podia to run their website, online store, and email marketing",
    problem: "Solo business owners need multiple tools for website, store, and email marketing",
    differentiator: "Complete business toolkit designed specifically for solo entrepreneurs",
    secondaryAnchors: {
      audience: "solo business owners",
      proof: "150,000+ users"
    },
    icp: ["Solo entrepreneurs", "Online course creators", "Digital product sellers"],
    tags: ["all-in-one", "solo-entrepreneurs", "simplification", "social-proof"],
    tone: "encouraging",
    industry: "creator economy",
    effectiveness: "high",
    structure: "community-focused"
  }
];

export const getExamplesByAnchorType = (anchorType: string) => {
  return positioningExamples.filter(example => 
    example.anchorType === anchorType
  );
};

export const getExamplesByIndustry = (industry: string) => {
  return positioningExamples.filter(example => 
    example.industry.toLowerCase().includes(industry.toLowerCase()) ||
    example.tags.some(tag => tag.toLowerCase().includes(industry.toLowerCase()))
  );
};

export const getExamplesByTags = (tags: string[]) => {
  return positioningExamples.filter(example =>
    tags.some(tag => example.tags.includes(tag))
  );
};

export const getExamplesByStructure = (structure: string) => {
  return positioningExamples.filter(example => 
    example.structure === structure
  );
};

export const getExamplesByTone = (tone: string) => {
  return positioningExamples.filter(example =>
    example.tone === tone
  );
};

export const getHighEffectivenessExamples = () => {
  return positioningExamples.filter(example => example.effectiveness === 'high');
};