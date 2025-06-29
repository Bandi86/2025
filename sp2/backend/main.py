#!/usr/bin/env python3
"""
SzerencseMix FastAPI Backend v2.0
Sport fogadási adatok API szerver
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

# Database path
DB_PATH = Path(__file__).parent.parent / "shared" / "data" / "optimized_sport_data.db"

# Pydantic models
class BettingOption(BaseModel):
    bet_type: str
    bet_description: str
    odds_1: Optional[float] = None
    odds_2: Optional[float] = None
    odds_3: Optional[float] = None
    raw_line: Optional[str] = None
    line_number: Optional[int] = None

class Match(BaseModel):
    id: int
    match_id: str
    team_home: str
    team_away: str
    match_time: Optional[str] = None
    match_day: Optional[str] = None
    source_pdf: Optional[str] = None
    extracted_at: Optional[str] = None
    betting_options: List[BettingOption] = []

class MatchLegacy(BaseModel):
    """Visszafelé kompatibilitás - régi formátum"""
    id: int
    match_id: Optional[str] = None
    teams: str
    time_info: Optional[str] = None
    day_info: Optional[str] = None
    odds_1: Optional[float] = None
    odds_2: Optional[float] = None
    odds_3: Optional[float] = None
    match_type: Optional[str] = None
    raw_line: Optional[str] = None
    source_pdf: Optional[str] = None
    extracted_at: Optional[str] = None

class MatchFilters(BaseModel):
    day_info: Optional[str] = None
    team: Optional[str] = None
    match_type: Optional[str] = None
    source_pdf: Optional[str] = None

# FastAPI app
app = FastAPI(
    title="SzerencseMix API v2.0",
    description="Sport fogadási adatok kezelése és megjelenítése",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    """Database kapcsolat létrehozása"""
    if not DB_PATH.exists():
        raise HTTPException(status_code=500, detail=f"Database nem található: {DB_PATH}")

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # Dict-szerű hozzáférés
    return conn

@app.get("/")
async def root():
    """API státusz"""
    return {
        "message": "SzerencseMix API v2.0",
        "status": "running",
        "database": "connected" if DB_PATH.exists() else "missing",
        "docs": "/docs"
    }

@app.get("/api/matches", response_model=Dict[str, Any])
async def get_matches(
    limit: int = Query(default=50, le=1000, description="Maximális eredmények száma"),
    offset: int = Query(default=0, ge=0, description="Eltolás (paginálás)"),
    day_info: Optional[str] = Query(default=None, description="Nap információ"),
    team: Optional[str] = Query(default=None, description="Csapat név (részleges keresés)"),
    bet_type: Optional[str] = Query(default=None, description="Fogadási típus"),
    source_pdf: Optional[str] = Query(default=None, description="Forrás PDF"),
    sort_by: Optional[str] = Query(default="time", description="Rendezési mező: time, team, id"),
    sort_order: Optional[str] = Query(default="desc", description="Rendezési irány: asc, desc")
):
    """Meccsek listázása a fogadási opciókkal együtt"""

    try:
        conn = get_db_connection()

        # Base query for matches with betting options
        query = """
        SELECT m.id, m.match_id, m.team_home, m.team_away, m.match_time, m.match_day,
               m.source_pdf, m.extracted_at,
               b.bet_type, b.bet_description, b.odds_1, b.odds_2, b.odds_3,
               b.raw_line, b.line_number
        FROM matches m
        LEFT JOIN betting_options b ON m.match_id = b.match_id
        WHERE 1=1
        """
        params = []

        # Szűrők alkalmazása
        if day_info:
            query += " AND m.match_day LIKE ?"
            params.append(f"%{day_info}%")

        if team:
            query += " AND (m.team_home LIKE ? OR m.team_away LIKE ?)"
            params.extend([f"%{team}%", f"%{team}%"])

        if bet_type:
            query += " AND b.bet_type LIKE ?"
            params.append(f"%{bet_type}%")

        if source_pdf:
            query += " AND m.source_pdf LIKE ?"
            params.append(f"%{source_pdf}%")

        # Sorting
        sort_field_map = {
            "time": "m.match_time",
            "team": "m.team_home",
            "id": "m.id"
        }

        sort_field = sort_field_map.get(sort_by, "m.id")
        sort_direction = "ASC" if sort_order.lower() == "asc" else "DESC"

        query += f" ORDER BY {sort_field} {sort_direction}, b.bet_type"

        # Execute query
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()

        # Group by match_id
        matches_dict = {}
        for row in rows:
            match_id = row["match_id"]

            if match_id not in matches_dict:
                matches_dict[match_id] = {
                    "id": row["id"],
                    "match_id": row["match_id"],
                    "team_home": row["team_home"],
                    "team_away": row["team_away"],
                    "match_time": row["match_time"],
                    "match_day": row["match_day"],
                    "source_pdf": row["source_pdf"],
                    "extracted_at": row["extracted_at"],
                    "betting_options": []
                }

            # Add betting option if exists
            if row["bet_type"]:
                matches_dict[match_id]["betting_options"].append({
                    "bet_type": row["bet_type"],
                    "bet_description": row["bet_description"],
                    "odds_1": row["odds_1"],
                    "odds_2": row["odds_2"],
                    "odds_3": row["odds_3"],
                    "raw_line": row["raw_line"],
                    "line_number": row["line_number"]
                })

        # Convert to list and apply pagination
        matches = list(matches_dict.values())
        total_count = len(matches)

        # Apply pagination
        paginated_matches = matches[offset:offset + limit]

        # Close connection
        conn.close()

        return {
            "matches": paginated_matches,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(paginated_matches) < total_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database hiba: {str(e)}")

@app.get("/api/statistics")
async def get_statistics():
    """Statisztikák lekérése az új adatbázis struktúrával"""

    try:
        conn = get_db_connection()

        # Total matches
        cursor = conn.execute("SELECT COUNT(*) as total FROM matches")
        total_matches = cursor.fetchone()["total"]

        # Total betting options
        cursor = conn.execute("SELECT COUNT(*) as total FROM betting_options")
        total_betting_options = cursor.fetchone()["total"]

        # Average betting options per match
        avg_bets_per_match = total_betting_options / total_matches if total_matches > 0 else 0

        # Betting options by type
        cursor = conn.execute("""
            SELECT bet_type, COUNT(*) as count
            FROM betting_options
            WHERE bet_type IS NOT NULL
            GROUP BY bet_type
            ORDER BY count DESC
        """)
        bet_types = [dict(row) for row in cursor.fetchall()]

        # Matches by source PDF
        cursor = conn.execute("""
            SELECT source_pdf, COUNT(*) as count
            FROM matches
            WHERE source_pdf IS NOT NULL
            GROUP BY source_pdf
            ORDER BY count DESC
            LIMIT 10
        """)
        source_pdfs = [dict(row) for row in cursor.fetchall()]

        # Recent matches by day
        cursor = conn.execute("""
            SELECT match_day, COUNT(*) as count
            FROM matches
            WHERE match_day IS NOT NULL
            GROUP BY match_day
            ORDER BY count DESC
            LIMIT 7
        """)
        match_days = [dict(row) for row in cursor.fetchall()]

        # Top teams by home games
        cursor = conn.execute("""
            SELECT team_home as team, COUNT(*) as count
            FROM matches
            WHERE team_home IS NOT NULL
            GROUP BY team_home
            ORDER BY count DESC
            LIMIT 10
        """)
        top_teams = [dict(row) for row in cursor.fetchall()]

        conn.close()

        return {
            "total_matches": total_matches,
            "total_betting_options": total_betting_options,
            "avg_bets_per_match": round(avg_bets_per_match, 2),
            "bet_types": bet_types,
            "source_pdfs": source_pdfs,
            "match_days": match_days,
            "top_teams": top_teams,
            "unique_sources": len(source_pdfs)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Statisztikák hiba: {str(e)}")

@app.get("/api/teams")
async def get_teams(search: Optional[str] = Query(default=None, description="Csapat keresés")):
    """Csapatok/Meccsek listázása"""

    try:
        conn = get_db_connection()

        if search:
            cursor = conn.execute("""
                SELECT DISTINCT teams
                FROM matches
                WHERE teams LIKE ?
                ORDER BY teams
                LIMIT 50
            """, [f"%{search}%"])
        else:
            cursor = conn.execute("""
                SELECT DISTINCT teams
                FROM matches
                WHERE teams IS NOT NULL
                ORDER BY teams
                LIMIT 100
            """)

        teams = [row["teams"] for row in cursor.fetchall()]

        conn.close()

        return {"teams": teams}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Csapatok lekérése hiba: {str(e)}")

@app.get("/api/sources")
async def get_sources():
    """PDF források listázása"""

    try:
        conn = get_db_connection()

        cursor = conn.execute("""
            SELECT source_pdf, COUNT(*) as matches_count
            FROM matches
            WHERE source_pdf IS NOT NULL
            GROUP BY source_pdf
            ORDER BY matches_count DESC
        """)

        sources = [dict(row) for row in cursor.fetchall()]

        conn.close()

        return {"sources": sources}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Források lekérése hiba: {str(e)}")

if __name__ == "__main__":
    print(f"🚀 SzerencseMix API v2.0 indítása...")
    print(f"📊 Database: {DB_PATH}")
    print(f"🌐 Frontend URL: http://localhost:3000")
    print(f"📖 API Docs: http://localhost:8000/docs")

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
