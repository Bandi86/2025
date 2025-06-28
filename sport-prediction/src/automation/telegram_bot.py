#!/usr/bin/env python3
"""
📱 TELEGRAM BOT - Napi fogadási értesítések
"""

import os
import sys
import asyncio
from datetime import datetime
import subprocess

# Telegram bot imports (telepíteni kell: pip install python-telegram-bot)
try:
    from telegram import Bot
    from telegram.ext import Application, CommandHandler, ContextTypes
except ImportError:
    print("❌ Telegram bot library hiányzik!")
    print("📦 Telepítés: pip install python-telegram-bot")
    sys.exit(1)

class BettingBot:
    def __init__(self, token: str, chat_ids: list):
        self.token = token
        self.chat_ids = chat_ids
        self.bot = Bot(token=token)
        
    async def send_daily_tips(self):
        """Napi tippek küldése"""
        try:
            # Daily assistant futtatása
            result = subprocess.run([
                sys.executable, 
                'src/tools/daily_betting_assistant.py',
                '--format', 'telegram'
            ], capture_output=True, text=True, cwd=os.path.dirname(__file__))
            
            if result.returncode == 0:
                message = f"🌅 **NAPI FOGADÁSI JAVASLATOK**\n{result.stdout}"
                
                for chat_id in self.chat_ids:
                    await self.bot.send_message(
                        chat_id=chat_id,
                        text=message,
                        parse_mode='Markdown'
                    )
                print("✅ Telegram üzenetek elküldve")
            else:
                error_msg = f"❌ Hiba a daily assistant futtatásában: {result.stderr}"
                print(error_msg)
                
        except Exception as e:
            print(f"❌ Telegram bot hiba: {e}")

# Bot konfiguráció
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_IDS = os.getenv('TELEGRAM_CHAT_IDS', '').split(',')

if __name__ == "__main__":
    if not TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN környezeti változó hiányzik!")
        sys.exit(1)
    
    bot = BettingBot(TOKEN, CHAT_IDS)
    asyncio.run(bot.send_daily_tips())
