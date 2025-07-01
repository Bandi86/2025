import shutil
import glob
import os

# Mozgatjuk a backtesthez tartozó fájlokat/scripts-eket
BACKTEST_DIR = os.path.join(os.path.dirname(__file__), "backtest")
SCRIPTS_DIR = os.path.join(BACKTEST_DIR, "scripts")
RESULTS_DIR = os.path.join(BACKTEST_DIR, "results")

os.makedirs(SCRIPTS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Fájlok, amiket mozgatunk (ha léteznek)
move_files = [
    "backtest.py", "csv2backtest.py", "matches_backtest.csv"
]
for fname in move_files:
    src = os.path.join(os.path.dirname(__file__), fname)
    dst = os.path.join(SCRIPTS_DIR, fname) if fname.endswith(".py") else os.path.join(BACKTEST_DIR, fname)
    if os.path.exists(src):
        shutil.move(src, dst)

# Log/JSON eredmények áthelyezése
for f in glob.glob(os.path.join(os.path.dirname(__file__), "backtest_*.json")):
    shutil.move(f, RESULTS_DIR)

print("Backtest mappa rendezve!")