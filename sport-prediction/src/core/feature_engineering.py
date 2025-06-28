import pandas as pd
import numpy as np

def get_team_stats(df, team_col, goals_for_col, goals_against_col, result_col, team_name, match_date, n=5):
    prev_matches = df[(df[team_col] == team_name) & (df['Date'] < match_date)].sort_values('Date', ascending=False).head(n)
    if prev_matches.empty:
        return pd.Series([0, 0, 0])
    win_rate = np.mean(prev_matches[result_col] == 'W')
    avg_gf = prev_matches[goals_for_col].mean()
    avg_ga = prev_matches[goals_against_col].mean()
    return pd.Series([win_rate, avg_gf, avg_ga])

def get_team_form(df, team_col, goals_for_col, goals_against_col, result_col, team_name, match_date, n=5):
    prev_matches = df[(df[team_col] == team_name) & (df['Date'] < match_date)].sort_values('Date', ascending=False).head(n)
    if prev_matches.empty:
        return pd.Series([0, 0])
    avg_goal_diff = (prev_matches[goals_for_col] - prev_matches[goals_against_col]).mean()
    win_rate = np.mean(prev_matches[result_col] == 'H') if team_col == 'HomeTeam' else np.mean(prev_matches[result_col] == 'A')
    return pd.Series([avg_goal_diff, win_rate])

def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Creates all features for the model."""
    # Odds-based features
    df['OddsImpliedProbHome'] = 1 / df['B365H']
    df['OddsImpliedProbAway'] = 1 / df['B365A']
    df['OddsImpliedProbDraw'] = 1 / df['B365D']
    df['IsHomeStrong'] = (df['B365H'] < df['B365A']).astype(int)
    df['ExpectedGoals'] = df['B365>2.5'].fillna(0)
    df['OddsImpliedProbDiff'] = df['OddsImpliedProbHome'] - df['OddsImpliedProbAway']
    df['OddsRatioHomeAway'] = df['B365H'] / df['B365A']

    # Historical team performance
    home_stats = df.apply(lambda row: get_team_stats(
        df, 'HomeTeam', 'FTHG', 'FTAG', 'FTR', row['HomeTeam'], row['Date']), axis=1)
    df[['Home_WinRate', 'Home_AvgGF', 'Home_AvgGA']] = home_stats

    away_stats = df.apply(lambda row: get_team_stats(
        df, 'AwayTeam', 'FTAG', 'FTHG', 'FTR', row['AwayTeam'], row['Date']), axis=1)
    df[['Away_WinRate', 'Away_AvgGF', 'Away_AvgGA']] = away_stats

    # New features: Attack Strength
    epsilon = 1e-6 # Small value to prevent division by zero
    df['HomeAttackStrength'] = df['Home_AvgGF'] / (df['Away_AvgGA'] + epsilon)
    df['AwayAttackStrength'] = df['Away_AvgGF'] / (df['Home_AvgGA'] + epsilon)

    # Team form
    home_form = df.apply(lambda row: get_team_form(
        df, 'HomeTeam', 'FTHG', 'FTAG', 'FTR', row['HomeTeam'], row['Date']), axis=1)
    df[['Home_Last5_GD', 'Home_Last5_WinRate']] = home_form

    away_form = df.apply(lambda row: get_team_form(
        df, 'AwayTeam', 'FTAG', 'FTHG', 'FTR', row['AwayTeam'], row['Date']), axis=1)
    df[['Away_Last5_GD', 'Away_Last5_WinRate']] = away_form

    return df
