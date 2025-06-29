-- SP3 Project - Database Schema
-- This script initializes the PostgreSQL database with the required tables.
-- It is designed to be run automatically by Docker Compose on the first start.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for storing sports leagues
CREATE TABLE leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    league_id INT REFERENCES leagues(id),
    country VARCHAR(255),
    logo_url TEXT,
    -- For scraping and external references
    transfermarkt_url TEXT,
    value_eur BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing matches
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    home_team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    league_id INT NOT NULL REFERENCES leagues(id),
    match_date TIMESTAMPTZ NOT NULL,
    season VARCHAR(50) NOT NULL, -- e.g., '2024/2025'
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- e.g., SCHEDULED, IN_PLAY, FINISHED, POSTPONED
    home_goals INT,
    away_goals INT,
    -- Store complex data like weather, referee stats, etc.
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(home_team_id, away_team_id, match_date)
);

-- Table for storing odds from different bookmakers
CREATE TABLE odds (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    bookmaker VARCHAR(255) NOT NULL,
    -- Main 1X2 market
    home_win_odds DECIMAL(10, 4),
    draw_odds DECIMAL(10, 4),
    away_win_odds DECIMAL(10, 4),
    -- Other common markets
    over_under_2_5_over_odds DECIMAL(10, 4),
    over_under_2_5_under_odds DECIMAL(10, 4),
    btts_yes_odds DECIMAL(10, 4),
    btts_no_odds DECIMAL(10, 4),
    -- To track odds movement
    last_updated TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Each bookmaker can only have one set of odds per match
    UNIQUE(match_id, bookmaker)
);

-- Table for storing ML model predictions
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    model_version VARCHAR(100) NOT NULL,
    -- e.g., HOME_WIN, DRAW, AWAY_WIN, OVER_2.5
    predicted_outcome VARCHAR(100) NOT NULL,
    -- Probability of the outcome
    confidence DECIMAL(5, 4) NOT NULL,
    -- The calculated edge the model sees
    value_score DECIMAL(10, 4),
    -- The odds the model thinks are "fair"
    calculated_odds DECIMAL(10, 4),
    -- The market odds used for the value calculation
    market_odds DECIMAL(10, 4),
    prediction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track the virtual portfolio and its bets
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id INT REFERENCES predictions(id),
    match_id INT NOT NULL REFERENCES matches(id),
    -- The stake calculated by the Kelly Criterion
    stake_amount DECIMAL(10, 2) NOT NULL,
    -- The odds at which the bet was placed
    odds_placed DECIMAL(10, 4) NOT NULL,
    bet_type VARCHAR(100) NOT NULL, -- e.g., HOME_WIN
    -- PENDING, WON, LOST, VOID
    status VARCHAR(50) DEFAULT 'PENDING',
    potential_winnings DECIMAL(10, 2),
    actual_profit_loss DECIMAL(10, 2),
    placed_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for monthly portfolio performance tracking
CREATE TABLE portfolio_summary (
    id SERIAL PRIMARY KEY,
    month INT NOT NULL,
    year INT NOT NULL,
    starting_balance DECIMAL(12, 2) NOT NULL,
    ending_balance DECIMAL(12, 2),
    total_staked DECIMAL(12, 2) DEFAULT 0.00,
    total_profit_loss DECIMAL(12, 2) DEFAULT 0.00,
    roi DECIMAL(10, 4), -- Return on Investment
    win_rate DECIMAL(5, 4),
    total_bets INT DEFAULT 0,
    won_bets INT DEFAULT 0,
    lost_bets INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(month, year)
);

-- Create indexes for faster queries on foreign keys and common lookups
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_odds_match_bookmaker ON odds(match_id, bookmaker);
CREATE INDEX idx_predictions_match_model ON predictions(match_id, model_version);
CREATE INDEX idx_bets_status_date ON bets(status, placed_at);

-- Function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER set_timestamp
                        BEFORE UPDATE ON %I
                        FOR EACH ROW
                        EXECUTE PROCEDURE trigger_set_timestamp();', t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Pre-populate the leagues table with the target leagues
INSERT INTO leagues (name, country) VALUES
('Premier League', 'England'),
('Bundesliga', 'Germany'),
('La Liga', 'Spain'),
('Ligue 1', 'France'),
('Serie A', 'Italy');