"""
Database query optimization and performance tuning tools.

This module provides tools for analyzing and optimizing database queries,
including query plan analysis, index recommendations, and performance tuning.
"""

import re
import time
from collections import defaultdict, Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Set, Tuple
import structlog
from sqlalchemy import text, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.sql import sqltypes

from .config import PerformanceConfig
from .exceptions import PerformanceError


@dataclass
class QueryAnalysis:
    """Query analysis result."""
    query_hash: str
    normalized_query: str
    execution_count: int
    total_time: float
    avg_time: float
    min_time: float
    max_time: float
    tables_accessed: List[str]
    columns_accessed: List[str]
    query_type: str  # SELECT, INSERT, UPDATE, DELETE
    complexity_score: int
    optimization_suggestions: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'query_hash': self.query_hash,
            'normalized_query': self.normalized_query,
            'execution_count': self.execution_count,
            'total_time': self.total_time,
            'avg_time': self.avg_time,
            'min_time': self.min_time,
            'max_time': self.max_time,
            'tables_accessed': self.tables_accessed,
            'columns_accessed': self.columns_accessed,
            'query_type': self.query_type,
            'complexity_score': self.complexity_score,
            'optimization_suggestions': self.optimization_suggestions
        }


@dataclass
class IndexRecommendation:
    """Index recommendation."""
    table_name: str
    columns: List[str]
    index_type: str  # 'btree', 'hash', 'composite'
    reason: str
    estimated_benefit: str  # 'high', 'medium', 'low'
    query_patterns: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'table_name': self.table_name,
            'columns': self.columns,
            'index_type': self.index_type,
            'reason': self.reason,
            'estimated_benefit': self.estimated_benefit,
            'query_patterns': self.query_patterns
        }


@dataclass
class TableStatistics:
    """Table statistics for optimization."""
    table_name: str
    row_count: int
    size_bytes: int
    columns: Dict[str, Dict[str, Any]]
    indexes: List[Dict[str, Any]]
    foreign_keys: List[Dict[str, Any]]
    access_patterns: Dict[str, int] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'table_name': self.table_name,
            'row_count': self.row_count,
            'size_bytes': self.size_bytes,
            'size_mb': self.size_bytes / (1024 * 1024),
            'columns': self.columns,
            'indexes': self.indexes,
            'foreign_keys': self.foreign_keys,
            'access_patterns': self.access_patterns
        }


