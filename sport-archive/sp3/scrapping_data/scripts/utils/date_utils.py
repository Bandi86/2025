#!/usr/bin/env python3
"""
Dátum műveletek segédeszközök
===========================

Dátum konvertáláshoz és manipulációhoz szükséges függvények.
"""

from datetime import datetime, date, timedelta
import pytz
from typing import Optional, List
import os

def get_today_date() -> date:
    """Mai dátum lekérése helyi időzónában."""
    return datetime.now().date()

def get_today_string() -> str:
    """
    Mai dátum YYYY-MM-DD formátumban

    Returns:
        str: Mai dátum
    """
    return datetime.now().strftime("%Y-%m-%d")

def get_date_string(target_date: Optional[date] = None, format_str: str = "%Y-%m-%d") -> str:
    """
    Dátum konvertálása szövegformátumba.

    Args:
        target_date: A formázandó dátum (alapértelmezés szerint a mai nap)
        format_str: A dátum formátuma

    Returns:
        str: Formázott dátum szöveg
    """
    if target_date is None:
        target_date = get_today_date()
    return target_date.strftime(format_str)

def parse_date_string(date_str: str, format_str: str = "%Y-%m-%d") -> date:
    """
    Dátum szöveg elemzése dátum objektummá.

    Args:
        date_str: A dátum szöveg, amit elemezni kell
        format_str: Az elemzéshez használt formátum

    Returns:
        date: Elemzett dátum objektum
    """
    return datetime.strptime(date_str, format_str).date()

def format_date_for_path(date_str: str) -> str:
    """
    Dátum formázása útvonal számára (YYYY/MM/DD)

    Args:
        date_str (str): Dátum YYYY-MM-DD formátumban

    Returns:
        str: Formázott útvonal
    """
    date_obj = parse_date_string(date_str)
    return os.path.join(str(date_obj.year), str(date_obj.month).zfill(2), str(date_obj.day).zfill(2))

def format_date_for_filename(date_str: str) -> str:
    """
    Dátum formázása fájlnév számára (YYYYMMDD)

    Args:
        date_str (str): Dátum YYYY-MM-DD formátumban

    Returns:
        str: Formázott fájlnév
    """
    date_obj = parse_date_string(date_str)
    return date_obj.strftime("%Y%m%d")

def is_valid_date(date_str: str) -> bool:
    """
    Dátum validálása

    Args:
        date_str (str): Dátum YYYY-MM-DD formátumban

    Returns:
        bool: Érvényes dátum
    """
    try:
        parse_date_string(date_str)
        return True
    except ValueError:
        return False

def get_date_range(start_date: date, end_date: date) -> List[date]:
    """
    Dátum tartomány generálása

    Args:
        start_date (date): Kezdő dátum
        end_date (date): Végső dátum

    Returns:
        list: Dátumok listája
    """
    dates = []
    current_date = start_date
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=1)
    return dates

def get_data_directory_path(base_path: str, target_date: Optional[date] = None) -> str:
    """
    Adatkönyvtár útvonalának generálása egy adott dátumhoz.

    Args:
        base_path: Alap adatkönyvtár útvonala
        target_date: Cél dátum (alapértelmezés szerint a mai nap)

    Returns:
        str: Teljes útvonal a dátum specifikus könyvtárhoz
    """
    if target_date is None:
        target_date = get_today_date()

    year = target_date.strftime("%Y")
    month = target_date.strftime("%m")
    day = target_date.strftime("%d")

    return os.path.join(base_path, "data", year, month, day, "matches")

def ensure_data_directory(base_path: str, target_date: Optional[date] = None) -> str:
    """
    Biztosítja, hogy az adatkönyvtár létezik a céldátumhoz.

    Args:
        base_path: Alap adatkönyvtár útvonala
        target_date: Cél dátum (alapértelmezés szerint a mai nap)

    Returns:
        str: A létrehozott könyvtár útvonala
    """
    dir_path = get_data_directory_path(base_path, target_date)
    os.makedirs(dir_path, exist_ok=True)
    return dir_path

def convert_timezone(dt: datetime, from_tz: str, to_tz: str = "UTC") -> datetime:
    """
    Dátum és idő átkonvertálása egyik időzónából a másikba.

    Args:
        dt: Dátum és idő objektum
        from_tz: Forrás időzóna neve
        to_tz: Cél időzóna neve

    Returns:
        datetime: Átkonvertált dátum és idő
    """
    source_tz = pytz.timezone(from_tz)
    target_tz = pytz.timezone(to_tz)

    # Lokalizálás, ha naiv dátum és idő
    if dt.tzinfo is None:
        dt = source_tz.localize(dt)
    else:
        dt = dt.astimezone(source_tz)

    return dt.astimezone(target_tz)

def get_match_time_formats() -> List[str]:
    """
    A mérkőzés adatokban használt gyakori időformátumok lekérése.

    Returns:
        list: Időformátumok listája
    """
    return [
        "%H:%M",      # 15:30
        "%H.%M",      # 15.30
        "%I:%M %p",   # 3:30 PM
        "%H:%M:%S",   # 15:30:00
    ]

def parse_match_time(time_str: str) -> Optional[datetime]:
    """
    Mérkőzés idő szövegének elemzése dátum és idő objektummá.

    Args:
        time_str: Az idő szöveg, amit elemezni kell

    Returns:
        datetime: Elemzett dátum és idő objektum vagy None, ha az elemzés nem sikerül
    """
    time_formats = get_match_time_formats()

    for fmt in time_formats:
        try:
            # Idő elemzése és kombinálása a mai dátummal
            time_obj = datetime.strptime(time_str, fmt).time()
            return datetime.combine(get_today_date(), time_obj)
        except ValueError:
            continue

    return None

def main():
    """Dátum utils teszt"""
    print("📅 Dátum utils teszt...")
    print(f"Mai dátum: {get_today_string()}")

    # TODO: További tesztek
    pass

if __name__ == "__main__":
    main()
