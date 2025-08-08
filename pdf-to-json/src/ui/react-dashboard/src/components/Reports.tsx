import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

import { apiService, ReportData, GameData } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TrendData {
  dates: string[];
  game_counts: number[];
  league_distribution: { [key: string]: number };
  market_coverage: { [key: string]: number };
  processing_times: number[];
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [games, setGames] = useState<GameData[]>([]);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState('30');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadReportsData();
  }, []);

  useEffect(() => {
    if (selectedDateRange) {
      loadTrendData(parseInt(selectedDateRange));
    }
  }, [selectedDateRange]);

  useEffect(() => {
    if (selectedDate) {
      loadGamesData(selectedDate);
    } else {
      loadGamesData();
    }
  }, [selectedDate]);

  const loadReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportsData = await apiService.getReports();
      setReports(reportsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async (days: number) => {
    try {
      const data = await apiService.getTrendReport(days);
      setTrendData(data);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    }
  };

  const loadGamesData = async (date?: string) => {
    try {
      const data = await apiService.getGames(date);
      setGames(data);
    } catch (err) {
      console.error('Failed to load games data:', err);
    }
  };

  const handleDownloadReport = async (report: ReportData) => {
    try {
      const response = await fetch(`/api/v1/reports/download/${report.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'primary';
      case 'anomaly':
        return 'warning';
      case 'summary':
        return 'success';
      default:
        return 'default';
    }
  };

  // Chart data preparation
  const gameCountChartData = {
    labels: trendData?.dates || [],
    datasets: [
      {
        label: 'Games Processed',
        data: trendData?.game_counts || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const leagueDistributionData = {
    labels: Object.keys(trendData?.league_distribution || {}),
    datasets: [
      {
        label: 'Games by League',
        data: Object.values(trendData?.league_distribution || {}),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  };

  const processingTimeData = {
    labels: trendData?.dates || [],
    datasets: [
      {
        label: 'Processing Time (seconds)',
        data: trendData?.processing_times || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={selectedDateRange}
                label="Date Range"
                onChange={(e) => setSelectedDateRange(e.target.value)}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Specific Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadReportsData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Games Processed Over Time
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={gameCountChartData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              League Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={leagueDistributionData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Processing Time Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={processingTimeData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Reports List */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Available Reports
        </Typography>
        <Grid container spacing={2}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ReportIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {report.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={report.type}
                    color={getReportTypeColor(report.type) as any}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(report.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadReport(report)}
                  >
                    Download
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {reports.length === 0 && !loading && (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No reports available
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Games Data Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Games Data {selectedDate && `for ${selectedDate}`}
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>League</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Home Team</TableCell>
                <TableCell>Away Team</TableCell>
                <TableCell>Markets</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.slice(0, 50).map((game, index) => (
                <TableRow key={index}>
                  <TableCell>{game.league}</TableCell>
                  <TableCell>{game.date}</TableCell>
                  <TableCell>{game.time}</TableCell>
                  <TableCell>{game.home_team}</TableCell>
                  <TableCell>{game.away_team}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${1 + game.additional_markets.length} markets`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {games.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No games data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {games.length > 50 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Showing first 50 of {games.length} games
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;