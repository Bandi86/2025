#!/usr/bin/env python3
"""
📄 MAGYAR FOGADÁSI PDF FELDOLGOZÓ
Feldolgozza a magyar fogadóiroda PDF fájljait és kinyeri a meccs adatokat
"""

import PyPDF2
import pdfplumber
import re
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import requests
import os

@dataclass
class MatchInfo:
    """Meccs információk a PDF-ből"""
    match_id: str
    date: str
    time: str
    home_team: str
    away_team: str
    competition: str
    venue: Optional[str] = None

    # Odds adatok
    home_win_odds: Optional[float] = None
    draw_odds: Optional[float] = None
    away_win_odds: Optional[float] = None

    # További fogadási lehetőségek
    over_25_odds: Optional[float] = None
    under_25_odds: Optional[float] = None
    btts_yes_odds: Optional[float] = None  # Both teams to score
    btts_no_odds: Optional[float] = None

    # Szögletek
    corners_over_9_odds: Optional[float] = None
    corners_under_9_odds: Optional[float] = None

    # Sárga lapok
    cards_over_3_odds: Optional[float] = None
    cards_under_3_odds: Optional[float] = None

class HungarianBettingPDFProcessor:
    """Magyar fogadási PDF feldolgozó"""

    def __init__(self):
        self.pdf_cache_dir = "data/pdf_cache"
        os.makedirs(self.pdf_cache_dir, exist_ok=True)

        # Magyar csapat nevek normalizálása
        self.team_name_mapping = {
            # Premier League
            "Manchester City": ["Man City", "M. City", "Manchester C."],
            "Manchester United": ["Man United", "Man Utd", "Manchester U."],
            "Tottenham": ["Tottenham Hotspur", "Spurs"],
            "Newcastle": ["Newcastle United", "Newcastle Utd"],

            # La Liga
            "Athletic Bilbao": ["Athletic", "Ath. Bilbao"],
            "Real Sociedad": ["R. Sociedad", "Sociedad"],
            "Atletico Madrid": ["Atlético Madrid", "Atlético", "A. Madrid"],

            # Serie A
            "Juventus": ["Juve"],
            "AC Milan": ["Milan", "A.C. Milan"],
            "Inter Milan": ["Inter", "Internazionale"],

            # Bundesliga
            "Bayern Munich": ["Bayern München", "FC Bayern"],
            "Borussia Dortmund": ["B. Dortmund", "BVB"],
            "RB Leipzig": ["Leipzig"],

            # Magyar csapatok
            "Ferencváros": ["Ferencvárosi TC", "FTC", "Fradi"],
            "Újpest": ["Újpest FC"],
            "Debrecen": ["Debreceni VSC", "DVSC"],
        }

    def download_latest_pdf(self, pdf_url: str) -> str:
        """Legfrissebb PDF letöltése"""
        print("📄 PDF letöltése...")

        try:
            response = requests.get(pdf_url, timeout=30)
            response.raise_for_status()

            # Fájlnév generálása dátum alapján
            today = datetime.now().strftime('%Y%m%d')
            pdf_filename = f"betting_odds_{today}.pdf"
            pdf_path = os.path.join(self.pdf_cache_dir, pdf_filename)

            with open(pdf_path, 'wb') as f:
                f.write(response.content)

            print(f"✅ PDF letöltve: {pdf_path}")
            return pdf_path

        except Exception as e:
            print(f"❌ PDF letöltési hiba: {e}")
            return None

    def extract_text_from_pdf(self, pdf_path: str) -> List[str]:
        """PDF szöveg kinyerése"""
        print("📖 PDF szöveg feldolgozása...")

        try:
            # pdfplumber a jobb szöveg felismerésért
            with pdfplumber.open(pdf_path) as pdf:
                all_text = []

                for page_num, page in enumerate(pdf.pages):
                    print(f"   Oldal {page_num + 1}/{len(pdf.pages)}")
                    text = page.extract_text()
                    if text:
                        all_text.append(text)

                print(f"✅ {len(all_text)} oldal feldolgozva")
                return all_text

        except Exception as e:
            print(f"❌ PDF feldolgozási hiba: {e}")
            return []

    def parse_matches_from_text(self, text_pages: List[str]) -> List[MatchInfo]:
        """Meccsek kinyerése a szövegből"""
        print("⚽ Meccs adatok elemzése...")

        matches = []
        current_date = None
        current_competition = None

        for page_text in text_pages:
            lines = page_text.split('\n')

            for i, line in enumerate(lines):
                line = line.strip()

                # Dátum felismerése (pl: "2025. június 28., péntek")
                date_match = re.search(r'(\d{4})\.\s*(\w+)\s*(\d{1,2})\.,?\s*(\w+)', line)
                if date_match:
                    current_date = self._parse_hungarian_date(date_match.groups())
                    continue

                # Bajnokság felismerése
                competition_match = re.search(r'(Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League|Europa League|MLS|NB I)', line, re.IGNORECASE)
                if competition_match:
                    current_competition = competition_match.group(1)
                    continue

                # Meccs felismerése (pl: "15:30 Manchester City - Liverpool 2.10 3.40 3.20")
                match_pattern = r'(\d{1,2}:\d{2})\s+([^-]+)\s*-\s*([^0-9]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)'
                match_found = re.search(match_pattern, line)

                if match_found and current_date:
                    time_str, home_team, away_team, home_odds, draw_odds, away_odds = match_found.groups()

                    # Csapat nevek tisztítása
                    home_team = self._normalize_team_name(home_team.strip())
                    away_team = self._normalize_team_name(away_team.strip())

                    # Odds-ok konvertálása
                    try:
                        home_win_odds = float(home_odds)
                        draw_odds_val = float(draw_odds)
                        away_win_odds = float(away_odds)
                    except ValueError:
                        continue

                    # További odds keresése a következő sorokban
                    additional_odds = self._extract_additional_odds(lines, i + 1, i + 5)

                    match_info = MatchInfo(
                        match_id=f"{current_date}_{home_team}_{away_team}".replace(' ', '_'),
                        date=current_date,
                        time=time_str,
                        home_team=home_team,
                        away_team=away_team,
                        competition=current_competition or "Ismeretlen",
                        home_win_odds=home_win_odds,
                        draw_odds=draw_odds_val,
                        away_win_odds=away_win_odds,
                        **additional_odds
                    )

                    matches.append(match_info)

        print(f"✅ {len(matches)} meccs találva")
        return matches

    def _parse_hungarian_date(self, date_parts: Tuple[str, str, str, str]) -> str:
        """Magyar dátum feldolgozása"""
        year, month_name, day, weekday = date_parts

        hungarian_months = {
            'január': '01', 'február': '02', 'március': '03', 'április': '04',
            'május': '05', 'június': '06', 'július': '07', 'augusztus': '08',
            'szeptember': '09', 'október': '10', 'november': '11', 'december': '12'
        }

        month = hungarian_months.get(month_name.lower(), '01')
        day = day.zfill(2)

        return f"{year}-{month}-{day}"

    def _normalize_team_name(self, team_name: str) -> str:
        """Csapat név normalizálása"""
        team_name = team_name.strip()

        # Keresés a mapping-ben
        for standard_name, variations in self.team_name_mapping.items():
            if team_name in variations or team_name == standard_name:
                return standard_name

        return team_name

    def _extract_additional_odds(self, lines: List[str], start_idx: int, end_idx: int) -> Dict:
        """További odds kinyerése (gólok, szögletek, lapok)"""
        additional_odds = {}

        for i in range(start_idx, min(end_idx, len(lines))):
            line = lines[i].strip()

            # Over/Under 2.5 gólok
            over_under_match = re.search(r'(?:Over|Felett)\s*2[.,]5.*?([\d.]+).*?(?:Under|Alatt)\s*2[.,]5.*?([\d.]+)', line, re.IGNORECASE)
            if over_under_match:
                try:
                    additional_odds['over_25_odds'] = float(over_under_match.group(1))
                    additional_odds['under_25_odds'] = float(over_under_match.group(2))
                except ValueError:
                    pass

            # Both Teams to Score
            btts_match = re.search(r'(?:BTTS|Mindkét csapat góloz).*?(?:Igen|Yes).*?([\d.]+).*?(?:Nem|No).*?([\d.]+)', line, re.IGNORECASE)
            if btts_match:
                try:
                    additional_odds['btts_yes_odds'] = float(btts_match.group(1))
                    additional_odds['btts_no_odds'] = float(btts_match.group(2))
                except ValueError:
                    pass

            # Szögletek
            corners_match = re.search(r'(?:Szögletek|Corners).*?(?:Over|Felett)\s*9.*?([\d.]+).*?(?:Under|Alatt)\s*9.*?([\d.]+)', line, re.IGNORECASE)
            if corners_match:
                try:
                    additional_odds['corners_over_9_odds'] = float(corners_match.group(1))
                    additional_odds['corners_under_9_odds'] = float(corners_match.group(2))
                except ValueError:
                    pass

            # Sárga lapok
            cards_match = re.search(r'(?:Sárga lapok|Yellow cards).*?(?:Over|Felett)\s*3.*?([\d.]+).*?(?:Under|Alatt)\s*3.*?([\d.]+)', line, re.IGNORECASE)
            if cards_match:
                try:
                    additional_odds['cards_over_3_odds'] = float(cards_match.group(1))
                    additional_odds['cards_under_3_odds'] = float(cards_match.group(2))
                except ValueError:
                    pass

        return additional_odds

    def save_matches_to_json(self, matches: List[MatchInfo], output_file: str = None) -> str:
        """Meccsek mentése JSON fájlba"""
        if not output_file:
            today = datetime.now().strftime('%Y%m%d')
            output_file = f"data/daily_matches_{today}.json"

        # Matches objektumok átalakítása dict-té
        matches_dict = {
            'generated_at': datetime.now().isoformat(),
            'total_matches': len(matches),
            'matches': []
        }

        for match in matches:
            match_dict = {
                'match_id': match.match_id,
                'date': match.date,
                'time': match.time,
                'home_team': match.home_team,
                'away_team': match.away_team,
                'competition': match.competition,
                'venue': match.venue,
                'odds': {
                    'match_result': {
                        'home_win': match.home_win_odds,
                        'draw': match.draw_odds,
                        'away_win': match.away_win_odds
                    },
                    'total_goals': {
                        'over_25': match.over_25_odds,
                        'under_25': match.under_25_odds
                    },
                    'both_teams_score': {
                        'yes': match.btts_yes_odds,
                        'no': match.btts_no_odds
                    },
                    'corners': {
                        'over_9': match.corners_over_9_odds,
                        'under_9': match.corners_under_9_odds
                    },
                    'cards': {
                        'over_3': match.cards_over_3_odds,
                        'under_3': match.cards_under_3_odds
                    }
                }
            }
            matches_dict['matches'].append(match_dict)

        # JSON fájl mentése
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(matches_dict, f, indent=2, ensure_ascii=False)

        print(f"✅ Meccsek mentve: {output_file}")
        return output_file

    def filter_matches_by_date_range(self, matches: List[MatchInfo], days_ahead: int = 3) -> List[MatchInfo]:
        """Meccsek szűrése dátum szerint"""
        today = datetime.now().date()
        end_date = today + timedelta(days=days_ahead)

        filtered_matches = []

        for match in matches:
            try:
                match_date = datetime.strptime(match.date, '%Y-%m-%d').date()
                if today <= match_date <= end_date:
                    filtered_matches.append(match)
            except ValueError:
                continue

        return filtered_matches

    def get_matches_by_competition(self, matches: List[MatchInfo], competition: str) -> List[MatchInfo]:
        """Meccsek szűrése bajnokság szerint"""
        return [match for match in matches if competition.lower() in match.competition.lower()]

