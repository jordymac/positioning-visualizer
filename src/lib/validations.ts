import { z } from 'zod';

export const CoreMessagingSchema = z.object({
  primaryAnchor: z.object({
    type: z.enum(['Product Category', 'Use Case', 'Competitive Alternative']),
    content: z.string(),
  }),
  secondaryAnchor: z.object({
    type: z.enum(['Company Type', 'Department', 'Desired Outcome']),
    content: z.string().optional(),
  }),
  problem: z.string(),
  differentiator: z.string(),
  thesis: z.array(z.string()),
  risks: z.array(z.string()),
});

export const GeneratedContentSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  thesis: z.array(z.string()),
  risks: z.array(z.string()),
  opportunity: z.string(),
});

export const TrainingExampleSchema = z.object({
  id: z.string(),
  company: z.string(),
  anchorType: z.enum(['Product Category', 'Use Case', 'Competitive Alternative']),
  content: z.string(),
  headline: z.string(),
  tags: z.array(z.string()),
  industry: z.string().optional(),
  effectiveness: z.enum(['high', 'medium', 'low']),
});

export type CoreMessagingFormData = z.infer<typeof CoreMessagingSchema>;
export type GeneratedContentData = z.infer<typeof GeneratedContentSchema>;
export type TrainingExampleData = z.infer<typeof TrainingExampleSchema>;