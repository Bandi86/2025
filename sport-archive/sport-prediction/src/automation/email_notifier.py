#!/usr/bin/env python3
"""
📧 EMAIL ÉRTESÍTÉSEK - Napi jelentések
"""

import smtplib
import os
import sys
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class EmailNotifier:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email = os.getenv('EMAIL_ADDRESS')
        self.password = os.getenv('EMAIL_PASSWORD')
        self.recipients = os.getenv('EMAIL_RECIPIENTS', '').split(',')
    
    def send_daily_report(self):
        """Napi jelentés küldése"""
        try:
            # Daily assistant futtatása
            result = subprocess.run([
                sys.executable, 
                'src/tools/daily_betting_assistant.py',
                '--format', 'email'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                # Email összeállítása
                msg = MimeMultipart()
                msg['From'] = self.email
                msg['To'] = ', '.join(self.recipients)
                msg['Subject'] = f"🌅 Napi Fogadási Javaslatok - {datetime.now().strftime('%Y-%m-%d')}"
                
                body = f"""
Napi fogadási javaslatok:

{result.stdout}

---
Automatikus jelentés a Sport Betting Prediction System-től
{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
                
                msg.attach(MIMEText(body, 'plain', 'utf-8'))
                
                # Email küldése
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)
                server.quit()
                
                print("✅ Email jelentés elküldve")
            else:
                print(f"❌ Hiba a daily assistant futtatásában: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Email küldési hiba: {e}")

if __name__ == "__main__":
    notifier = EmailNotifier()
    notifier.send_daily_report()
