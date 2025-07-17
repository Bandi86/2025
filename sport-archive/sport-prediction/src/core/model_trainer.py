import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.feature_selection import SelectFromModel
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.ensemble import VotingClassifier

def tune_model(model, param_grid, X_train, y_train):
    grid_search = GridSearchCV(model, param_grid, cv=3, scoring='accuracy', n_jobs=-1)
    grid_search.fit(X_train, y_train)
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best cross-validation score: {grid_search.best_score_:.2f}")
    return grid_search.best_estimator_

def perform_cross_validation(model, X, y, cv=5):
    scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
    print(f"Cross-validation Accuracy: {scores.mean():.2f} (+/- {scores.std() * 2:.2f})")
    return scores

def get_ensemble_model(tuned_models):
    estimators = [
        ('rf', tuned_models['Random Forest']),
        ('lr', tuned_models['Logisztikus Regresszió']),
        ('xgb', tuned_models['XGBoost'])
    ]
    # Use 'soft' voting for probability prediction
    ensemble = VotingClassifier(estimators=estimators, voting='soft')
    return ensemble

def get_features_and_target(df: np.ndarray):
    features = [
        'OddsImpliedProbHome', 'OddsImpliedProbAway', 'OddsImpliedProbDraw',
        'IsHomeStrong', 'ExpectedGoals',
        'Home_WinRate', 'Home_AvgGF', 'Home_AvgGA',
        'Away_WinRate', 'Away_AvgGF', 'Away_AvgGA',
        'Home_Last5_GD', 'Home_Last5_WinRate',
        'Away_Last5_GD', 'Away_Last5_WinRate',
        'OddsImpliedProbDiff', 'OddsRatioHomeAway',
        'HomeAttackStrength', 'AwayAttackStrength'
    ]
    X = df[features]
    y = df['FTR']
    return X, y, features

def split_data(X, y, test_size=0.2):
    split_idx = int(len(X) * (1 - test_size))
    X_train = X[:split_idx]
    X_test = X[split_idx:]
    y_train = y[:split_idx]
    y_test = y[split_idx:]
    return X_train, X_test, y_train, y_test, split_idx

def scale_features(X_train, X_test):
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    return X_train_scaled, X_test_scaled, scaler

def select_features(model, X_train, y_train, X_test, features):
    selector = SelectFromModel(model)
    selector.fit(X_train, y_train)
    selected_features = np.array(features)[selector.get_support()]
    print(f"\nSelected features: {selected_features}")
    X_train_sel = selector.transform(X_train)
    X_test_sel = selector.transform(X_test)
    return X_train_sel, X_test_sel, selector

def encode_labels(y_train, y_test):
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc = le.transform(y_test)
    return y_train_enc, y_test_enc, le

def get_models():
    """Returns a dictionary of initialized models."""
    return {
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Logisztikus Regresszió': LogisticRegression(max_iter=1000, random_state=42),
        'XGBoost': XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
    }
