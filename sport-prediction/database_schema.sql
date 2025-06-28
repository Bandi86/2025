-- =====================================================
-- SZERENCSEMIX FOOTBALL DATABASE SCHEMA
-- =====================================================
-- Célja: Történelmi és jövőbeli futball meccs adatok tárolása
-- Verzió: 1.0
-- Dátum: 2025-06-28
-- =====================================================

-- Adatbázis beállítások
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- =====================================================
-- 1. CSAPAT ADATOK
-- =====================================================

-- Csapatok törzsadatai
CREATE TABLE teams (
    team_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL UNIQUE,
    alternative_names TEXT, -- JSON array: ["Man Utd", "MUFC", "Manchester United"]
    country VARCHAR(50),
    league_tier INTEGER DEFAULT 1, -- 1=első osztály, 2=másodosztály, stb.
    active_since DATE,
    last_seen DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Egyedi kulcs
    UNIQUE(normalized_name)
);

-- Csapat statisztikák szezonokra/ligákra bontva
CREATE TABLE team_statistics (
    stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    season VARCHAR(20) NOT NULL, -- "2024/25"
    league VARCHAR(100) NOT NULL,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    position INTEGER,
    form_last_5 VARCHAR(10), -- "WDLWW"
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    UNIQUE(team_id, season, league)
);

-- =====================================================
-- 2. MECCS ADATOK
-- =====================================================

-- Múltbeli meccsek (eredményekkel)
CREATE TABLE historical_matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    time TIME,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_team_id INTEGER, -- FK link teams táblára
    away_team_id INTEGER, -- FK link teams táblára
    league VARCHAR(100) NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    match_status VARCHAR(20) DEFAULT 'completed', -- completed/cancelled/postponed
    round_number INTEGER,
    matchday INTEGER,
    season VARCHAR(20), -- "2024/25"
    source_pdf VARCHAR(255),
    extraction_confidence REAL DEFAULT 0.0, -- 0.0-1.0
    manual_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
);

-- Jövőbeli meccsek (eredmények nélkül)
CREATE TABLE future_matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    time TIME,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_team_id INTEGER, -- FK link teams táblára
    away_team_id INTEGER, -- FK link teams táblára
    league VARCHAR(100) NOT NULL,
    round_number INTEGER,
    matchday INTEGER,
    season VARCHAR(20), -- "2024/25"
    betting_odds TEXT, -- JSON: {"1": 2.5, "X": 3.2, "2": 2.8, "Over2.5": 1.8}
    source_pdf VARCHAR(255),
    extraction_confidence REAL DEFAULT 0.0,
    prediction_generated BOOLEAN DEFAULT FALSE,
    predicted_result TEXT, -- JSON: {"home_win_prob": 0.6, "draw_prob": 0.2, "away_win_prob": 0.2}
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
    FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
);

-- =====================================================
-- 3. LIGA TÁBLÁZATOK
-- =====================================================

-- Liga táblázat snapshots (időpont specifikus)
CREATE TABLE league_tables (
    table_id INTEGER PRIMARY KEY AUTOINCREMENT,
    league VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL,
    matchday INTEGER,
    snapshot_date DATE NOT NULL,
    team_id INTEGER,
    team_name VARCHAR(100) NOT NULL, -- Denormalizált a gyorsaságért
    position INTEGER NOT NULL,
    points INTEGER NOT NULL,
    matches_played INTEGER NOT NULL,
    wins INTEGER NOT NULL,
    draws INTEGER NOT NULL,
    losses INTEGER NOT NULL,
    goals_for INTEGER NOT NULL,
    goals_against INTEGER NOT NULL,
    goal_difference INTEGER NOT NULL,
    source_pdf VARCHAR(255),
    extraction_confidence REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    UNIQUE(league, season, matchday, team_id)
);

-- =====================================================
-- 4. FOGADÁSI ADATOK
-- =====================================================

