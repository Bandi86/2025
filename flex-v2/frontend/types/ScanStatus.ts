export interface ScanStatus {
  isScanning: boolean;
  progress: number;
  scannedFiles: number;
  totalFiles: number;
  currentDirectory?: string;
  currentFile?: string;
  startTime?: string;
  estimatedEndTime?: string;
  cancelRequested?: boolean;
  error?: string;
  duration?: number;
  filesCount?: number; // Optional property to store the count of files
  directoriesCount?: number; // Optional property to store the count of directories
  directoriesScanned?: number; // Optional property to store the count of scanned directories
  directoriesTotal?: number; // Optional property to store the total count of directories
  directoriesScannedCount?: number; // Optional property to store the count of scanned directories
  directoriesTotalCount?: number; // Optional property to store the total count of directories
  directories?: Array<{
    id: string;

    path: string;
    name: string;
    created_at: string;
    files_count?: number;
    last_scan_date?: string;
    files?: Array<{
      id: string;
      name: string;
      size: number;
      created_at: string;
      last_modified: string;
    }>;
  }>;
  files?: Array<{
    id: string;
    name: string;
    size: number;
    created_at: string;
    last_modified: string;
  }>;
  last_scan_date?: string;
}
