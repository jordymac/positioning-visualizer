// @ts-nocheck
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { CoreMessagingSchema, type CoreMessagingFormData } from '@/lib/validations';
import type { CoreMessaging } from '@/types';
import { Info, Plus, Trash2 } from 'lucide-react';

interface CoreMessagingFormProps {
  onSubmit: (data: CoreMessaging) => void;
  defaultValues?: Partial<CoreMessaging>;
}

export function CoreMessagingForm({ onSubmit, defaultValues }: CoreMessagingFormProps) {
  const form = useForm<CoreMessagingFormData>({
    resolver: zodResolver(CoreMessagingSchema),
    defaultValues: {
      primaryAnchor: {
        type: 'Product Category',
        content: '',
      },
      secondaryAnchor: {
        type: 'Company Type',
        content: '',
      },
      problem: '',
      differentiator: '',
      thesis: [''],
      risks: [''],
      ...defaultValues,
    },
  });

  const {
    fields: thesisFields,
    append: appendThesis,
    remove: removeThesis,
  } = useFieldArray({
    control: form.control,
    name: 'thesis',
  });

  const {
    fields: riskFields,
    append: appendRisk,
    remove: removeRisk,
  } = useFieldArray({
    control: form.control,
    name: 'risks',
  });

  const handleSubmit = (data: CoreMessagingFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Core Elements Section */}
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">Core Positioning Elements</h3>
            <p className="text-sm text-muted-foreground">
              Define the fundamental components of your positioning strategy
            </p>
          </div>

          {/* Primary Anchor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="primaryAnchor.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Primary Anchor Type
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select anchor type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Product Category">Product Category</SelectItem>
                      <SelectItem value="Use Case">Use Case</SelectItem>
                      <SelectItem value="Competitive Alternative">Competitive Alternative</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The main category that frames your positioning
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryAnchor.content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Anchor Content</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., CRM Software, Marketing Automation..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Specific content for your primary anchor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Secondary Anchor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="secondaryAnchor.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Secondary Anchor Type
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select secondary anchor type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Company Type">Company Type</SelectItem>
                      <SelectItem value="Department">Department</SelectItem>
                      <SelectItem value="Desired Outcome">Desired Outcome</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Additional context to narrow your positioning
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondaryAnchor.content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Anchor Content</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., SaaS Companies, Sales Teams..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Specific content for your secondary anchor (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Problem Statement */}
          <FormField
            control={form.control}
            name="problem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Problem Statement</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the specific problem your product solves..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  What problem do you solve for your target customers?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Differentiator */}
          <FormField
            control={form.control}
            name="differentiator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Differentiator</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What makes you different from alternatives..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  What unique value do you provide that competitors don't?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Elements Section */}
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">Supporting Elements</h3>
            <p className="text-sm text-muted-foreground">
              Add thesis points and risks to strengthen your positioning analysis
            </p>
          </div>

        {/* Thesis Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base">Thesis Points</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendThesis('')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Thesis Point
            </Button>
          </div>
          <FormDescription>
            Why does this positioning strategy work? What evidence supports it?
          </FormDescription>
          {thesisFields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`thesis.${index}`}
              render={({ field: inputField }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Textarea
                        placeholder={`Thesis point ${index + 1}...`}
                        className="min-h-[80px]"
                        {...inputField}
                      />
                    </FormControl>
                    {thesisFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeThesis(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        {/* Risk Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base">Risk Points</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendRisk('')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Risk Point
            </Button>
          </div>
          <FormDescription>
            What are the potential risks or downsides of this positioning strategy?
          </FormDescription>
          {riskFields.map((field, index) => (
            <FormField
              key={field.id}
              control={form.control}
              name={`risks.${index}`}
              render={({ field: inputField }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Textarea
                        placeholder={`Risk point ${index + 1}...`}
                        className="min-h-[80px]"
                        {...inputField}
                      />
                    </FormControl>
                    {riskFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRisk(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            Generate Positioning Strategy
          </Button>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset Form
          </Button>
        </div>
      </form>
    </Form>
  );
}