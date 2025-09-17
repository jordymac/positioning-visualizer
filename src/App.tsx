import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { VersionManager } from '@/components/forms/VersionManager';
import { PositioningCanvas } from '@/components/canvas/PositioningCanvas';
import { SimpleCoreMessagingForm } from '@/components/forms/SimpleCoreMessagingForm';
import { llmService } from '@/services/llmService';
import type { CoreMessaging, GeneratedContent, PositioningVersion } from '@/types';

function App() {
  const [versions, setVersions] = useState<PositioningVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [llmStatus, setLlmStatus] = useState({ isInitialized: false, isInitializing: false });

  // Initialize with a default version and LLM
  useEffect(() => {
    const defaultVersion: PositioningVersion = {
      id: '1',
      name: 'Default Positioning',
      coreMessaging: {
        primaryAnchor: { type: '', content: '' },
        secondaryAnchor: { type: '', content: '' },
        problem: '',
        differentiator: '',
        thesis: [''],
        risks: [''],
      },
      createdAt: new Date(),
    };
    setVersions([defaultVersion]);
    setCurrentVersionId(defaultVersion.id);

    // Initialize LLM in background
    const initializeLLM = async () => {
      setLlmStatus({ isInitialized: false, isInitializing: true });
      try {
        await llmService.initialize();
        setLlmStatus({ isInitialized: true, isInitializing: false });
      } catch (error) {
        console.error('LLM initialization failed:', error);
        setLlmStatus({ isInitialized: false, isInitializing: false });
      }
    };

    initializeLLM();
  }, []);

  const currentVersion = versions.find(v => v.id === currentVersionId);

  const handleVersionCreate = (name: string) => {
    const newVersion: PositioningVersion = {
      id: Date.now().toString(),
      name,
      coreMessaging: {
        primaryAnchor: { type: '', content: '' },
        secondaryAnchor: { type: '', content: '' },
        problem: '',
        differentiator: '',
        thesis: [''],
        risks: [''],
      },
      createdAt: new Date(),
    };
    setVersions(prev => [...prev, newVersion]);
    setCurrentVersionId(newVersion.id);
  };

  const handleVersionSelect = (versionId: string) => {
    setCurrentVersionId(versionId);
  };

  const handleVersionDelete = (versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
    if (currentVersionId === versionId) {
      const remaining = versions.filter(v => v.id !== versionId);
      setCurrentVersionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleFormSubmit = async (data: CoreMessaging) => {
    if (!currentVersionId) return;

    setIsGenerating(true);

    try {
      // Generate content using LLM
      const generatedContent = await llmService.generatePositioning(data);

      // Update the current version
      setVersions(prev => prev.map(version => 
        version.id === currentVersionId 
          ? { ...version, coreMessaging: data, generatedContent }
          : version
      ));
    } catch (error) {
      console.error('Generation failed:', error);
      
      // Fallback to simple generation
      const fallbackContent: GeneratedContent = {
        headline: data.secondaryAnchor.content ? 
          `${data.primaryAnchor.content} for ${data.secondaryAnchor.content}` :
          `${data.primaryAnchor.content} Positioning Strategy`,
        subheadline: `Positioning based on ${data.primaryAnchor.type.toLowerCase()}: ${data.primaryAnchor.content}`,
        thesis: data.thesis.filter(t => t.trim()),
        risks: data.risks.filter(r => r.trim()),
        opportunity: `Market opportunity for ${data.primaryAnchor.content} targeting ${data.secondaryAnchor.content || 'target market'}`
      };

      setVersions(prev => prev.map(version => 
        version.id === currentVersionId 
          ? { ...version, coreMessaging: data, generatedContent: fallbackContent }
          : version
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentVersion) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="text-center">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-0">
        {/* Version Management */}
        <VersionManager
          versions={versions}
          currentVersionId={currentVersionId}
          onVersionSelect={handleVersionSelect}
          onVersionCreate={handleVersionCreate}
          onVersionDelete={handleVersionDelete}
        />

        <div className="space-y-8 p-8">
          {/* Canvas Section */}
          <PositioningCanvas 
            coreMessaging={currentVersion.coreMessaging}
            generatedContent={currentVersion.generatedContent}
          />
          
          {/* Form Section */}
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Positioning Strategy Form</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {llmStatus.isInitializing && (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Loading AI model...
                  </span>
                )}
                {llmStatus.isInitialized && (
                  <span className="flex items-center text-green-600">
                    <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                    AI Ready
                  </span>
                )}
                {isGenerating && (
                  <span className="flex items-center text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Generating...
                  </span>
                )}
              </div>
            </div>
            <SimpleCoreMessagingForm 
              key={currentVersionId} // Force re-render when version changes
              onSubmit={handleFormSubmit}
              defaultValues={currentVersion.coreMessaging}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default App;
