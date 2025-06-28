import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def create_advanced_features(df: pd.DataFrame) -> pd.DataFrame:
    """Fejlett jellemzők létrehozása profitábilis fogadáshoz."""

    # Momentum alapú jellemzők
    def get_momentum_features(df, team_col, goals_for_col, goals_against_col, team_name, match_date, windows=[3, 5, 10]):
        features = {}
        prev_matches = df[(df[team_col] == team_name) & (df['Date'] < match_date)].sort_values('Date', ascending=False)

        for window in windows:
            recent = prev_matches.head(window)
            if len(recent) >= window:
                # Gólkülönbség trend
                goal_diff = (recent[goals_for_col] - recent[goals_against_col]).values
                features[f'{team_col}_momentum_{window}'] = np.mean(goal_diff)
                features[f'{team_col}_momentum_trend_{window}'] = np.polyfit(range(len(goal_diff)), goal_diff, 1)[0] if len(goal_diff) > 1 else 0

                # Győzelem momentum
                wins = (recent['FTR'] == ('H' if team_col == 'HomeTeam' else 'A')).sum()
                features[f'{team_col}_win_momentum_{window}'] = wins / window

                # Várt gólok vs valós gólok (overperformance/underperformance)
                features[f'{team_col}_goal_variance_{window}'] = np.var(recent[goals_for_col])
            else:
                for key in [f'{team_col}_momentum_{window}', f'{team_col}_momentum_trend_{window}',
                           f'{team_col}_win_momentum_{window}', f'{team_col}_goal_variance_{window}']:
                    features[key] = 0

        return pd.Series(features)

    # Head-to-head statisztikák
    def get_h2h_features(df, home_team, away_team, match_date, last_n=5):
        h2h = df[
            (((df['HomeTeam'] == home_team) & (df['AwayTeam'] == away_team)) |
             ((df['HomeTeam'] == away_team) & (df['AwayTeam'] == home_team))) &
            (df['Date'] < match_date)
        ].sort_values('Date', ascending=False).head(last_n)

        if len(h2h) == 0:
            return pd.Series({
                'h2h_home_wins': 0, 'h2h_draws': 0, 'h2h_away_wins': 0,
                'h2h_total_goals_avg': 2.5, 'h2h_home_advantage': 0
            })

        home_wins = len(h2h[(h2h['HomeTeam'] == home_team) & (h2h['FTR'] == 'H')])
        away_wins = len(h2h[(h2h['AwayTeam'] == home_team) & (h2h['FTR'] == 'A')])
        draws = len(h2h[h2h['FTR'] == 'D'])

        return pd.Series({
            'h2h_home_wins': home_wins / len(h2h),
            'h2h_draws': draws / len(h2h),
            'h2h_away_wins': away_wins / len(h2h),
            'h2h_total_goals_avg': (h2h['FTHG'] + h2h['FTAG']).mean(),
            'h2h_home_advantage': (home_wins - away_wins) / len(h2h)
        })

    # Market efficiency jellemzők
    def get_market_features(row):
        # Implicit probability és margin
        home_prob = 1 / row['B365H']
        draw_prob = 1 / row['B365D']
        away_prob = 1 / row['B365A']
        total_prob = home_prob + draw_prob + away_prob
        margin = total_prob - 1

        # True probabilities (margin nélkül)
        true_home_prob = home_prob / total_prob
        true_draw_prob = draw_prob / total_prob
        true_away_prob = away_prob / total_prob

        # Odds imbalance (melyik kimenetel túlárazott)
        max_prob = max(true_home_prob, true_draw_prob, true_away_prob)
        prob_spread = max_prob - min(true_home_prob, true_draw_prob, true_away_prob)

        return pd.Series({
            'bookmaker_margin': margin,
            'true_home_prob': true_home_prob,
            'true_draw_prob': true_draw_prob,
            'true_away_prob': true_away_prob,
            'prob_spread': prob_spread,
            'favorite_odds': min(row['B365H'], row['B365D'], row['B365A']),
            'underdog_odds': max(row['B365H'], row['B365D'], row['B365A'])
        })

    # Szezonális jellemzők
    def get_seasonal_features(row):
        date = pd.to_datetime(row['Date'])
        day_of_season = (date - pd.to_datetime(f"{date.year}-08-01")).days
        if day_of_season < 0:  # Ha új év előtt van
            day_of_season = (date - pd.to_datetime(f"{date.year-1}-08-01")).days

        return pd.Series({
            'day_of_season': day_of_season,
            'is_weekend': date.weekday() >= 5,
            'month': date.month,
            'season_phase': 'early' if day_of_season < 100 else 'mid' if day_of_season < 250 else 'late'
        })

    print("Fejlett jellemzők létrehozása...")

    # Alkalmazás
    momentum_features = df.apply(lambda row: pd.concat([
        get_momentum_features(df, 'HomeTeam', 'FTHG', 'FTAG', row['HomeTeam'], row['Date']),
        get_momentum_features(df, 'AwayTeam', 'FTAG', 'FTHG', row['AwayTeam'], row['Date'])
    ]), axis=1)

    h2h_features = df.apply(lambda row: get_h2h_features(
        df, row['HomeTeam'], row['AwayTeam'], row['Date']
    ), axis=1)

    market_features = df.apply(get_market_features, axis=1)
    seasonal_features = df.apply(get_seasonal_features, axis=1)

    # Egyesítés
    df_enhanced = pd.concat([df, momentum_features, h2h_features, market_features, seasonal_features], axis=1)

    # További származtatott jellemzők
    df_enhanced['home_away_momentum_diff'] = df_enhanced['HomeTeam_momentum_5'] - df_enhanced['AwayTeam_momentum_5']
    df_enhanced['total_momentum'] = df_enhanced['HomeTeam_momentum_5'] + df_enhanced['AwayTeam_momentum_5']
    df_enhanced['odds_value_home'] = df_enhanced['true_home_prob'] * df_enhanced['B365H']
    df_enhanced['odds_value_away'] = df_enhanced['true_away_prob'] * df_enhanced['B365A']
    df_enhanced['odds_value_draw'] = df_enhanced['true_draw_prob'] * df_enhanced['B365D']

    return df_enhanced

def get_advanced_feature_list():
    """A fejlett modellhez használandó jellemzők listája."""
    return [
        # Alapvető piaci jellemzők
        'true_home_prob', 'true_draw_prob', 'true_away_prob',
        'bookmaker_margin', 'prob_spread', 'favorite_odds', 'underdog_odds',

        # Momentum jellemzők
        'HomeTeam_momentum_3', 'HomeTeam_momentum_5', 'HomeTeam_momentum_10',
        'AwayTeam_momentum_3', 'AwayTeam_momentum_5', 'AwayTeam_momentum_10',
        'HomeTeam_momentum_trend_5', 'AwayTeam_momentum_trend_5',
        'HomeTeam_win_momentum_5', 'AwayTeam_win_momentum_5',
        'home_away_momentum_diff', 'total_momentum',

        # H2H jellemzők
        'h2h_home_wins', 'h2h_draws', 'h2h_away_wins',
        'h2h_total_goals_avg', 'h2h_home_advantage',

        # Value betting jellemzők
        'odds_value_home', 'odds_value_away', 'odds_value_draw',

        # Szezonális
        'day_of_season', 'is_weekend', 'month',

        # Klasszikus jellemzők (javított)
        'OddsImpliedProbHome', 'OddsImpliedProbAway', 'OddsImpliedProbDraw',
        'Home_WinRate', 'Away_WinRate', 'HomeAttackStrength', 'AwayAttackStrength'
    ]
