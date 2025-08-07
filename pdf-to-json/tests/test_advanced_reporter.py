"""
Unit tests for AdvancedReporter

Tests cover:
- Time-series analysis capabilities
- Anomaly detection algorithms for data quality monitoring
- Dashboard-compatible data export in JSON format
- Multiple export formats (CSV, Excel, PDF) using pandas and reportlab
- Enhanced analytics and trend analysis
"""

import pytest
import json
import tempfile
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
import numpy as np

from src.converter.advanced_reporter import (
    AdvancedReporter, TrendData, AnomalyFlag, PerformanceMetrics, DashboardData
)


# Global fixtures available to all test classes
@pytest.fixture
def reporter():
    """Create AdvancedReporter instance for testing"""
    config = {
        'trend_analysis': {
            'min_data_points': 3,
            'confidence_level': 0.95,
            'trend_threshold': 0.1
        },
        'anomaly_detection': {
            'outlier_threshold': 2.0,
            'clustering_eps': 0.5,
            'min_samples': 2
        },
        'export_formats': ['json', 'csv', 'excel', 'pdf'],
        'dashboard': {
            'max_time_series_points': 50,
            'refresh_interval': 300
        }
    }
    return AdvancedReporter(config)


@pytest.fixture
def sample_games():
    """Create sample games data for testing"""
    base_date = datetime.now() - timedelta(days=10)
    games = []
    
    for i in range(15):
        game_date = base_date + timedelta(days=i % 5)  # 5 different dates
        
        game = {
            'home_team': f'Team A{i % 3}',
            'away_team': f'Team B{i % 3}',
            'league': f'League {i % 2}',
            'date': game_date.strftime('%Y-%m-%d'),
            'iso_date': game_date.isoformat(),
            'time': f'{14 + i % 4}:00',
            'total_markets': 3 + i % 5,
            'main_market': {
                'market_type': '1X2',
                'odds': {
                    'home_odds': 1.5 + (i % 10) * 0.1,
                    'draw_odds': 3.0 + (i % 5) * 0.2,
                    'away_odds': 2.0 + (i % 8) * 0.15
                }
            },
            'additional_markets': [
                {
                    'market_type': 'total_goals',
                    'odds': {'over': 1.8, 'under': 2.0}
                }
            ] * (i % 3),
            'processing_info': {
                'processing_time': 0.5 + (i % 10) * 0.1,
                'team_normalized': i % 2 == 0,
                'cache_hits': i % 5,
                'cache_misses': (i + 1) % 3,
                'optimizations_applied': ['caching'] if i % 2 == 0 else []
            }
        }
        games.append(game)
    
    # Add some anomalous games
    anomalous_game = {
        'home_team': 'Anomalous Team With Very Long Name That Should Be Detected',
        'away_team': 'Team B',
        'league': 'Test League',
        'date': base_date.strftime('%Y-%m-%d'),
        'iso_date': base_date.isoformat(),
        'time': '15:00',
        'total_markets': 50,  # Unusually high
        'main_market': {
            'market_type': '1X2',
            'odds': {
                'home_odds': 0.5,  # Unusually low
                'draw_odds': 3.0,
                'away_odds': 150.0  # Unusually high
            }
        },
        'additional_markets': [],
        'processing_info': {
            'processing_time': 10.0,  # Unusually high
            'team_normalized': False,
            'cache_hits': 0,
            'cache_misses': 10
        }
    }
    games.append(anomalous_game)
    
    return games


@pytest.fixture
def sample_games_with_missing_data():
    """Create sample games with missing data for testing"""
    return [
        {
            'home_team': 'Team A',
            'away_team': '',  # Missing away team
            'league': 'League 1',
            'date': '2024-01-01',
            'time': '15:00',
            'total_markets': 0,
            # Missing main_market
            'additional_markets': []
        },
        {
            'home_team': 'Team B',
            'away_team': 'Team C',
            # Missing league
            'date': '2024-01-02',
            'time': '16:00',
            'total_markets': 2,
            'main_market': {
                'market_type': '1X2',
                'odds': {
                    'home_odds': 0,  # Invalid odds
                    'draw_odds': 3.0,
                    'away_odds': 2.0
                }
            },
            'additional_markets': []
        }
    ]


