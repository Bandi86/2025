"""
Dátum segédeszközök
"""
from datetime import datetime, timedelta
from typing import Optional, List
import re

class DateUtils:
    """
    Dátum kezelő segédosztály
    """

    @staticmethod
    def parse_date(date_str: Optional[str]) -> datetime:
        """
        Dátum string parsing különböző formátumokban
        """
        if not date_str:
            return datetime.now() + timedelta(days=1)

        date_str = date_str.lower().strip()

        # Speciális kulcsszavak
        if date_str in ['tomorrow', 'holnap']:
            return datetime.now() + timedelta(days=1)

        if date_str in ['today', 'ma']:
            return datetime.now()

        if date_str in ['yesterday', 'tegnap']:
            return datetime.now() - timedelta(days=1)

        # Relatív dátumok
        if date_str.startswith('+'):
            try:
                days = int(date_str[1:])
                return datetime.now() + timedelta(days=days)
            except ValueError:
                pass

        if date_str.startswith('-'):
            try:
                days = int(date_str[1:])
                return datetime.now() - timedelta(days=days)
            except ValueError:
                pass

        # Dátum formátumok
        formats = [
            '%Y-%m-%d',
            '%Y.%m.%d',
            '%Y/%m/%d',
            '%d-%m-%Y',
            '%d.%m.%Y',
            '%d/%m/%Y',
            '%m-%d-%Y',
            '%m.%d.%Y',
            '%m/%d/%Y'
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue

        # Ha semmi nem sikerült, holnap
        return datetime.now() + timedelta(days=1)

    @staticmethod
    def format_date(date: datetime, format_type: str = 'iso') -> str:
        """
        Dátum formázás
        """
        if format_type == 'iso':
            return date.strftime('%Y-%m-%d')
        elif format_type == 'readable':
            return date.strftime('%Y. %B %d.')
        elif format_type == 'short':
            return date.strftime('%m/%d')
        else:
            return date.strftime('%Y-%m-%d')

    @staticmethod
    def is_today(date: datetime) -> bool:
        """
        Ellenőrzi, hogy a dátum ma van-e
        """
        return date.date() == datetime.now().date()

    @staticmethod
    def is_tomorrow(date: datetime) -> bool:
        """
        Ellenőrzi, hogy a dátum holnap van-e
        """
        return date.date() == (datetime.now() + timedelta(days=1)).date()

    @staticmethod
    def days_until(date: datetime) -> int:
        """
        Hány nap van a dátumig
        """
        return (date.date() - datetime.now().date()).days

    @staticmethod
    def parse_match_time(time_str: str) -> Optional[str]:
        """
        Meccs idő parsing és normalizálás
        """
        if not time_str:
            return None

        # Különböző időformátumok
        time_patterns = [
            r'(\d{1,2}):(\d{2})',  # 14:30
            r'(\d{1,2})\.(\d{2})',  # 14.30
            r'(\d{1,2})h(\d{2})',   # 14h30
            r'(\d{1,2}):(\d{2})\s*(AM|PM)',  # 2:30 PM
        ]

        for pattern in time_patterns:
            match = re.search(pattern, time_str, re.IGNORECASE)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))

                # AM/PM kezelés
                if len(match.groups()) > 2 and match.group(3):
                    am_pm = match.group(3).upper()
                    if am_pm == 'PM' and hour != 12:
                        hour += 12
                    elif am_pm == 'AM' and hour == 12:
                        hour = 0

                return f"{hour:02d}:{minute:02d}"

        return time_str

    @staticmethod
    def get_date_range(start_date: datetime, days: int) -> List[datetime]:
        """
        Dátum tartomány generálása
        """
        dates = []
        for i in range(days):
            dates.append(start_date + timedelta(days=i))
        return dates
