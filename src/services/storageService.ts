import type { PositioningVersion } from '@/types';

const STORAGE_KEYS = {
  VERSIONS: 'positioning-visualizer-versions',
  CURRENT_VERSION_ID: 'positioning-visualizer-current-version-id',
  LAST_SAVED: 'positioning-visualizer-last-saved'
};

class StorageService {
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  saveVersions(versions: PositioningVersion[]): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const serializedVersions = JSON.stringify(versions.map(version => ({
        ...version,
        createdAt: version.createdAt.toISOString() // Convert Date to string
      })));
      
      localStorage.setItem(STORAGE_KEYS.VERSIONS, serializedVersions);
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
      
      console.log('Versions saved to localStorage');
    } catch (error) {
      console.error('Failed to save versions:', error);
    }
  }

  loadVersions(): PositioningVersion[] | null {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      const savedVersions = localStorage.getItem(STORAGE_KEYS.VERSIONS);
      if (!savedVersions) return null;
      
      const parsedVersions = JSON.parse(savedVersions);
      
      // Convert ISO strings back to Date objects
      const versions = parsedVersions.map((version: any) => ({
        ...version,
        createdAt: new Date(version.createdAt)
      }));
      
      console.log('Versions loaded from localStorage:', versions.length);
      return versions;
    } catch (error) {
      console.error('Failed to load versions:', error);
      return null;
    }
  }

  saveCurrentVersionId(versionId: string): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION_ID, versionId);
    } catch (error) {
      console.error('Failed to save current version ID:', error);
    }
  }

  loadCurrentVersionId(): string | null {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION_ID);
    } catch (error) {
      console.error('Failed to load current version ID:', error);
      return null;
    }
  }

  getLastSavedTime(): Date | null {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      const lastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
      return lastSaved ? new Date(lastSaved) : null;
    } catch (error) {
      console.error('Failed to get last saved time:', error);
      return null;
    }
  }

  clearAll(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('All positioning data cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  exportData(): string | null {
    if (!this.isLocalStorageAvailable()) return null;
    
    try {
      const versions = this.loadVersions();
      const currentVersionId = this.loadCurrentVersionId();
      const lastSaved = this.getLastSavedTime();
      
      const exportData = {
        versions,
        currentVersionId,
        lastSaved: lastSaved?.toISOString(),
        exportedAt: new Date().toISOString()
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (importedData.versions && Array.isArray(importedData.versions)) {
        const versions = importedData.versions.map((version: any) => ({
          ...version,
          createdAt: new Date(version.createdAt)
        }));
        
        this.saveVersions(versions);
        
        if (importedData.currentVersionId) {
          this.saveCurrentVersionId(importedData.currentVersionId);
        }
        
        console.log('Data imported successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Auto-save with debouncing
  private autoSaveTimeout: NodeJS.Timeout | null = null;
  
  autoSave(versions: PositioningVersion[], currentVersionId: string | null, delay: number = 1000): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveVersions(versions);
      if (currentVersionId) {
        this.saveCurrentVersionId(currentVersionId);
      }
    }, delay);
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;