#!/usr/bin/env python3
"""
REST API-kompatibilis predikciós modul odds, value bet, várható gól, százalékos esélyek visszaadásához.
Input: JSON (POST body)
Output: JSON (prediction, probabilities, value bet, expected goals, ajánlás)
"""
import sys
import json
import joblib
import pandas as pd
from datetime import datetime

MODEL_PATH = "models/unified_football_model.pkl"

# Várható gól baseline (később modellel bővíthető)
LEAGUE_XG = {
    # Európai ligák
    'premier-league': (1.4, 1.1),
    'la-liga': (1.2, 1.0),
    'bundesliga': (1.5, 1.2),
    'serie-a': (1.3, 1.1),
    'ligue-1': (1.3, 1.1),

    # Nemzetközi tornák
    'champions-league': (1.5, 1.3),
    'europa-league': (1.4, 1.2),
    'conference-league': (1.3, 1.1),
    'nations-league': (1.2, 1.1),
    'world-cup': (1.3, 1.2),
    'euros': (1.2, 1.1),

    # Klub tornák
    'club-world-cup': (1.4, 1.2),
    'uefa-super-cup': (1.4, 1.2),
    'fa-cup': (1.3, 1.1),
    'copa-del-rey': (1.2, 1.0),
    'dfb-pokal': (1.4, 1.1),
    'coppa-italia': (1.3, 1.1),
    'coupe-de-france': (1.3, 1.1),

    # Egyéb ligák
    'brazil': (1.1, 1.0),
    'mls': (1.2, 1.1),
    'eredivisie': (1.4, 1.2),
    'primeira-liga': (1.2, 1.0),
    'scottish-premiership': (1.2, 1.0),

    # Általános/ismeretlen liga esetére
    'international': (1.3, 1.1),
    'friendly': (1.1, 1.0)
}

# Liga mapping: új ligákat ismert ligákra képez le a modell számára
LEAGUE_MAPPING = {
    # Nemzetközi tornák - erős ligákhoz hasonlítanak
    'champions-league': 'premier-league',
    'europa-league': 'premier-league',
    'conference-league': 'serie-a',
    'club-world-cup': 'premier-league',
    'uefa-super-cup': 'premier-league',

    # Nemzeti kupák - saját ligájukhoz hasonlítanak
    'fa-cup': 'premier-league',
    'copa-del-rey': 'la-liga',
    'dfb-pokal': 'bundesliga',
    'coppa-italia': 'serie-a',
    'coupe-de-france': 'ligue-1',

    # Válogatott tornák - kiegyensúlyozott
    'world-cup': 'premier-league',
    'euros': 'premier-league',
    'nations-league': 'premier-league',

    # Egyéb ligák
    'eredivisie': 'bundesliga',
    'primeira-liga': 'la-liga',
    'scottish-premiership': 'premier-league',
    'mls': 'ligue-1',

    # Általános
    'international': 'premier-league',
    'friendly': 'ligue-1'
}

def map_league_for_model(league):
    """Az új ligákat a modell által ismert ligákra képezi le"""
    return LEAGUE_MAPPING.get(league, league)

