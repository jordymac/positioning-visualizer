import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CoreMessaging } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface SimpleCoreMessagingFormProps {
  onSubmit: (data: CoreMessaging) => void;
  defaultValues?: Partial<CoreMessaging>;
  isGenerating?: boolean;
}

export function SimpleCoreMessagingForm({ onSubmit, defaultValues, isGenerating = false }: SimpleCoreMessagingFormProps) {
  const [formData, setFormData] = useState<CoreMessaging>({
    primaryAnchor: {
      type: defaultValues?.primaryAnchor?.type || '',
      content: defaultValues?.primaryAnchor?.content || '',
    },
    secondaryAnchor: {
      type: defaultValues?.secondaryAnchor?.type || '',
      content: defaultValues?.secondaryAnchor?.content || '',
    },
    problem: defaultValues?.problem || '',
    differentiator: defaultValues?.differentiator || '',
    icp: defaultValues?.icp || [''],
    thesis: defaultValues?.thesis || [''],
    risks: defaultValues?.risks || [''],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addThesis = () => {
    setFormData(prev => ({
      ...prev,
      thesis: [...prev.thesis, '']
    }));
  };

  const removeThesis = (index: number) => {
    setFormData(prev => ({
      ...prev,
      thesis: prev.thesis.filter((_, i) => i !== index)
    }));
  };

  const updateThesis = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      thesis: prev.thesis.map((item, i) => i === index ? value : item)
    }));
  };

  const addRisk = () => {
    setFormData(prev => ({
      ...prev,
      risks: [...prev.risks, '']
    }));
  };

  const removeRisk = (index: number) => {
    setFormData(prev => ({
      ...prev,
      risks: prev.risks.filter((_, i) => i !== index)
    }));
  };

  const updateRisk = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      risks: prev.risks.map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-12">
        
        {/* Core Elements Section */}
        <div className="space-y-12">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 ml-2">Core Positioning Elements</h3>
            <p className="text-sm text-gray-600 ml-2">
              Define the fundamental components of your positioning strategy
            </p>
          </div>

          {/* Primary Anchor */}
          <div className="space-y-6 bg-gray-50 p-8 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Primary Anchor</h4>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Type</Label>
                <Select 
                  value={formData.primaryAnchor.type} 
                  onValueChange={(value: any) => setFormData(prev => ({
                    ...prev,
                    primaryAnchor: { ...prev.primaryAnchor, type: value }
                  }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select an anchor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product Category">Product Category</SelectItem>
                    <SelectItem value="Use Case">Use Case</SelectItem>
                    <SelectItem value="Competitive Alternative">Competitive Alternative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Content</Label>
                <Input
                  value={formData.primaryAnchor.content}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryAnchor: { ...prev.primaryAnchor, content: e.target.value }
                  }))}
                  placeholder="e.g., CRM Software, Marketing Automation..."
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Secondary Anchor */}
          <div className="space-y-6 bg-gray-50 p-8 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Secondary Anchor</h4>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Type</Label>
                <Select 
                  value={formData.secondaryAnchor.type} 
                  onValueChange={(value: any) => setFormData(prev => ({
                    ...prev,
                    secondaryAnchor: { ...prev.secondaryAnchor, type: value }
                  }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select an anchor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Company Type">Company Type</SelectItem>
                    <SelectItem value="Department">Department</SelectItem>
                    <SelectItem value="Desired Outcome">Desired Outcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Content</Label>
                <Input
                  value={formData.secondaryAnchor.content}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    secondaryAnchor: { ...prev.secondaryAnchor, content: e.target.value }
                  }))}
                  placeholder="e.g., SaaS Companies, Sales Teams..."
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Problem & Differentiator */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4 bg-gray-50 p-8 rounded-lg">
              <Label className="text-lg font-medium text-gray-900">Problem Statement</Label>
              <Textarea
                value={formData.problem}
                onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
                placeholder="Describe the specific problem your product solves..."
                className="min-h-[120px] resize-none"
              />
            </div>
            <div className="space-y-4 bg-gray-50 p-8 rounded-lg">
              <Label className="text-lg font-medium text-gray-900">Differentiator</Label>
              <Textarea
                value={formData.differentiator}
                onChange={(e) => setFormData(prev => ({ ...prev, differentiator: e.target.value }))}
                placeholder="What makes you different from alternatives..."
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Supporting Elements */}
        <div className="space-y-12">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 ml-2">Supporting Elements</h3>
            <p className="text-sm text-gray-600 ml-2">
              Add thesis points and risks to strengthen your positioning analysis
            </p>
          </div>

          {/* Thesis and Risks */}
          <div className="grid grid-cols-2 gap-8">
            {/* Thesis */}
            <div className="space-y-6 bg-gray-50 p-8 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium text-gray-900">Thesis Points</Label>
                <Button type="button" variant="outline" size="sm" onClick={addThesis}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-4">
                {formData.thesis.map((thesis, index) => (
                  <div key={index} className="flex gap-3">
                    <Textarea
                      value={thesis}
                      onChange={(e) => updateThesis(index, e.target.value)}
                      placeholder={`Why this positioning works ${index + 1}...`}
                      className="min-h-[100px] flex-1 resize-none text-sm"
                    />
                    {formData.thesis.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeThesis(index)}
                        className="h-10 w-10 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="space-y-6 bg-gray-50 p-8 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium text-gray-900">Risk Points</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRisk}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-4">
                {formData.risks.map((risk, index) => (
                  <div key={index} className="flex gap-3">
                    <Textarea
                      value={risk}
                      onChange={(e) => updateRisk(index, e.target.value)}
                      placeholder={`Potential risk ${index + 1}...`}
                      className="min-h-[100px] flex-1 resize-none text-sm"
                    />
                    {formData.risks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRisk(index)}
                        className="h-10 w-10 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
          <Button type="submit" className="flex-1 h-12 text-lg" disabled={isGenerating}>
            {isGenerating ? (
              <span className="flex items-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Generating with AI...
              </span>
            ) : (
              'Generate Positioning Strategy'
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="h-12 px-8"
            onClick={() => setFormData({
              primaryAnchor: { type: '', content: '' },
              secondaryAnchor: { type: '', content: '' },
              problem: '',
              differentiator: '',
              icp: [''],
              thesis: [''],
              risks: [''],
            })}
          >
            Reset Form
          </Button>
        </div>
      </form>
    </div>
  );
}