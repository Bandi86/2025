#!/usr/bin/env python3
"""
Részletes debug a Premier League szekció feldolgozásához
"""

from advanced_tippmix_processor import AdvancedTippmixProcessor
from test_mock_processor import create_mock_pdf_text
import logging

def main():
    # Debug szint beállítása
    logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

    processor = AdvancedTippmixProcessor()
    text = create_mock_pdf_text()

    # Liga szekciók elemzése
    sections = processor.parse_league_sections(text)

    # Csak a Premier League szekció
    premier_section = [s for s in sections if 'Premier League' in s['league']][0]

    print(f"🔍 PREMIER LEAGUE SZEKCIÓ DEBUG")
    print(f"Liga: {premier_section['league']}")
    print(f"Tartalom sorai:")
    for i, line in enumerate(premier_section['content']):
        print(f"  {i}: {repr(line)}")

    print(f"\n🔄 MECCSEK FELDOLGOZÁSA:")

    # Manual feldolgozás debug-gal
    matches = []
    signatures = set()

    for line in premier_section['content']:
        line = line.strip()
        print(f"\n📝 Sor feldolgozása: {repr(line)}")

        # Meccs minta keresése
        found_match = False
        for pattern in processor.match_patterns:
            import re
            match = re.search(pattern, line)
            if match:
                print(f"  ✅ Minta találat: {pattern}")
                extracted_match = processor.parse_match_from_regex(match, pattern, line)
                if extracted_match:
                    print(f"  ⚽ Meccs: {extracted_match['home_team']} - {extracted_match['away_team']}")

                    # Signature generálás
                    signature = processor.create_match_signature(
                        extracted_match['home_team'],
                        extracted_match['away_team']
                    )
                    print(f"  🔖 Signature: {signature}")

                    if signature not in signatures:
                        signatures.add(signature)
                        extracted_match['signature'] = signature
                        matches.append(extracted_match)
                        print(f"  ➕ Új meccs hozzáadva! Összesen: {len(matches)}")
                    else:
                        print(f"  🔄 DUPLIKÁCIÓ! Frissítjük a meglévő meccset...")
                        processor.update_existing_match_odds_in_list(matches, signature, extracted_match)
                        print(f"  📊 Frissítés után meccsek száma: {len(matches)}")
                        if matches:
                            for j, m in enumerate(matches):
                                if m.get('signature') == signature:
                                    print(f"    • Meccs {j}: {m['home_team']} - {m['away_team']} | Változatok: {m['match_variations']}")

                    found_match = True
                    break

        if not found_match:
            print(f"  ❌ Nincs meccs minta a sorban")

    print(f"\n📈 VÉGEREDMÉNY:")
    print(f"  Meccsek száma: {len(matches)}")
    print(f"  Signature-k: {len(signatures)}")
    for i, match in enumerate(matches):
        print(f"  {i+1}. {match['home_team']} - {match['away_team']} | Változatok: {match['match_variations']}")

if __name__ == "__main__":
    main()
