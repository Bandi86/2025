import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

import { websocketService, ProcessingEvent, SystemStatus } from '../services/websocket';
import { apiService, ProcessingJob, SystemMetrics } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [recentEvents, setRecentEvents] = useState<ProcessingEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    websocketService.connect();

    // Set up event listeners
    const handleConnection = (data: { connected: boolean }) => {
      setIsConnected(data.connected);
    };

    const handleProcessingEvent = (event: ProcessingEvent) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    };

    const handleSystemStatus = (status: SystemStatus) => {
      setSystemStatus(status);
    };

    websocketService.on('connection', handleConnection);
    websocketService.on('processing_event', handleProcessingEvent);
    websocketService.on('system_status', handleSystemStatus);

    // Load initial data
    loadInitialData();

    // Set up periodic data refresh
    const interval = setInterval(loadInitialData, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
      websocketService.off('connection', handleConnection);
      websocketService.off('processing_event', handleProcessingEvent);
      websocketService.off('system_status', handleSystemStatus);
      websocketService.disconnect();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [jobs, metricsData] = await Promise.all([
        apiService.getQueue(),
        apiService.getMetrics(),
      ]);
      setProcessingJobs(jobs);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const systemUsageData = {
    labels: ['Used', 'Available'],
    datasets: [
      {
        data: [
          metrics?.memory_usage || 0,
          100 - (metrics?.memory_usage || 0),
        ],
        backgroundColor: ['#ff6384', '#36a2eb'],
        hoverBackgroundColor: ['#ff6384', '#36a2eb'],
      },
    ],
  };

  const processingTimeData = {
    labels: ['Last 10 Jobs'],
    datasets: [
      {
        label: 'Processing Time (seconds)',
        data: [12, 19, 3, 5, 2, 3, 9, 15, 8, 11], // Mock data
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Connection Status */}
      <Box mb={2}>
        <Chip
          label={isConnected ? 'Connected' : 'Disconnected'}
          color={isConnected ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* System Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Queue Length
              </Typography>
              <Typography variant="h4">
                {systemStatus?.processing_queue_length || metrics?.processing_queue_length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Jobs
              </Typography>
              <Typography variant="h4">
                {systemStatus?.active_jobs || metrics?.active_jobs || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cache Hit Ratio
              </Typography>
              <Typography variant="h4">
                {((systemStatus?.cache_hit_ratio || metrics?.cache_hit_ratio || 0) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Error Rate
              </Typography>
              <Typography variant="h4">
                {((systemStatus?.error_rate || metrics?.error_rate || 0) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Usage Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Memory Usage
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Doughnut data={systemUsageData} />
            </Box>
          </Paper>
        </Grid>

        {/* Processing Time Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Processing Time Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={processingTimeData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>

        {/* Processing Jobs */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Processing Queue
            </Typography>
            <List>
              {processingJobs.slice(0, 5).map((job) => (
                <ListItem key={job.id}>
                  <ListItemText
                    primary={job.file_name}
                    secondary={
                      <Box>
                        <Chip
                          label={job.status}
                          color={getStatusColor(job.status) as any}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {job.status === 'processing' && (
                          <LinearProgress
                            variant="determinate"
                            value={job.progress}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {processingJobs.length === 0 && (
                <ListItem>
                  <ListItemText primary="No jobs in queue" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Events */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Events
            </Typography>
            <List>
              {recentEvents.map((event, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={event.type.replace('_', ' ').toUpperCase()}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {JSON.stringify(event.data)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {recentEvents.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent events" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;