"""
AdvancedReporter for enhanced analytics and trend analysis.

This module extends the ReportGenerator with advanced features including:
- Time-series analysis capabilities
- Anomaly detection algorithms for data quality monitoring
- Dashboard-compatible data export in JSON format
- Multiple export formats (CSV, Excel, PDF) using pandas and reportlab
- Enhanced analytics and trend analysis
"""

import json
import csv
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Union
from collections import defaultdict, Counter
from dataclasses import dataclass, asdict
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

from .report_generator import ReportGenerator

logger = logging.getLogger(__name__)


@dataclass
class TrendData:
    """Data structure for trend analysis results"""
    metric_name: str
    time_period: str
    trend_direction: str  # 'increasing', 'decreasing', 'stable'
    trend_strength: float  # 0.0 to 1.0
    slope: float
    r_squared: float
    confidence_interval: Tuple[float, float]
    data_points: List[Tuple[str, float]]  # (date, value) pairs
    
    
@dataclass
class AnomalyFlag:
    """Data structure for anomaly detection results"""
    anomaly_type: str
    severity: str  # 'low', 'medium', 'high'
    confidence_score: float  # 0.0 to 1.0
    description: str
    affected_data: Dict[str, Any]
    detection_method: str
    timestamp: str


@dataclass
class PerformanceMetrics:
    """Data structure for performance metrics"""
    processing_time: float
    memory_usage: float
    cache_hits: int
    cache_misses: int
    optimization_applied: List[str]
    quality_score: float


@dataclass
class DashboardData:
    """Data structure for dashboard-compatible data export"""
    summary_stats: Dict[str, Any]
    time_series_data: Dict[str, List[Dict[str, Any]]]
    anomaly_summary: Dict[str, Any]
    trend_analysis: Dict[str, TrendData]
    performance_metrics: PerformanceMetrics
    last_updated: str


