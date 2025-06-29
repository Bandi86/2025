import sys
import os
import json
import pandas as pd
import joblib

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml_pipeline.data_processing import preprocess_data, select_features_and_split

def predict_single_match(match_data_json):
    # Load the trained model
    model_path = os.path.join(os.path.dirname(__file__), 'trained_model.joblib')
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}", file=sys.stderr)
        sys.exit(1)
    model = joblib.load(model_path)

    # Convert JSON input to DataFrame
    # The input match_data_json should contain all raw columns needed for preprocessing
    # For simplicity, we assume it contains at least the features selected for the model
    # and placeholder values for others if needed by preprocess_data.
    try:
        match_data = json.loads(match_data_json)
        # Ensure match_data is a list of dicts for DataFrame creation if it's a single match
        if not isinstance(match_data, list):
            match_data = [match_data]
        df_single_match = pd.DataFrame(match_data)
    except Exception as e:
        print(f"Error parsing input JSON: {e}", file=sys.stderr)
        sys.exit(1)

    # Preprocess the single match data
    # Note: preprocess_data expects a DataFrame with multiple matches for rolling averages.
    # For a single prediction, we need to ensure the necessary features are present.
    # For now, we'll assume the input JSON directly provides the features needed by the model.
    # In a real scenario, you'd need to pass historical data for the teams involved
    # to correctly calculate rolling averages for a new match.
    # For this POC, we'll simplify and assume the input JSON contains the pre-calculated
    # rolling average features (Home_GoalsScored_MA, etc.) or we'll use dummy values.

    # For a real-world prediction, you would need to:
    # 1. Fetch historical data for HomeTeam and AwayTeam up to the match_date.
    # 2. Calculate their rolling averages based on that historical data.
    # 3. Construct the feature vector for the new match.

    # For this example, let's assume the input JSON already contains the required features
    # that `select_features_and_split` expects.
    # We need to ensure the columns match the `features` list in `data_processing.py`.

    # Define the features that the model expects (must match select_features_and_split)
    features = [
        'B365H', 'B365D', 'B365A',  # Betting odds
        'Home_GoalsScored_MA', 'Home_GoalsConceded_MA', 'Home_Points_MA',  # Home team form
        'Away_GoalsScored_MA', 'Away_GoalsConceded_MA', 'Away_Points_MA',  # Away team form
        'HS', 'AS', 'HST', 'AST', 'HF', 'AF', 'HC', 'AC', 'HY', 'AY', 'HR', 'AR' # Match statistics
    ]

    # Ensure all expected features are in the input DataFrame
    for feature in features:
        if feature not in df_single_match.columns:
            # For a real system, you'd calculate these or fetch them.
            # For this POC, we'll fill with a placeholder or raise an error.
            df_single_match[feature] = 0.0 # Placeholder, adjust as needed

    X_predict = df_single_match[features]

    # Make prediction
    prediction = model.predict(X_predict)[0]

    # Map numerical prediction back to FTR (H=0, D=1, A=2)
    result_map = {0: 'H', 1: 'D', 2: 'A'}
    predicted_result = result_map.get(prediction, 'Unknown')

    print(predicted_result)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        match_data_json = sys.argv[1]
        predict_single_match(match_data_json)
    else:
        print("Usage: python predict.py <match_data_json>", file=sys.stderr)
        sys.exit(1)
