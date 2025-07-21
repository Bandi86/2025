const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'flashscore.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Leagues (
      league_id TEXT PRIMARY KEY,
      name TEXT,
      country TEXT,
      season TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Matches (
      match_id TEXT PRIMARY KEY,
      league_id TEXT,
      home_team TEXT,
      away_team TEXT,
      match_datetime TEXT,
      status TEXT,
      final_score TEXT,
      half_time_score TEXT,
      flashscore_url TEXT,
      FOREIGN KEY (league_id) REFERENCES Leagues(league_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS MatchEvents (
      event_id TEXT PRIMARY KEY,
      match_id TEXT,
      event_type TEXT,
      minute INTEGER,
      player_name TEXT,
      description TEXT,
      FOREIGN KEY (match_id) REFERENCES Matches(match_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS MatchStats (
      stat_id TEXT PRIMARY KEY,
      match_id TEXT,
      stat_name TEXT,
      home_value TEXT,
      away_value TEXT,
      FOREIGN KEY (match_id) REFERENCES Matches(match_id)
    )
  `);
});

// Function to insert league
function insertLeague(league) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT OR REPLACE INTO Leagues (league_id, name, country, season) VALUES (?, ?, ?, ?)`
      , [league.league_id, league.name, league.country, league.season], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Similar functions for other tables
// insertMatch, insertEvent, insertStat

function insertMatch(match) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT OR REPLACE INTO Matches (match_id, league_id, home_team, away_team, match_datetime, status, final_score, half_time_score, flashscore_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [match.match_id, match.league_id, match.home_team, match.away_team, match.match_datetime, match.status, match.final_score, match.half_time_score, match.flashscore_url], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function insertMatchEvent(event) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO MatchEvents (event_id, match_id, event_type, minute, player_name, description) VALUES (?, ?, ?, ?, ?, ?)`
      , [event.event_id, event.match_id, event.event_type, event.minute, event.player_name, event.description], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function insertMatchStat(stat) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO MatchStats (stat_id, match_id, stat_name, home_value, away_value) VALUES (?, ?, ?, ?, ?)`
      , [stat.stat_id, stat.match_id, stat.stat_name, stat.home_value, stat.away_value], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { db, insertLeague, insertMatch, insertMatchEvent, insertMatchStat };