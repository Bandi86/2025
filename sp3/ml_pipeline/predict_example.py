import pandas as pd
from data_processing import normalize_fixtures_df, compute_team_stats, predict_match_result

# Adatok betöltése (ESPN fixtures)
fixtures = pd.read_csv('../data/espn20242025/base_data/fixtures.csv')

# Normalizálás
fixtures_norm = fixtures.rename(columns={
    'date': 'date',
    'homeTeamId': 'homeTeamId',
    'awayTeamId': 'awayTeamId',
    'homeTeamScore': 'homeTeamScore',
    'awayTeamScore': 'awayTeamScore',
})
fixtures_norm = fixtures_norm[['date','homeTeamId','awayTeamId','homeTeamScore','awayTeamScore']]
fixtures_norm = normalize_fixtures_df(fixtures_norm)

# Csapatstatisztikák
team_stats = compute_team_stats(fixtures_norm)

# Példa: két csapat azonosítója
home_team_id = 83  # pl. Barcelona
away_team_id = 86  # pl. Real Madrid

pred = predict_match_result(home_team_id, away_team_id, team_stats)
print(f"Predikció Barcelona vs Real Madrid: {pred}")
