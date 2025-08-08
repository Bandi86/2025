import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from '../Reports';
import { apiService } from '../../services/api';

// Mock the services
jest.mock('../../services/api');

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('Reports Component', () => {
  const mockReports = [
    {
      id: '1',
      name: 'Daily Report 2023-01-01',
      created_at: '2023-01-01T00:00:00Z',
      file_path: '/reports/daily-2023-01-01.json',
      type: 'summary' as const,
    },
    {
      id: '2',
      name: 'Trend Analysis',
      created_at: '2023-01-01T12:00:00Z',
      file_path: '/reports/trend-analysis.json',
      type: 'trend' as const,
    },
  ];

  const mockGames = [
    {
      league: 'Premier League',
      date: '2023-01-01',
      iso_date: '2023-01-01',
      time: '15:00',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      original_home_team: 'Arsenal FC',
      original_away_team: 'Chelsea FC',
      main_market: { type: '1X2', odds: [2.1, 3.2, 3.8] },
      additional_markets: [
        { type: 'Over/Under', odds: [1.9, 1.9] },
      ],
    },
  ];

  const mockTrendData = {
    dates: ['2023-01-01', '2023-01-02', '2023-01-03'],
    game_counts: [10, 15, 12],
    league_distribution: { 'Premier League': 20, 'La Liga': 15 },
    market_coverage: { '1X2': 35, 'Over/Under': 30 },
    processing_times: [120, 110, 130],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API service mocks
    mockApiService.getReports.mockResolvedValue(mockReports);
    mockApiService.getGames.mockResolvedValue(mockGames);
    mockApiService.getTrendReport.mockResolvedValue(mockTrendData);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders reports title', () => {
    render(<Reports />);
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
  });

  test('displays control filters', () => {
    render(<Reports />);
    
    expect(screen.getByLabelText('Date Range')).toBeInTheDocument();
    expect(screen.getByLabelText('Specific Date')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  test('loads and displays reports', async () => {
    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Available Reports')).toBeInTheDocument();
      expect(screen.getByText('Daily Report 2023-01-01')).toBeInTheDocument();
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    });

    // Check report type chips
    expect(screen.getByText('summary')).toBeInTheDocument();
    expect(screen.getByText('trend')).toBeInTheDocument();
  });

  test('displays charts with trend data', async () => {
    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Games Processed Over Time')).toBeInTheDocument();
      expect(screen.getByText('League Distribution')).toBeInTheDocument();
      expect(screen.getByText('Processing Time Trend')).toBeInTheDocument();
    });

    // Check if chart components are rendered
    expect(screen.getAllByTestId('line-chart')).toHaveLength(2);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('displays games data table', async () => {
    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Games Data')).toBeInTheDocument();
      expect(screen.getByText('Arsenal')).toBeInTheDocument();
      expect(screen.getByText('Chelsea')).toBeInTheDocument();
      expect(screen.getByText('Premier League')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('League')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Home Team')).toBeInTheDocument();
    expect(screen.getByText('Away Team')).toBeInTheDocument();
    expect(screen.getByText('Markets')).toBeInTheDocument();
  });

  test('handles date range selection', async () => {
    render(<Reports />);

    const dateRangeSelect = screen.getByLabelText('Date Range');
    await userEvent.click(dateRangeSelect);
    
    const option7Days = screen.getByText('Last 7 days');
    await userEvent.click(option7Days);

    await waitFor(() => {
      expect(mockApiService.getTrendReport).toHaveBeenCalledWith(7);
    });
  });

  test('handles specific date selection', async () => {
    const user = userEvent.setup();
    render(<Reports />);

    const dateInput = screen.getByLabelText('Specific Date');
    await user.type(dateInput, '2023-01-01');

    await waitFor(() => {
      expect(mockApiService.getGames).toHaveBeenCalledWith('2023-01-01');
    });
  });

  test('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<Reports />);

    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockApiService.getReports).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  test('handles report download', async () => {
    const user = userEvent.setup();
    
    // Mock fetch for download
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test data'])),
    });

    // Mock DOM methods
    const mockCreateElement = jest.spyOn(document, 'createElement');
    const mockAppendChild = jest.spyOn(document.body, 'appendChild');
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild');
    const mockClick = jest.fn();

    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    } as any);

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Daily Report 2023-01-01')).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByText('Download');
    await user.click(downloadButtons[0]);

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/reports/download/1');
    expect(mockClick).toHaveBeenCalled();

    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  test('displays loading state', () => {
    mockApiService.getReports.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<Reports />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles API errors', async () => {
    mockApiService.getReports.mockRejectedValue(new Error('API Error'));

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('displays empty state when no reports', async () => {
    mockApiService.getReports.mockResolvedValue([]);

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('No reports available')).toBeInTheDocument();
    });
  });

  test('displays empty state when no games', async () => {
    mockApiService.getGames.mockResolvedValue([]);

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('No games data available')).toBeInTheDocument();
    });
  });

  test('limits games display to 50 items', async () => {
    const manyGames = Array.from({ length: 100 }, (_, i) => ({
      ...mockGames[0],
      home_team: `Team ${i}`,
      away_team: `Team ${i + 100}`,
    }));

    mockApiService.getGames.mockResolvedValue(manyGames);

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText('Showing first 50 of 100 games')).toBeInTheDocument();
    });
  });

  test('updates trend data when date range changes', async () => {
    const user = userEvent.setup();
    render(<Reports />);

    // Change to 90 days
    const dateRangeSelect = screen.getByLabelText('Date Range');
    await user.click(dateRangeSelect);
    
    const option90Days = screen.getByText('Last 90 days');
    await user.click(option90Days);

    await waitFor(() => {
      expect(mockApiService.getTrendReport).toHaveBeenCalledWith(90);
    });
  });
});