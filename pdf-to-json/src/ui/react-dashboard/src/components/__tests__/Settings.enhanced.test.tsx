import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Settings from '../Settings';
import { apiService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    reloadConfig: jest.fn(),
    validateConfig: jest.fn(),
    previewConfig: jest.fn(),
    getConfigBackups: jest.fn(),
    createConfigBackup: jest.fn(),
    restoreConfigBackup: jest.fn(),
    deleteConfigBackup: jest.fn(),
    exportConfig: jest.fn(),
    importConfig: jest.fn(),
  },
}));

const mockConfig = {
  web_downloader: {
    url: 'https://example.com/data',
    check_interval: 3600,
    download_path: 'source/',
    max_retries: 3,
    timeout: 30,
    verify_ssl: true,
    headers: {},
    user_agent: 'Football-Data-Processor/1.0',
    enable_conditional_requests: true,
    enable_resume: true,
    rate_limit_delay: 1.0,
  },
  file_watcher: {
    watch_path: 'source/',
    file_patterns: ['*.pdf'],
    debounce_time: 5.0,
    recursive: false,
    ignore_patterns: ['.*', '*~', '*.tmp'],
    enable_lock_detection: true,
    lock_check_interval: 1.0,
  },
  processing: {
    max_concurrent_jobs: 2,
    retry_attempts: 3,
    timeout: 300,
    queue_max_size: 100,
    job_persistence_enabled: true,
    job_persistence_path: 'data/jobs.db',
    enable_progress_tracking: true,
    cleanup_completed_jobs_after: 86400,
    priority_levels: 5,
  },
  caching: {
    enabled: true,
    redis_url: 'redis://localhost:6379/0',
    default_ttl: 3600,
    max_memory_cache_size: 1000,
    cache_strategies: {
      team_normalization: 86400,
      market_classification: 43200,
      processing_results: 3600,
      configuration: 1800,
    },
    enable_compression: true,
    connection_pool_size: 10,
  },
  notifications: {
    enabled: true,
    types: ['webhook'],
    email_config: {},
    webhook_config: {},
    slack_config: {},
    notification_levels: ['ERROR', 'CRITICAL'],
    rate_limit: 10,
  },
  monitoring: {
    enabled: true,
    health_check_interval: 30,
    metrics_collection_interval: 60,
    log_level: 'INFO',
    log_format: 'json',
    log_file: 'logs/automation.log',
    enable_structured_logging: true,
    metrics_retention_days: 30,
    alert_thresholds: {
      queue_length: 10,
      error_rate_percent: 5.0,
      memory_usage_percent: 80.0,
      processing_time_multiplier: 2.0,
      failed_downloads: 3,
    },
  },
  security: {
    enable_api_authentication: false,
    jwt_secret_key: 'default-dev-secret-change-in-production',
    jwt_expiration_hours: 24,
    api_rate_limit_per_minute: 100,
    allowed_file_types: ['.pdf'],
    max_file_size_mb: 100,
    enable_ip_whitelisting: false,
    allowed_ips: [],
    enable_cors: true,
    cors_origins: ['*'],
  },
  database: {
    url: 'sqlite:///data/automation.db',
    pool_size: 5,
    max_overflow: 10,
    pool_timeout: 30,
    pool_recycle: 3600,
    enable_migrations: true,
    backup_enabled: true,
    backup_interval_hours: 24,
    retention_days: 30,
  },
  environment: 'development',
  debug: false,
  config_hot_reload: true,
  data_directory: 'data/',
  temp_directory: 'temp/',
};

const mockBackups = [
  {
    id: '1',
    name: 'Production Backup',
    timestamp: '2023-01-01T00:00:00Z',
    config: mockConfig,
    description: 'Backup before production deployment',
  },
  {
    id: '2',
    name: 'Development Snapshot',
    timestamp: '2023-01-02T00:00:00Z',
    config: mockConfig,
    description: 'Development environment snapshot',
  },
];

