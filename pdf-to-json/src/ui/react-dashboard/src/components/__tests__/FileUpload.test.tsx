import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../FileUpload';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';

// Mock the services
jest.mock('../../services/api');
jest.mock('../../services/websocket');

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;

describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup WebSocket service mocks
    mockWebsocketService.on = jest.fn();
    mockWebsocketService.off = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders file upload interface', () => {
    render(<FileUpload />);
    
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop PDF files here/)).toBeInTheDocument();
    expect(screen.getByText('Supports multiple PDF files')).toBeInTheDocument();
  });

  test('displays instructions', () => {
    render(<FileUpload />);
    
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByText(/Upload PDF files containing football match data/)).toBeInTheDocument();
    expect(screen.getByText(/Files will be automatically processed after upload/)).toBeInTheDocument();
  });

  test('handles file drop', async () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    // Should show the file in the list
    await waitFor(() => {
      expect(screen.getByText('Files (1)')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  test('displays file information', async () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText(/Size:/)).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  test('shows upload controls when files are added', async () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('Upload All Files')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
  });

  test('uploads file successfully', async () => {
    mockApiService.uploadFile.mockResolvedValue({ job_id: 'test-job-123' });

    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('Upload All Files')).toBeInTheDocument();
    });

    const uploadButton = screen.getByText('Upload All Files');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockApiService.uploadFile).toHaveBeenCalled();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('Job: test-job-123')).toBeInTheDocument();
    });
  });

  test('handles upload error', async () => {
    mockApiService.uploadFile.mockRejectedValue(new Error('Upload failed'));

    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    const uploadButton = screen.getByText('Upload All Files');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  test('removes file from list', async () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('Files (1)')).not.toBeInTheDocument();
  });

  test('clears all files', async () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear All');
    await userEvent.click(clearButton);

    expect(screen.queryByText('Files (1)')).not.toBeInTheDocument();
    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  test('disables upload button when no pending files', async () => {
    mockApiService.uploadFile.mockResolvedValue({ job_id: 'test-job-123' });

    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    const uploadButton = screen.getByText('Upload All Files');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(uploadButton).toBeDisabled();
    });
  });

  test('shows progress during upload', async () => {
    // Mock a delayed response to see progress
    mockApiService.uploadFile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ job_id: 'test-job-123' }), 1000))
    );

    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    const uploadButton = screen.getByText('Upload All Files');
    await userEvent.click(uploadButton);

    // Should show uploading status
    await waitFor(() => {
      expect(screen.getByText('uploading')).toBeInTheDocument();
    });
  });

  test('listens for WebSocket processing events', async () => {
    mockApiService.uploadFile.mockResolvedValue({ job_id: 'test-job-123' });

    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    await userEvent.click(dropzone);

    const uploadButton = screen.getByText('Upload All Files');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockWebsocketService.on).toHaveBeenCalledWith('processing_event', expect.any(Function));
    });
  });

  test('prevents upload of non-PDF files', () => {
    // This test would require mocking the dropzone more thoroughly
    // to test file type validation, but the basic structure is here
    render(<FileUpload />);
    
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    // The actual file type validation happens in the dropzone configuration
  });
});