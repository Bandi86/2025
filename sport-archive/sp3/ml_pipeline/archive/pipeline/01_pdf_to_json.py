# 01_pdf_to_json.py
# PDF-ből minden piac és meccs kinyerése JSON-ba
# Használja a structured_betting_extractor.py logikáját, de jól dokumentált, átlátható wrapperként

import sys
import os
import json
import subprocess

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Használat: python3 pipeline/01_pdf_to_json.py <pdf_fajl>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    output_path = "/tmp/all_matches.json"
    # structured_betting_extractor.py CLI hívása
    cmd = [
        sys.executable,
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "structured_betting_extractor.py"),
        pdf_path,
        "--output", output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)
    print(f"Kész: {output_path}")
