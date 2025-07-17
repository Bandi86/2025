#!/usr/bin/env python3
"""
Javított meccs kinyerő - csoportosítja a fogadási opciókat
"""

import re
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

class BetType(Enum):
    """Fogadási típusok"""
    MAIN = "main"           # Alapfogadás (1X2)
    GOAL = "goal"           # Gól fogadások
    CORNER = "corner"       # Szöglet fogadások
    CARD = "card"           # Lap fogadások
    HANDICAP = "handicap"   # Handicap fogadások
    TOTAL = "total"         # Összes gól (Over/Under)
    OTHER = "other"         # Egyéb

@dataclass
class BettingOption:
    """Egyetlen fogadási opció"""
    bet_type: BetType
    bet_description: str
    odds_1: float
    odds_2: float
    odds_3: float
    raw_line: str
    line_number: int

@dataclass
class MatchGroup:
    """Egy meccs az összes fogadási opcióval"""
    match_id: str
    team_home: str
    team_away: str
    match_time: Optional[str] = None
    match_day: Optional[str] = None
    betting_options: List[BettingOption] = None

    def __post_init__(self):
        if self.betting_options is None:
            self.betting_options = []

class ImprovedMatchExtractor:
    """Javított meccs kinyerő - csoportosítja a fogadásokat"""

    def __init__(self):
        self.patterns = self._setup_patterns()
        self.bet_type_keywords = self._setup_bet_keywords()

    def _setup_patterns(self):
        """Regex minták különböző formátumokhoz"""
        return {
            # P/K formátum: P 00:00 03683 Seattle - Atl. Madrid 10,00 5,75 1,19
            'p_k_format': re.compile(
                r'([PK])\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.*?)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)'
            ),

            # Nap formátum: Sze 02:00 23198 Florida - Edmonton 2,05 4,10 2,95
            'day_format': re.compile(
                r'(Sze|Cs|P|K|V|Sz|H)\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.*?)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)'
            ),

            # Fogadási sor: 2 vagy 3 odds-sal
            'betting_line': re.compile(
                r'(\d+)\s+(.*?)\s+(\d+[,\.]\d+)(?:\s+(\d+[,\.]\d+))?(?:\s+(\d+[,\.]\d+))?'
            ),

            # Csapat nevek kinyerése
            'teams': re.compile(r'^(.*?)\s+-\s+(.*?)$')
        }

    def _setup_bet_keywords(self):
        """Fogadási típus felismerő kulcsszavak"""
        return {
            BetType.GOAL: ['gól', 'goal', 'over', 'under', 'o/u', '2.5', '1.5', '3.5'],
            BetType.CORNER: ['szöglet', 'corner', 'sarok'],
            BetType.CARD: ['lap', 'card', 'sárga', 'piros', 'yellow', 'red'],
            BetType.HANDICAP: ['handicap', 'asian', 'ázsia', 'hc'],
            BetType.TOTAL: ['összes', 'total', 'összesen'],
            BetType.MAIN: ['1x2', 'győzelem', 'döntetlen', 'vereség']
        }

    def _detect_bet_type(self, description: str) -> BetType:
        """Fogadási típus felismerése a leírás alapján"""
        description_lower = description.lower()

        for bet_type, keywords in self.bet_type_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                return bet_type

        return BetType.OTHER

    def _normalize_odds(self, odds_str: str) -> float:
        """Odds normalizálása (vesszős -> pontos)"""
        try:
            return float(odds_str.replace(',', '.'))
        except ValueError:
            return 0.0

    def _extract_teams(self, teams_text: str) -> Tuple[str, str]:
        """Csapatok kinyerése a szövegből"""
        teams_match = self.patterns['teams'].match(teams_text.strip())
        if teams_match:
            home = teams_match.group(1).strip()
            away = teams_match.group(2).strip()
            return home, away

        # Fallback: egyszerű split
        parts = teams_text.split(' - ')
        if len(parts) == 2:
            return parts[0].strip(), parts[1].strip()

        return teams_text.strip(), ""

    def extract_matches_from_text(self, text: str) -> List[MatchGroup]:
        """Meccek kinyerése és csoportosítása"""
        lines = text.split('\n')
        current_match = None
        matches = {}

        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue

            # P/K formátum
            match = self.patterns['p_k_format'].match(line)
            if match:
                format_type, time_info, match_id, teams_text, odds1, odds2, odds3 = match.groups()
                team_home, team_away = self._extract_teams(teams_text)

                match_group = MatchGroup(
                    match_id=match_id,
                    team_home=team_home,
                    team_away=team_away,
                    match_time=time_info
                )

                # Alapfogadás hozzáadása
                betting_option = BettingOption(
                    bet_type=BetType.MAIN,
                    bet_description="1X2",
                    odds_1=self._normalize_odds(odds1),
                    odds_2=self._normalize_odds(odds2),
                    odds_3=self._normalize_odds(odds3),
                    raw_line=line,
                    line_number=line_num
                )
                match_group.betting_options.append(betting_option)
                matches[match_id] = match_group
                current_match = match_group
                continue

            # Nap formátum
            match = self.patterns['day_format'].match(line)
            if match:
                day_info, time_info, match_id, teams_text, odds1, odds2, odds3 = match.groups()
                team_home, team_away = self._extract_teams(teams_text)

                match_group = MatchGroup(
                    match_id=match_id,
                    team_home=team_home,
                    team_away=team_away,
                    match_time=time_info,
                    match_day=day_info
                )

                betting_option = BettingOption(
                    bet_type=BetType.MAIN,
                    bet_description="1X2",
                    odds_1=self._normalize_odds(odds1),
                    odds_2=self._normalize_odds(odds2),
                    odds_3=self._normalize_odds(odds3),
                    raw_line=line,
                    line_number=line_num
                )
                match_group.betting_options.append(betting_option)
                matches[match_id] = match_group
                current_match = match_group
                continue

            # További fogadási opciók keresése (bármilyen meccshez)
            betting_match = self.patterns['betting_line'].match(line)
            if betting_match:
                bet_match_id = betting_match.group(1)
                description = betting_match.group(2)
                odds1 = betting_match.group(3)
                odds2 = betting_match.group(4) if betting_match.group(4) else None
                odds3 = betting_match.group(5) if betting_match.group(5) else None

                # Keressük meg a meccs ID-t a már létező meccsek között
                if bet_match_id in matches:
                    bet_type = self._detect_bet_type(description)

                    betting_option = BettingOption(
                        bet_type=bet_type,
                        bet_description=description.strip(),
                        odds_1=self._normalize_odds(odds1),
                        odds_2=self._normalize_odds(odds2) if odds2 else 0.0,
                        odds_3=self._normalize_odds(odds3) if odds3 else 0.0,
                        raw_line=line,
                        line_number=line_num
                    )
                    matches[bet_match_id].betting_options.append(betting_option)
                continue

        return list(matches.values())

    def get_statistics(self, matches: List[MatchGroup]) -> Dict[str, Any]:
        """Statisztikák a kinyert meccsekről"""
        total_matches = len(matches)
        total_betting_options = sum(len(match.betting_options) for match in matches)

        bet_type_counts = {}
        for match in matches:
            for bet_option in match.betting_options:
                bet_type = bet_option.bet_type.value
                bet_type_counts[bet_type] = bet_type_counts.get(bet_type, 0) + 1

        return {
            'total_matches': total_matches,
            'total_betting_options': total_betting_options,
            'avg_bets_per_match': total_betting_options / total_matches if total_matches > 0 else 0,
            'bet_type_distribution': bet_type_counts
        }


if __name__ == "__main__":
    # Teszt
    extractor = ImprovedMatchExtractor()
    print("Javított match extractor készen áll!")
