#!/bin/bash
# Napi fogadási asszisztens futtatása
cd /home/bandi/Documents/code/2025/sport-prediction
/home/bandi/Documents/code/2025/sport-prediction/venv/bin/python src/tools/daily_betting_assistant.py --league premier_league --auto >> /home/bandi/Documents/code/2025/sport-prediction/logs/daily_assistant.log 2>&1
