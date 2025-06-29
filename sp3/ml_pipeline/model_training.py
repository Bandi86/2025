import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml_pipeline.data_processing import load_multiple_datasets, preprocess_data, select_features_and_split


def train_and_evaluate_model():
    print("Loading and preprocessing data...")
    # Valós adatforrás mappa
    data_dirs = ['sp3/data/espn20242025/base_data']
    for d in data_dirs:
        if not os.path.exists(d):
            print(f"WARNING: {d} nem létezik!")
    # Kiírjuk, hány CSV van forrásonként
    for d in data_dirs:
        if os.path.exists(d):
            print(f"{d}: {len([f for f in os.listdir(d) if f.endswith('.csv')])} CSV file")
    df = load_multiple_datasets(data_dirs)
    print(f"Összes rekord: {len(df)}")
    print(f"Oszlopok: {list(df.columns)}")
    if df.empty:
        print("No data loaded. Exiting.")
        return

    df_processed = preprocess_data(df.copy())
    print(f"Feldolgozott rekordok: {len(df_processed)}")
    print(f"Feldolgozott oszlopok: {list(df_processed.columns)}")
    if df_processed.empty:
        print("No data after preprocessing. Exiting.")
        return

    X_train, X_test, y_train, y_test = select_features_and_split(df_processed)
    print(f"Tanító minták: {len(X_train)}, Teszt minták: {len(X_test)}")

    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = model.predict(X_test)

    print("\nAccuracy:", accuracy_score(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    # Save the trained model
    model_path = 'ml_pipeline/trained_model.joblib'
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")

if __name__ == "__main__":
    train_and_evaluate_model()