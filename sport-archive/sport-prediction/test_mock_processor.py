#!/usr/bin/env python3
"""
Mock teszt a fejlett tippmix processzoromnak
Szimulált PDF szöveggel teszteljük a logikát
"""

from advanced_tippmix_processor import AdvancedTippmixProcessor
import json

def create_mock_pdf_text():
    """Szimulált PDF szöveg tippmix formátumban"""
    return """
        SzerencseMix Sportfogadás

        Labdarúgás, Premier League:

        K 15:30 12345 Manchester City - Liverpool 1,85 3,45 4,20
        K 18:00 12346 Arsenal - Chelsea 2,10 3,25 3,80
        K 20:45 12347 Tottenham - Manchester Utd. 2,45 3,10 3,05
        K 15:30 12355 Manchester City - Liverpool 2,10 1,75 (Over/Under)
        K 15:30 12356 Manchester City - Liverpool 1,45 2,85 (Both Teams Score)

        Labdarúgás, Serie A:

        V 16:00 12348 Juventus - Milan 2,20 3,15 3,60
        V 18:30 12349 Napoli - Inter 1,95 3,40 4,10
        V 21:00 12350 Roma - Lazio 2,80 3,20 2,65

        Labdarúgás, NB I:

        V 17:00 12351 FTC - MTK 1,45 4,20 7,50
        V 19:30 12352 Kecskemét - Puskás Akadémia 3,10 3,40 2,35

        Labdarúgás, La Liga:

        H 14:00 12353 Real Madrid - Barcelona 2,05 3,30 3,85
        H 16:30 12354 Valencia - Sevilla 2,75 3,20 2,85

        Labdarúgás, Bundesliga:

        H 16:30 12357 Bayern München - Dortmund 1,75 3,80 4,90
    """

def main():
    processor = AdvancedTippmixProcessor()

    print("🧪 MOCK TESZT - Fejlett Tippmix Processor")
    print("=" * 50)

    # Mock szöveg létrehozása
    text = create_mock_pdf_text()
    print(f"📝 Mock szöveg hossz: {len(text)} karakter")

    # Liga szekciók elemzése
    sections = processor.parse_league_sections(text)
    print(f"🏆 Liga szekciók: {len(sections)}")

    for section in sections:
        print(f"  - {section['league']} ({len(section['content'])} sor)")

    # Meccsek kinyerése
    all_matches = []
    total_betting_options = 0

    for section in sections:
        matches = processor.extract_matches_from_section(section)
        all_matches.extend(matches)
        total_betting_options += sum(m.get('match_variations', 1) for m in matches)

    print(f"\n⚽ FELDOLGOZÁSI EREDMÉNYEK:")
    print(f"   Egyedi meccsek: {len(all_matches)}")
    print(f"   Fogadási opciók: {total_betting_options}")
    print(f"   Duplikáció arány: {total_betting_options / max(len(all_matches), 1):.2f}x")

    # Liga megoszlás
    liga_dist = {}
    for match in all_matches:
        liga = match['league']
        liga_dist[liga] = liga_dist.get(liga, 0) + 1

    print(f"\n🏆 LIGA MEGOSZLÁS:")
    for liga, count in sorted(liga_dist.items(), key=lambda x: x[1], reverse=True):
        print(f"   {liga}: {count} meccs")

    # Részletes meccs információk
    print(f"\n⚽ RÉSZLETES MECCSEK:")
    for i, match in enumerate(all_matches):
        confidence_emoji = "🟢" if match['confidence'] > 0.8 else "🟡" if match['confidence'] > 0.6 else "🔴"
        print(f"   {i+1}. {confidence_emoji} {match['home_team']} - {match['away_team']}")
        print(f"      🏆 Liga: {match['league']}")
        print(f"      📊 Bizonyosság: {match['confidence']:.3f}")
        print(f"      🎯 Fogadási változatok: {match.get('match_variations', 1)}")
        if match.get('betting_odds'):
            odds = match['betting_odds'][0]
            if odds:
                print(f"      💰 Odds: {odds.get('1', 'N/A')} - {odds.get('X', 'N/A')} - {odds.get('2', 'N/A')}")
        print()

    # Duplikáció teszt
    signatures = set()
    duplicates = 0
    for match in all_matches:
        sig = processor.create_match_signature(match['home_team'], match['away_team'])
        if sig in signatures:
            duplicates += 1
        signatures.add(sig)

    print(f"🔄 DUPLIKÁCIÓ ELEMZÉS:")
    print(f"   Talált duplikációk: {duplicates}")
    print(f"   Egyedi signature-k: {len(signatures)}")

    # Test specific issues
    print(f"\n🔍 PROBLÉMÁK ELEMZÉSE:")
    unknown_league = [m for m in all_matches if m['league'] == 'Ismeretlen Liga']
    low_confidence = [m for m in all_matches if m['confidence'] < 0.6]

    print(f"   ❓ Ismeretlen liga meccsek: {len(unknown_league)}")
    print(f"   🔴 Alacsony bizonyosságú meccsek: {len(low_confidence)}")

    if unknown_league:
        print(f"\n❓ ISMERETLEN LIGA MECCSEK:")
        for match in unknown_league:
            print(f"   • {match['home_team']} - {match['away_team']}")

    # Debug: minden meccs signature-je
    print(f"\n🔍 DEBUG - ÖSSZES MECCS SIGNATURE:")
    for i, match in enumerate(all_matches):
        sig = processor.create_match_signature(match['home_team'], match['away_team'])
        print(f"   {i+1}. {match['home_team']} - {match['away_team']} → {sig}")

    print(f"\n✅ Mock teszt befejezve!")

if __name__ == "__main__":
    main()