class QueryOptimizer:
    """Database query optimizer and performance tuner."""
    
    def __init__(self, config: PerformanceConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Query tracking
        self.query_stats: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
            'count': 0,
            'total_time': 0.0,
            'min_time': float('inf'),
            'max_time': 0.0,
            'queries': [],
            'tables': set(),
            'columns': set()
        })
        
        # Registered engines
        self.engines: List[Engine] = []
        
        # Query patterns for optimization
        self.optimization_patterns = {
            'missing_where_clause': re.compile(r'SELECT\s+.*\s+FROM\s+\w+(?:\s+JOIN\s+.*)?(?:\s+GROUP\s+BY\s+.*)?(?:\s+ORDER\s+BY\s+.*)?$', re.IGNORECASE),
            'select_star': re.compile(r'SELECT\s+\*\s+FROM', re.IGNORECASE),
            'unnecessary_distinct': re.compile(r'SELECT\s+DISTINCT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\s+PRIMARY\s+KEY', re.IGNORECASE),
            'missing_limit': re.compile(r'SELECT\s+.*\s+FROM\s+.*\s+ORDER\s+BY\s+.*(?!LIMIT)', re.IGNORECASE),
            'inefficient_like': re.compile(r'LIKE\s+[\'"]%.*%[\'"]', re.IGNORECASE),
            'unnecessary_subquery': re.compile(r'SELECT\s+.*\s+FROM\s+\(\s*SELECT\s+.*\s+FROM\s+\w+\s*\)', re.IGNORECASE),
            'missing_join_condition': re.compile(r'FROM\s+\w+\s*,\s*\w+(?!\s+WHERE)', re.IGNORECASE),
            'inefficient_or': re.compile(r'WHERE\s+.*\s+OR\s+.*', re.IGNORECASE)
        }
    
    def register_engine(self, engine: Engine):
        """Register a database engine for optimization."""
        self.engines.append(engine)
        self.logger.info("Database engine registered for optimization", engine=str(engine.url))
    
    def analyze_query(self, query: str, execution_time: float) -> str:
        """Analyze a query and return its hash for tracking."""
        normalized_query = self._normalize_query(query)
        query_hash = str(hash(normalized_query))
        
        # Update statistics
        stats = self.query_stats[query_hash]
        stats['count'] += 1
        stats['total_time'] += execution_time
        stats['min_time'] = min(stats['min_time'], execution_time)
        stats['max_time'] = max(stats['max_time'], execution_time)
        stats['normalized_query'] = normalized_query
        
        # Store recent queries for analysis
        stats['queries'].append({
            'query': query,
            'execution_time': execution_time,
            'timestamp': datetime.now(timezone.utc)
        })
        
        # Keep only recent queries
        if len(stats['queries']) > 100:
            stats['queries'] = stats['queries'][-100:]
        
        # Extract table and column information
        tables, columns = self._extract_query_metadata(query)
        stats['tables'].update(tables)
        stats['columns'].update(columns)
        
        return query_hash
    
    def _normalize_query(self, query: str) -> str:
        """Normalize query for analysis by removing parameters and formatting."""
        # Remove comments
        query = re.sub(r'--.*$', '', query, flags=re.MULTILINE)
        query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
        
        # Normalize whitespace
        query = re.sub(r'\s+', ' ', query.strip())
        
        # Replace parameter placeholders
        query = re.sub(r'\?', '?', query)
        query = re.sub(r':\w+', ':param', query)
        query = re.sub(r'\$\d+', '$param', query)
        
        # Replace string literals
        query = re.sub(r"'[^']*'", "'string'", query)
        query = re.sub(r'"[^"]*"', '"string"', query)
        
        # Replace numeric literals
        query = re.sub(r'\b\d+\b', 'N', query)
        
        return query.upper()
    
    def _extract_query_metadata(self, query: str) -> Tuple[Set[str], Set[str]]:
        """Extract table and column names from query."""
        tables = set()
        columns = set()
        
        # Simple regex-based extraction (could be improved with SQL parser)
        # Extract table names from FROM and JOIN clauses
        from_matches = re.findall(r'FROM\s+(\w+)', query, re.IGNORECASE)
        join_matches = re.findall(r'JOIN\s+(\w+)', query, re.IGNORECASE)
        tables.update(from_matches + join_matches)
        
        # Extract column names from SELECT and WHERE clauses
        select_matches = re.findall(r'SELECT\s+(.+?)\s+FROM', query, re.IGNORECASE | re.DOTALL)
        if select_matches:
            select_clause = select_matches[0]
            if '*' not in select_clause:
                # Extract individual columns
                column_matches = re.findall(r'(\w+)(?:\s+AS\s+\w+)?(?:\s*,|$)', select_clause, re.IGNORECASE)
                columns.update(column_matches)
        
        where_matches = re.findall(r'WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)', query, re.IGNORECASE | re.DOTALL)
        if where_matches:
            where_clause = where_matches[0]
            column_matches = re.findall(r'(\w+)\s*[=<>!]', where_clause, re.IGNORECASE)
            columns.update(column_matches)
        
        return tables, columns
    
    def get_query_analysis(self, query_hash: str) -> Optional[QueryAnalysis]:
        """Get analysis for a specific query."""
        if query_hash not in self.query_stats:
            return None
        
        stats = self.query_stats[query_hash]
        
        # Determine query type
        normalized_query = stats['normalized_query']
        if normalized_query.startswith('SELECT'):
            query_type = 'SELECT'
        elif normalized_query.startswith('INSERT'):
            query_type = 'INSERT'
        elif normalized_query.startswith('UPDATE'):
            query_type = 'UPDATE'
        elif normalized_query.startswith('DELETE'):
            query_type = 'DELETE'
        else:
            query_type = 'OTHER'
        
        # Calculate complexity score
        complexity_score = self._calculate_complexity_score(normalized_query)
        
        # Generate optimization suggestions
        suggestions = self._generate_optimization_suggestions(normalized_query, stats)
        
        return QueryAnalysis(
            query_hash=query_hash,
            normalized_query=normalized_query,
            execution_count=stats['count'],
            total_time=stats['total_time'],
            avg_time=stats['total_time'] / stats['count'],
            min_time=stats['min_time'],
            max_time=stats['max_time'],
            tables_accessed=list(stats['tables']),
            columns_accessed=list(stats['columns']),
            query_type=query_type,
            complexity_score=complexity_score,
            optimization_suggestions=suggestions
        )
    
    def _calculate_complexity_score(self, query: str) -> int:
        """Calculate query complexity score."""
        score = 0
        
        # Base score for query type
        if query.startswith('SELECT'):
            score += 1
        elif query.startswith(('INSERT', 'UPDATE', 'DELETE')):
            score += 2
        
        # Add score for joins
        score += len(re.findall(r'JOIN', query, re.IGNORECASE)) * 2
        
        # Add score for subqueries
        score += len(re.findall(r'SELECT.*FROM.*SELECT', query, re.IGNORECASE)) * 3
        
        # Add score for aggregations
        score += len(re.findall(r'GROUP\s+BY|HAVING|COUNT|SUM|AVG|MIN|MAX', query, re.IGNORECASE))
        
        # Add score for sorting
        score += len(re.findall(r'ORDER\s+BY', query, re.IGNORECASE))
        
        # Add score for conditions
        score += len(re.findall(r'WHERE|AND|OR', query, re.IGNORECASE))
        
        return score
    
    def _generate_optimization_suggestions(self, query: str, stats: Dict[str, Any]) -> List[str]:
        """Generate optimization suggestions for a query."""
        suggestions = []
        
        # Check for common anti-patterns
        for pattern_name, pattern in self.optimization_patterns.items():
            if pattern.search(query):
                suggestion = self._get_suggestion_for_pattern(pattern_name, query)
                if suggestion:
                    suggestions.append(suggestion)
        
        # Performance-based suggestions
        avg_time = stats['total_time'] / stats['count']
        if avg_time > self.config.slow_query_threshold:
            suggestions.append(f"Query is slow (avg: {avg_time:.3f}s). Consider adding indexes or optimizing WHERE clauses.")
        
        if stats['count'] > 1000:
            suggestions.append("Frequently executed query. Consider caching results or optimizing for better performance.")
        
        return suggestions
    
    def _get_suggestion_for_pattern(self, pattern_name: str, query: str) -> Optional[str]:
        """Get optimization suggestion for a specific pattern."""
        suggestions = {
            'missing_where_clause': "Consider adding WHERE clause to limit result set",
            'select_star': "Avoid SELECT * - specify only needed columns",
            'unnecessary_distinct': "DISTINCT may be unnecessary with PRIMARY KEY constraints",
            'missing_limit': "Consider adding LIMIT clause for large result sets",
            'inefficient_like': "LIKE with leading wildcard (%) prevents index usage",
            'unnecessary_subquery': "Consider rewriting subquery as JOIN for better performance",
            'missing_join_condition': "Use explicit JOIN syntax instead of comma-separated tables",
            'inefficient_or': "OR conditions may prevent index usage - consider UNION instead"
        }
        
        return suggestions.get(pattern_name)
    
    async def analyze_table_statistics(self, engine: Engine) -> List[TableStatistics]:
        """Analyze table statistics for optimization."""
        statistics = []
        
        try:
            inspector = inspect(engine)
            table_names = inspector.get_table_names()
            
            for table_name in table_names:
                try:
                    # Get table info
                    columns_info = {}
                    for column in inspector.get_columns(table_name):
                        columns_info[column['name']] = {
                            'type': str(column['type']),
                            'nullable': column['nullable'],
                            'default': column.get('default'),
                            'primary_key': column.get('primary_key', False)
                        }
                    
                    # Get indexes
                    indexes = []
                    for index in inspector.get_indexes(table_name):
                        indexes.append({
                            'name': index['name'],
                            'columns': index['column_names'],
                            'unique': index['unique']
                        })
                    
                    # Get foreign keys
                    foreign_keys = []
                    for fk in inspector.get_foreign_keys(table_name):
                        foreign_keys.append({
                            'name': fk['name'],
                            'columns': fk['constrained_columns'],
                            'referred_table': fk['referred_table'],
                            'referred_columns': fk['referred_columns']
                        })
                    
                    # Get row count and size (database-specific)
                    row_count, size_bytes = await self._get_table_size_info(engine, table_name)
                    
                    # Calculate access patterns
                    access_patterns = self._calculate_table_access_patterns(table_name)
                    
                    stats = TableStatistics(
                        table_name=table_name,
                        row_count=row_count,
                        size_bytes=size_bytes,
                        columns=columns_info,
                        indexes=indexes,
                        foreign_keys=foreign_keys,
                        access_patterns=access_patterns
                    )
                    
                    statistics.append(stats)
                    
                except Exception as e:
                    self.logger.warning("Failed to analyze table", table=table_name, error=str(e))
            
            return statistics
            
        except Exception as e:
            self.logger.error("Failed to analyze table statistics", error=str(e))
            raise PerformanceError(f"Failed to analyze table statistics: {e}")
    
    async def _get_table_size_info(self, engine: Engine, table_name: str) -> Tuple[int, int]:
        """Get table row count and size information."""
        try:
            with engine.connect() as conn:
                # Get row count
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                row_count = result.scalar()
                
                # Get size (database-specific)
                size_bytes = 0
                if 'sqlite' in str(engine.url):
                    # SQLite doesn't have direct table size queries
                    size_bytes = row_count * 100  # Rough estimate
                elif 'postgresql' in str(engine.url):
                    result = conn.execute(text(f"SELECT pg_total_relation_size('{table_name}')"))
                    size_bytes = result.scalar() or 0
                elif 'mysql' in str(engine.url):
                    result = conn.execute(text(f"""
                        SELECT (data_length + index_length) as size 
                        FROM information_schema.tables 
                        WHERE table_name = '{table_name}'
                    """))
                    size_bytes = result.scalar() or 0
                
                return row_count, size_bytes
                
        except Exception as e:
            self.logger.warning("Failed to get table size info", table=table_name, error=str(e))
            return 0, 0
    
    def _calculate_table_access_patterns(self, table_name: str) -> Dict[str, int]:
        """Calculate access patterns for a table based on query history."""
        patterns = defaultdict(int)
        
        for stats in self.query_stats.values():
            if table_name in stats['tables']:
                query = stats['normalized_query']
                
                if query.startswith('SELECT'):
                    patterns['select'] += stats['count']
                elif query.startswith('INSERT'):
                    patterns['insert'] += stats['count']
                elif query.startswith('UPDATE'):
                    patterns['update'] += stats['count']
                elif query.startswith('DELETE'):
                    patterns['delete'] += stats['count']
        
        return dict(patterns)
    
    def generate_index_recommendations(self, table_stats: List[TableStatistics]) -> List[IndexRecommendation]:
        """Generate index recommendations based on query patterns and table statistics."""
        recommendations = []
        
        for table_stat in table_stats:
            table_name = table_stat.table_name
            existing_indexes = {tuple(idx['columns']) for idx in table_stat.indexes}
            
            # Analyze query patterns for this table
            column_usage = Counter()
            where_conditions = Counter()
            join_conditions = Counter()
            
            for stats in self.query_stats.values():
                if table_name in stats['tables']:
                    # Analyze WHERE clauses
                    for query_info in stats['queries']:
                        query = query_info['query']
                        where_columns = self._extract_where_columns(query, table_name)
                        for col in where_columns:
                            where_conditions[col] += 1
                            column_usage[col] += 1
                        
                        # Analyze JOIN conditions
                        join_columns = self._extract_join_columns(query, table_name)
                        for col in join_columns:
                            join_conditions[col] += 1
                            column_usage[col] += 1
            
            # Generate recommendations based on usage patterns
            
            # Single column indexes for frequently used WHERE conditions
            for column, usage_count in where_conditions.most_common(10):
                if usage_count >= 5 and (column,) not in existing_indexes:
                    recommendations.append(IndexRecommendation(
                        table_name=table_name,
                        columns=[column],
                        index_type='btree',
                        reason=f"Frequently used in WHERE clauses ({usage_count} times)",
                        estimated_benefit='high' if usage_count > 50 else 'medium',
                        query_patterns=[f"WHERE {column} = ?"]
                    ))
            
            # Composite indexes for multiple column conditions
            column_pairs = self._find_column_pairs_in_queries(table_name)
            for (col1, col2), usage_count in column_pairs.most_common(5):
                if usage_count >= 3 and (col1, col2) not in existing_indexes and (col2, col1) not in existing_indexes:
                    recommendations.append(IndexRecommendation(
                        table_name=table_name,
                        columns=[col1, col2],
                        index_type='composite',
                        reason=f"Frequently used together in queries ({usage_count} times)",
                        estimated_benefit='medium',
                        query_patterns=[f"WHERE {col1} = ? AND {col2} = ?"]
                    ))
            
            # Foreign key indexes
            for fk in table_stat.foreign_keys:
                for column in fk['columns']:
                    if (column,) not in existing_indexes:
                        recommendations.append(IndexRecommendation(
                            table_name=table_name,
                            columns=[column],
                            index_type='btree',
                            reason="Foreign key column should be indexed",
                            estimated_benefit='high',
                            query_patterns=[f"JOIN ON {column} = ?"]
                        ))
        
        return recommendations
    
    def _extract_where_columns(self, query: str, table_name: str) -> List[str]:
        """Extract columns used in WHERE clauses for a specific table."""
        columns = []
        
        # Simple regex-based extraction
        where_match = re.search(r'WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)', query, re.IGNORECASE | re.DOTALL)
        if where_match:
            where_clause = where_match.group(1)
            
            # Look for column conditions
            column_matches = re.findall(r'(\w+)\s*[=<>!]', where_clause, re.IGNORECASE)
            columns.extend(column_matches)
        
        return columns
    
    def _extract_join_columns(self, query: str, table_name: str) -> List[str]:
        """Extract columns used in JOIN conditions for a specific table."""
        columns = []
        
        # Look for JOIN conditions
        join_matches = re.findall(r'JOIN\s+\w+\s+ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)', query, re.IGNORECASE)
        for left_col, right_col in join_matches:
            # Extract table and column
            if '.' in left_col:
                table, column = left_col.split('.', 1)
                if table.lower() == table_name.lower():
                    columns.append(column)
            
            if '.' in right_col:
                table, column = right_col.split('.', 1)
                if table.lower() == table_name.lower():
                    columns.append(column)
        
        return columns
    
    def _find_column_pairs_in_queries(self, table_name: str) -> Counter:
        """Find frequently used column pairs in queries."""
        pairs = Counter()
        
        for stats in self.query_stats.values():
            if table_name in stats['tables']:
                for query_info in stats['queries']:
                    query = query_info['query']
                    columns = self._extract_where_columns(query, table_name)
                    
                    # Find all pairs of columns used together
                    for i, col1 in enumerate(columns):
                        for col2 in columns[i+1:]:
                            pair = tuple(sorted([col1, col2]))
                            pairs[pair] += 1
        
        return pairs
    
    def get_optimization_report(self) -> Dict[str, Any]:
        """Generate comprehensive optimization report."""
        report = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'query_analysis': {},
            'slow_queries': [],
            'frequent_queries': [],
            'optimization_opportunities': []
        }
        
        # Analyze all tracked queries
        for query_hash, stats in self.query_stats.items():
            analysis = self.get_query_analysis(query_hash)
            if analysis:
                report['query_analysis'][query_hash] = analysis.to_dict()
                
                # Identify slow queries
                if analysis.avg_time > self.config.slow_query_threshold:
                    report['slow_queries'].append({
                        'query_hash': query_hash,
                        'avg_time': analysis.avg_time,
                        'execution_count': analysis.execution_count,
                        'suggestions': analysis.optimization_suggestions
                    })
                
                # Identify frequent queries
                if analysis.execution_count > 100:
                    report['frequent_queries'].append({
                        'query_hash': query_hash,
                        'execution_count': analysis.execution_count,
                        'total_time': analysis.total_time,
                        'suggestions': analysis.optimization_suggestions
                    })
        
        # Sort by impact
        report['slow_queries'].sort(key=lambda x: x['avg_time'], reverse=True)
        report['frequent_queries'].sort(key=lambda x: x['total_time'], reverse=True)
        
        return report
    
    def reset_statistics(self):
        """Reset all query statistics."""
        self.query_stats.clear()
        self.logger.info("Query optimizer statistics reset")
    
    def export_statistics(self, filepath: str):
        """Export query statistics to file."""
        try:
            import json
            
            export_data = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'query_stats': {}
            }
            
            for query_hash, stats in self.query_stats.items():
                # Convert sets to lists for JSON serialization
                export_stats = dict(stats)
                export_stats['tables'] = list(export_stats['tables'])
                export_stats['columns'] = list(export_stats['columns'])
                
                # Convert datetime objects
                for query_info in export_stats['queries']:
                    query_info['timestamp'] = query_info['timestamp'].isoformat()
                
                export_data['query_stats'][query_hash] = export_stats
            
            with open(filepath, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            
            self.logger.info("Query statistics exported", file=filepath)
            
        except Exception as e:
            self.logger.error("Failed to export statistics", error=str(e))
            raise PerformanceError(f"Failed to export statistics: {e}")