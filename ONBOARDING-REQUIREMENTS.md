# 🎯 Onboarding Flow Requirements & Structure

## **1. Demo Positioning Data (For The Visualizer Itself)**

The visualizer needs to showcase itself with its own positioning data:

**Primary Anchor:** `Positioning Strategy Visualizer` (Product Category)  
**Secondary Anchor:** `B2B SaaS founders` (Audience)  
**ICP:** `["B2B SaaS founders", "Product marketing managers", "Growth teams"]`  
**Problem:** `Teams struggle to create compelling positioning that resonates with their target market and differentiates from competitors`  
**Differentiator:** `Interactive visual canvas that maps positioning elements to real customer-facing copy with intelligent highlighting and similarity matching from 34 real examples`  
**Thesis:** 
- `Most positioning frameworks are theoretical - this tool shows you the actual result`
- `Visual mapping prevents disconnected messaging across teams`
- `AI-powered similarity matching finds proven examples in your space`
- `Color-coded highlighting reveals how inputs transform into customer copy`

**Risks:**
- `Over-relying on the tool without understanding positioning fundamentals`
- `Generated copy may need refinement for specific brand voice`

---

## **2. User Journey Flow**

```
Landing Page (Demo View)
    ↓ (Auto-show completed visualizer)
[Get Started Button]
    ↓
Onboarding Step 1: Primary Anchor
    ↓
Onboarding Step 2: Secondary Anchor  
    ↓
Onboarding Step 3: Problem
    ↓
Onboarding Step 4: Differentiator
    ↓
Onboarding Step 5: Thesis & Risks
    ↓
Full Form Interface (Current State)
```

---

## **3. Technical Architecture**

**State Management:**
```typescript
interface OnboardingState {
  currentStep: 'demo' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'complete'
  isFirstTime: boolean
  demoData: CoreMessaging  // Pre-filled visualizer data
  userProgress: Partial<CoreMessaging>
}
```

**Navigation Flow:**
- Route-based navigation (`/`, `/onboarding/step1`, etc.)
- Progress persistence in localStorage
- Skip/back functionality
- Auto-save as user progresses

---

## **4. Component Structure**

```
src/components/
├── onboarding/
│   ├── LandingView.tsx           # Demo visualizer + Get Started
│   ├── OnboardingStep.tsx        # Reusable step component
│   ├── ProgressIndicator.tsx     # Visual progress bar
│   └── GuidedPrompts.tsx         # Smart prompting system
├── canvas/
│   ├── PositioningCanvas.tsx     # Enhanced with demo mode
│   └── DemoCanvas.tsx            # Read-only demo version
└── forms/
    └── CoreMessagingForm.tsx     # Enhanced with step mode
```

---

## **5. Guided Prompts System**

Each step includes:
- **Context explanation** (why this matters)
- **Examples** (2-3 good examples from our database)  
- **Smart suggestions** (based on user's industry/input)
- **Validation** (check for common mistakes)

**Step-by-step prompts:**
1. **Primary Anchor:** "What category do you want to own? (e.g., 'CRM platform', 'marketing automation tool')"
2. **Secondary Anchor:** "Who specifically are you targeting? (e.g., 'B2B SaaS founders', 'enterprise sales teams')"
3. **Problem:** "What pain point keeps your audience up at night?"
4. **Differentiator:** "What makes your solution uniquely better?"
5. **Thesis & Risks:** "What market beliefs support your positioning? What could go wrong?"

---

## **6. Data Flow & Integration**

**Demo Mode:**
- Uses pre-defined demo data
- Generates positioning automatically to show end result
- Read-only canvas with full highlighting
- "Get Started" CTA to begin user flow

**Onboarding Mode:**
- Progressive form filling
- Real-time canvas updates as user progresses
- Smart defaults based on similar examples
- Vector search suggestions at each step

**Integration Points:**
- Existing `simpleRAGService.ts` for AI generation
- Current `PositioningCanvas.tsx` with demo mode flag
- Enhanced `CoreMessagingForm.tsx` with step-by-step mode
- localStorage for progress persistence

---

## **7. UI/UX Requirements**

**Landing Page:**
- Hero section with completed demo visualizer
- Clear value proposition
- "Get Started" button prominent
- "Skip to Full Form" option for power users

**Onboarding Steps:**
- Progress indicator (1/5, 2/5, etc.)
- Back/Next navigation
- Skip option
- Auto-save progress
- Smart field suggestions

**Transitions:**
- Smooth animations between steps
- Canvas updates in real-time
- Highlight new content as it's added

---

## **Implementation Notes**

This structure provides a complete roadmap for implementing the onboarding flow while maintaining all existing functionality and integrating seamlessly with the current vector search and highlighting systems.

**Key Files to Modify:**
- `src/components/canvas/PositioningCanvas.tsx` - Add demo mode support
- `src/components/forms/CoreMessagingForm.tsx` - Add step-by-step mode  
- `src/services/simpleRAGService.ts` - Add demo data generation
- Create new onboarding components as outlined above

**Development Priority:**
1. Create demo positioning data
2. Build landing view with demo
3. Implement step-by-step onboarding
4. Add guided prompts and suggestions
5. Polish transitions and UX flow