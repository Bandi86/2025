import '@testing-library/jest-dom';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'line-chart' }, JSON.stringify(props.data));
  },
  Bar: (props: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'bar-chart' }, JSON.stringify(props.data));
  },
  Doughnut: (props: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'doughnut-chart' }, JSON.stringify(props.data));
  },
}));

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: any) => ({
    getRootProps: () => ({
      'data-testid': 'dropzone',
      onClick: () => onDrop([new File(['test'], 'test.pdf', { type: 'application/pdf' })]),
    }),
    getInputProps: () => ({ 'data-testid': 'dropzone-input' }),
    isDragActive: false,
  }),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
  },
  writable: true,
});