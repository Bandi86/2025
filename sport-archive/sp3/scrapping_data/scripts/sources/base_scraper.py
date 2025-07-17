#!/usr/bin/env python3
"""
Alap scraper osztály
===================

Ez a modul tartalmazza az alap scraper osztályt, amelyből
az összes specifikus scraper örököl.
"""

import requests
from bs4 import BeautifulSoup
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import time
import logging
from datetime import datetime, date
import random

class BaseScraper(ABC):
    """
    Alap scraper osztály
    """

    def __init__(self, source_name: str, base_url: str, delay_range: tuple = (1, 3)):
        """
        Inicializálás

        Args:
            source_name: Az adatforrás neve
            base_url: Az alap URL az forráshoz
            delay_range: Minimális és maximális késleltetés a kérések között (másodpercben)
        """
        self.source_name = source_name
        self.base_url = base_url
        self.delay_range = delay_range
        self.session = requests.Session()
        self.logger = logging.getLogger(f"{__name__}.{source_name}")

        # Alapértelmezett fejléc
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

    def get_page(self, url: str, params: Optional[Dict] = None,
                 timeout: int = 30) -> Optional[BeautifulSoup]:
        """
        Oldal tartalmának lekérése és BeautifulSoup objektum visszaadása.

        Args:
            url: A lekérni kívánt URL
            params: Lekérdezési paraméterek
            timeout: Kérés időtúllépése másodpercben

        Returns:
            BeautifulSoup objektum vagy None hiba esetén
        """
        try:
            self.logger.info(f"Oldal lekérése: {url}")

            response = self.session.get(url, params=params, timeout=timeout)
            response.raise_for_status()

            # Késleltetés hozzáadása a tiszteletteljes lekérdezés érdekében
            self._add_delay()

            soup = BeautifulSoup(response.content, 'html.parser')
            self.logger.info(f"Sikeres oldallekérés: {url}")

            return soup

        except requests.RequestException as e:
            self.logger.error(f"Hiba az oldal lekérésekor {url}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Váratlan hiba az oldal lekérésekor {url}: {e}")
            return None

    def _add_delay(self):
        """Véletlenszerű késleltetés hozzáadása a kérések között."""
        delay = random.uniform(*self.delay_range)
        time.sleep(delay)

    def _clean_text(self, text: str) -> str:
        """Szöveg tartalom tisztítása és normalizálása."""
        if not text:
            return ""

        # Felesleges szóközök és különleges karakterek eltávolítása
        cleaned = text.strip()
        cleaned = ' '.join(cleaned.split())  # Szóközök normalizálása

        return cleaned

    def _safe_extract_text(self, element, default: str = "") -> str:
        """Szöveg biztonságos kinyerése a BeautifulSoup eleméből."""
        if element is None:
            return default

        text = element.get_text(strip=True)
        return self._clean_text(text) if text else default

    def _safe_extract_attribute(self, element, attribute: str, default: str = "") -> str:
        """Attribútum biztonságos kinyerése a BeautifulSoup eleméből."""
        if element is None:
            return default

        value = element.get(attribute, default)
        return self._clean_text(str(value)) if value else default

    def _create_match_dict(self, home_team: str, away_team: str,
                          league: str, match_time: str, **kwargs) -> Dict[str, Any]:
        """
        Szabványosított mérkőzés szótár létrehozása.

        Args:
            home_team: Hazai csapat neve
            away_team: Vendég csapat neve
            league: Liga/bajnokság neve
            match_time: Mérkőzés ideje
            **kwargs: További mérkőzés adatok

        Returns:
            Szabványosított mérkőzés szótár
        """
        match_dict = {
            "home_team": self._clean_text(home_team),
            "away_team": self._clean_text(away_team),
            "league": self._clean_text(league),
            "match_time": self._clean_text(match_time),
            "source": self.source_name,
            "scraped_at": datetime.now().isoformat(),
        }

        # Opcionális mezők hozzáadása
        optional_fields = [
            "match_url", "status", "score", "odds", "statistics",
            "date", "venue", "round_info"
        ]

        for field in optional_fields:
            if field in kwargs and kwargs[field] is not None:
                match_dict[field] = kwargs[field]

        return match_dict

    @abstractmethod
    def get_daily_matches(self, target_date: date) -> List[Dict[str, Any]]:
        """
        Mérkőzések listájának lekérése egy adott dátumra.

        Args:
            target_date: A lekérni kívánt mérkőzések dátuma

        Returns:
            Mérkőzés szótárak listája
        """
        pass

    @abstractmethod
    def get_match_details(self, match_url: str) -> Optional[Dict[str, Any]]:
        """
        Részletes információk lekérése egy adott mérkőzésről.

        Args:
            match_url: A mérkőzés oldalának URL-je

        Returns:
            Részletes mérkőzés szótár vagy None hiba esetén
        """
        pass

    def get_leagues(self) -> List[str]:
        """
        Elérhető ligák listájának lekérése a forrástól.

        Returns:
            Liga nevek listája
        """
        # Alapértelmezett megvalósítás - felülírható
        return []

    def search_team(self, team_name: str) -> List[Dict[str, str]]:
        """
        Csapatinformáció keresése.

        Args:
            team_name: A keresni kívánt csapat neve

        Returns:
            Csapatinformáció szótárak listája
        """
        # Alapértelmezett megvalósítás - felülírható
        return []

    def is_available(self) -> bool:
        """
        Ellenőrizze, hogy a forrás jelenleg elérhető-e.

        Returns:
            True, ha a forrás elérhető, különben False
        """
        try:
            response = self.session.head(self.base_url, timeout=10)
            return response.status_code == 200
        except:
            return False

    def get_source_info(self) -> Dict[str, Any]:
        """
        Információk lekérése erről a scraper forrásról.

        Returns:
            Szótár a forrás információival
        """
        return {
            "name": self.source_name,
            "base_url": self.base_url,
            "available": self.is_available(),
            "features": self._get_features()
        }

    def _get_features(self) -> List[str]:
        """
        A scraper által támogatott funkciók listájának lekérése.

        Returns:
            Funkció nevek listája
        """
        features = ["daily_matches"]

        # Ellenőrizze, hogy a részletes mérkőzésinformáció támogatott-e
        if hasattr(self, 'get_match_details'):
            features.append("match_details")

        # Ellenőrizze, hogy az oddszak támogatottak-e
        if hasattr(self, 'get_odds'):
            features.append("odds")

        # Ellenőrizze, hogy a statisztikák támogatottak-e
        if hasattr(self, 'get_statistics'):
            features.append("statistics")

        return features
