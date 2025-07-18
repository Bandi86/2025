import json
import os
from pathlib import Path

def test_json_file():
    project_dir = Path(__file__).parent.parent
    jsons_dir = project_dir / "jsons"
    json_file_path = jsons_dir / "Web__57sz__P__07-18_lines.json"

    assert json_file_path.exists(), f"A JSON fájl nem található: {json_file_path}"

    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    assert "matches" in data, "A JSON fájlnak tartalmaznia kell egy 'matches' kulcsot."
    assert isinstance(data["matches"], list), "A 'matches' kulcsnak egy listának kell lennie."
    assert len(data["matches"]) > 0, "A 'matches' lista nem lehet üres."

    print("✅ A JSON fájl sikeresen ellenőrizve!")

if __name__ == "__main__":
    test_json_file()
