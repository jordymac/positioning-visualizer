import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { GenerationSettings } from '@/types';
import { cn } from '@/lib/utils';

interface GenerationControlsProps {
  onSettingsChange: (settings: GenerationSettings) => void;
  className?: string;
  initialSettings?: GenerationSettings;
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({
  onSettingsChange,
  className,
  initialSettings = { temperature: 0.3, top_p: 0.8 }
}) => {
  // Convert temperature (0-1) to creativity slider (0-100)
  const [creativity, setCreativity] = useState(Math.round(initialSettings.temperature * 100));
  // Convert top_p (0.3-1.0) to vocabulary slider (0-100)
  const [vocabulary, setVocabulary] = useState(Math.round(((initialSettings.top_p - 0.3) / 0.7) * 100));

  useEffect(() => {
    const settings: GenerationSettings = {
      temperature: creativity / 100,
      top_p: 0.3 + (vocabulary / 100) * 0.7 // Map 0-100 to 0.3-1.0
    };
    onSettingsChange(settings);
  }, [creativity, vocabulary, onSettingsChange]);

  const getCreativityLabel = (value: number) => {
    if (value <= 20) return 'Very Conservative';
    if (value <= 40) return 'Conservative';
    if (value <= 60) return 'Balanced';
    if (value <= 80) return 'Creative';
    return 'Very Creative';
  };

  const getVocabularyLabel = (value: number) => {
    if (value <= 20) return 'Simple & Direct';
    if (value <= 40) return 'Professional';
    if (value <= 60) return 'Varied';
    if (value <= 80) return 'Rich';
    return 'Highly Varied';
  };

  return (
    <div className={cn("space-y-6 p-4 bg-gray-50 rounded-lg border", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Writing Style</Label>
          <span className="text-xs text-gray-500 font-medium">
            {getCreativityLabel(creativity)}
          </span>
        </div>
        <Slider
          value={[creativity]}
          onValueChange={(value) => setCreativity(value[0])}
          max={100}
          min={0}
          step={5}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Corporate</span>
          <span>Creative</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Controls how conservative or creative the generated content will be
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Word Variety</Label>
          <span className="text-xs text-gray-500 font-medium">
            {getVocabularyLabel(vocabulary)}
          </span>
        </div>
        <Slider
          value={[vocabulary]}
          onValueChange={(value) => setVocabulary(value[0])}
          max={100}
          min={0}
          step={5}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Simple</span>
          <span>Rich</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Controls vocabulary diversity and word choice complexity
        </p>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Temperature:</span>
            <span className="font-mono">{(creativity / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Top-p:</span>
            <span className="font-mono">{(0.3 + (vocabulary / 100) * 0.7).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};