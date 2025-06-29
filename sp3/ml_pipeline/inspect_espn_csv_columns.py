import os
import pandas as pd

# Mappa, ahol az ESPN CSV-k vannak (al-mappákat is néz)
BASE_DIR = os.path.join(os.path.dirname(__file__), '../data/espn20242025')

csv_files = []
for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        if file.endswith('.csv'):
            csv_files.append(os.path.join(root, file))

print(f"Talált CSV-k száma: {len(csv_files)}\n")

for csv_path in csv_files:
    try:
        df = pd.read_csv(csv_path, nrows=5)
        print(f"Fájl: {csv_path}")
        print(f"Oszlopok: {list(df.columns)}\n")
    except Exception as e:
        print(f"HIBA: {csv_path} - {e}\n")
