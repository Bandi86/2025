#!/usr/bin/env python3
"""
Optimalizált SzerencseMix meccs kinyerő - tiszta, moduláris kód
"""

import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class MatchFormat(Enum):
    """Meccs formátum típusok"""
    P_FORMAT = "P_format"
    K_FORMAT = "K_format"
    DAY_FORMAT = "day_format"
    SIMPLE_FORMAT = "simple_format"

@dataclass
class MatchData:
    """Meccs adat strukturálva"""
    match_id: str
    teams: str
    time_info: str
    day_info: Optional[str] = None
    odds: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    match_type: MatchFormat = MatchFormat.P_FORMAT
    raw_line: str = ""
    line_number: int = 0

class MatchPatterns:
    """Regex minták a különböző meccs formátumokhoz"""

    # P formátum: P 00:00 03683 Seattle - Atl. Madrid 10,00 5,75 1,19
    P_PATTERN = re.compile(
        r'P\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.*?)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)'
    )

    # K formátum: K 12:30 15224 Daegu - Pohang 3,60 3,60 1,81
    K_PATTERN = re.compile(
        r'K\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.*?)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)'
    )

    # Nap formátum: Sze 02:00 23198 Florida - Edmonton 2,05 4,10 2,95
    DAY_PATTERN = re.compile(
        r'(Sze|Cs|P|K|V|Sz|H)\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.*?)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)'
    )

    # Egyszerű formátum: Manchester City - Liverpool FC 1.85 3.40 4.20
    SIMPLE_PATTERN = re.compile(
        r'([A-Za-z\s\u00C0-\u017F]+?)\s+-\s+([A-Za-z\s\u00C0-\u017F]+?)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)'
    )

class MatchExtractor:
    """Optimalizált meccs kinyerő osztály"""

    def __init__(self):
        self.patterns = MatchPatterns()

    def _normalize_odds(self, odd_str: str) -> float:
        """Odds string normalizálása float-ra"""
        return float(odd_str.replace(',', '.'))

    def _parse_p_format(self, line: str, line_num: int) -> Optional[MatchData]:
        """P formátum elemzése"""
        match = self.patterns.P_PATTERN.search(line)
        if not match:
            return None

        time, match_id, teams, odd1, odd2, odd3 = match.groups()

        return MatchData(
            match_id=match_id,
            teams=teams.strip(),
            time_info=time,
            odds=(
                self._normalize_odds(odd1),
                self._normalize_odds(odd2),
                self._normalize_odds(odd3)
            ),
            match_type=MatchFormat.P_FORMAT,
            raw_line=line,
            line_number=line_num
        )

    def _parse_k_format(self, line: str, line_num: int) -> Optional[MatchData]:
        """K formátum elemzése"""
        match = self.patterns.K_PATTERN.search(line)
        if not match:
            return None

        time, match_id, teams, odd1, odd2, odd3 = match.groups()

        return MatchData(
            match_id=match_id,
            teams=teams.strip(),
            time_info=time,
            odds=(
                self._normalize_odds(odd1),
                self._normalize_odds(odd2),
                self._normalize_odds(odd3)
            ),
            match_type=MatchFormat.K_FORMAT,
            raw_line=line,
            line_number=line_num
        )

    def _parse_day_format(self, line: str, line_num: int) -> Optional[MatchData]:
        """Nap formátum elemzése"""
        match = self.patterns.DAY_PATTERN.search(line)
        if not match:
            return None

        day, time, match_id, teams, odd1, odd2, odd3 = match.groups()

        return MatchData(
            match_id=match_id,
            teams=teams.strip(),
            time_info=time,
            day_info=day,
            odds=(
                self._normalize_odds(odd1),
                self._normalize_odds(odd2),
                self._normalize_odds(odd3)
            ),
            match_type=MatchFormat.DAY_FORMAT,
            raw_line=line,
            line_number=line_num
        )

    def _parse_simple_format(self, line: str, line_num: int) -> Optional[MatchData]:
        """Egyszerű formátum elemzése: Team1 - Team2 odd1 odd2 odd3"""
        match = self.patterns.SIMPLE_PATTERN.search(line)
        if not match:
            return None

        team1, team2, odd1, odd2, odd3 = match.groups()
        teams = f"{team1.strip()} - {team2.strip()}"

        return MatchData(
            match_id=f"SIMPLE_{line_num}",  # Egyszerű ID generálás
            teams=teams,
            time_info="--:--",  # Nincs időpont információ
            odds=(
                self._normalize_odds(odd1),
                self._normalize_odds(odd2),
                self._normalize_odds(odd3)
            ),
            match_type=MatchFormat.SIMPLE_FORMAT,
            raw_line=line,
            line_number=line_num
        )

    def parse_line(self, line: str, line_num: int = 0) -> Optional[MatchData]:
        """Egyetlen sor elemzése - próbálja az összes formátumot"""
        line = line.strip()
        if not line:
            return None

        # Próbáljuk meg az összes formátumot
        for parser_method in [
            self._parse_p_format,
            self._parse_k_format,
            self._parse_day_format,
            self._parse_simple_format  # Új formátum hozzáadása
        ]:
            result = parser_method(line, line_num)
            if result:
                return result

        return None

    def extract_from_text(self, text: str) -> List[MatchData]:
        """Meccsek kinyerése teljes szövegből"""
        lines = text.split('\n')
        matches = []

        for line_num, line in enumerate(lines, 1):
            match_data = self.parse_line(line, line_num)
            if match_data:
                matches.append(match_data)

        return matches

    def get_statistics(self, matches: List[MatchData]) -> Dict:
        """Meccsek statisztikái"""
        if not matches:
            return {'total': 0}

        stats = {
            'total': len(matches),
            'by_format': {},
            'teams': set(),
            'match_ids': set()
        }

        for match in matches:
            # Formátum szerint
            format_name = match.match_type.value
            stats['by_format'][format_name] = stats['by_format'].get(format_name, 0) + 1

            # Egyedi csapatok és meccs ID-k
            stats['teams'].add(match.teams)
            stats['match_ids'].add(match.match_id)

        stats['unique_teams'] = len(stats['teams'])
        stats['unique_match_ids'] = len(stats['match_ids'])

        # Set-eket listává alakítjuk serialization-hoz
        stats['teams'] = list(stats['teams'])
        stats['match_ids'] = list(stats['match_ids'])

        return stats

def main():
    """Teszt futtatás"""
    print("🧪 MATCH EXTRACTOR TESZT")
    print("="*40)

    extractor = MatchExtractor()

    # Teszt sorok
    test_lines = [
        "P 00:00 03683 Seattle - Atl. Madrid 10,00 5,75 1,19",
        "K 12:30 15224 Daegu - Pohang 3,60 3,60 1,81",
        "Sze 02:00 23198 Florida - Edmonton 2,05 4,10 2,95",
        "invalid line",
        "V 15:45 77889 Barcelona - Real Madrid 2,25 3,40 2,90",
        "Manchester City - Liverpool FC 1.85 3.40 4.20"
    ]

    matches = []
    for i, line in enumerate(test_lines, 1):
        match = extractor.parse_line(line, i)
        if match:
            matches.append(match)
            print(f"✅ {match.teams} - {match.odds}")
        else:
            print(f"❌ Nem ismert formátum: {line}")

    # Statisztikák
    stats = extractor.get_statistics(matches)
    print(f"\n📊 Statisztikák:")
    print(f"Összes meccs: {stats['total']}")
    print(f"Formátumok: {stats['by_format']}")

if __name__ == "__main__":
    main()
