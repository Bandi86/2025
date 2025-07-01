from core.unified_data_processor import UnifiedDataProcessor

# A végén egy summary függvény, amit a CLI hívhat:
def summarize_data():
    processor = UnifiedDataProcessor()
    matches = processor.process_all_data_sources()
    processor.save_to_database(db_path="db/unified_football.db")
    summary = processor.get_data_summary()
    print("\n=== ADATFELDOLGOZÁS ÖSSZEFOGLALÓ ===")
    for key, value in summary.items():
        print(f"{key}: {value}")
