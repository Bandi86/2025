import pandas as pd
import os
import numpy as np
from sklearn.model_selection import train_test_split

# Általános CSV beolvasó függvény

def load_csv_data_from_dir(data_dir):
    all_data = pd.DataFrame()
    for filename in os.listdir(data_dir):
        if filename.endswith('.csv'):
            filepath = os.path.join(data_dir, filename)
            try:
                df = pd.read_csv(filepath)
                all_data = pd.concat([all_data, df], ignore_index=True)
            except Exception as e:
                print(f"Error loading {filename}: {e}")
    return all_data

# Több mappából olvasó függvény

def load_multiple_datasets(data_dirs):
    all_data = pd.DataFrame()
    for data_dir in data_dirs:
        df = load_csv_data_from_dir(data_dir)
        all_data = pd.concat([all_data, df], ignore_index=True)
    return all_data

def preprocess_data(df):
    # Convert Date to datetime objects
    # Handle multiple date formats if necessary. Assuming 'DD/MM/YY' or 'DD/MM/YYYY'
    df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y', errors='coerce')
    # Try another format if the first one fails
    df['Date'] = df['Date'].fillna(pd.to_datetime(df['Date'], format='%d/%m/%y', errors='coerce'))

    # Sort by date to ensure correct rolling calculations
    df = df.sort_values(by='Date').reset_index(drop=True)

    # Fill missing odds with the mean of their respective columns
    # Focus on Bet365 odds as primary for now
    odds_cols = ['B365H', 'B365D', 'B365A']
    for col in odds_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].fillna(df[col].mean())

    # Feature Engineering: Basic team form (rolling averages)
    # Goals scored/conceded in last N games
    # Points from last N games

    # Define a function to calculate rolling stats for a team
    def get_rolling_stats(df_team, window=5):
        df_team = df_team.sort_values(by='Date')
        df_team['GoalsScored_MA'] = df_team['FTHG'].rolling(window=window, closed='left').mean()
        df_team['GoalsConceded_MA'] = df_team['FTAG'].rolling(window=window, closed='left').mean()
        # Points: Win=3, Draw=1, Loss=0
        df_team['Points'] = df_team['FTR'].apply(lambda x: 3 if x == 'H' else (1 if x == 'D' else 0))
        df_team['Points_MA'] = df_team['Points'].rolling(window=window, closed='left').mean()
        return df_team

    # Apply rolling stats for HomeTeam
    df_processed = df.groupby('HomeTeam').apply(get_rolling_stats, window=5).reset_index(drop=True)
    df_processed.rename(columns={
        'GoalsScored_MA': 'Home_GoalsScored_MA',
        'GoalsConceded_MA': 'Home_GoalsConceded_MA',
        'Points_MA': 'Home_Points_MA'
    }, inplace=True)

    # Apply rolling stats for AwayTeam
    # Need to adjust FTHG/FTAG for away team perspective
    df_away_temp = df.copy()
    df_away_temp.rename(columns={'HomeTeam': 'TempAwayTeam', 'AwayTeam': 'HomeTeam'}, inplace=True)
    df_away_temp.rename(columns={'FTHG': 'TempAwayGoals', 'FTAG': 'FTHG'}, inplace=True)
    df_away_temp.rename(columns={'TempAwayGoals': 'FTAG'}, inplace=True)
    df_away_temp['FTR'] = df_away_temp['FTR'].apply(lambda x: 'H' if x == 'A' else ('A' if x == 'H' else x))

    df_processed_away = df_away_temp.groupby('HomeTeam').apply(get_rolling_stats, window=5).reset_index(drop=True)
    df_processed_away.rename(columns={
        'GoalsScored_MA': 'Away_GoalsScored_MA',
        'GoalsConceded_MA': 'Away_GoalsConceded_MA',
        'Points_MA': 'Away_Points_MA'
    }, inplace=True)

    # Merge the calculated features back to the original dataframe
    df = pd.merge(df, df_processed[['Date', 'HomeTeam', 'Home_GoalsScored_MA', 'Home_GoalsConceded_MA', 'Home_Points_MA']],
                  on=['Date', 'HomeTeam'], how='left')
    df = pd.merge(df, df_processed_away[['Date', 'HomeTeam', 'Away_GoalsScored_MA', 'Away_GoalsConceded_MA', 'Away_Points_MA']].rename(columns={'HomeTeam': 'AwayTeam'}),
                  on=['Date', 'AwayTeam'], how='left')

    # Drop rows with NaN in newly created features (first few games for each team)
    df.dropna(subset=['Home_GoalsScored_MA', 'Away_GoalsScored_MA'], inplace=True)

    # Encode FTR (Full Time Result) to numerical: H=0, D=1, A=2
    df['FTR_encoded'] = df['FTR'].map({'H': 0, 'D': 1, 'A': 2})

    return df