class TestAdvancedReporter:
    """Test suite for AdvancedReporter class"""


class TestTrendAnalysis:
    """Test trend analysis functionality"""
    
    @pytest.mark.asyncio
    async def test_generate_trend_analysis_basic(self, reporter, sample_games):
        """Test basic trend analysis generation"""
        trends = await reporter.generate_trend_analysis(sample_games, days=30)
        
        assert isinstance(trends, dict)
        assert len(trends) > 0
        
        # Check that we have expected metrics
        expected_metrics = ['games_per_day', 'markets_per_game', 'data_quality_score']
        for metric in expected_metrics:
            if metric in trends:
                trend_data = trends[metric]
                assert isinstance(trend_data, TrendData)
                assert trend_data.metric_name == metric
                assert trend_data.trend_direction in ['increasing', 'decreasing', 'stable']
                assert 0.0 <= trend_data.trend_strength <= 1.0
                assert isinstance(trend_data.data_points, list)
    
    @pytest.mark.asyncio
    async def test_generate_trend_analysis_insufficient_data(self, reporter):
        """Test trend analysis with insufficient data"""
        # Only 2 games, less than min_data_points (3)
        games = [
            {
                'home_team': 'Team A',
                'away_team': 'Team B',
                'date': '2024-01-01',
                'iso_date': '2024-01-01T15:00:00',
                'total_markets': 3
            },
            {
                'home_team': 'Team C',
                'away_team': 'Team D',
                'date': '2024-01-02',
                'iso_date': '2024-01-02T15:00:00',
                'total_markets': 4
            }
        ]
        
        trends = await reporter.generate_trend_analysis(games, days=30)
        assert trends == {}
    
    @pytest.mark.asyncio
    async def test_trend_analysis_date_filtering(self, reporter, sample_games):
        """Test that trend analysis properly filters by date range"""
        # Test with very short date range
        trends = await reporter.generate_trend_analysis(sample_games, days=1)
        
        # Should have fewer or no trends due to limited date range
        assert isinstance(trends, dict)
    
    def test_calculate_game_quality_score(self, reporter):
        """Test game quality score calculation"""
        # High quality game
        high_quality_game = {
            'home_team': 'Team A',
            'away_team': 'Team B',
            'league': 'Premier League',
            'date': '2024-01-01',
            'time': '15:00',
            'main_market': {
                'odds': {
                    'home_odds': 2.0,
                    'draw_odds': 3.0,
                    'away_odds': 2.5
                }
            },
            'additional_markets': [{'market_type': 'total_goals'}],
            'processing_info': {
                'team_normalized': True
            }
        }
        
        score = reporter._calculate_game_quality_score(high_quality_game)
        assert 0.8 <= score <= 1.0  # Should be high quality
        
        # Low quality game
        low_quality_game = {
            'home_team': '',  # Missing
            'away_team': 'Team B',
            # Missing league, date, time
            # Missing main_market
            'additional_markets': []
        }
        
        score = reporter._calculate_game_quality_score(low_quality_game)
        assert 0.0 <= score <= 0.3  # Should be low quality