class AdvancedReporter(ReportGenerator):
    """Enhanced reporter with analytics and trend analysis capabilities"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize AdvancedReporter with configuration
        
        Args:
            config: Configuration dictionary for advanced features
        """
        super().__init__()
        
        # Default configuration
        self.config = {
            'trend_analysis': {
                'min_data_points': 5,
                'confidence_level': 0.95,
                'trend_threshold': 0.1
            },
            'anomaly_detection': {
                'outlier_threshold': 2.5,  # Standard deviations
                'clustering_eps': 0.5,
                'min_samples': 3
            },
            'export_formats': ['json', 'csv', 'excel', 'pdf'],
            'dashboard': {
                'max_time_series_points': 100,
                'refresh_interval': 300  # seconds
            }
        }
        
        if config:
            self._update_config(config)
            
        # Enhanced anomaly detectors
        self.advanced_anomaly_detectors = {
            'statistical_outliers': self._detect_statistical_outliers,
            'time_series_anomalies': self._detect_time_series_anomalies,
            'clustering_anomalies': self._detect_clustering_anomalies,
            'pattern_anomalies': self._detect_pattern_anomalies,
            'data_quality_issues': self._detect_data_quality_issues
        }
        
        # Trend analysis cache
        self._trend_cache = {}
        self._last_analysis_time = None
        
    def _update_config(self, config: Dict[str, Any]) -> None:
        """Update configuration with deep merge"""
        def deep_update(base_dict, update_dict):
            for key, value in update_dict.items():
                if key in base_dict and isinstance(base_dict[key], dict) and isinstance(value, dict):
                    deep_update(base_dict[key], value)
                else:
                    base_dict[key] = value
        
        deep_update(self.config, config)
    
    async def generate_trend_analysis(self, games: List[Dict[str, Any]], days: int = 30) -> Dict[str, TrendData]:
        """
        Generate comprehensive trend analysis for the specified time period
        
        Args:
            games: List of game dictionaries
            days: Number of days to analyze (default: 30)
            
        Returns:
            Dictionary mapping metric names to TrendData objects
        """
        logger.info(f"Starting trend analysis for {len(games)} games over {days} days")
        
        # Filter games by date range
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_games = self._filter_games_by_date(games, cutoff_date)
        
        if len(filtered_games) < self.config['trend_analysis']['min_data_points']:
            logger.warning(f"Insufficient data points for trend analysis: {len(filtered_games)}")
            return {}
        
        # Prepare time series data
        time_series_data = self._prepare_time_series_data(filtered_games)
        
        # Analyze trends for different metrics
        trend_results = {}
        
        metrics_to_analyze = [
            'games_per_day',
            'markets_per_game',
            'leagues_per_day',
            'teams_per_day',
            'anomalies_per_day',
            'processing_time_per_game',
            'data_quality_score'
        ]
        
        for metric in metrics_to_analyze:
            if metric in time_series_data:
                trend_data = await self._analyze_metric_trend(metric, time_series_data[metric])
                if trend_data:
                    trend_results[metric] = trend_data
        
        logger.info(f"Trend analysis completed: {len(trend_results)} metrics analyzed")
        return trend_results
    
    async def generate_anomaly_report(self, games: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate comprehensive anomaly detection report
        
        Args:
            games: List of game dictionaries
            
        Returns:
            Dictionary containing anomaly analysis results
        """
        logger.info(f"Starting advanced anomaly detection for {len(games)} games")
        
        # Run basic anomaly detection from parent class
        basic_anomalies = self._detect_anomalies(games)
        
        # Run advanced anomaly detection
        advanced_anomalies = []
        
        for detector_name, detector_func in self.advanced_anomaly_detectors.items():
            try:
                anomalies = await detector_func(games)
                advanced_anomalies.extend(anomalies)
                logger.debug(f"{detector_name}: {len(anomalies)} anomalies detected")
            except Exception as e:
                logger.error(f"Error in advanced anomaly detector {detector_name}: {e}")
                advanced_anomalies.append(AnomalyFlag(
                    anomaly_type='detector_error',
                    severity='high',
                    confidence_score=1.0,
                    description=f"Advanced anomaly detector failed: {str(e)}",
                    affected_data={'detector': detector_name},
                    detection_method='error_handling',
                    timestamp=datetime.now().isoformat()
                ))
        
        # Combine and categorize anomalies
        all_anomalies = self._combine_anomalies(basic_anomalies, advanced_anomalies)
        
        # Generate anomaly summary
        anomaly_summary = self._generate_anomaly_summary(all_anomalies)
        
        logger.info(f"Anomaly detection completed: {len(all_anomalies)} total anomalies")
        
        return {
            'total_anomalies': len(all_anomalies),
            'anomalies_by_severity': anomaly_summary['by_severity'],
            'anomalies_by_type': anomaly_summary['by_type'],
            'anomalies_by_detection_method': anomaly_summary['by_method'],
            'detailed_anomalies': all_anomalies,
            'confidence_distribution': anomaly_summary['confidence_stats'],
            'recommendations': self._generate_anomaly_recommendations(all_anomalies)
        }
    
    async def generate_dashboard_data(self, games: List[Dict[str, Any]]) -> DashboardData:
        """
        Generate dashboard-compatible data export
        
        Args:
            games: List of game dictionaries
            
        Returns:
            DashboardData object with all dashboard information
        """
        logger.info(f"Generating dashboard data for {len(games)} games")
        
        # Calculate enhanced statistics
        summary_stats = self._calculate_enhanced_statistics(games)
        
        # Prepare time series data for charts
        time_series_data = self._prepare_dashboard_time_series(games)
        
        # Generate anomaly summary
        anomaly_report = await self.generate_anomaly_report(games)
        anomaly_summary = {
            'total_count': anomaly_report['total_anomalies'],
            'by_severity': anomaly_report['anomalies_by_severity'],
            'recent_anomalies': self._get_recent_anomalies(anomaly_report['detailed_anomalies'], hours=24)
        }
        
        # Generate trend analysis
        trend_analysis = await self.generate_trend_analysis(games, days=30)
        
        # Calculate performance metrics
        performance_metrics = self._calculate_performance_metrics(games)
        
        dashboard_data = DashboardData(
            summary_stats=summary_stats,
            time_series_data=time_series_data,
            anomaly_summary=anomaly_summary,
            trend_analysis=trend_analysis,
            performance_metrics=performance_metrics,
            last_updated=datetime.now().isoformat()
        )
        
        logger.info("Dashboard data generation completed")
        return dashboard_data
    
    async def export_to_formats(self, data: Any, formats: List[str], output_dir: str = "jsons/reports") -> Dict[str, str]:
        """
        Export data to multiple formats (CSV, Excel, PDF)
        
        Args:
            data: Data to export (can be games list, dashboard data, etc.)
            formats: List of formats to export to
            output_dir: Output directory for exported files
            
        Returns:
            Dictionary mapping format names to file paths
        """
        logger.info(f"Exporting data to formats: {formats}")
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        exported_files = {}
        
        # Determine data type and prepare for export
        if isinstance(data, list) and data and isinstance(data[0], dict):
            # Games data
            export_data = self._prepare_games_for_export(data)
        elif isinstance(data, DashboardData):
            # Dashboard data
            export_data = self._prepare_dashboard_for_export(data)
        else:
            # Generic data
            export_data = data
        
        for format_type in formats:
            try:
                if format_type.lower() == 'csv':
                    file_path = await self._export_to_csv(export_data, output_path, timestamp)
                    exported_files['csv'] = file_path
                    
                elif format_type.lower() == 'excel':
                    file_path = await self._export_to_excel(export_data, output_path, timestamp)
                    exported_files['excel'] = file_path
                    
                elif format_type.lower() == 'pdf':
                    file_path = await self._export_to_pdf(export_data, output_path, timestamp)
                    exported_files['pdf'] = file_path
                    
                elif format_type.lower() == 'json':
                    file_path = await self._export_to_json(export_data, output_path, timestamp)
                    exported_files['json'] = file_path
                    
                else:
                    logger.warning(f"Unsupported export format: {format_type}")
                    
            except Exception as e:
                logger.error(f"Error exporting to {format_type}: {e}")
                
        logger.info(f"Export completed: {len(exported_files)} files created")
        return exported_files    

    # Private helper methods for trend analysis
    
    def _filter_games_by_date(self, games: List[Dict[str, Any]], cutoff_date: datetime) -> List[Dict[str, Any]]:
        """Filter games by date range"""
        filtered_games = []
        
        for game in games:
            game_date_str = game.get('iso_date') or game.get('date')
            if game_date_str:
                try:
                    game_date = datetime.fromisoformat(game_date_str.replace('Z', '+00:00'))
                    if game_date >= cutoff_date:
                        filtered_games.append(game)
                except (ValueError, AttributeError):
                    # Include games with unparseable dates for completeness
                    filtered_games.append(game)
        
        return filtered_games
    
    def _prepare_time_series_data(self, games: List[Dict[str, Any]]) -> Dict[str, List[Tuple[str, float]]]:
        """Prepare time series data for trend analysis"""
        # Group games by date
        games_by_date = defaultdict(list)
        
        for game in games:
            date_str = game.get('iso_date') or game.get('date', 'undated')
            games_by_date[date_str].append(game)
        
        time_series_data = {}
        
        # Calculate daily metrics
        for date_str, daily_games in games_by_date.items():
            if date_str == 'undated':
                continue
                
            # Games per day
            if 'games_per_day' not in time_series_data:
                time_series_data['games_per_day'] = []
            time_series_data['games_per_day'].append((date_str, len(daily_games)))
            
            # Markets per game
            total_markets = sum(game.get('total_markets', 0) for game in daily_games)
            avg_markets = total_markets / len(daily_games) if daily_games else 0
            if 'markets_per_game' not in time_series_data:
                time_series_data['markets_per_game'] = []
            time_series_data['markets_per_game'].append((date_str, avg_markets))
            
            # Leagues per day
            leagues = set(game.get('league') for game in daily_games if game.get('league'))
            if 'leagues_per_day' not in time_series_data:
                time_series_data['leagues_per_day'] = []
            time_series_data['leagues_per_day'].append((date_str, len(leagues)))
            
            # Teams per day
            teams = set()
            for game in daily_games:
                if game.get('home_team'):
                    teams.add(game['home_team'])
                if game.get('away_team'):
                    teams.add(game['away_team'])
            if 'teams_per_day' not in time_series_data:
                time_series_data['teams_per_day'] = []
            time_series_data['teams_per_day'].append((date_str, len(teams)))
            
            # Data quality score (based on completeness)
            quality_scores = []
            for game in daily_games:
                score = self._calculate_game_quality_score(game)
                quality_scores.append(score)
            avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
            if 'data_quality_score' not in time_series_data:
                time_series_data['data_quality_score'] = []
            time_series_data['data_quality_score'].append((date_str, avg_quality))
        
        # Sort all time series by date
        for metric in time_series_data:
            time_series_data[metric].sort(key=lambda x: x[0])
        
        return time_series_data
    
    def _calculate_game_quality_score(self, game: Dict[str, Any]) -> float:
        """Calculate quality score for a single game (0.0 to 1.0)"""
        score = 0.0
        max_score = 0.0
        
        # Required fields
        required_fields = ['home_team', 'away_team', 'league', 'date', 'time']
        for field in required_fields:
            max_score += 1.0
            if game.get(field):
                score += 1.0
        
        # Main market presence
        max_score += 2.0
        if game.get('main_market'):
            score += 1.0
            main_market = game['main_market']
            if main_market.get('odds') and all(
                main_market['odds'].get(odd_type, 0) > 0 
                for odd_type in ['home_odds', 'draw_odds', 'away_odds']
            ):
                score += 1.0
        
        # Additional markets
        max_score += 1.0
        additional_markets = game.get('additional_markets', [])
        if additional_markets:
            score += min(1.0, len(additional_markets) / 5.0)  # Up to 5 additional markets for full score
        
        # Team normalization
        max_score += 1.0
        processing_info = game.get('processing_info', {})
        if processing_info.get('team_normalized'):
            score += 1.0
        
        return score / max_score if max_score > 0 else 0.0
    
    async def _analyze_metric_trend(self, metric_name: str, data_points: List[Tuple[str, float]]) -> Optional[TrendData]:
        """Analyze trend for a specific metric"""
        if len(data_points) < self.config['trend_analysis']['min_data_points']:
            return None
        
        try:
            # Convert dates to numeric values for regression
            dates = [datetime.fromisoformat(dp[0].replace('Z', '+00:00')) for dp in data_points]
            values = [dp[1] for dp in data_points]
            
            # Convert dates to days since first date
            first_date = min(dates)
            x_values = [(date - first_date).days for date in dates]
            
            # Perform linear regression
            slope, intercept, r_value, p_value, std_err = stats.linregress(x_values, values)
            
            # Calculate confidence interval
            confidence_level = self.config['trend_analysis']['confidence_level']
            t_val = stats.t.ppf((1 + confidence_level) / 2, len(x_values) - 2)
            margin_error = t_val * std_err
            confidence_interval = (slope - margin_error, slope + margin_error)
            
            # Determine trend direction and strength
            trend_threshold = self.config['trend_analysis']['trend_threshold']
            
            if abs(slope) < trend_threshold:
                trend_direction = 'stable'
            elif slope > 0:
                trend_direction = 'increasing'
            else:
                trend_direction = 'decreasing'
            
            trend_strength = min(1.0, abs(r_value))  # R-value as strength indicator
            
            return TrendData(
                metric_name=metric_name,
                time_period=f"{len(data_points)} days",
                trend_direction=trend_direction,
                trend_strength=trend_strength,
                slope=slope,
                r_squared=r_value ** 2,
                confidence_interval=confidence_interval,
                data_points=data_points
            )
            
        except Exception as e:
            logger.error(f"Error analyzing trend for {metric_name}: {e}")
            return None
    
    # Advanced anomaly detection methods
    
    async def _detect_statistical_outliers(self, games: List[Dict[str, Any]]) -> List[AnomalyFlag]:
        """Detect statistical outliers using z-score analysis"""
        anomalies = []
        
        # Extract numeric metrics for outlier detection
        metrics = {
            'total_markets': [game.get('total_markets', 0) for game in games],
            'processing_time': [
                game.get('processing_info', {}).get('processing_time', 0) 
                for game in games
            ]
        }
        
        threshold = self.config['anomaly_detection']['outlier_threshold']
        
        for metric_name, values in metrics.items():
            if not values or all(v == 0 for v in values):
                continue
                
            # Calculate z-scores
            mean_val = np.mean(values)
            std_val = np.std(values)
            
            if std_val == 0:
                continue
                
            z_scores = [(v - mean_val) / std_val for v in values]
            
            # Find outliers
            for i, (z_score, game) in enumerate(zip(z_scores, games)):
                if abs(z_score) > threshold:
                    severity = 'high' if abs(z_score) > threshold * 1.5 else 'medium'
                    
                    anomalies.append(AnomalyFlag(
                        anomaly_type='statistical_outlier',
                        severity=severity,
                        confidence_score=min(1.0, abs(z_score) / threshold),
                        description=f"Statistical outlier in {metric_name}: {values[i]} (z-score: {z_score:.2f})",
                        affected_data={
                            'game_key': f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}",
                            'metric': metric_name,
                            'value': values[i],
                            'z_score': z_score,
                            'mean': mean_val,
                            'std': std_val
                        },
                        detection_method='z_score_analysis',
                        timestamp=datetime.now().isoformat()
                    ))
        
        return anomalies
    
    async def _detect_time_series_anomalies(self, games: List[Dict[str, Any]]) -> List[AnomalyFlag]:
        """Detect anomalies in time series data"""
        anomalies = []
        
        # Prepare time series data
        time_series_data = self._prepare_time_series_data(games)
        
        for metric_name, data_points in time_series_data.items():
            if len(data_points) < 5:  # Need minimum data points
                continue
                
            values = [dp[1] for dp in data_points]
            
            # Calculate moving average and detect deviations
            window_size = min(7, len(values) // 2)  # 7-day window or half the data
            if window_size < 3:
                continue
                
            moving_avg = []
            for i in range(len(values)):
                start_idx = max(0, i - window_size // 2)
                end_idx = min(len(values), i + window_size // 2 + 1)
                avg = sum(values[start_idx:end_idx]) / (end_idx - start_idx)
                moving_avg.append(avg)
            
            # Find significant deviations
            for i, (date_str, value) in enumerate(data_points):
                if i >= len(moving_avg):
                    continue
                    
                expected = moving_avg[i]
                if expected == 0:
                    continue
                    
                deviation = abs(value - expected) / expected
                
                if deviation > 0.5:  # 50% deviation threshold
                    severity = 'high' if deviation > 1.0 else 'medium'
                    
                    anomalies.append(AnomalyFlag(
                        anomaly_type='time_series_anomaly',
                        severity=severity,
                        confidence_score=min(1.0, deviation),
                        description=f"Time series anomaly in {metric_name}: {value:.2f} vs expected {expected:.2f}",
                        affected_data={
                            'date': date_str,
                            'metric': metric_name,
                            'actual_value': value,
                            'expected_value': expected,
                            'deviation_percent': deviation * 100
                        },
                        detection_method='moving_average_deviation',
                        timestamp=datetime.now().isoformat()
                    ))
        
        return anomalies
    
    async def _detect_clustering_anomalies(self, games: List[Dict[str, Any]]) -> List[AnomalyFlag]:
        """Detect anomalies using clustering analysis"""
        anomalies = []
        
        # Extract features for clustering
        features = []
        game_info = []
        
        for game in games:
            feature_vector = [
                game.get('total_markets', 0),
                len(game.get('additional_markets', [])),
                self._calculate_game_quality_score(game),
                game.get('processing_info', {}).get('processing_time', 0)
            ]
            
            # Only include games with valid features
            if any(f > 0 for f in feature_vector):
                features.append(feature_vector)
                game_info.append(game)
        
        if len(features) < self.config['anomaly_detection']['min_samples']:
            return anomalies
        
        try:
            # Standardize features
            scaler = StandardScaler()
            features_scaled = scaler.fit_transform(features)
            
            # Apply DBSCAN clustering
            eps = self.config['anomaly_detection']['clustering_eps']
            min_samples = self.config['anomaly_detection']['min_samples']
            
            clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(features_scaled)
            
            # Find outliers (label -1 in DBSCAN)
            for i, (label, game) in enumerate(zip(clustering.labels_, game_info)):
                if label == -1:  # Outlier
                    anomalies.append(AnomalyFlag(
                        anomaly_type='clustering_anomaly',
                        severity='medium',
                        confidence_score=0.7,  # Fixed confidence for clustering
                        description=f"Game identified as outlier by clustering analysis",
                        affected_data={
                            'game_key': f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}",
                            'features': dict(zip(['total_markets', 'additional_markets', 'quality_score', 'processing_time'], features[i])),
                            'cluster_label': int(label)
                        },
                        detection_method='dbscan_clustering',
                        timestamp=datetime.now().isoformat()
                    ))
        
        except Exception as e:
            logger.error(f"Error in clustering anomaly detection: {e}")
        
        return anomalies
    
    async def _detect_pattern_anomalies(self, games: List[Dict[str, Any]]) -> List[AnomalyFlag]:
        """Detect pattern-based anomalies"""
        anomalies = []
        
        # Analyze team name patterns
        team_names = []
        for game in games:
            if game.get('home_team'):
                team_names.append(game['home_team'])
            if game.get('away_team'):
                team_names.append(game['away_team'])
        
        # Find unusual team name patterns
        name_lengths = [len(name) for name in team_names]
        if name_lengths:
            avg_length = np.mean(name_lengths)
            std_length = np.std(name_lengths)
            
            for game in games:
                for team_type in ['home_team', 'away_team']:
                    team_name = game.get(team_type)
                    if team_name:
                        name_length = len(team_name)
                        z_score = abs(name_length - avg_length) / std_length if std_length > 0 else 0
                        
                        if z_score > 2.0:  # Unusual length
                            anomalies.append(AnomalyFlag(
                                anomaly_type='pattern_anomaly',
                                severity='low',
                                confidence_score=min(1.0, z_score / 3.0),
                                description=f"Unusual team name length: '{team_name}' ({name_length} chars)",
                                affected_data={
                                    'game_key': f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}",
                                    'team_type': team_type,
                                    'team_name': team_name,
                                    'name_length': name_length,
                                    'z_score': z_score
                                },
                                detection_method='pattern_analysis',
                                timestamp=datetime.now().isoformat()
                            ))
        
        return anomalies
    
    async def _detect_data_quality_issues(self, games: List[Dict[str, Any]]) -> List[AnomalyFlag]:
        """Detect data quality issues"""
        anomalies = []
        
        # Calculate overall data quality metrics
        quality_scores = [self._calculate_game_quality_score(game) for game in games]
        avg_quality = np.mean(quality_scores) if quality_scores else 0
        
        # Find games with quality issues
        for i, (game, quality_score) in enumerate(zip(games, quality_scores)):
            missing_fields = self._identify_missing_fields(game)
            
            # Detect based on missing critical fields or low quality score
            has_critical_missing = any(field in missing_fields for field in ['home_team', 'away_team', 'main_market'])
            has_low_quality = quality_score < 0.6  # 60% quality threshold
            
            if has_critical_missing or has_low_quality:
                severity = 'high' if has_critical_missing else 'medium' if quality_score < 0.4 else 'low'
                
                anomalies.append(AnomalyFlag(
                    anomaly_type='data_quality_issue',
                    severity=severity,
                    confidence_score=1.0 - quality_score,
                    description=f"Data quality issue: score {quality_score:.2f}, missing {len(missing_fields)} fields",
                    affected_data={
                        'game_key': f"{game.get('home_team', 'Unknown')} - {game.get('away_team', 'Unknown')}",
                        'quality_score': quality_score,
                        'average_quality': avg_quality,
                        'missing_fields': missing_fields,
                        'has_critical_missing': has_critical_missing
                    },
                    detection_method='quality_score_analysis',
                    timestamp=datetime.now().isoformat()
                ))
        
        return anomalies
    
    def _identify_missing_fields(self, game: Dict[str, Any]) -> List[str]:
        """Identify missing or incomplete fields in a game"""
        missing_fields = []
        
        required_fields = ['home_team', 'away_team', 'league', 'date', 'time']
        for field in required_fields:
            if not game.get(field):
                missing_fields.append(field)
        
        if not game.get('main_market'):
            missing_fields.append('main_market')
        elif not game.get('main_market', {}).get('odds'):
            missing_fields.append('main_market_odds')
        
        return missing_fields   
 
    # Helper methods for anomaly processing
    
    def _combine_anomalies(self, basic_anomalies: List[Dict[str, Any]], advanced_anomalies: List[AnomalyFlag]) -> List[Dict[str, Any]]:
        """Combine basic and advanced anomalies into unified format"""
        combined = []
        
        # Convert basic anomalies to standard format
        for anomaly in basic_anomalies:
            combined.append({
                'type': anomaly.get('type', 'unknown'),
                'severity': anomaly.get('severity', 'medium'),
                'confidence_score': 0.8,  # Default confidence for basic anomalies
                'description': anomaly.get('description', ''),
                'affected_data': anomaly.get('game_info', {}),
                'detection_method': 'basic_detection',
                'timestamp': datetime.now().isoformat()
            })
        
        # Convert advanced anomalies to dict format
        for anomaly in advanced_anomalies:
            combined.append(asdict(anomaly))
        
        # Sort by severity and confidence
        severity_order = {'high': 0, 'medium': 1, 'low': 2}
        combined.sort(key=lambda x: (
            severity_order.get(x.get('severity', 'low'), 2),
            -x.get('confidence_score', 0)
        ))
        
        return combined
    
    def _generate_anomaly_summary(self, anomalies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics for anomalies"""
        if not anomalies:
            return {
                'by_severity': {'high': 0, 'medium': 0, 'low': 0},
                'by_type': {},
                'by_method': {},
                'confidence_stats': {'mean': 0, 'median': 0, 'std': 0}
            }
        
        # Count by severity
        by_severity = Counter(anomaly.get('severity', 'unknown') for anomaly in anomalies)
        
        # Count by type
        by_type = Counter(anomaly.get('type', 'unknown') for anomaly in anomalies)
        
        # Count by detection method
        by_method = Counter(anomaly.get('detection_method', 'unknown') for anomaly in anomalies)
        
        # Confidence statistics
        confidence_scores = [anomaly.get('confidence_score', 0) for anomaly in anomalies]
        confidence_stats = {
            'mean': np.mean(confidence_scores),
            'median': np.median(confidence_scores),
            'std': np.std(confidence_scores)
        }
        
        return {
            'by_severity': dict(by_severity),
            'by_type': dict(by_type),
            'by_method': dict(by_method),
            'confidence_stats': confidence_stats
        }
    
    def _generate_anomaly_recommendations(self, anomalies: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on detected anomalies"""
        recommendations = []
        
        # Count anomaly types
        type_counts = Counter(anomaly.get('type', 'unknown') for anomaly in anomalies)
        severity_counts = Counter(anomaly.get('severity', 'unknown') for anomaly in anomalies)
        
        # High severity recommendations
        if severity_counts.get('high', 0) > 0:
            recommendations.append(f"Address {severity_counts['high']} high-severity anomalies immediately")
        
        # Specific type recommendations
        if type_counts.get('missing_odds', 0) > 5:
            recommendations.append("Review odds extraction process - multiple games missing odds data")
        
        if type_counts.get('invalid_team_name', 0) > 3:
            recommendations.append("Improve team name extraction and validation")
        
        if type_counts.get('statistical_outlier', 0) > 0:
            recommendations.append("Investigate statistical outliers for potential data quality issues")
        
        if type_counts.get('data_quality_issue', 0) > len(anomalies) * 0.1:
            recommendations.append("Overall data quality is below acceptable threshold - review extraction process")
        
        # General recommendations
        if len(anomalies) > 50:
            recommendations.append("High anomaly count detected - consider reviewing data sources and processing pipeline")
        
        return recommendations
    
    def _get_recent_anomalies(self, anomalies: List[Dict[str, Any]], hours: int = 24) -> List[Dict[str, Any]]:
        """Get anomalies from the last N hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_anomalies = []
        
        for anomaly in anomalies:
            timestamp_str = anomaly.get('timestamp')
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    if timestamp >= cutoff_time:
                        recent_anomalies.append(anomaly)
                except (ValueError, AttributeError):
                    continue
        
        return recent_anomalies
    
    # Dashboard data preparation methods
    
    def _calculate_enhanced_statistics(self, games: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate enhanced statistics for dashboard"""
        basic_stats = self._calculate_statistics(games)
        
        # Add enhanced metrics
        enhanced_stats = basic_stats.copy()
        
        # Quality metrics
        quality_scores = [self._calculate_game_quality_score(game) for game in games]
        enhanced_stats['data_quality'] = {
            'average_score': np.mean(quality_scores) if quality_scores else 0,
            'median_score': np.median(quality_scores) if quality_scores else 0,
            'min_score': np.min(quality_scores) if quality_scores else 0,
            'max_score': np.max(quality_scores) if quality_scores else 0
        }
        
        # Processing metrics
        processing_times = []
        for game in games:
            proc_time = game.get('processing_info', {}).get('processing_time', 0)
            if proc_time > 0:
                processing_times.append(proc_time)
        
        enhanced_stats['processing_performance'] = {
            'average_time': np.mean(processing_times) if processing_times else 0,
            'median_time': np.median(processing_times) if processing_times else 0,
            'total_games_with_timing': len(processing_times)
        }
        
        # Market distribution analysis
        market_types = Counter()
        for game in games:
            if game.get('main_market'):
                market_type = game['main_market'].get('market_type', '1X2')
                market_types[market_type] += 1
            
            for market in game.get('additional_markets', []):
                market_type = market.get('market_type', 'unknown')
                market_types[market_type] += 1
        
        enhanced_stats['market_analysis'] = {
            'total_unique_types': len(market_types),
            'type_distribution': dict(market_types.most_common(10)),
            'unknown_markets_count': market_types.get('unknown', 0)
        }
        
        return enhanced_stats
    
    def _prepare_dashboard_time_series(self, games: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Prepare time series data for dashboard charts"""
        time_series_data = self._prepare_time_series_data(games)
        
        # Convert to dashboard format
        dashboard_series = {}
        
        for metric_name, data_points in time_series_data.items():
            # Limit data points for performance
            max_points = self.config['dashboard']['max_time_series_points']
            if len(data_points) > max_points:
                # Sample data points evenly
                step = len(data_points) // max_points
                data_points = data_points[::step]
            
            # Convert to dashboard format
            dashboard_series[metric_name] = [
                {'date': date_str, 'value': value}
                for date_str, value in data_points
            ]
        
        return dashboard_series
    
    def _calculate_performance_metrics(self, games: List[Dict[str, Any]]) -> PerformanceMetrics:
        """Calculate performance metrics for dashboard"""
        processing_times = []
        cache_hits = 0
        cache_misses = 0
        optimizations = set()
        
        for game in games:
            processing_info = game.get('processing_info', {})
            
            # Processing time
            proc_time = processing_info.get('processing_time', 0)
            if proc_time > 0:
                processing_times.append(proc_time)
            
            # Cache statistics (if available)
            cache_hits += processing_info.get('cache_hits', 0)
            cache_misses += processing_info.get('cache_misses', 0)
            
            # Optimizations applied
            opts = processing_info.get('optimizations_applied', [])
            if isinstance(opts, list):
                optimizations.update(opts)
        
        # Calculate quality score
        quality_scores = [self._calculate_game_quality_score(game) for game in games]
        avg_quality = np.mean(quality_scores) if quality_scores else 0
        
        return PerformanceMetrics(
            processing_time=np.mean(processing_times) if processing_times else 0,
            memory_usage=0.0,  # Would need system monitoring to populate
            cache_hits=cache_hits,
            cache_misses=cache_misses,
            optimization_applied=list(optimizations),
            quality_score=avg_quality
        )
    
    # Export methods
    
    def _prepare_games_for_export(self, games: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Prepare games data for export"""
        return {
            'games': games,
            'summary': self._calculate_enhanced_statistics(games),
            'export_timestamp': datetime.now().isoformat(),
            'total_games': len(games)
        }
    
    def _prepare_dashboard_for_export(self, dashboard_data: DashboardData) -> Dict[str, Any]:
        """Prepare dashboard data for export"""
        return asdict(dashboard_data)
    
    async def _export_to_csv(self, data: Dict[str, Any], output_path: Path, timestamp: str) -> str:
        """Export data to CSV format"""
        file_path = output_path / f"advanced_report_{timestamp}.csv"
        
        # If data contains games, create a comprehensive CSV
        if 'games' in data:
            games = data['games']
            
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                
                # Header
                headers = [
                    'Date', 'Time', 'League', 'Home Team', 'Away Team',
                    'Total Markets', 'Main Market Odds (H-D-A)', 'Additional Markets Count',
                    'Quality Score', 'Processing Time', 'Team Normalized'
                ]
                writer.writerow(headers)
                
                # Data rows
                for game in games:
                    main_market = game.get('main_market', {})
                    odds = main_market.get('odds', {})
                    odds_str = f"{odds.get('home_odds', 'N/A')}-{odds.get('draw_odds', 'N/A')}-{odds.get('away_odds', 'N/A')}"
                    
                    processing_info = game.get('processing_info', {})
                    
                    row = [
                        game.get('iso_date', game.get('date', 'N/A')),
                        game.get('time', 'N/A'),
                        game.get('league', 'N/A'),
                        game.get('home_team', 'N/A'),
                        game.get('away_team', 'N/A'),
                        game.get('total_markets', 0),
                        odds_str,
                        len(game.get('additional_markets', [])),
                        round(self._calculate_game_quality_score(game), 3),
                        processing_info.get('processing_time', 0),
                        processing_info.get('team_normalized', False)
                    ]
                    writer.writerow(row)
        
        else:
            # Generic CSV export
            df = pd.json_normalize(data)
            df.to_csv(file_path, index=False, encoding='utf-8')
        
        logger.info(f"CSV export completed: {file_path}")
        return str(file_path)
    
    async def _export_to_excel(self, data: Dict[str, Any], output_path: Path, timestamp: str) -> str:
        """Export data to Excel format with multiple sheets"""
        file_path = output_path / f"advanced_report_{timestamp}.xlsx"
        
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            if 'games' in data:
                games = data['games']
                
                # Games sheet
                games_data = []
                for game in games:
                    main_market = game.get('main_market', {})
                    odds = main_market.get('odds', {})
                    processing_info = game.get('processing_info', {})
                    
                    games_data.append({
                        'Date': game.get('iso_date', game.get('date', 'N/A')),
                        'Time': game.get('time', 'N/A'),
                        'League': game.get('league', 'N/A'),
                        'Home Team': game.get('home_team', 'N/A'),
                        'Away Team': game.get('away_team', 'N/A'),
                        'Total Markets': game.get('total_markets', 0),
                        'Home Odds': odds.get('home_odds', 'N/A'),
                        'Draw Odds': odds.get('draw_odds', 'N/A'),
                        'Away Odds': odds.get('away_odds', 'N/A'),
                        'Additional Markets': len(game.get('additional_markets', [])),
                        'Quality Score': round(self._calculate_game_quality_score(game), 3),
                        'Processing Time': processing_info.get('processing_time', 0),
                        'Team Normalized': processing_info.get('team_normalized', False)
                    })
                
                games_df = pd.DataFrame(games_data)
                games_df.to_excel(writer, sheet_name='Games', index=False)
                
                # Summary sheet
                if 'summary' in data:
                    summary_data = []
                    summary = data['summary']
                    
                    # Basic statistics
                    for key, value in summary.items():
                        if isinstance(value, (int, float, str)):
                            summary_data.append({'Metric': key, 'Value': value})
                        elif isinstance(value, dict):
                            for sub_key, sub_value in value.items():
                                if isinstance(sub_value, (int, float, str)):
                                    summary_data.append({'Metric': f"{key}.{sub_key}", 'Value': sub_value})
                    
                    summary_df = pd.DataFrame(summary_data)
                    summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            else:
                # Generic Excel export
                df = pd.json_normalize(data)
                df.to_excel(writer, sheet_name='Data', index=False)
        
        logger.info(f"Excel export completed: {file_path}")
        return str(file_path)
    
    async def _export_to_pdf(self, data: Dict[str, Any], output_path: Path, timestamp: str) -> str:
        """Export data to PDF format"""
        file_path = output_path / f"advanced_report_{timestamp}.pdf"
        
        # Create PDF document
        doc = SimpleDocTemplate(str(file_path), pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        story.append(Paragraph("Advanced Football Data Report", title_style))
        story.append(Spacer(1, 12))
        
        # Generation info
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        if 'games' in data and 'summary' in data:
            games = data['games']
            summary = data['summary']
            
            # Summary section
            story.append(Paragraph("Summary Statistics", styles['Heading2']))
            
            summary_data = [
                ['Metric', 'Value'],
                ['Total Games', summary.get('total_games', 0)],
                ['Total Markets', summary.get('total_markets', 0)],
                ['Leagues Count', summary.get('leagues_count', 0)],
                ['Teams Count', summary.get('teams_count', 0)],
                ['Average Markets per Game', summary.get('average_markets_per_game', 0)]
            ]
            
            # Add data quality metrics if available
            if 'data_quality' in summary:
                dq = summary['data_quality']
                summary_data.extend([
                    ['Average Quality Score', f"{dq.get('average_score', 0):.3f}"],
                    ['Min Quality Score', f"{dq.get('min_score', 0):.3f}"],
                    ['Max Quality Score', f"{dq.get('max_score', 0):.3f}"]
                ])
            
            summary_table = Table(summary_data)
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(summary_table)
            story.append(Spacer(1, 12))
            
            # League distribution
            if summary.get('leagues'):
                story.append(Paragraph("Leagues", styles['Heading2']))
                leagues_text = ", ".join(summary['leagues'][:10])  # Limit to first 10
                if len(summary['leagues']) > 10:
                    leagues_text += f" ... and {len(summary['leagues']) - 10} more"
                story.append(Paragraph(leagues_text, styles['Normal']))
                story.append(Spacer(1, 12))
            
            # Date range
            date_range = summary.get('date_range', {})
            if date_range.get('earliest') and date_range.get('latest'):
                story.append(Paragraph("Date Range", styles['Heading2']))
                date_text = f"From {date_range['earliest']} to {date_range['latest']} ({date_range.get('total_days', 0)} days)"
                story.append(Paragraph(date_text, styles['Normal']))
                story.append(Spacer(1, 12))
        
        else:
            # Generic PDF content
            story.append(Paragraph("Data Export", styles['Heading2']))
            story.append(Paragraph(f"Exported {len(data)} data items", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        logger.info(f"PDF export completed: {file_path}")
        return str(file_path)
    
    async def _export_to_json(self, data: Dict[str, Any], output_path: Path, timestamp: str) -> str:
        """Export data to JSON format"""
        file_path = output_path / f"advanced_report_{timestamp}.json"
        
        # Ensure data is JSON serializable
        def make_serializable(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, datetime):
                return obj.isoformat()
            elif hasattr(obj, '__dict__'):
                return obj.__dict__
            return obj
        
        # Convert data to JSON-serializable format
        serializable_data = json.loads(json.dumps(data, default=make_serializable))
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(serializable_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"JSON export completed: {file_path}")
        return str(file_path)
    
    def get_advanced_report_stats(self) -> Dict[str, Any]:
        """Get advanced reporting statistics"""
        base_stats = self.get_report_stats()
        
        advanced_stats = base_stats.copy()
        advanced_stats.update({
            'trend_analysis_cache_size': len(self._trend_cache),
            'last_trend_analysis': self._last_analysis_time,
            'advanced_detectors_count': len(self.advanced_anomaly_detectors),
            'supported_export_formats': self.config['export_formats']
        })
        
        return advanced_stats