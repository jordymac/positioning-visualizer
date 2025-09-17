import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PositioningVersion } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface VersionManagerProps {
  versions: PositioningVersion[];
  currentVersionId: string | null;
  onVersionSelect: (versionId: string) => void;
  onVersionCreate: (name: string) => void;
  onVersionDelete: (versionId: string) => void;
  onClearAllData?: () => void;
}

export function VersionManager({
  versions,
  currentVersionId,
  onVersionSelect,
  onVersionCreate,
  onVersionDelete,
  onClearAllData,
}: VersionManagerProps) {
  const [newVersionName, setNewVersionName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreate = () => {
    if (newVersionName.trim()) {
      onVersionCreate(newVersionName.trim());
      setNewVersionName('');
      setShowCreateForm(false);
    }
  };

  const handleDelete = (versionId: string) => {
    if (versions.length > 1 && confirm('Are you sure you want to delete this positioning version?')) {
      onVersionDelete(versionId);
    }
  };

  return (
    <div className="border-b bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Positioning Versions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Version
        </Button>
      </div>

      {showCreateForm && (
        <div className="mb-4 p-3 bg-white rounded border">
          <div className="flex gap-2">
            <Input
              placeholder="Version name (e.g., 'Enterprise Focus', 'SMB Market')"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1"
            />
            <Button onClick={handleCreate} disabled={!newVersionName.trim()}>
              Create
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Current Version:</span>
        <Select value={currentVersionId || ''} onValueChange={onVersionSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select positioning version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                {version.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {currentVersionId && versions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(currentVersionId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        {onClearAllData && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAllData}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            Clear All Data
          </Button>
        )}
      </div>
    </div>
  );
}