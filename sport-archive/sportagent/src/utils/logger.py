"""
Logging konfigurációs modul
"""
import logging
import os
from datetime import datetime
from typing import Optional

class Logger:
    """
    Centralizált logging kezelés
    """

    def __init__(self, name: str = 'sportagent', level: str = 'INFO'):
        self.name = name
        self.level = getattr(logging, level.upper())
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """
        Logger beállítása
        """
        logger = logging.getLogger(self.name)
        logger.setLevel(self.level)

        # Ha már be van állítva, ne duplikáljunk
        if logger.handlers:
            return logger

        # Formázó létrehozása
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        # Konzol handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(self.level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # Fájl handler
        log_dir = 'logs'
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

        log_file = os.path.join(log_dir, f'{self.name}_{datetime.now().strftime("%Y%m%d")}.log')
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(self.level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        return logger

    def get_logger(self) -> logging.Logger:
        """
        Logger visszaadása
        """
        return self.logger

    def info(self, message: str):
        """
        Info szintű log
        """
        self.logger.info(message)

    def error(self, message: str):
        """
        Error szintű log
        """
        self.logger.error(message)

    def warning(self, message: str):
        """
        Warning szintű log
        """
        self.logger.warning(message)

    def debug(self, message: str):
        """
        Debug szintű log
        """
        self.logger.debug(message)