-- Fogadási szorzók
CREATE TABLE betting_odds (
    odds_id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER,
    match_type VARCHAR(20) NOT NULL, -- 'historical' vagy 'future'
    bet_type VARCHAR(50) NOT NULL, -- "1X2", "Over/Under 2.5", "Both Teams Score"
    odds_1 DECIMAL(5,2), -- Hazai győzelem
    odds_x DECIMAL(5,2), -- Döntetlen
    odds_2 DECIMAL(5,2), -- Vendég győzelem
    odds_over DECIMAL(5,2), -- Over szorzó
    odds_under DECIMAL(5,2), -- Under szorzó
    odds_btts_yes DECIMAL(5,2), -- Both teams score - igen
    odds_btts_no DECIMAL(5,2), -- Both teams score - nem
    bookmaker VARCHAR(50) DEFAULT 'SzerencseMix',
    source_pdf VARCHAR(255),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

    -- Dinamikus foreign key (historical_matches vagy future_matches)
);

-- =====================================================
-- 5. METAADATOK ÉS NAPLÓZÁS
-- =====================================================

-- PDF feldolgozási napló
CREATE TABLE extraction_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pdf_filename VARCHAR(255) NOT NULL,
    pdf_path VARCHAR(500) NOT NULL,
    processing_started DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_completed DATETIME,
    status VARCHAR(20) NOT NULL, -- 'processing', 'completed', 'failed', 'manual_review'
    records_extracted INTEGER DEFAULT 0,
    matches_found INTEGER DEFAULT 0,
    tables_found INTEGER DEFAULT 0,
    odds_found INTEGER DEFAULT 0,
    avg_confidence REAL DEFAULT 0.0,
    error_message TEXT,
    manual_review_needed BOOLEAN DEFAULT FALSE,
    reviewed_by VARCHAR(100),
    review_notes TEXT
);

-- Kézi javítások naplója
CREATE TABLE manual_corrections (
    correction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(50) NOT NULL, -- melyik táblában
    record_id INTEGER NOT NULL, -- melyik rekordban
    field_name VARCHAR(50) NOT NULL, -- melyik mezőben
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    corrected_by VARCHAR(100),
    corrected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE
);

-- Adatminőségi metrikák
CREATE TABLE data_quality_metrics (
    metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value REAL NOT NULL,
    metric_target REAL,
    measurement_date DATE DEFAULT (date('now')),
    details TEXT -- JSON további információkhoz
);

-- =====================================================
-- INDEXEK LÉTREHOZÁSA
-- =====================================================

-- Teams táblához
CREATE INDEX idx_teams_name ON teams(team_name);
CREATE INDEX idx_teams_country ON teams(country);

-- Team statistics táblához
CREATE INDEX idx_team_stats_season ON team_statistics(season);
CREATE INDEX idx_team_stats_league ON team_statistics(league);

-- Historical matches táblához
CREATE INDEX idx_historical_date ON historical_matches(date);
CREATE INDEX idx_historical_league ON historical_matches(league);
CREATE INDEX idx_historical_season ON historical_matches(season);
CREATE INDEX idx_historical_teams ON historical_matches(home_team, away_team);
CREATE INDEX idx_historical_confidence ON historical_matches(extraction_confidence);

-- Future matches táblához
CREATE INDEX idx_future_date ON future_matches(date);
CREATE INDEX idx_future_league ON future_matches(league);
CREATE INDEX idx_future_season ON future_matches(season);
CREATE INDEX idx_future_teams ON future_matches(home_team, away_team);

-- League tables táblához
CREATE INDEX idx_league_tables_league_season ON league_tables(league, season);
CREATE INDEX idx_league_tables_date ON league_tables(snapshot_date);
CREATE INDEX idx_league_tables_position ON league_tables(position);

-- Betting odds táblához
CREATE INDEX idx_betting_match ON betting_odds(match_id, match_type);
CREATE INDEX idx_betting_type ON betting_odds(bet_type);
CREATE INDEX idx_betting_timestamp ON betting_odds(timestamp);

-- Extraction logs táblához
CREATE INDEX idx_extraction_status ON extraction_logs(status);
CREATE INDEX idx_extraction_date ON extraction_logs(processing_started);
CREATE INDEX idx_extraction_filename ON extraction_logs(pdf_filename);

-- Manual corrections táblához
CREATE INDEX idx_corrections_table ON manual_corrections(table_name);
CREATE INDEX idx_corrections_date ON manual_corrections(corrected_at);

