#!/usr/bin/env python3
import argparse
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from advanced_predictor import FootballPredictor
from data_provider import FootballDataProvider
from web_scraper import FootballScraper
from summer_scraper import SimpleFootballScraper
from free_football_api import FreeFootballAPI
from hybrid_data_source import HybridFootballDataSource
from betting_strategy import BettingStrategy

def main():
    parser = argparse.ArgumentParser(description='Futball meccs eredmény előrejelző')
    parser.add_argument('--train', action='store_true', help='Modellek tanítása')
    parser.add_argument('--predict', action='store_true', help='Predikció készítése')
    parser.add_argument('--home-team', type=int, help='Hazai csapat ID')
    parser.add_argument('--away-team', type=int, help='Vendég csapat ID')
    parser.add_argument('--league', type=int, help='Liga ID (opcionális)')
    parser.add_argument('--list-teams', action='store_true', help='Csapatok listázása')
    parser.add_argument('--search-team', type=str, help='Csapat keresése név alapján')

    # Új funkciók a valós idejű adatokhoz
    parser.add_argument('--fetch-upcoming', action='store_true', help='Jövőbeli meccsek letöltése API-ból')
    parser.add_argument('--predict-upcoming', action='store_true', help='Összes jövőbeli meccs predikciója')
    parser.add_argument('--days-ahead', type=int, default=7, help='Hány napra előre (alapértelmezett: 7)')
    parser.add_argument('--setup-api', action='store_true', help='API kulcsok beállítási útmutató')

    # Új funkció - web scraping
    parser.add_argument('--scrape-matches', action='store_true', help='Meccsek scraping-e weboldalakról')
    parser.add_argument('--predict-scraped', action='store_true', help='Scraped meccsekre predikciók')

    # Nyári meccsek specifikus funkció
    parser.add_argument('--summer-matches', action='store_true', help='Nyári meccsek és predikciók')

    # Hibrid adatforrás funkció (API + scraping + mock)
    parser.add_argument('--hybrid-matches', action='store_true', help='Hibrid módszer: API + scraping + reális mock')

    # Fogadási stratégia és ROI számítás
    parser.add_argument('--betting-analysis', action='store_true', help='Fogadási stratégia elemzés hibrid adatokkal')
    parser.add_argument('--bankroll', type=float, default=1000.0, help='Kezdő bankroll (alapértelmezett: $1000)')

    args = parser.parse_args()

    # Adatok elérési útjai
    fixtures_path = '../data/espn20242025/base_data/fixtures.csv'
    teams_path = '../data/espn20242025/base_data/teams.csv'

    # Új funkciók kezelése
    if args.setup_api:
        provider = FootballDataProvider()
        provider.setup_api_keys()
        return

    if args.fetch_upcoming:
        print("🔄 Jövőbeli meccsek letöltése...")
        provider = FootballDataProvider()
        upcoming = provider.get_upcoming_fixtures(days_ahead=args.days_ahead)

        if not upcoming.empty:
            provider.save_fixtures(upcoming)
            print(f"✅ {len(upcoming)} jövőbeli meccs letöltve és elmentve!")
            print("\nPéldák a letöltött meccsekből:")
            print("-" * 60)
            for _, match in upcoming.head(5).iterrows():
                print(f"📅 {match['date'][:10]} | {match['home_team_name']} vs {match['away_team_name']}")
        else:
            print("❌ Nem sikerült meccseket letölteni. Ellenőrizd az API kulcsokat!")
        return

    if args.predict_upcoming:
        print("🔮 Jövőbeli meccsek predikciója...")

        # Betöltjük a jövőbeli meccseket
        upcoming_file = 'upcoming_fixtures.csv'
        if not os.path.exists(upcoming_file):
            print("❌ Nincs jövőbeli meccs adat! Futtasd először: --fetch-upcoming")
            return

        import pandas as pd
        upcoming = pd.read_csv(upcoming_file)

        # Modell betöltése
        if not os.path.exists('models'):
            print("❌ Nincs betanított modell! Futtasd először: --train")
            return

        predictor = FootballPredictor(fixtures_path, teams_path)
        predictor.load_data()
        predictor.load_models()

        print(f"📊 {len(upcoming)} meccs predikciója:")
        print("=" * 80)

        for _, match in upcoming.iterrows():
            try:
                # Itt kellene mappelni a külső team ID-ket a belső ID-kre
                # Most egyszerűen megpróbáljuk
                home_id = int(match.get('local_home_team_id', match['home_team_id']))
                away_id = int(match.get('local_away_team_id', match['away_team_id']))

                prediction = predictor.predict_match(home_id, away_id)

                print(f"\n📅 {match['date'][:16]}")
                print(f"🏠 {match['home_team_name']} vs ✈️ {match['away_team_name']}")
                print(f"🎯 Predikció: {prediction['predicted_result']} ({prediction['confidence']}%)")
                print(f"⚽ Várható gólok: {prediction['expected_total_goals']}")

                probs = prediction['result_probabilities']
                print(f"📊 H: {probs['home_win']}% | D: {probs['draw']}% | A: {probs['away_win']}%")
                print("-" * 80)

            except Exception as e:
                print(f"❌ Hiba {match['home_team_name']} vs {match['away_team_name']} predikciójánál: {e}")

        return

    predictor = FootballPredictor(fixtures_path, teams_path)
    predictor.load_data()

    if args.list_teams:
        print("Elérhető csapatok:")
        print("-" * 50)
        for _, team in predictor.teams_df.head(20).iterrows():
            print(f"{team['teamId']:4d}: {team['displayName']}")
        print("... és még több csapat")
        return

    if args.search_team:
        search_term = args.search_team.lower()
        matches = predictor.teams_df[
            predictor.teams_df['displayName'].str.lower().str.contains(search_term, na=False)
        ]
        print(f"Csapatok '{args.search_team}' alapján:")
        print("-" * 50)
        for _, team in matches.iterrows():
            print(f"{team['teamId']:4d}: {team['displayName']}")
        return

    if args.train:
        print("Modellek tanítása kezdődik...")
        try:
            predictor.compute_advanced_features()
            predictor.train_models()
            predictor.save_models()
            print("✅ Modellek sikeresen betanítva és elmentve!")
        except Exception as e:
            print(f"❌ Hiba a tanítás során: {e}")
            return

    if args.predict:
        if not args.home_team or not args.away_team:
            print("❌ Hiba: --home-team és --away-team argumentumok szükségesek!")
            print("Példa: python cli.py --predict --home-team 83 --away-team 86")
            return

        try:
            # Modell betöltése
            if os.path.exists('models'):
                predictor.load_models()
            else:
                print("❌ Nincs betanított modell! Futtasd először: --train")
                return

            # Predikció
            prediction = predictor.predict_match(args.home_team, args.away_team, args.league)

            # Eredmény megjelenítése
            home_name = predictor.get_team_name(args.home_team)
            away_name = predictor.get_team_name(args.away_team)

            print(f"\n🏆 MECCS ELŐREJELZÉS")
            print("=" * 60)
            print(f"🏠 Hazai csapat: {home_name}")
            print(f"✈️  Vendég csapat: {away_name}")
            print("-" * 60)

            probs = prediction['result_probabilities']
            print(f"📊 EREDMÉNY VALÓSZÍNŰSÉGEK:")
            print(f"   🏠 Hazai győzelem: {probs['home_win']}%")
            print(f"   🤝 Döntetlen:     {probs['draw']}%")
            print(f"   ✈️  Vendég győzelem: {probs['away_win']}%")

            print(f"\n🎯 ELŐREJELZETT EREDMÉNY: ", end="")
            if prediction['predicted_result'] == 'H':
                print(f"🏠 Hazai győzelem")
            elif prediction['predicted_result'] == 'D':
                print(f"🤝 Döntetlen")
            else:
                print(f"✈️ Vendég győzelem")

            print(f"\n⚽ VÁRHATÓ GÓLOK ÖSSZESEN: {prediction['expected_total_goals']}")
            print(f"📈 MEGBÍZHATÓSÁG: {prediction['confidence']}%")

            # Tippek
            print(f"\n💡 FOGADÁSI TIPPEK:")
            max_prob = max(probs.values())
            if max_prob > 50:
                print(f"   🔥 Erős tip: {max_prob}% eséllyel")
            elif max_prob > 40:
                print(f"   ⚡ Közepes tip: {max_prob}% eséllyel")
            else:
                print(f"   ⚠️  Bizonytalan meccs: max {max_prob}% esély")

            if prediction['expected_total_goals'] > 2.5:
                print(f"   ⚽ Over 2.5 gól: Valószínű ({prediction['expected_total_goals']} várható)")
            else:
                print(f"   🛡️  Under 2.5 gól: Valószínű ({prediction['expected_total_goals']} várható)")

        except Exception as e:
            print(f"❌ Hiba a predikció során: {e}")
            return

    if args.fetch_upcoming:
        try:
            data_provider = FootballDataProvider()
            upcoming_matches = data_provider.fetch_upcoming_matches(args.days_ahead)

            if upcoming_matches.empty:
                print("Nincsenek közelgő meccsek.")
            else:
                print(f"Jövőbeli meccsek ({args.days_ahead} napon belül):")
                print("-" * 50)
                for _, match in upcoming_matches.iterrows():
                    home_team = predictor.get_team_name(match['homeTeam'])
                    away_team = predictor.get_team_name(match['awayTeam'])
                    print(f"{match['date']}: {home_team} vs {away_team}")
        except Exception as e:
            print(f"❌ Hiba a jövőbeli meccsek lekérése során: {e}")
            return

    if args.predict_upcoming:
        try:
            if os.path.exists('models'):
                predictor.load_models()
            else:
                print("❌ Nincs betanított modell! Futtasd először: --train")
                return

            data_provider = FootballDataProvider()
            upcoming_matches = data_provider.fetch_upcoming_matches(args.days_ahead)

            if upcoming_matches.empty:
                print("Nincsenek közelgő meccsek a predikcióhoz.")
            else:
                print(f"Jövőbeli meccsek predikciója ({args.days_ahead} napon belül):")
                print("-" * 50)
                for _, match in upcoming_matches.iterrows():
                    prediction = predictor.predict_match(match['homeTeam'], match['awayTeam'], match.get('leagueId'))

                    home_team = predictor.get_team_name(match['homeTeam'])
                    away_team = predictor.get_team_name(match['awayTeam'])

                    print(f"\n{home_team} vs {away_team}:")
                    probs = prediction['result_probabilities']
                    print(f"   🏠 Hazai győzelem: {probs['home_win']}%")
                    print(f"   🤝 Döntetlen:     {probs['draw']}%")
                    print(f"   ✈️  Vendég győzelem: {probs['away_win']}%")
        except Exception as e:
            print(f"❌ Hiba a jövőbeli meccsek predikciója során: {e}")
            return

    if args.scrape_matches:
        print("🕷️  Web scraping jövőbeli meccsekhez...")
        scraper = FootballScraper()
        matches = scraper.get_upcoming_matches(days_ahead=args.days_ahead)

        if not matches.empty:
            print(f"✅ {len(matches)} meccs találva web scraping-gel!")
            print("\nTalált meccsek:")
            print("-" * 60)
            for _, match in matches.head(10).iterrows():
                print(f"📅 {match['datetime'].strftime('%Y-%m-%d %H:%M')} | {match['home_team_name']} vs {match['away_team_name']} ({match['source']})")

            # Mentés CSV-be
            matches.to_csv('scraped_matches.csv', index=False)
            print(f"\n💾 Meccsek elmentve: scraped_matches.csv")
        else:
            print("❌ Nem találtam meccseket")
        return

    if args.predict_scraped:
        print("🔮 Scraped meccsekre predikciók készítése...")

        # Modell betöltése
        predictor = FootballPredictor(fixtures_path, teams_path)
        predictor.load_data()

        if not os.path.exists('models'):
            print("❌ Nincs betanított modell! Futtasd először: --train")
            return

        predictor.load_models()

        # Web scraping és predikciók
        scraper = FootballScraper()
        predictions = scraper.get_predictions_for_scraped_matches(predictor)

        if predictions:
            print(f"\n🎯 {len(predictions)} predikció elkészült!")
            print("=" * 80)

            for pred in predictions:
                match_info = pred['match_info']
                probs = pred['result_probabilities']

                print(f"\n🏆 {match_info['home_team_name']} vs {match_info['away_team_name']}")
                print(f"📅 {match_info['datetime'].strftime('%Y-%m-%d %H:%M')} | {match_info['competition']} ({match_info['source']})")
                print(f"📊 🏠 {probs['home_win']}% | 🤝 {probs['draw']}% | ✈️ {probs['away_win']}%")
                print(f"⚽ Várható gólok: {pred['expected_total_goals']}")

                if pred['predicted_result'] == 'H':
                    print(f"🎯 Tipp: Hazai győzelem ({pred['confidence']}% biztos)")
                elif pred['predicted_result'] == 'D':
                    print(f"🎯 Tipp: Döntetlen ({pred['confidence']}% biztos)")
                else:
                    print(f"🎯 Tipp: Vendég győzelem ({pred['confidence']}% biztos)")
                print("-" * 60)
        else:
            print("❌ Nem sikerült predikciót készíteni")
        return

    if args.summer_matches:
        print("☀️ Nyári meccsek predikciói...")

        # Modell betöltése
        predictor = FootballPredictor(fixtures_path, teams_path)
        predictor.load_data()

        if not os.path.exists('models'):
            print("❌ Nincs betanított modell! Futtasd először: --train")
            return

        predictor.load_models()

        # Nyári meccsek scraping és predikciók
        scraper = SimpleFootballScraper()
        predictions = scraper.predict_summer_matches(predictor)

        if predictions:
            print(f"\n🎯 ÖSSZEFOGLALÓ: {len(predictions)} nyári meccs predikciója elkészült!")
            print("\n💡 LEGJOBB TIPPEK:")
            print("=" * 50)

            # Top 5 legbiztosabb tipp
            sorted_preds = sorted(predictions, key=lambda x: x['confidence'], reverse=True)

            for i, pred in enumerate(sorted_preds[:5], 1):
                match_info = pred['match_info']
                probs = pred['result_probabilities']

                print(f"{i}. {match_info['home_team_name']} vs {match_info['away_team_name']}")
                print(f"   📅 {match_info['datetime'].strftime('%Y-%m-%d %H:%M')}")

                if pred['predicted_result'] == 'H':
                    result_text = f"🏠 Hazai győzelem ({probs['home_win']}%)"
                elif pred['predicted_result'] == 'D':
                    result_text = f"🤝 Döntetlen ({probs['draw']}%)"
                else:
                    result_text = f"✈️ Vendég győzelem ({probs['away_win']}%)"

                print(f"   🎯 {result_text} - {pred['confidence']}% biztos")
                print()
        else:
            print("❌ Nem sikerült predikciót készíteni")
        return

    if args.hybrid_matches:
        print("🔄 Hibrid adatforrás: API + Scraping + Reális Mock...")

        # Modell betöltése
        predictor = FootballPredictor(fixtures_path, teams_path)
        predictor.load_data()

        if not os.path.exists('models'):
            print("❌ Nincs betanított modell! Futtasd először: --train")
            return

        predictor.load_models()

        # Hibrid adatforrás használata
        data_source = HybridFootballDataSource()
        upcoming_matches = data_source.get_upcoming_matches(days_ahead=args.days_ahead)

        if not upcoming_matches.empty:
            print(f"\n📊 {len(upcoming_matches)} meccs feldolgozása...")
            print("=" * 80)

            successful_predictions = 0
            total_matches = len(upcoming_matches)

            for idx, match in upcoming_matches.iterrows():
                try:
                    # Csapat ID-k keresése név alapján
                    home_team_id = predictor.find_team_id_by_name(match['home_team'])
                    away_team_id = predictor.find_team_id_by_name(match['away_team'])

                    if home_team_id and away_team_id:
                        prediction = predictor.predict_match(home_team_id, away_team_id)

                        print(f"\n📅 {match.get('date', match.get('time', 'TBD'))}")
                        print(f"🏠 {match['home_team']} vs ✈️ {match['away_team']}")
                        print(f"📊 Forrás: {match['source']}")

                        if prediction['predicted_result'] == 'H':
                            result_text = f"🏠 Hazai győzelem"
                        elif prediction['predicted_result'] == 'D':
                            result_text = f"🤝 Döntetlen"
                        else:
                            result_text = f"✈️ Vendég győzelem"

                        print(f"🎯 Predikció: {result_text} ({prediction['confidence']}% biztos)")

                        # Várható gólok (a modell a total goals-t adja vissza)
                        total_goals = prediction['expected_total_goals']
                        avg_home_goals = total_goals * 0.55  # Hazai előny kb. 55%-40%
                        avg_away_goals = total_goals * 0.45

                        print(f"⚽ Várható gólok: {avg_home_goals:.1f} - {avg_away_goals:.1f} (összesen: {total_goals:.1f})")

                        # Over/Under tipp
                        if total_goals > 2.5:
                            print(f"📈 Over 2.5 gól ({total_goals:.1f} várható gól)")
                        else:
                            print(f"📉 Under 2.5 gól ({total_goals:.1f} várható gól)")

                        print(f"🔍 Liga: {match.get('league', 'N/A')}")
                        print("-" * 60)

                        successful_predictions += 1

                    else:
                        print(f"❌ Nem találom: {match['home_team']} vs {match['away_team']}")

                except Exception as e:
                    print(f"❌ Hiba {match['home_team']} vs {match['away_team']}: {e}")

            print(f"\n✅ Összesen {successful_predictions}/{total_matches} meccs feldolgozva")

            if successful_predictions > 0:
                print("\n💡 HASZNÁLATI TIPPEK:")
                print("• Magasabb confidence (>60%) = megbízhatóbb tipp")
                print("• Over/Under tippek gyakran jobbak mint eredmény tippek")
                print("• Ismert csapatokra (Premier League, La Liga) pontosabb predikciók")
                print("• Kombinálj több faktort a végleges döntés előtt!")

        else:
            print("❌ Nem sikerült meccseket találni a hibrid forrásból")
        return

    if args.betting_analysis:
        print("💰 Fogadási Stratégia Elemzés...")
        print(f"💳 Kezdő bankroll: ${args.bankroll:.2f}")

        # Modell betöltése
        predictor = FootballPredictor(fixtures_path, teams_path)
        predictor.load_data()

        if not os.path.exists('models'):
            print("❌ Nincs betanított modell! Futtasd először: --train")
            return

        predictor.load_models()

        # Fogadási stratégia inicializálása
        betting_strategy = BettingStrategy(starting_bankroll=args.bankroll)

        # Hibrid adatforrás használata
        data_source = HybridFootballDataSource()
        upcoming_matches = data_source.get_upcoming_matches(days_ahead=args.days_ahead)

        if not upcoming_matches.empty:
            print(f"\n📊 {len(upcoming_matches)} meccs fogadási elemzése...")
            print("=" * 80)

            all_opportunities = []
            successful_analyses = 0

            for idx, match in upcoming_matches.iterrows():
                try:
                    # Csapat ID-k keresése
                    home_team_id = predictor.find_team_id_by_name(match['home_team'])
                    away_team_id = predictor.find_team_id_by_name(match['away_team'])

                    if home_team_id and away_team_id:
                        prediction = predictor.predict_match(home_team_id, away_team_id)

                        print(f"\n🎯 {match['home_team']} vs {match['away_team']}")
                        print(f"📅 {match.get('date', match.get('time', 'TBD'))} | 📊 {match['source']}")

                        # Fogadási lehetőségek elemzése
                        match_info = {
                            'home_team': match['home_team'],
                            'away_team': match['away_team']
                        }

                        opportunities = betting_strategy.evaluate_betting_opportunity(prediction)

                        if opportunities:
                            betting_strategy.print_betting_opportunities(opportunities, match_info)
                            all_opportunities.extend(opportunities)
                            successful_analyses += 1
                        else:
                            print("❌ Nincs értékes fogadási lehetőség")

                        print("-" * 60)

                except Exception as e:
                    print(f"❌ Hiba {match['home_team']} vs {match['away_team']}: {e}")

            # Összefoglaló
            print(f"\n📈 FOGADÁSI ÖSSZEFOGLALÓ:")
            print("=" * 50)
            print(f"✅ Elemzett meccsek: {successful_analyses}/{len(upcoming_matches)}")
            print(f"🎯 Értékes fogadási lehetőségek: {len(all_opportunities)}")

            if all_opportunities:
                total_recommended = sum(opp['recommended_bet'] for opp in all_opportunities)
                total_potential = sum(opp['potential_profit'] for opp in all_opportunities)
                avg_edge = sum(opp['edge_percentage'] for opp in all_opportunities) / len(all_opportunities)

                print(f"💰 Összesen ajánlott tét: ${total_recommended:.2f}")
                print(f"🎁 Összesen potenciális profit: ${total_potential:.2f}")
                print(f"📊 Átlagos edge: {avg_edge:+.1f}%")
                print(f"💳 Bankroll kihasználtság: {(total_recommended/args.bankroll)*100:.1f}%")

                # Top 3 legjobb lehetőség
                best_opportunities = sorted(all_opportunities, key=lambda x: x['edge_percentage'], reverse=True)[:3]

                print(f"\n🏆 TOP 3 LEGJOBB LEHETŐSÉG:")
                for i, opp in enumerate(best_opportunities, 1):
                    print(f"{i}. {opp['selection_name']} | Edge: {opp['edge_percentage']:+.1f}% | Tét: ${opp['recommended_bet']:.2f}")

                print(f"\n💡 STRATÉGIAI JAVASLATOK:")
                print("• Csak pozitív edge-dzsel fogadj (+)")
                print("• Szórj: ne tedd az összes pénzt egy meccsre")
                print("• Over/Under tippek gyakran stabilabbak")
                print("• Magasabb confidence = alacsonyabb kockázat")
                print("• Kelly Criterion alapú tétméret = hosszú távú profit")

            else:
                print("❌ Nem találtam értékes fogadási lehetőségeket")
                print("💡 Próbáld máskor, vagy állítsd a paramétereket!")

        else:
            print("❌ Nem sikerült meccseket találni")
        return

    if not any([args.train, args.predict, args.list_teams, args.search_team, args.fetch_upcoming, args.predict_upcoming, args.setup_api, args.summer_matches, args.hybrid_matches, args.betting_analysis]):
        print("Futball Predikciós Rendszer 🏆")
        print("=" * 40)
        print("Használat:")
        print("  python cli.py --train                           # Modellek tanítása")
        print("  python cli.py --predict --home-team 83 --away-team 86  # Barcelona vs Real Madrid")
        print("  python cli.py --list-teams                      # Csapatok listázása")
        print("  python cli.py --search-team 'Barcelona'         # Csapat keresése")
        print("  python cli.py --fetch-upcoming --days-ahead 3  # Jövőbeli meccsek letöltése")
        print("  python cli.py --predict-upcoming --days-ahead 3 # Jövőbeli meccsek predikciója")
        print("  python cli.py --setup-api                      # API kulcsok beállítása")
        print("  python cli.py --summer-matches                 # Nyári meccsek (SimpleFootballScraper)")
        print("  python cli.py --hybrid-matches                 # Hibrid forrás (API + Scraping + Mock)")
        print("  python cli.py --betting-analysis               # Fogadási stratégia + ROI elemzés")
        print("\nPéldák:")
        print("  python cli.py --search-team 'Real'")
        print("  python cli.py --predict --home-team 83 --away-team 86 --league 140")
        print("  python cli.py --fetch-upcoming --days-ahead 7")
        print("  python cli.py --predict-upcoming --days-ahead 7")
        print("  python cli.py --hybrid-matches --days-ahead 3")
        print("  python cli.py --betting-analysis --bankroll 500 --days-ahead 5")

if __name__ == "__main__":
    main()
