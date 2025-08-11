-- Football Automation Database Initialization Script

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- This script runs after the database is created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS automation;
CREATE SCHEMA IF NOT EXISTS football;
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Set default search path
ALTER DATABASE football_automation SET search_path TO automation, football, monitoring, public;

-- Create automation tables
CREATE TABLE IF NOT EXISTS automation.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 2,
    file_path TEXT,
    parameters JSONB,
    result JSONB,
    error_message TEXT,
    progress_percent FLOAT DEFAULT 0.0,
    current_stage VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

CREATE TABLE IF NOT EXISTS automation.job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES automation.jobs(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stage VARCHAR(100),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS automation.system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    tags JSONB,
    component VARCHAR(50)
);

-- Create football data tables
CREATE TABLE IF NOT EXISTS football.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    iso_date VARCHAR(20) NOT NULL,
    time VARCHAR(10) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    original_home_team VARCHAR(100) NOT NULL,
    original_away_team VARCHAR(100) NOT NULL,
    main_market JSONB,
    additional_markets JSONB,
    processing_metadata JSONB,
    quality_score FLOAT,
    confidence_scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS football.processing_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB NOT NULL,
    file_path TEXT,
    summary JSONB,
    anomalies JSONB,
    trends JSONB
);

-- Create monitoring tables
CREATE TABLE IF NOT EXISTS monitoring.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS monitoring.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON automation.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON automation.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON automation.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON automation.job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_timestamp ON automation.job_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_games_league ON football.games(league);
CREATE INDEX IF NOT EXISTS idx_games_date ON football.games(date);
CREATE INDEX IF NOT EXISTS idx_games_teams ON football.games(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON football.games(created_at);

CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON automation.system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON automation.system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_component ON automation.system_metrics(component);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON monitoring.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON monitoring.alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON monitoring.alerts(alert_type);

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at 
    BEFORE UPDATE ON football.games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW automation.job_summary AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM automation.jobs 
WHERE started_at IS NOT NULL
GROUP BY status;

CREATE OR REPLACE VIEW football.daily_game_summary AS
SELECT 
    date,
    league,
    COUNT(*) as game_count,
    AVG(quality_score) as avg_quality_score
FROM football.games 
GROUP BY date, league
ORDER BY date DESC, league;

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

-- Insert default configuration data
INSERT INTO monitoring.webhooks (url, events, is_active) VALUES
('http://localhost:8000/webhooks/test', ARRAY['processing_completed', 'system_error'], false)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA automation TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA football TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA monitoring TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA automation TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA football TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA monitoring TO postgres;