def main():
    """Demo futtatás"""
    processor = HungarianBettingPDFProcessor()

    print("📄 MAGYAR FOGADÁSI PDF FELDOLGOZÓ")
    print("=" * 50)

    # Demo: ha lenne PDF URL
    demo_pdf_url = "https://example.com/betting_odds.pdf"

    print("🎭 DEMO MINTA ADATOK GENERÁLÁSA...")

    # Minta adatok generálása teszteléshez
    demo_matches = [
        MatchInfo(
            match_id="2025-06-29_Manchester_City_Liverpool",
            date="2025-06-29",
            time="16:00",
            home_team="Manchester City",
            away_team="Liverpool FC",
            competition="Premier League",
            venue="Etihad Stadium",
            home_win_odds=2.10,
            draw_odds=3.40,
            away_win_odds=3.20,
            over_25_odds=1.85,
            under_25_odds=1.95,
            btts_yes_odds=1.75,
            btts_no_odds=2.05,
            corners_over_9_odds=1.90,
            corners_under_9_odds=1.90,
            cards_over_3_odds=2.10,
            cards_under_3_odds=1.70
        ),
        MatchInfo(
            match_id="2025-06-29_Real_Madrid_Barcelona",
            date="2025-06-29",
            time="20:00",
            home_team="Real Madrid",
            away_team="FC Barcelona",
            competition="La Liga",
            venue="Santiago Bernabéu",
            home_win_odds=2.25,
            draw_odds=3.20,
            away_win_odds=3.10,
            over_25_odds=1.80,
            under_25_odds=2.00,
            btts_yes_odds=1.65,
            btts_no_odds=2.20,
            corners_over_9_odds=1.95,
            corners_under_9_odds=1.85,
            cards_over_3_odds=1.85,
            cards_under_3_odds=1.95
        ),
        MatchInfo(
            match_id="2025-06-30_Bayern_Munich_Dortmund",
            date="2025-06-30",
            time="18:30",
            home_team="Bayern Munich",
            away_team="Borussia Dortmund",
            competition="Bundesliga",
            venue="Allianz Arena",
            home_win_odds=1.95,
            draw_odds=3.60,
            away_win_odds=3.80,
            over_25_odds=1.75,
            under_25_odds=2.05,
            btts_yes_odds=1.70,
            btts_no_odds=2.10,
            corners_over_9_odds=2.00,
            corners_under_9_odds=1.80,
            cards_over_3_odds=2.20,
            cards_under_3_odds=1.60
        )
    ]

    # JSON mentése
    json_file = processor.save_matches_to_json(demo_matches)

    # Szűrések bemutatása
    print(f"\n🔍 SZŰRÉSEK:")
    print(f"Összes meccs: {len(demo_matches)}")

    # Következő 3 nap meccsek
    upcoming_matches = processor.filter_matches_by_date_range(demo_matches, 3)
    print(f"Következő 3 nap: {len(upcoming_matches)}")

    # Premier League meccsek
    pl_matches = processor.get_matches_by_competition(demo_matches, "Premier League")
    print(f"Premier League: {len(pl_matches)}")

    # Részletes meccs információk
    print(f"\n⚽ RÉSZLETES MECCS INFORMÁCIÓK:")
    print("=" * 50)

    for match in demo_matches:
        print(f"\n🏟️ {match.home_team} vs {match.away_team}")
        print(f"   📅 {match.date} {match.time}")
        print(f"   🏆 {match.competition}")
        print(f"   💰 1X2: {match.home_win_odds} / {match.draw_odds} / {match.away_win_odds}")

        if match.over_25_odds:
            print(f"   ⚽ Gólok: Over 2.5 ({match.over_25_odds}) / Under 2.5 ({match.under_25_odds})")

        if match.btts_yes_odds:
            print(f"   🎯 BTTS: Igen ({match.btts_yes_odds}) / Nem ({match.btts_no_odds})")

        if match.corners_over_9_odds:
            print(f"   📐 Szögletek: Over 9 ({match.corners_over_9_odds}) / Under 9 ({match.corners_under_9_odds})")

        if match.cards_over_3_odds:
            print(f"   🟨 Lapok: Over 3 ({match.cards_over_3_odds}) / Under 3 ({match.cards_under_3_odds})")

    print(f"\n✅ JSON fájl elkészült: {json_file}")
    print("💡 Most már használhatod a meccs adatokat predikciókhoz!")

if __name__ == "__main__":
    main()
