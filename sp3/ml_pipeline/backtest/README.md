# Ez a README a backtest mappa szerkezetét és tartalmát írja le

- scripts/: minden backtest szkript (pl. backtest.py, csv2backtest.py)
- results/: automatikusan generált naplók, logok, JSON és CSV eredmények
- matches_backtest.csv: teszteléshez használt adatfájl (vagy symlink)

A backtest.py futtatásához:
cd scripts && python3 backtest.py ...