def predict_api(input_json):
    args = input_json
    if not all(k in args for k in ['home_team','away_team','league','date','odds_home','odds_draw','odds_away']):
        return {"error": "Hiányzó mező az inputban!"}
    if not joblib.os.path.exists(MODEL_PATH):
        return {"error": f"Modell nem található: {MODEL_PATH}"}
    model_data = joblib.load(MODEL_PATH)
    le_home = model_data['le_home']
    le_away = model_data['le_away']
    le_league = model_data['le_league']
    features = model_data['features']

    # Liga mapping: új ligákat ismert ligákra képez le
    mapped_league = map_league_for_model(args['league'])

    try:
        X_enc = pd.DataFrame({
            'home_team_enc': [le_home.transform([args['home_team']])[0]],
            'away_team_enc': [le_away.transform([args['away_team']])[0]],
            'league_enc': [le_league.transform([mapped_league])[0]]
        })
    except Exception as e:
        return {"error": f"Kódolási hiba: {e}"}
    model = model_data['model']
    proba = model.predict_proba(X_enc.values)[0]
    classes = model.classes_
    proba_dict = dict(zip(classes, proba))
    # Várható gól becslés
    xg_home, xg_away = LEAGUE_XG.get(args['league'], (1.3, 1.1))

    # BTTS (Both Teams To Score) számítás
    # Poisson eloszlás alapján: P(X >= 1) = 1 - P(X = 0) = 1 - e^(-λ)
    import math
    prob_home_scores = 1 - math.exp(-xg_home)
    prob_away_scores = 1 - math.exp(-xg_away)
    btts_prob = prob_home_scores * prob_away_scores

    # Over/Under 2.5 goals számítás
    # Poisson eloszlás: P(X + Y > 2.5) = 1 - P(X + Y <= 2)
    total_xg = xg_home + xg_away
    # P(X + Y = 0) + P(X + Y = 1) + P(X + Y = 2) kiszámítása
    prob_0_goals = math.exp(-total_xg)
    prob_1_goal = total_xg * math.exp(-total_xg)
    prob_2_goals = (total_xg**2 / 2) * math.exp(-total_xg)
    prob_under_25 = prob_0_goals + prob_1_goal + prob_2_goals
    prob_over_25 = 1 - prob_under_25

    # Value bet logika
    value_bets = {}
    for outcome, odd in zip(['H','D','A'], [args['odds_home'], args['odds_draw'], args['odds_away']]):
        implied = 1/odd if odd > 0 else 0
        model_prob = proba_dict.get(outcome, 0)
        value = model_prob - implied
        value_bets[outcome] = value
    best_bet = max(value_bets, key=value_bets.get)
    recommendation = None
    if value_bets[best_bet] > 0.02:
        outcome_str = {'H':'Hazai','D':'Döntetlen','A':'Vendég'}[best_bet]
        recommendation = {
            "bet": outcome_str,
            "value": round(value_bets[best_bet]*100,1),
            "text": f"Érdemes fogadni: {outcome_str} ({value_bets[best_bet]*100:.1f}% value)"
        }
    else:
        recommendation = {"bet": None, "value": 0, "text": "Nincs igazán jó value fogadás a megadott oddsokkal."}
    # Magyarázó szöveg generálása
    explanations = []
    # Value bet magyarázat
    if value_bets[best_bet] > 0.02:
        explanations.append(f"A legnagyobb value a(z) {outcome_str} kimenetnél van, mert a modell szerint ennek az esélye ({round(model_prob*100,1)}%) magasabb, mint amit az odds sugall.")
    else:
        explanations.append("Egyik kimenetnél sem mutatkozik jelentős value a megadott oddsok mellett.")
    # BTTS magyarázat
    if btts_prob > 0.6:
        explanations.append("A várható gólok alapján jó eséllyel mindkét csapat szerez gólt.")
    elif btts_prob < 0.4:
        explanations.append("A várható gólok alapján kevés az esély, hogy mindkét csapat betalál.")
    else:
        explanations.append("A BTTS piac kiegyenlített, nincs egyértelműen jó opció.")
    # Over/Under magyarázat
    if prob_over_25 > 0.6:
        explanations.append("A modell szerint inkább 2.5 gól feletti meccs várható.")
    elif prob_over_25 < 0.4:
        explanations.append("A modell szerint inkább 2.5 gól alatti meccs várható.")
    else:
        explanations.append("A 2.5 gól piac kiegyenlített, nincs egyértelműen jó opció.")
    # Confidence score
    confidence = max(proba_dict.values())
    explanations.append(f"A modell legnagyobb magabiztossága: {round(confidence*100,1)}%.")
    explanation_text = " ".join(explanations)
    return {
        "league": args['league'],
        "home_team": args['home_team'],
        "away_team": args['away_team'],
        "date": args['date'],
        "probabilities": {
            "home": round(proba_dict.get('H',0)*100,1),
            "draw": round(proba_dict.get('D',0)*100,1),
            "away": round(proba_dict.get('A',0)*100,1)
        },
        "odds": {
            "home": args['odds_home'],
            "draw": args['odds_draw'],
            "away": args['odds_away']
        },
        "expected_goals": {
            "home": xg_home,
            "away": xg_away,
            "total": round(xg_home + xg_away, 1)
        },
        "btts": {
            "probability": round(btts_prob * 100, 1),
            "yes_prob": round(btts_prob * 100, 1),
            "no_prob": round((1 - btts_prob) * 100, 1)
        },
        "over_under_25": {
            "over_prob": round(prob_over_25 * 100, 1),
            "under_prob": round(prob_under_25 * 100, 1),
            "total_expected": round(total_xg, 1)
        },
        "value_bets": value_bets,
        "recommendation": recommendation,
        "explanation": explanation_text,
        "model": type(model).__name__,
        "timestamp": datetime.now().isoformat(timespec='minutes')
    }

if __name__ == "__main__":
    # CLI/REST API kompatibilis: stdin-ből olvas JSON-t, stdout-ra ír JSON-t
    if len(sys.argv) > 1 and sys.argv[1] != '-':
        input_json = json.loads(sys.argv[1])
    else:
        input_json = json.load(sys.stdin)
    result = predict_api(input_json)
    print(json.dumps(result, ensure_ascii=False))