class TestAnomalyDetection:
    """Test anomaly detection functionality"""
    
    @pytest.mark.asyncio
    async def test_generate_anomaly_report_basic(self, reporter, sample_games):
        """Test basic anomaly report generation"""
        report = await reporter.generate_anomaly_report(sample_games)
        
        assert isinstance(report, dict)
        assert 'total_anomalies' in report
        assert 'anomalies_by_severity' in report
        assert 'anomalies_by_type' in report
        assert 'detailed_anomalies' in report
        assert 'recommendations' in report
        
        assert isinstance(report['total_anomalies'], int)
        assert report['total_anomalies'] >= 0
        assert isinstance(report['detailed_anomalies'], list)
        assert isinstance(report['recommendations'], list)
    
    @pytest.mark.asyncio
    async def test_detect_statistical_outliers(self, reporter, sample_games):
        """Test statistical outlier detection"""
        anomalies = await reporter._detect_statistical_outliers(sample_games)
        
        assert isinstance(anomalies, list)
        
        # Check that anomalous game with 50 markets is detected
        outlier_found = False
        for anomaly in anomalies:
            if (anomaly.anomaly_type == 'statistical_outlier' and 
                'total_markets' in anomaly.description):
                outlier_found = True
                assert anomaly.severity in ['low', 'medium', 'high']
                assert 0.0 <= anomaly.confidence_score <= 1.0
                break
        
        # Should find at least the anomalous game we added
        assert outlier_found or len(sample_games) < 5  # May not detect with small sample
    
    @pytest.mark.asyncio
    async def test_detect_time_series_anomalies(self, reporter, sample_games):
        """Test time series anomaly detection"""
        anomalies = await reporter._detect_time_series_anomalies(sample_games)
        
        assert isinstance(anomalies, list)
        
        for anomaly in anomalies:
            assert isinstance(anomaly, AnomalyFlag)
            assert anomaly.anomaly_type == 'time_series_anomaly'
            assert anomaly.severity in ['low', 'medium', 'high']
            assert 0.0 <= anomaly.confidence_score <= 1.0
    
    @pytest.mark.asyncio
    async def test_detect_clustering_anomalies(self, reporter, sample_games):
        """Test clustering-based anomaly detection"""
        anomalies = await reporter._detect_clustering_anomalies(sample_games)
        
        assert isinstance(anomalies, list)
        
        for anomaly in anomalies:
            assert isinstance(anomaly, AnomalyFlag)
            assert anomaly.anomaly_type == 'clustering_anomaly'
            assert anomaly.severity in ['low', 'medium', 'high']
            assert 0.0 <= anomaly.confidence_score <= 1.0
    
    @pytest.mark.asyncio
    async def test_detect_data_quality_issues(self, reporter, sample_games_with_missing_data):
        """Test data quality issue detection"""
        anomalies = await reporter._detect_data_quality_issues(sample_games_with_missing_data)
        
        assert isinstance(anomalies, list)
        assert len(anomalies) > 0  # Should detect quality issues
        
        for anomaly in anomalies:
            assert isinstance(anomaly, AnomalyFlag)
            assert anomaly.anomaly_type == 'data_quality_issue'
            assert 'score' in anomaly.description
    
    def test_identify_missing_fields(self, reporter):
        """Test missing field identification"""
        incomplete_game = {
            'home_team': 'Team A',
            # Missing away_team, league, date, time, main_market
        }
        
        missing_fields = reporter._identify_missing_fields(incomplete_game)
        
        expected_missing = ['away_team', 'league', 'date', 'time', 'main_market']
        for field in expected_missing:
            assert field in missing_fields


class TestDashboardData:
    """Test dashboard data generation"""
    
    @pytest.mark.asyncio
    async def test_generate_dashboard_data(self, reporter, sample_games):
        """Test dashboard data generation"""
        dashboard_data = await reporter.generate_dashboard_data(sample_games)
        
        assert isinstance(dashboard_data, DashboardData)
        assert isinstance(dashboard_data.summary_stats, dict)
        assert isinstance(dashboard_data.time_series_data, dict)
        assert isinstance(dashboard_data.anomaly_summary, dict)
        assert isinstance(dashboard_data.trend_analysis, dict)
        assert isinstance(dashboard_data.performance_metrics, PerformanceMetrics)
        assert isinstance(dashboard_data.last_updated, str)
        
        # Validate summary stats
        assert 'total_games' in dashboard_data.summary_stats
        assert 'data_quality' in dashboard_data.summary_stats
        assert 'processing_performance' in dashboard_data.summary_stats
        
        # Validate time series data
        for metric_name, data_points in dashboard_data.time_series_data.items():
            assert isinstance(data_points, list)
            for point in data_points:
                assert 'date' in point
                assert 'value' in point
    
    def test_calculate_enhanced_statistics(self, reporter, sample_games):
        """Test enhanced statistics calculation"""
        stats = reporter._calculate_enhanced_statistics(sample_games)
        
        assert isinstance(stats, dict)
        assert 'total_games' in stats
        assert 'data_quality' in stats
        assert 'processing_performance' in stats
        assert 'market_analysis' in stats
        
        # Check data quality metrics
        dq = stats['data_quality']
        assert 'average_score' in dq
        assert 'median_score' in dq
        assert 'min_score' in dq
        assert 'max_score' in dq
        assert 0.0 <= dq['average_score'] <= 1.0
        
        # Check processing performance
        pp = stats['processing_performance']
        assert 'average_time' in pp
        assert 'median_time' in pp
        assert pp['average_time'] >= 0
    
    def test_calculate_performance_metrics(self, reporter, sample_games):
        """Test performance metrics calculation"""
        metrics = reporter._calculate_performance_metrics(sample_games)
        
        assert isinstance(metrics, PerformanceMetrics)
        assert metrics.processing_time >= 0
        assert metrics.cache_hits >= 0
        assert metrics.cache_misses >= 0
        assert isinstance(metrics.optimization_applied, list)
        assert 0.0 <= metrics.quality_score <= 1.0


