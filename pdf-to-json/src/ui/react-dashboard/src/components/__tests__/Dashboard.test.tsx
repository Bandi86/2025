import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';

// Mock the services
jest.mock('../../services/api');
jest.mock('../../services/websocket');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;

describe('Dashboard Component', () => {
  const mockProcessingJobs = [
    {
      id: '1',
      file_name: 'test.pdf',
      status: 'processing' as const,
      progress: 50,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      file_name: 'test2.pdf',
      status: 'completed' as const,
      progress: 100,
      created_at: '2023-01-01T01:00:00Z',
    },
  ];

  const mockMetrics = {
    processing_queue_length: 5,
    active_jobs: 2,
    cache_hit_ratio: 0.85,
    memory_usage: 65,
    cpu_usage: 45,
    disk_usage: 30,
    error_rate: 0.02,
    average_processing_time: 120,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API service mocks
    mockApiService.getQueue.mockResolvedValue(mockProcessingJobs);
    mockApiService.getMetrics.mockResolvedValue(mockMetrics);

    // Setup WebSocket service mocks
    mockWebsocketService.connect = jest.fn();
    mockWebsocketService.disconnect = jest.fn();
    mockWebsocketService.on = jest.fn();
    mockWebsocketService.off = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('displays system metrics cards', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Queue Length')).toBeInTheDocument();
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByText('Cache Hit Ratio')).toBeInTheDocument();
      expect(screen.getByText('Error Rate')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Queue length
      expect(screen.getByText('2')).toBeInTheDocument(); // Active jobs
      expect(screen.getByText('85.0%')).toBeInTheDocument(); // Cache hit ratio
      expect(screen.getByText('2.0%')).toBeInTheDocument(); // Error rate
    });
  });

  test('displays processing jobs list', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Processing Queue')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });

    // Check status chips
    expect(screen.getByText('processing')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  test('displays charts', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Processing Time Trend')).toBeInTheDocument();
    });

    // Check if chart components are rendered
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('shows connection status', () => {
    render(<Dashboard />);
    
    // Initially should show disconnected
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  test('handles WebSocket connection events', () => {
    render(<Dashboard />);

    // Verify WebSocket service methods are called
    expect(mockWebsocketService.connect).toHaveBeenCalled();
    expect(mockWebsocketService.on).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(mockWebsocketService.on).toHaveBeenCalledWith('processing_event', expect.any(Function));
    expect(mockWebsocketService.on).toHaveBeenCalledWith('system_status', expect.any(Function));
  });

  test('handles API errors gracefully', async () => {
    mockApiService.getQueue.mockRejectedValue(new Error('API Error'));
    mockApiService.getMetrics.mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);

    // Should still render the dashboard structure
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Processing Queue')).toBeInTheDocument();
  });

  test('updates data periodically', async () => {
    jest.useFakeTimers();
    
    render(<Dashboard />);

    // Fast-forward time to trigger periodic refresh
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockApiService.getQueue).toHaveBeenCalledTimes(2); // Initial + periodic
      expect(mockApiService.getMetrics).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  test('cleans up WebSocket listeners on unmount', () => {
    const { unmount } = render(<Dashboard />);
    
    unmount();

    expect(mockWebsocketService.off).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(mockWebsocketService.off).toHaveBeenCalledWith('processing_event', expect.any(Function));
    expect(mockWebsocketService.off).toHaveBeenCalledWith('system_status', expect.any(Function));
    expect(mockWebsocketService.disconnect).toHaveBeenCalled();
  });

  test('displays empty state when no jobs', async () => {
    mockApiService.getQueue.mockResolvedValue([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No jobs in queue')).toBeInTheDocument();
    });
  });

  test('displays empty state when no recent events', () => {
    render(<Dashboard />);

    expect(screen.getByText('Recent Events')).toBeInTheDocument();
    expect(screen.getByText('No recent events')).toBeInTheDocument();
  });
});