-- Data quality metrics táblához
CREATE INDEX idx_quality_name ON data_quality_metrics(metric_name);
CREATE INDEX idx_quality_date ON data_quality_metrics(measurement_date);

-- =====================================================
-- 6. SEGÉDTÁBLÁK ÉS VIEWS
-- =====================================================

-- Gyakran használt lekérdezések optimalizálása
CREATE VIEW v_recent_matches AS
SELECT
    h.match_id,
    h.date,
    h.time,
    h.home_team,
    h.away_team,
    h.home_score,
    h.away_score,
    h.league,
    h.season,
    h.extraction_confidence,
    CASE
        WHEN h.home_score > h.away_score THEN 'H'
        WHEN h.home_score < h.away_score THEN 'A'
        ELSE 'D'
    END as result
FROM historical_matches h
WHERE h.date >= date('now', '-30 days')
AND h.match_status = 'completed'
ORDER BY h.date DESC;

-- Csapat form táblázat (utolsó 5 meccs)
CREATE VIEW v_team_form AS
SELECT
    team_name,
    league,
    season,
    COUNT(*) as matches_played,
    SUM(CASE WHEN result = 'W' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
    SUM(CASE WHEN result = 'L' THEN 1 ELSE 0 END) as losses,
    GROUP_CONCAT(result, '') as form_string
FROM (
    SELECT
        home_team as team_name,
        league,
        season,
        date,
        CASE
            WHEN home_score > away_score THEN 'W'
            WHEN home_score < away_score THEN 'L'
            ELSE 'D'
        END as result
    FROM historical_matches
    WHERE match_status = 'completed'

    UNION ALL

    SELECT
        away_team as team_name,
        league,
        season,
        date,
        CASE
            WHEN away_score > home_score THEN 'W'
            WHEN away_score < home_score THEN 'L'
            ELSE 'D'
        END as result
    FROM historical_matches
    WHERE match_status = 'completed'
) team_matches
GROUP BY team_name, league, season;

-- Liga aktuális állás
CREATE VIEW v_current_league_standings AS
SELECT
    lt.*,
    ROW_NUMBER() OVER (PARTITION BY league, season ORDER BY snapshot_date DESC) as recency_rank
FROM league_tables lt
WHERE recency_rank = 1
ORDER BY league, position;

-- =====================================================
-- 7. KEZDŐ ADATOK ÉS KONFIGURÁCIÓ
-- =====================================================

-- Alapvető adatminőségi metrikák beszúrása
INSERT INTO data_quality_metrics (metric_name, metric_value, metric_target) VALUES
('extraction_success_rate', 0.0, 0.95),
('team_name_match_rate', 0.0, 0.90),
('confidence_avg', 0.0, 0.85),
('manual_review_rate', 0.0, 0.10),
('duplicate_rate', 0.0, 0.05);

-- =====================================================
-- 8. TRIGGER-EK ÉS AUTOMATIZÁLÁS
-- =====================================================

-- Automatikus updated_at frissítés
CREATE TRIGGER tr_teams_updated_at
    AFTER UPDATE ON teams
    FOR EACH ROW
BEGIN
    UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE team_id = NEW.team_id;
END;

CREATE TRIGGER tr_historical_matches_updated_at
    AFTER UPDATE ON historical_matches
    FOR EACH ROW
BEGIN
    UPDATE historical_matches SET updated_at = CURRENT_TIMESTAMP WHERE match_id = NEW.match_id;
END;

CREATE TRIGGER tr_future_matches_updated_at
    AFTER UPDATE ON future_matches
    FOR EACH ROW
BEGIN
    UPDATE future_matches SET updated_at = CURRENT_TIMESTAMP WHERE match_id = NEW.match_id;
END;

-- =====================================================
-- ADATBÁZIS SÉMA KÉSZ
-- =====================================================
-- Táblák: 8 fő tábla + 3 view
-- Indexek: Optimalizált lekérdezésekhez
-- Trigger-ek: Automatikus metaadat kezelés
-- Foreign Key-k: Referenciális integritás
-- =====================================================
