import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import { apiService } from '../../services/api';

// Mock the services
jest.mock('../../services/api');

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('Settings Component', () => {
  const mockConfig = {
    web_downloader: {
      url: 'https://example.com/data',
      check_interval: 3600,
      download_path: 'source/',
      max_retries: 3,
      timeout: 30,
      verify_ssl: true,
    },
    file_watcher: {
      watch_path: 'source/',
      file_patterns: ['*.pdf'],
      debounce_time: 5,
    },
    processing: {
      max_concurrent_jobs: 2,
      retry_attempts: 3,
      timeout: 300,
    },
    monitoring: {
      enable_metrics: true,
      log_level: 'INFO',
      health_check_interval: 30,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API service mocks
    mockApiService.getConfig.mockResolvedValue(mockConfig);
    mockApiService.updateConfig.mockResolvedValue({ success: true });
    mockApiService.reloadConfig.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders settings title', () => {
    render(<Settings />);
    expect(screen.getByText('System Configuration')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    mockApiService.getConfig.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<Settings />);
    
    expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
  });

  test('loads and displays configuration sections', async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Web Downloader')).toBeInTheDocument();
      expect(screen.getByText('File Watcher')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Monitoring')).toBeInTheDocument();
    });
  });

  test('displays configuration values', async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3600')).toBeInTheDocument();
      expect(screen.getByDisplayValue('source/')).toBeInTheDocument();
    });
  });

  test('shows action buttons', async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Reload Config')).toBeInTheDocument();
      expect(screen.getByText('Reset Changes')).toBeInTheDocument();
    });
  });

  test('disables save button when no changes', async () => {
    render(<Settings />);

    await waitFor(() => {
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });
  });

  test('enables save button when changes are made', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
    });

    const urlInput = screen.getByDisplayValue('https://example.com/data');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://newurl.com/data');

    await waitFor(() => {
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
  });

  test('saves configuration changes', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
    });

    const urlInput = screen.getByDisplayValue('https://example.com/data');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://newurl.com/data');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockApiService.updateConfig).toHaveBeenCalledWith({
        ...mockConfig,
        web_downloader: {
          ...mockConfig.web_downloader,
          url: 'https://newurl.com/data',
        },
      });
      expect(screen.getByText('Configuration saved successfully')).toBeInTheDocument();
    });
  });

  test('reloads configuration', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Reload Config')).toBeInTheDocument();
    });

    const reloadButton = screen.getByText('Reload Config');
    await user.click(reloadButton);

    await waitFor(() => {
      expect(mockApiService.reloadConfig).toHaveBeenCalled();
      expect(screen.getByText('Configuration reloaded successfully')).toBeInTheDocument();
    });
  });

  test('resets changes', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
    });

    // Make a change
    const urlInput = screen.getByDisplayValue('https://example.com/data');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://newurl.com/data');

    // Reset changes
    const resetButton = screen.getByText('Reset Changes');
    await user.click(resetButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
      expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });
  });

  test('handles numeric input changes', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('3600')).toBeInTheDocument();
    });

    const intervalInput = screen.getByDisplayValue('3600');
    await user.clear(intervalInput);
    await user.type(intervalInput, '7200');

    await waitFor(() => {
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
  });

  test('handles switch toggle changes', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByLabelText('Verify SSL Certificates')).toBeInTheDocument();
    });

    const sslSwitch = screen.getByLabelText('Verify SSL Certificates');
    await user.click(sslSwitch);

    await waitFor(() => {
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
  });

  test('handles select dropdown changes', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByLabelText('Log Level')).toBeInTheDocument();
    });

    const logLevelSelect = screen.getByLabelText('Log Level');
    await user.click(logLevelSelect);
    
    const debugOption = screen.getByText('DEBUG');
    await user.click(debugOption);

    await waitFor(() => {
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
  });

  test('handles array input changes (file patterns)', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('*.pdf')).toBeInTheDocument();
    });

    const patternsInput = screen.getByDisplayValue('*.pdf');
    await user.clear(patternsInput);
    await user.type(patternsInput, '*.pdf, *.txt');

    await waitFor(() => {
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
  });

  test('expands and collapses accordion sections', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('File Watcher')).toBeInTheDocument();
    });

    // File Watcher section should be collapsed initially
    expect(screen.queryByLabelText('Watch Path')).not.toBeInTheDocument();

    // Click to expand
    const fileWatcherHeader = screen.getByText('File Watcher');
    await user.click(fileWatcherHeader);

    await waitFor(() => {
      expect(screen.getByLabelText('Watch Path')).toBeInTheDocument();
    });
  });

  test('handles API errors during save', async () => {
    const user = userEvent.setup();
    mockApiService.updateConfig.mockRejectedValue(new Error('Save failed'));

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
    });

    const urlInput = screen.getByDisplayValue('https://example.com/data');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://newurl.com/data');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save configuration')).toBeInTheDocument();
    });
  });

  test('handles API errors during load', async () => {
    mockApiService.getConfig.mockRejectedValue(new Error('Load failed'));

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load configuration')).toBeInTheDocument();
    });
  });

  test('shows saving state during save operation', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockApiService.updateConfig.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    );

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/data')).toBeInTheDocument();
    });

    const urlInput = screen.getByDisplayValue('https://example.com/data');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://newurl.com/data');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    // Should show saving state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});