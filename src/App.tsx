import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { VersionManager } from '@/components/forms/VersionManager';
import { PositioningCanvas } from '@/components/canvas/PositioningCanvas';
import { SimpleCoreMessagingForm } from '@/components/forms/SimpleCoreMessagingForm';
import type { CoreMessaging, GeneratedContent, PositioningVersion } from '@/types';

function App() {
  const [versions, setVersions] = useState<PositioningVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);

  // Initialize with a default version
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

  const handleFormSubmit = (data: CoreMessaging) => {
    if (!currentVersionId) return;

    // TODO: Replace with AI generation
    const generatedContent: GeneratedContent = {
      headline: data.secondaryAnchor.content ? 
        `${data.primaryAnchor.content} for ${data.secondaryAnchor.content}` :
        `${data.primaryAnchor.content} Positioning Strategy`,
      subheadline: `Positioning based on ${data.primaryAnchor.type.toLowerCase()}: ${data.primaryAnchor.content}`,
      thesis: data.thesis.filter(t => t.trim()),
      risks: data.risks.filter(r => r.trim()),
      opportunity: `Market opportunity for ${data.primaryAnchor.content} targeting ${data.secondaryAnchor.content || 'target market'}`
    };

    // Update the current version
    setVersions(prev => prev.map(version => 
      version.id === currentVersionId 
        ? { ...version, coreMessaging: data, generatedContent }
        : version
    ));
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
            <h2 className="text-lg font-semibold mb-6">Positioning Strategy Form</h2>
            <SimpleCoreMessagingForm 
              key={currentVersionId} // Force re-render when version changes
              onSubmit={handleFormSubmit}
              defaultValues={currentVersion.coreMessaging}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default App;
