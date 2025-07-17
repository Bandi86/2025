import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "../../../../../sp3/ml_pipeline/pdf_pipeline/db/labdarugas_meccsek.db"

@app.get("/api/matches")
def get_matches():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT id, forras, bajnoksag, kezd, home, away, odds_h, odds_d, odds_a, fogadas_tipus
        FROM matches
        ORDER BY kezd DESC
        LIMIT 100
    """)
    rows = c.fetchall()
    conn.close()
    matches = [
        {
            "id": row[0],
            "forras": row[1],
            "bajnoksag": row[2],
            "kezd": row[3],
            "home": row[4],
            "away": row[5],
            "odds_h": row[6],
            "odds_d": row[7],
            "odds_a": row[8],
            "fogadas_tipus": row[9],
        }
        for row in rows
    ]
    return JSONResponse(content={"matches": matches})
