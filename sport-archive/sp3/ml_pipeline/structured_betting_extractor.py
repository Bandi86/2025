#!/usr/bin/env python3
"""
🚀 STRUKTURÁLT FOGADÁSI ESEMÉNYEK KINYERŐ

Specializált PDF feldolgozó amely képes:
- Fogadási események felismerésére magyar formátumban
- Piacok csoportosítására egy meccshez
- Nem kívánt sportágak kiszűrésére
- Strukturált meccs adatok generálására
"""

import re
import json
import os
import pdfplumber
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict

@dataclass
class BettingMarket:
    """Fogadási piac"""
    market_type: str  # "1X2", "Both Teams To Score", "Over/Under", etc.
    odds: Dict[str, float]  # {"home": 1.83, "draw": 3.95, "away": 2.87}
    market_line: Optional[str] = None  # "2.5" for over/under, "+1" for handicap

@dataclass
class StructuredMatch:
    """Strukturált meccs adatok"""
    home_team: str
    away_team: str
    date: Optional[str] = None
    time: Optional[str] = None
    league: Optional[str] = None
    sport: str = "football"
    markets: List[BettingMarket] = None

    def __post_init__(self):
        if self.markets is None:
            self.markets = []

class StructuredBettingExtractor:
    """Strukturált fogadási események kinyerő"""

    def __init__(self):
        self.matches: List[StructuredMatch] = []
        self.current_date = None
        self.current_league = None

        # Nem kívánt sportágak
        self.excluded_sports = [
            "női", "noi", "women", "female", "ladies",
            "kézilabda", "handball", "kosárlabda", "basketball",
            "jégkorong", "hockey", "tenisz", "tennis",
            "amerikai foci", "american football", "rugby"
        ]

        # Liga mapping
        self.league_mapping = {
            "norvég": "Norwegian Division",
            "finn": "Finnish League",
            "magyar": "Hungarian League",
            "premier": "Premier League",
            "bundesliga": "Bundesliga",
            "la liga": "La Liga",
            "serie a": "Serie A",
            "ligue 1": "Ligue 1"
        }

    def extract_from_pdf(self, pdf_path: str) -> List[Dict]:
        """PDF feldolgozás és strukturált adatok kinyerése"""
        print(f"🚀 Strukturált PDF feldolgozás: {pdf_path}")

        self.matches = []

        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    print(f"📄 Oldal {page_num + 1} feldolgozása...")

                    # Szöveg kinyerése
                    text = page.extract_text()
                    if text:
                        try:
                            self._process_page_text(text)
                        except Exception as page_error:
                            print(f"⚠️ Oldal {page_num + 1} feldolgozási hiba: {page_error}")
                            # Folytatjuk a következő oldallal, ne álljon le

        except Exception as e:
            print(f"❌ PDF feldolgozási hiba: {e}")
            # Ne töröljük a self.matches-t, inkább visszaadjuk amit sikerült feldolgozni

        # Strukturált adatok visszaadása
        result = [self._match_to_dict(match) for match in self.matches]
        print(f"✅ {len(result)} meccs feldolgozva")

        return result

    def _process_page_text(self, text: str):
        """Oldal szövegének feldolgozása (robosztusabb meccs/piac csoportosítás)"""
        lines = text.split('\n')
        current_date = self.current_date
        current_league = self.current_league
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            # Dátum felismerése
            if self._is_date_line(line):
                current_date = self._parse_date_line(line)
                self.current_date = current_date
                print(f"[DATE] {i}: {line}")
                i += 1
                continue
            # Liga felismerése
            if self._is_league_line(line):
                current_league = self._parse_league_line(line)
                self.current_league = current_league
                print(f"[LEAGUE] {i}: {line}")
                i += 1
                continue
            # Fő meccs sor felismerése
            if self._is_main_match_line(line):
                print(f"[MATCH] {i}: {line}")
                match_info = self._parse_main_match_line(line)
                if match_info:
                    match = StructuredMatch(
                        home_team=match_info['home_team'],
                        away_team=match_info['away_team'],
                        date=current_date,
                        time=match_info['time'],
                        league=current_league,
                        sport="football",
                        markets=[BettingMarket(
                            market_type="1X2",
                            odds={
                                "home": match_info['odds_home'],
                                "draw": match_info['odds_draw'],
                                "away": match_info['odds_away']
                            }
                        )]
                    )
                    next_i = self._collect_additional_markets(lines, i+1, match)
                    self.matches.append(match)
                    i = next_i + 1
                    continue
            # Új: Liga/piac sor felismerése
            if hasattr(self, '_is_league_market_line') and self._is_league_market_line(line):
                print(f"[LEAGUE_MARKET] {i}: {line}")
                match_info = self._parse_league_market_line(line)
                if match_info:
                    # Odds dictionary létrehozása
                    odds_dict = match_info.get('odds_dict', {})
                    if 'value' in odds_dict:
                        # Egyszeres odds (pl. "1X2 döntetlen 2,45")
                        market_odds = {"value": odds_dict['value']}
                    elif 'option1' in odds_dict and 'option2' in odds_dict:
                        # Kettős vagy hármas odds
                        market_odds = odds_dict
                    else:
                        # Fallback: ha nem illeszkedik, akkor üres
                        market_odds = odds_dict

                    match = StructuredMatch(
                        home_team=match_info['home_team'],
                        away_team=match_info['away_team'],
                        date=current_date,
                        time=None,
                        league=current_league,
                        sport="football",
                        markets=[BettingMarket(
                            market_type=match_info['market_name'],
                            odds=market_odds
                        )]
                    )
                    self.matches.append(match)
                    print(f"✅ Meccs hozzáadva: {match.home_team} vs {match.away_team}")
                    i += 1
                    continue
            # Egyéb sorok
            if line:
                print(f"[SKIP] {i}: {line}")
            i += 1

    def _is_date_line(self, line: str) -> bool:
        """Dátum sor felismerése"""
        # "Kedd (2025. július 1.)"
        date_patterns = [
            r'(hétfő|kedd|szerda|csütörtök|péntek|szombat|vasárnap)',
            r'\d{4}\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)',
            r'\(\d{4}\.\s*\w+\s*\d+\.\)'
        ]

        line_lower = line.lower()
        return any(re.search(pattern, line_lower) for pattern in date_patterns)

    def _parse_date_line(self, line: str) -> str:
        """Dátum sor feldolgozása"""
        # Egyszerű dátum kinyerés - mostani implementációban az aktuális dátumot használjuk
        return datetime.now().strftime("%Y-%m-%d")

    def _is_league_line(self, line: str) -> bool:
        """Liga sor felismerése"""
        line_lower = line.lower()
        return ("labdarúgás," in line_lower) or ("football" in line_lower)

    def _parse_league_line(self, line: str) -> str:
        """Liga sor feldolgozása"""
        # "Labdarúgás, Norvég 3., 1. csoport" -> "Norvég 3., 1. csoport"
        if "labdarúgás," in line.lower():
            return line.split("labdarúgás,", 1)[1].strip()
        return line.strip()

    def _should_exclude_league(self, league: str) -> bool:
        """Liga kiszűrése nem kívánt sportágak alapján"""
        if not league:
            return True

        league_lower = league.lower()
        return any(excluded in league_lower for excluded in self.excluded_sports)

    def _is_main_match_line(self, line: str) -> bool:
        """Fő meccs sor felismerése (1X2 odds-okkal)"""
        # "K 16:00 12470 Brann Bergen 2 - Pors Grenland 1,83 3,95 2,87"
        # Pattern: [K/más] [idő] [szám] [csapat1] - [csapat2] [odds1] [odds2] [odds3]

        # Alapvető pattern ellenőrzés
        parts = line.split()
        if len(parts) < 7:
            return False

        # Utolsó 3 elem odds-nak kell lennie
        try:
            odds = parts[-3:]
            for odd in odds:
                odd_clean = odd.replace(',', '.')
                float(odd_clean)
            return True
        except ValueError:
            return False

    def _parse_main_match_line(self, line: str) -> Optional[Dict]:
        """Fő meccs sor feldolgozása"""
        try:
            # "K 16:00 12470 Brann Bergen 2 - Pors Grenland 1,83 3,95 2,87"
            parts = line.split()

            if len(parts) < 7:
                print(f"[DEBUG] Túl rövid sor, kihagyva: {line}")
                return None

            # Odds kinyerése (utolsó 3 elem)
            odds_raw = parts[-3:]
            try:
                odds_home = float(odds_raw[0].replace(',', '.'))
                odds_draw = float(odds_raw[1].replace(',', '.'))
                odds_away = float(odds_raw[2].replace(',', '.'))
            except Exception as e:
                print(f"[DEBUG] Odds parse hiba: {odds_raw} | {line}")
                return None

            # Idő kinyerése
            time = None
            if len(parts) > 1 and ':' in parts[1]:
                time = parts[1]

            # Csapat nevek kinyerése
            # A csapat neveket a " - " separator alapján választjuk szét
            line_without_odds = ' '.join(parts[:-3])

            # Keressük a " - " separatort
            if ' - ' in line_without_odds:
                team_part = line_without_odds.split(' - ')
                if len(team_part) >= 2:
                    home_part = team_part[0]
                    home_words = home_part.split()
                    if len(home_words) < 3:
                        print(f"[DEBUG] Nincs elég elem a home csapathoz: {home_words} | {line}")
                        return None
                    # Eltávolítjuk az első 2-3 elemet (K, idő, szám)
                    home_team = ' '.join(home_words[2:]).strip()
                    away_team = team_part[1].strip()
                    if home_team and away_team:
                        return {
                            'home_team': home_team,
                            'away_team': away_team,
                            'time': time,
                            'odds_home': odds_home,
                            'odds_draw': odds_draw,
                            'odds_away': odds_away
                        }
                    else:
                        print(f"[DEBUG] Üres home vagy away team: {home_team=} {away_team=} | {line}")
                        return None
                else:
                    print(f"[DEBUG] Nincs két rész a ' - ' után: {team_part} | {line}")
                    return None
            else:
                print(f"[DEBUG] Nincs ' - ' separator: {line_without_odds} | {line}")
                return None

            return None

        except Exception as e:
            print(f"⚠️ Meccs sor feldolgozási hiba: {e} | {line}")
            return None

    def _is_league_market_line(self, line: str) -> bool:
        """Liga és piac sor felismerése"""
        l = line.strip().lower()
        return ("labdarúgás" in l and " - " in l)

    def _parse_league_market_line(self, line: str) -> Optional[Dict]:
        """Liga és piac sor feldolgozása (1 vagy több odds is lehet a végén, robustabb csapatnév/piacnév kinyerés)"""
        try:
            # Keressük a "Labdarúgás" szó helyét, és csak utána dolgozzuk fel
            labda_idx = line.lower().find("labdarúgás")
            if labda_idx == -1:
                print(f"[DEBUG] Nincs 'Labdarúgás' a sorban: {line}")
                return None
            after_sport = line[labda_idx + len("labdarúgás"):].strip()
            # Odds a sor végén (1-3 float, bármi utánuk)
            odds_matches = list(re.finditer(r'([0-9]+,[0-9]+)', line))
            if not odds_matches:
                print(f"[DEBUG] Nincs odds a sor végén: {line}")
                return None
            odds = [float(m.group(1).replace(',', '.')) for m in odds_matches[-3:]]
            # Csapatok
            if ' - ' not in after_sport:
                print(f"[DEBUG] Nincs kötőjel a csapatsorban: {line}")
                return None
            teams_and_rest = after_sport.split(' - ', 1)
            team1 = teams_and_rest[0].strip()
            rest = teams_and_rest[1].strip()
            # Csapat2: az első szó/akár több szó, amíg nem piacnév vagy odds
            rest_parts = rest.split()
            team2_words = []
            for w in rest_parts:
                if re.match(r'^[0-9]+(,[0-9]+)?$', w):
                    break
                if w.lower() in ["kétesély", "gólszám", "1x2", "szuper", "mindkét", "hendikep", "nyertes", "korai", "különbség"]:
                    break
                team2_words.append(w)
            team2 = ' '.join(team2_words)
            # Piacnév: ami a csapat2 után van, odds előtt
            market_name_raw = rest[len(team2):].strip()
            # Piacnévből odds-okat és "nyertes" szót levágjuk
            market_name = re.sub(r'[0-9]+,[0-9]+', '', market_name_raw)
            market_name = market_name.replace('nyertes', '').strip(' -.,')
            # Odds dict
            if len(odds) == 1:
                odds_dict = {"value": odds[0]}
            elif len(odds) == 2:
                odds_dict = {"option1": odds[0], "option2": odds[1]}
            elif len(odds) == 3:
                odds_dict = {"option1": odds[0], "option2": odds[1], "option3": odds[2]}
            else:
                odds_dict = {}
            print(f"[DEBUG] Kinyert: {team1=} {team2=} {market_name=} {odds_dict=}")
            return {
                'home_team': team1,
                'away_team': team2,
                'market_name': market_name,
                'odds_home': odds[0] if len(odds) > 0 else None,
                'odds_draw': odds[1] if len(odds) > 1 else None,
                'odds_away': odds[2] if len(odds) > 2 else None,
                'odds_dict': odds_dict
            }
        except Exception as e:
            print(f"⚠️ Liga/piac sor feldolgozási hiba: {e} | {line}")
            return None

    def _collect_additional_markets(self, lines: List[str], start_index: int, match: StructuredMatch) -> int:
        """További piacok gyűjtése egy meccshez"""
        i = start_index

        while i < len(lines):
            line = lines[i].strip()

            # Ha üres sor vagy új liga/dátum, akkor vége
            if not line or self._is_date_line(line) or self._is_league_line(line):
                break

            # Ha új fő meccs sor, akkor vége
            if self._is_main_match_line(line):
                return i - 1

            # További piac felismerése ugyanahhoz a meccshez
            market = self._parse_additional_market_line(line, match)
            if market:
                match.markets.append(market)
                print(f"  📊 {market.market_type}")

            i += 1

        return i - 1

    def _parse_additional_market_line(self, line: str, match: StructuredMatch) -> Optional[BettingMarket]:
        """További piac sor feldolgozása"""
        try:
            # Ellenőrizzük, hogy tartalmazza-e a csapat neveket
            if match.home_team not in line or match.away_team not in line:
                return None

            # "K 16:00 12471 Brann Bergen 2 - Pors Grenland Kétesély (H: 1X, D: 12, V: X2) 1,25 1,16 1,56"

            # Piac típus felismerése
            market_type = self._identify_market_type(line)

            # Odds kinyerése
            parts = line.split()
            odds_values = []

            # Próbáljuk megtalálni az odds értékeket a sor végén
            for part in reversed(parts):
                try:
                    odd = float(part.replace(',', '.'))
                    if 1.0 <= odd <= 50.0:  # Valószerű odds tartomány
                        odds_values.insert(0, odd)
                    else:
                        break
                except ValueError:
                    break

            if len(odds_values) >= 2:
                # Odds hozzárendelése a piac típusától függően
                odds_dict = self._map_odds_to_market(market_type, odds_values)

                return BettingMarket(
                    market_type=market_type,
                    odds=odds_dict
                )

            return None

        except Exception as e:
            return None

    def _identify_market_type(self, line: str) -> str:
        """Piac típus azonosítása"""
        line_lower = line.lower()

        if "kétesély" in line_lower or "double chance" in line_lower:
            return "Double Chance"
        elif "döntetlen" in line_lower and "visszajár" in line_lower:
            return "Draw No Bet"
        elif "mindkét csapat szerez gólt" in line_lower or "btts" in line_lower:
            return "Both Teams To Score"
        elif "gólszám" in line_lower or "over" in line_lower or "under" in line_lower:
            return "Over/Under"
        elif "hendikep" in line_lower or "handicap" in line_lower:
            return "Asian Handicap"
        else:
            return "Special Market"

    def _map_odds_to_market(self, market_type: str, odds_values: List[float]) -> Dict[str, float]:
        """Odds hozzárendelése a piac típusához"""
        if market_type == "Double Chance" and len(odds_values) >= 3:
            return {"1X": odds_values[0], "12": odds_values[1], "X2": odds_values[2]}
        elif market_type == "Draw No Bet" and len(odds_values) >= 2:
            return {"home": odds_values[0], "away": odds_values[1]}
        elif market_type == "Both Teams To Score" and len(odds_values) >= 2:
            return {"yes": odds_values[0], "no": odds_values[1]}
        elif market_type == "Over/Under" and len(odds_values) >= 2:
            return {"over": odds_values[0], "under": odds_values[1]}
        else:
            # Általános mapping
            if len(odds_values) == 2:
                return {"option1": odds_values[0], "option2": odds_values[1]}
            elif len(odds_values) == 3:
                return {"option1": odds_values[0], "option2": odds_values[1], "option3": odds_values[2]}
            else:
                return {"value": odds_values[0]}

    def _match_to_dict(self, match: StructuredMatch) -> Dict:
        """Meccs konvertálása dictionary-be"""
        return {
            "home_team": match.home_team,
            "away_team": match.away_team,
            "date": match.date,
            "time": match.time,
            "league": match.league,
            "sport": match.sport,
            "markets": [asdict(market) for market in match.markets],
            # Kompatibilitás a régi formátummal
            "home_score": None,
            "away_score": None,
            "season": "2024/25",
            "competition": match.league,
            "venue": None,
            "matchday": None
        }

def main():
    """CLI interface"""
    import argparse
    import sys

    parser = argparse.ArgumentParser(description='Strukturált fogadási események kinyerő')
    parser.add_argument('pdf_path', help='PDF fájl elérési útvonala')
    parser.add_argument('--output', '-o', help='Kimeneti JSON fájl', required=True)
    parser.add_argument('--verbose', '-v', action='store_true', help='Részletes kimenet')

    args = parser.parse_args()

    # Argumentumok validálása
    if not os.path.exists(args.pdf_path):
        print(f"❌ PDF fájl nem található: {args.pdf_path}")
        sys.exit(1)

    # Extrakció futtatása
    extractor = StructuredBettingExtractor()
    matches = extractor.extract_from_pdf(args.pdf_path)

    # Eredmény mentése
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(matches, f, indent=2, ensure_ascii=False)

        print(f"✅ {len(matches)} meccs mentve: {args.output}")

        if args.verbose and matches:
            print("\n📋 Első meccs példa:")
            print(json.dumps(matches[0], indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"❌ Mentési hiba: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