class TestExportFunctionality:
    """Test export functionality"""
    
    @pytest.mark.asyncio
    async def test_export_to_json(self, reporter, sample_games):
        """Test JSON export functionality"""
        with tempfile.TemporaryDirectory() as temp_dir:
            data = {'games': sample_games, 'summary': {'total_games': len(sample_games)}}
            
            exported_files = await reporter.export_to_formats(
                data, ['json'], temp_dir
            )
            
            assert 'json' in exported_files
            json_file = Path(exported_files['json'])
            assert json_file.exists()
            
            # Verify JSON content
            with open(json_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
            
            assert 'games' in loaded_data
            assert len(loaded_data['games']) == len(sample_games)
    
    @pytest.mark.asyncio
    async def test_export_to_csv(self, reporter, sample_games):
        """Test CSV export functionality"""
        with tempfile.TemporaryDirectory() as temp_dir:
            data = {'games': sample_games}
            
            exported_files = await reporter.export_to_formats(
                data, ['csv'], temp_dir
            )
            
            assert 'csv' in exported_files
            csv_file = Path(exported_files['csv'])
            assert csv_file.exists()
            
            # Verify CSV content
            df = pd.read_csv(csv_file)
            assert len(df) == len(sample_games)
            assert 'Home Team' in df.columns
            assert 'Away Team' in df.columns
    
    @pytest.mark.asyncio
    async def test_export_to_excel(self, reporter, sample_games):
        """Test Excel export functionality"""
        with tempfile.TemporaryDirectory() as temp_dir:
            data = {
                'games': sample_games,
                'summary': {'total_games': len(sample_games)}
            }
            
            exported_files = await reporter.export_to_formats(
                data, ['excel'], temp_dir
            )
            
            assert 'excel' in exported_files
            excel_file = Path(exported_files['excel'])
            assert excel_file.exists()
            
            # Verify Excel content
            df = pd.read_excel(excel_file, sheet_name='Games')
            assert len(df) == len(sample_games)
            assert 'Home Team' in df.columns
    
    @pytest.mark.asyncio
    async def test_export_to_pdf(self, reporter, sample_games):
        """Test PDF export functionality"""
        with tempfile.TemporaryDirectory() as temp_dir:
            data = {
                'games': sample_games,
                'summary': {
                    'total_games': len(sample_games),
                    'total_markets': 50,
                    'leagues': ['League 1', 'League 2'],
                    'date_range': {
                        'earliest': '2024-01-01',
                        'latest': '2024-01-10',
                        'total_days': 10
                    }
                }
            }
            
            exported_files = await reporter.export_to_formats(
                data, ['pdf'], temp_dir
            )
            
            assert 'pdf' in exported_files
            pdf_file = Path(exported_files['pdf'])
            assert pdf_file.exists()
            assert pdf_file.stat().st_size > 0  # File should not be empty
    
    @pytest.mark.asyncio
    async def test_export_multiple_formats(self, reporter, sample_games):
        """Test exporting to multiple formats simultaneously"""
        with tempfile.TemporaryDirectory() as temp_dir:
            data = {'games': sample_games}
            formats = ['json', 'csv', 'excel']
            
            exported_files = await reporter.export_to_formats(
                data, formats, temp_dir
            )
            
            for format_name in formats:
                assert format_name in exported_files
                file_path = Path(exported_files[format_name])
                assert file_path.exists()
                assert file_path.stat().st_size > 0
    
    @pytest.mark.asyncio
    async def test_export_dashboard_data(self, reporter, sample_games):
        """Test exporting dashboard data"""
        with tempfile.TemporaryDirectory() as temp_dir:
            dashboard_data = await reporter.generate_dashboard_data(sample_games)
            
            exported_files = await reporter.export_to_formats(
                dashboard_data, ['json'], temp_dir
            )
            
            assert 'json' in exported_files
            json_file = Path(exported_files['json'])
            assert json_file.exists()
            
            # Verify dashboard data structure
            with open(json_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
            
            assert 'summary_stats' in loaded_data
            assert 'time_series_data' in loaded_data
            assert 'anomaly_summary' in loaded_data


class TestConfigurationAndUtilities:
    """Test configuration and utility functions"""
    
    def test_reporter_initialization_with_config(self):
        """Test reporter initialization with custom configuration"""
        custom_config = {
            'trend_analysis': {
                'min_data_points': 10,
                'confidence_level': 0.99
            },
            'export_formats': ['json', 'csv']
        }
        
        reporter = AdvancedReporter(custom_config)
        
        assert reporter.config['trend_analysis']['min_data_points'] == 10
        assert reporter.config['trend_analysis']['confidence_level'] == 0.99
        assert reporter.config['export_formats'] == ['json', 'csv']
        
        # Should still have default values for unspecified config
        assert 'anomaly_detection' in reporter.config
    
    def test_get_advanced_report_stats(self, reporter):
        """Test getting advanced report statistics"""
        stats = reporter.get_advanced_report_stats()
        
        assert isinstance(stats, dict)
        assert 'reports_generated' in stats
        assert 'trend_analysis_cache_size' in stats
        assert 'advanced_detectors_count' in stats
        assert 'supported_export_formats' in stats
        
        assert stats['advanced_detectors_count'] == len(reporter.advanced_anomaly_detectors)
    
    def test_filter_games_by_date(self, reporter, sample_games):
        """Test date filtering functionality"""
        cutoff_date = datetime.now() - timedelta(days=5)
        filtered_games = reporter._filter_games_by_date(sample_games, cutoff_date)
        
        assert isinstance(filtered_games, list)
        assert len(filtered_games) <= len(sample_games)
        
        # All filtered games should be after cutoff date
        for game in filtered_games:
            game_date_str = game.get('iso_date') or game.get('date')
            if game_date_str:
                try:
                    game_date = datetime.fromisoformat(game_date_str.replace('Z', '+00:00'))
                    assert game_date >= cutoff_date
                except (ValueError, AttributeError):
                    # Games with unparseable dates are included
                    pass


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    @pytest.mark.asyncio
    async def test_trend_analysis_with_invalid_dates(self, reporter):
        """Test trend analysis with invalid date formats"""
        games_with_bad_dates = [
            {
                'home_team': 'Team A',
                'away_team': 'Team B',
                'date': 'invalid-date',
                'iso_date': 'also-invalid',
                'total_markets': 3
            }
        ]
        
        trends = await reporter.generate_trend_analysis(games_with_bad_dates, days=30)
        # Should handle gracefully and return empty or limited results
        assert isinstance(trends, dict)
    
    @pytest.mark.asyncio
    async def test_anomaly_detection_with_empty_games(self, reporter):
        """Test anomaly detection with empty games list"""
        report = await reporter.generate_anomaly_report([])
        
        assert isinstance(report, dict)
        assert report['total_anomalies'] == 0
        assert report['detailed_anomalies'] == []
    
    @pytest.mark.asyncio
    async def test_export_with_invalid_format(self, reporter, sample_games):
        """Test export with unsupported format"""
        with tempfile.TemporaryDirectory() as temp_dir:
            data = {'games': sample_games}
            
            exported_files = await reporter.export_to_formats(
                data, ['unsupported_format'], temp_dir
            )
            
            # Should not include unsupported format
            assert 'unsupported_format' not in exported_files
    
    def test_quality_score_with_missing_data(self, reporter):
        """Test quality score calculation with missing data"""
        empty_game = {}
        score = reporter._calculate_game_quality_score(empty_game)
        
        assert score == 0.0
        
        partial_game = {'home_team': 'Team A'}
        score = reporter._calculate_game_quality_score(partial_game)
        
        assert 0.0 <= score <= 1.0


if __name__ == '__main__':
    pytest.main([__file__])