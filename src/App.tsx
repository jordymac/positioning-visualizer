import { useState, useEffect, lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { VersionManager } from '@/components/forms/VersionManager';
import { storageService } from '@/services/storageService';
import type { CoreMessaging, GeneratedContent, PositioningVersion } from '@/types';

// Lazy load heavy components
const PositioningCanvas = lazy(() => import('@/components/canvas/PositioningCanvas').then(module => ({ default: module.PositioningCanvas })));
const SimpleCoreMessagingForm = lazy(() => import('@/components/forms/SimpleCoreMessagingForm').then(module => ({ default: module.SimpleCoreMessagingForm })));

function App() {
  const [versions, setVersions] = useState<PositioningVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [llmStatus, setLlmStatus] = useState({ isInitialized: false, isInitializing: false });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize with saved data or default version and LLM
  useEffect(() => {
    // Try to load saved data first
    const savedVersions = storageService.loadVersions();
    const savedCurrentVersionId = storageService.loadCurrentVersionId();
    const savedTime = storageService.getLastSavedTime();
    
    if (savedVersions && savedVersions.length > 0) {
      // Load saved data
      setVersions(savedVersions);
      
      // Verify current version ID exists
      const validCurrentId = savedCurrentVersionId && savedVersions.find(v => v.id === savedCurrentVersionId) 
        ? savedCurrentVersionId 
        : savedVersions[0].id;
      
      setCurrentVersionId(validCurrentId);
      setLastSaved(savedTime);
      
      console.log('Loaded saved positioning data');
    } else {
      // Create default version
      const defaultVersion: PositioningVersion = {
        id: '1',
        name: 'Default Positioning',
        coreMessaging: {
          primaryAnchor: { type: '', content: '' },
          secondaryAnchor: { type: '', content: '' },
          problem: '',
          differentiator: '',
          icp: [''],
          thesis: [''],
          risks: [''],
        },
        createdAt: new Date(),
      };
      setVersions([defaultVersion]);
      setCurrentVersionId(defaultVersion.id);
      
      // Save default version
      storageService.autoSave([defaultVersion], defaultVersion.id);
    }

    // Initialize LLM in background with lazy loading
    const initializeLLM = async () => {
      setLlmStatus({ isInitialized: false, isInitializing: true });
      try {
        // Dynamically import the LLM service
        const { llmService } = await import('@/services/llmService');
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
        icp: [''],
        thesis: [''],
        risks: [''],
      },
      createdAt: new Date(),
    };
    
    const updatedVersions = [...versions, newVersion];
    setVersions(updatedVersions);
    setCurrentVersionId(newVersion.id);
    
    // Auto-save new version
    storageService.autoSave(updatedVersions, newVersion.id);
    setLastSaved(new Date());
  };

  const handleVersionSelect = (versionId: string) => {
    setCurrentVersionId(versionId);
    
    // Auto-save current version selection
    storageService.autoSave(versions, versionId);
    setLastSaved(new Date());
  };

  const handleVersionDelete = (versionId: string) => {
    const updatedVersions = versions.filter(v => v.id !== versionId);
    setVersions(updatedVersions);
    
    let newCurrentId = currentVersionId;
    if (currentVersionId === versionId) {
      newCurrentId = updatedVersions.length > 0 ? updatedVersions[0].id : null;
      setCurrentVersionId(newCurrentId);
    }
    
    // Auto-save after deletion
    if (updatedVersions.length > 0) {
      storageService.autoSave(updatedVersions, newCurrentId);
    } else {
      storageService.clearAll();
    }
    setLastSaved(new Date());
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
      storageService.clearAll();
      
      // Reset to default state
      const defaultVersion: PositioningVersion = {
        id: '1',
        name: 'Default Positioning',
        coreMessaging: {
          primaryAnchor: { type: '', content: '' },
          secondaryAnchor: { type: '', content: '' },
          problem: '',
          differentiator: '',
          icp: [''],
          thesis: [''],
          risks: [''],
        },
        createdAt: new Date(),
      };
      
      setVersions([defaultVersion]);
      setCurrentVersionId(defaultVersion.id);
      setLastSaved(null);
      
      console.log('All data cleared');
    }
  };

  const handleFormSubmit = async (data: CoreMessaging) => {
    if (!currentVersionId) return;

    setIsGenerating(true);

    try {
      // Dynamically import and generate content using LLM
      const { llmService } = await import('@/services/llmService');
      const generatedContent = await llmService.generatePositioning(data);

      // Update the current version
      const updatedVersions = versions.map(version => 
        version.id === currentVersionId 
          ? { ...version, coreMessaging: data, generatedContent }
          : version
      );
      setVersions(updatedVersions);
      
      // Auto-save updated content
      storageService.autoSave(updatedVersions, currentVersionId);
      setLastSaved(new Date());
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

      const updatedVersions = versions.map(version => 
        version.id === currentVersionId 
          ? { ...version, coreMessaging: data, generatedContent: fallbackContent }
          : version
      );
      setVersions(updatedVersions);
      
      // Auto-save fallback content
      storageService.autoSave(updatedVersions, currentVersionId);
      setLastSaved(new Date());
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
          onClearAllData={handleClearAllData}
        />

        <div className="space-y-8 p-8">
          {/* Canvas Section */}
          <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">Loading Canvas...</div>}>
            <PositioningCanvas 
              coreMessaging={currentVersion.coreMessaging}
              generatedContent={currentVersion.generatedContent}
            />
          </Suspense>
          
          {/* Form Section */}
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Positioning Strategy Form</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {/* Save indicator */}
                {lastSaved && (
                  <span className="flex items-center text-green-600">
                    <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                
                {/* AI Status */}
                {llmStatus.isInitializing && (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                    Loading AI model...
                  </span>
                )}
                {llmStatus.isInitialized && !llmStatus.isInitializing && (
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
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">Loading Form...</div>}>
              <SimpleCoreMessagingForm 
                key={currentVersionId} // Force re-render when version changes
                onSubmit={handleFormSubmit}
                defaultValues={currentVersion.coreMessaging}
                isGenerating={isGenerating}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default App;
