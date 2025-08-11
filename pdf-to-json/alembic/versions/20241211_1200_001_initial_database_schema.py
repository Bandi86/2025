"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2024-12-11 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create schemas
    op.execute('CREATE SCHEMA IF NOT EXISTS automation')
    op.execute('CREATE SCHEMA IF NOT EXISTS football')
    op.execute('CREATE SCHEMA IF NOT EXISTS monitoring')
    
    # Create extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')
    
    # Create automation.jobs table
    op.create_table('jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('job_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('file_path', sa.Text(), nullable=True),
        sa.Column('parameters', sa.JSON(), nullable=True),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('progress_percent', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('current_stage', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('max_retries', sa.Integer(), nullable=True, server_default='3'),
        sa.PrimaryKeyConstraint('id'),
        schema='automation'
    )
    op.create_index('idx_jobs_status', 'jobs', ['status'], schema='automation')
    op.create_index('idx_jobs_created_at', 'jobs', ['created_at'], schema='automation')
    op.create_index('idx_jobs_job_type', 'jobs', ['job_type'], schema='automation')
    
    # Create automation.job_logs table
    op.create_table('job_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('level', sa.String(length=10), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('stage', sa.String(length=100), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['automation.jobs.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='automation'
    )
    op.create_index('idx_job_logs_job_id', 'job_logs', ['job_id'], schema='automation')
    op.create_index('idx_job_logs_timestamp', 'job_logs', ['timestamp'], schema='automation')
    
    # Create automation.system_metrics table
    op.create_table('system_metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('component', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='automation'
    )
    op.create_index('idx_system_metrics_timestamp', 'system_metrics', ['timestamp'], schema='automation')
    op.create_index('idx_system_metrics_name', 'system_metrics', ['metric_name'], schema='automation')
    op.create_index('idx_system_metrics_component', 'system_metrics', ['component'], schema='automation')
    
    # Create football.games table
    op.create_table('games',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('league', sa.String(length=100), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('iso_date', sa.String(length=20), nullable=False),
        sa.Column('time', sa.String(length=10), nullable=False),
        sa.Column('home_team', sa.String(length=100), nullable=False),
        sa.Column('away_team', sa.String(length=100), nullable=False),
        sa.Column('original_home_team', sa.String(length=100), nullable=False),
        sa.Column('original_away_team', sa.String(length=100), nullable=False),
        sa.Column('main_market', sa.JSON(), nullable=True),
        sa.Column('additional_markets', sa.JSON(), nullable=True),
        sa.Column('processing_metadata', sa.JSON(), nullable=True),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('confidence_scores', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        schema='football'
    )
    op.create_index('idx_games_league', 'games', ['league'], schema='football')
    op.create_index('idx_games_date', 'games', ['date'], schema='football')
    op.create_index('idx_games_teams', 'games', ['home_team', 'away_team'], schema='football')
    op.create_index('idx_games_created_at', 'games', ['created_at'], schema='football')
    
    # Create football.processing_reports table
    op.create_table('processing_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=True),
        sa.Column('summary', sa.JSON(), nullable=True),
        sa.Column('anomalies', sa.JSON(), nullable=True),
        sa.Column('trends', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='football'
    )
    
    # Create monitoring.alerts table
    op.create_table('alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('triggered_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True, server_default='active'),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='monitoring'
    )
    op.create_index('idx_alerts_status', 'alerts', ['status'], schema='monitoring')
    op.create_index('idx_alerts_triggered_at', 'alerts', ['triggered_at'], schema='monitoring')
    op.create_index('idx_alerts_type', 'alerts', ['alert_type'], schema='monitoring')
    
    # Create monitoring.webhooks table
    op.create_table('webhooks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('events', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('secret', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('last_triggered', sa.DateTime(timezone=True), nullable=True),
        sa.Column('success_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('failure_count', sa.Integer(), nullable=True, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        schema='monitoring'
    )
    
    # Create trigger function for updated_at
    op.execute("""
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """)
    
    # Create trigger for games table
    op.execute("""
    CREATE TRIGGER update_games_updated_at 
        BEFORE UPDATE ON football.games 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    
    # Create views
    op.execute("""
    CREATE OR REPLACE VIEW automation.job_summary AS
    SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
    FROM automation.jobs 
    WHERE started_at IS NOT NULL
    GROUP BY status;
    """)
    
    op.execute("""
    CREATE OR REPLACE VIEW football.daily_game_summary AS
    SELECT 
        date,
        league,
        COUNT(*) as game_count,
        AVG(quality_score) as avg_quality_score
    FROM football.games 
    GROUP BY date, league
    ORDER BY date DESC, league;
    """)
    
    op.execute("""
    CREATE OR REPLACE VIEW monitoring.alert_summary AS
    SELECT 
        alert_type,
        severity,
        COUNT(*) as total_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        MAX(triggered_at) as last_triggered
    FROM monitoring.alerts 
    GROUP BY alert_type, severity
    ORDER BY last_triggered DESC;
    """)


def downgrade() -> None:
    # Drop views
    op.execute('DROP VIEW IF EXISTS monitoring.alert_summary')
    op.execute('DROP VIEW IF EXISTS football.daily_game_summary')
    op.execute('DROP VIEW IF EXISTS automation.job_summary')
    
    # Drop trigger and function
    op.execute('DROP TRIGGER IF EXISTS update_games_updated_at ON football.games')
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column()')
    
    # Drop tables
    op.drop_table('webhooks', schema='monitoring')
    op.drop_table('alerts', schema='monitoring')
    op.drop_table('processing_reports', schema='football')
    op.drop_table('games', schema='football')
    op.drop_table('system_metrics', schema='automation')
    op.drop_table('job_logs', schema='automation')
    op.drop_table('jobs', schema='automation')
    
    # Drop schemas
    op.execute('DROP SCHEMA IF EXISTS monitoring CASCADE')
    op.execute('DROP SCHEMA IF EXISTS football CASCADE')
    op.execute('DROP SCHEMA IF EXISTS automation CASCADE')