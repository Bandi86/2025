# 02_group_markets.py
# Piacok csoportosítása, végső JSON előállítása
import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from group_markets import main as group_main

if __name__ == "__main__":
    group_main()
    print("Kész: /tmp/all_matches_grouped.json")