def select_features_and_split(df):
    # Define features to use for the model
    features = [
        'B365H', 'B365D', 'B365A',  # Betting odds
        'Home_GoalsScored_MA', 'Home_GoalsConceded_MA', 'Home_Points_MA',  # Home team form
        'Away_GoalsScored_MA', 'Away_GoalsConceded_MA', 'Away_Points_MA',  # Away team form
        'HS', 'AS', 'HST', 'AST', 'HF', 'AF', 'HC', 'AC', 'HY', 'AY', 'HR', 'AR' # Match statistics
    ]
    target = 'FTR_encoded'

    # Filter out rows where any of the selected features might be NaN (after preprocessing)
    df_model = df.dropna(subset=features + [target])

    X = df_model[features]
    y = df_model[target]

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    return X_train, X_test, y_train, y_test

def normalize_fixtures_df(df):
    # Átnevezés a pipeline által elvárt mezőkre
    df_norm = pd.DataFrame()
    df_norm['Date'] = pd.to_datetime(df['date'])
    df_norm['HomeTeamId'] = df['homeTeamId']
    df_norm['AwayTeamId'] = df['awayTeamId']
    df_norm['FTHG'] = df['homeTeamScore']
    df_norm['FTAG'] = df['awayTeamScore']
    # Eredmény kódolása: H=hazai, D=döntetlen, A=vendég
    def get_ftr(row):
        if row['FTHG'] > row['FTAG']:
            return 'H'
        elif row['FTHG'] < row['FTAG']:
            return 'A'
        else:
            return 'D'
    df_norm['FTR'] = df_norm.apply(get_ftr, axis=1)
    return df_norm

def compute_team_stats(fixtures_df, team_id_col='HomeTeamId', opp_id_col='AwayTeamId', goals_col='FTHG', opp_goals_col='FTAG', window=10):
    """
    Egyszerű csapatstatisztika: átlagos rúgott/kapott gólok, győzelmi arány az utolsó N meccsen.
    """
    stats = {}
    teams = pd.concat([fixtures_df[team_id_col], fixtures_df[opp_id_col]]).unique()
    for team in teams:
        # Hazai meccsek
        home = fixtures_df[fixtures_df[team_id_col] == team]
        # Idegenbeli meccsek
        away = fixtures_df[fixtures_df[opp_id_col] == team]
        # Utolsó N meccs
        last_matches = pd.concat([home, away]).sort_values('Date').tail(window)
        if len(last_matches) == 0:
            stats[team] = {'avg_scored': 1.0, 'avg_conceded': 1.0, 'win_rate': 0.33}
            continue
        # Gólszámok
        scored = np.where(last_matches[team_id_col] == team, last_matches[goals_col], last_matches[opp_goals_col])
        conceded = np.where(last_matches[team_id_col] == team, last_matches[opp_goals_col], last_matches[goals_col])
        # Győzelem
        win = np.where(
            ((last_matches[team_id_col] == team) & (last_matches['FTR'] == 'H')) |
            ((last_matches[opp_id_col] == team) & (last_matches['FTR'] == 'A')), 1, 0)
        stats[team] = {
            'avg_scored': np.mean(scored),
            'avg_conceded': np.mean(conceded),
            'win_rate': np.mean(win)
        }
    return stats


def predict_match_result(home_team_id, away_team_id, team_stats):
    """
    Baseline predikció: várható gólok Poisson-modell szerint, eredmény valószínűségek.
    """
    home = team_stats.get(home_team_id, {'avg_scored': 1.0, 'avg_conceded': 1.0})
    away = team_stats.get(away_team_id, {'avg_scored': 1.0, 'avg_conceded': 1.0})
    # Várható gólok
    home_exp = (home['avg_scored'] + away['avg_conceded']) / 2
    away_exp = (away['avg_scored'] + home['avg_conceded']) / 2
    # Eredmény valószínűségek (egyszerű szabály)
    if home_exp > away_exp + 0.3:
        result = 'H'
    elif away_exp > home_exp + 0.3:
        result = 'A'
    else:
        result = 'D'
    return {
        'expected_home_goals': round(home_exp, 2),
        'expected_away_goals': round(away_exp, 2),
        'predicted_result': result
    }

# Példa pipeline:
# fixtures = pd.read_csv('.../fixtures.csv')
# fixtures_norm = normalize_fixtures_df(fixtures)
# team_stats = compute_team_stats(fixtures_norm)
# pred = predict_match_result(home_team_id, away_team_id, team_stats)
# print(pred)