describe('Enhanced Settings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.getConfig as jest.Mock).mockResolvedValue(mockConfig);
    (apiService.getConfigBackups as jest.Mock).mockResolvedValue(mockBackups);
  });

  describe('Configuration Loading and Display', () => {
    test('loads and displays configuration on mount', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3600')).toBeInTheDocument();
      expect(screen.getByDisplayValue('source/')).toBeInTheDocument();
    });

    test('displays loading state while fetching configuration', () => {
      (apiService.getConfig as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<Settings />);

      expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
    });

    test('displays error when configuration loading fails', async () => {
      (apiService.getConfig as jest.Mock).mockRejectedValue(
        new Error('Failed to load config')
      );

      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load configuration/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Validation', () => {
    test('validates configuration changes in real-time', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Clear the URL field to trigger validation error
      const urlField = screen.getByLabelText('Source URL');
      await userEvent.clear(urlField);

      await waitFor(() => {
        expect(screen.getByText(/URL is required/)).toBeInTheDocument();
      });
    });

    test('shows validation warnings for potentially problematic values', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Set check interval to a low value to trigger warning
      const intervalField = screen.getByLabelText('Check Interval (seconds)');
      await userEvent.clear(intervalField);
      await userEvent.type(intervalField, '30');

      await waitFor(() => {
        expect(screen.getByText(/Check interval should be at least 60 seconds/)).toBeInTheDocument();
      });
    });

    test('prevents saving when validation errors exist', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Clear required field to create validation error
      const urlField = screen.getByLabelText('Source URL');
      await userEvent.clear(urlField);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save Changes/ });
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Hot Reload Functionality', () => {
    test('applies hot reload when enabled and changes are made', async () => {
      jest.useFakeTimers();
      (apiService.updateConfig as jest.Mock).mockResolvedValue({ success: true });

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Make a change
      const intervalField = screen.getByLabelText('Check Interval (seconds)');
      await userEvent.clear(intervalField);
      await userEvent.type(intervalField, '7200');

      // Fast-forward time to trigger hot reload
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(apiService.updateConfig).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    test('shows hot reload status when enabled', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Make a change to trigger hot reload status
      const intervalField = screen.getByLabelText('Check Interval (seconds)');
      await userEvent.clear(intervalField);
      await userEvent.type(intervalField, '7200');

      await waitFor(() => {
        expect(screen.getByText(/Hot reload is enabled/)).toBeInTheDocument();
      });
    });

    test('allows disabling hot reload', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const hotReloadSwitch = screen.getByLabelText('Hot Reload');
      await userEvent.click(hotReloadSwitch);

      expect(hotReloadSwitch).not.toBeChecked();
    });
  });

  describe('Configuration Preview', () => {
    test('opens preview dialog when preview button is clicked', async () => {
      (apiService.previewConfig as jest.Mock).mockResolvedValue({
        preview: mockConfig,
        changes: [
          {
            type: 'modified',
            path: 'web_downloader.check_interval',
            old_value: 3600,
            new_value: 7200,
          },
        ],
      });

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Make a change
      const intervalField = screen.getByLabelText('Check Interval (seconds)');
      await userEvent.clear(intervalField);
      await userEvent.type(intervalField, '7200');

      const previewButton = screen.getByRole('button', { name: /Preview Changes/ });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Configuration Preview')).toBeInTheDocument();
      });
    });

    test('displays configuration in JSON format in preview', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Make a change
      const intervalField = screen.getByLabelText('Check Interval (seconds)');
      await userEvent.clear(intervalField);
      await userEvent.type(intervalField, '7200');

      const previewButton = screen.getByRole('button', { name: /Preview Changes/ });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/"web_downloader"/)).toBeInTheDocument();
      });
    });
  });

  describe('Backup and Restore', () => {
    test('opens backup creation dialog', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const backupButton = screen.getByRole('button', { name: /Create Backup/ });
      await userEvent.click(backupButton);

      expect(screen.getByText('Create Configuration Backup')).toBeInTheDocument();
      expect(screen.getByLabelText('Backup Name')).toBeInTheDocument();
    });

    test('creates backup with name and description', async () => {
      (apiService.createConfigBackup as jest.Mock).mockResolvedValue({
        success: true,
        backup_id: 'new-backup-id',
      });

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const backupButton = screen.getByRole('button', { name: /Create Backup/ });
      await userEvent.click(backupButton);

      const nameField = screen.getByLabelText('Backup Name');
      await userEvent.type(nameField, 'Test Backup');

      const descriptionField = screen.getByLabelText('Description (optional)');
      await userEvent.type(descriptionField, 'Test backup description');

      const createButton = screen.getByRole('button', { name: /Create Backup/ });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Backup "Test Backup" created successfully/)).toBeInTheDocument();
      });
    });

    test('opens restore dialog and displays available backups', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const restoreButton = screen.getByRole('button', { name: /Restore/ });
      await userEvent.click(restoreButton);

      expect(screen.getByText('Restore Configuration')).toBeInTheDocument();
      expect(screen.getByText('Production Backup')).toBeInTheDocument();
      expect(screen.getByText('Development Snapshot')).toBeInTheDocument();
    });

    test('restores configuration from backup', async () => {
      (apiService.restoreConfigBackup as jest.Mock).mockResolvedValue({
        success: true,
      });

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const restoreButton = screen.getByRole('button', { name: /Restore/ });
      await userEvent.click(restoreButton);

      const restoreBackupButtons = screen.getAllByText('Restore');
      await userEvent.click(restoreBackupButtons[1]); // Click first backup's restore button

      await waitFor(() => {
        expect(screen.getByText(/Configuration restored from backup/)).toBeInTheDocument();
      });
    });
  });

  describe('Import and Export', () => {
    test('exports configuration when export button is clicked', async () => {
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      const mockLink = {
        click: jest.fn(),
        setAttribute: jest.fn(),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const exportButton = screen.getByRole('button', { name: /Export/ });
      await userEvent.click(exportButton);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('config-export'));
    });

    test('imports configuration from file', async () => {
      (apiService.importConfig as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Configuration imported successfully',
      });

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const file = new File([JSON.stringify(mockConfig)], 'config.json', {
        type: 'application/json',
      });

      const importInput = screen.getByLabelText(/Import/);
      await userEvent.upload(importInput, file);

      await waitFor(() => {
        expect(screen.getByText('Configuration imported successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Sensitive Field Visibility', () => {
    test('toggles sensitive field visibility', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Initially, sensitive fields should be hidden (password type)
      const jwtSecretField = screen.getByLabelText('JWT Secret Key');
      expect(jwtSecretField).toHaveAttribute('type', 'password');

      // Click visibility toggle
      const visibilityToggle = screen.getByLabelText(/Show sensitive fields/);
      await userEvent.click(visibilityToggle);

      // Now sensitive fields should be visible (text type)
      expect(jwtSecretField).toHaveAttribute('type', 'text');
    });
  });

  describe('Configuration Sections', () => {
    test('displays all configuration sections', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      expect(screen.getByText('Web Downloader')).toBeInTheDocument();
      expect(screen.getByText('File Watcher')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Caching')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Monitoring')).toBeInTheDocument();
    });

    test('allows editing configuration values', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const urlField = screen.getByLabelText('Source URL');
      await userEvent.clear(urlField);
      await userEvent.type(urlField, 'https://new-url.com');

      expect(urlField).toHaveValue('https://new-url.com');
    });

    test('handles boolean configuration values', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const sslSwitch = screen.getByLabelText('Verify SSL Certificates');
      expect(sslSwitch).toBeChecked();

      await userEvent.click(sslSwitch);
      expect(sslSwitch).not.toBeChecked();
    });
  });

  describe('Error Handling', () => {
    test('displays error when save fails', async () => {
      (apiService.updateConfig as jest.Mock).mockRejectedValue(
        new Error('Save failed')
      );

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Make a change
      const intervalField = screen.getByLabelText('Check Interval (seconds)');
      await userEvent.clear(intervalField);
      await userEvent.type(intervalField, '7200');

      const saveButton = screen.getByRole('button', { name: /Save Changes/ });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Save failed/)).toBeInTheDocument();
      });
    });

    test('displays error when reload fails', async () => {
      (apiService.reloadConfig as jest.Mock).mockRejectedValue(
        new Error('Reload failed')
      );

      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      const reloadButton = screen.getByRole('button', { name: /Reload Config/ });
      await userEvent.click(reloadButton);

      await waitFor(() => {
        expect(screen.getByText(/Reload failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Configuration Reset', () => {
    test('resets changes to original configuration', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(apiService.getConfig).toHaveBeenCalled();
      });

      // Make a change
      const intervalField = screen.getByLabelText('Check Interval (seconds)');
      await userEvent.clear(intervalField);
      await userEvent.type(intervalField, '7200');

      expect(intervalField).toHaveValue('7200');

      // Reset changes
      const resetButton = screen.getByRole('button', { name: /Reset Changes/ });
      await userEvent.click(resetButton);

      expect(intervalField).toHaveValue('3600');
    });
  });
});