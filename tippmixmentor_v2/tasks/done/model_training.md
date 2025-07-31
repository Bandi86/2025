model_training.md

# TippMixMentor Model Training Guide

This document provides best practices, debugging tips, and performance optimization techniques for the model training process in the TippMixMentor project.

---

## 📦 Script Overview

The training script is located in:

train_models.py

It performs the following steps:

1. Loads and processes match data via `DataProcessor`
2. Trains multiple models via `FootballPredictionModel`
3. Logs metrics and predictions using `structlog`
4. Saves trained models to disk
5. Provides a printed summary

---

## 🧠 Core Components

- api/
- data/
- logs/
- models/

- structlog: Structured logging with JSON output
- asyncio: Asynchronous execution for future extensibility

---

## ⚙️ Development Tips

### ✅ Fast Debug Mode

When modifying training logic, reduce dataset size to test quickly:

```python
# In DataProcessor
fixtures_df = fixtures_df.sample(100)  # or smaller slice
```

You can also bypass model saving/prediction during debugging to save time.

---

## 📊 Logging & Monitoring

### 🔧 Structured Logging

The script uses structlog with JSONRenderer. To monitor logs more easily:

- Pipe output to file:

```bash
python train_models.py | tee logs/train_$(date +%Y%m%d_%H%M).log
```

To pretty-print logs:

```bash
cat logs/train_20250731_1532.log | jq
```

### 📋 Terminal Summary

The script prints a clean training summary at the end:

```bash
==========================================
TRAINING SUMMARY
==========================================
Training samples: 1234
Training time: 15.43 seconds
Match Result Accuracy: 0.764
Over/Under Accuracy: 0.682
Both Teams Score Accuracy: 0.591
==========================================
⏱ Performance Optimization
🧪 Reduce Data on First Run
Useful for testing preprocessing logic or model structure.

🧮 Profile Training Time
Training time is measured via:

```python
start_time = time.time()
...
time.time() - start_time
Consider using cProfile for deeper profiling:

```bash
python -m cProfile -s time train_models.py
```

### ⚙️ Parallel Data Loading (optional)

If preprocessing becomes a bottleneck, consider using pandas multiprocessing or joblib for prepare_training_data.

### 📁 Output Management

### 💾 Saved Models

Models are saved via prediction_model.save_models()

Make sure they are versioned or timestamped for reproducibility

### 📝 Log Files

Save raw logs and metrics into a logs/ directory:

```bash
project/
└── logs/
    └── train_20250731_1532.log
```

### 🧪 Testing Predictions

At the end of training, the script performs a sample prediction using:

```python
test_features = X.iloc[0].to_dict()
prediction = prediction_model.predict_match(test_features)
```

You may expand this section to include more test cases or export predictions for validation.

### 🔁 Reproducibility

Set random seeds inside FootballPredictionModel or at the top of train.py:

```python
import random, numpy as np
random.seed(42)
np.random.seed(42)
```

Save dataset versions used in training if you scrape fresh data regularly.

### 📌 Suggestions for Future Improvements

### 📝 Logging

Add CLI flag to switch between console/JSON logging

### 📝 Evaluation

Add validation set split + confusion matrix reports

### 📝 Visualization

Integrate matplotlib or seaborn for loss/accuracy plots

### 📝 CLI Interface

Add argparse to control training params from command line

### 📝 Experiment Tracking

Use MLflow, WandB, or simple CSV logs for tracking experiments

---

## 📝 Error Handling

Raise custom exceptions in DataProcessor for clearer debugging

---

## 📝 Visualization

Integrate matplotlib or seaborn for loss/accuracy plots

---

## Future Features

- logging modul használata, ami kiírja a konzolra és fájlba is a haladást (epoch, loss, accuracy)
- tqdm vagy rich.progress használata a vizuális feedbackhez
- Mentés checkpoints formájában (pl. minden 1-5 epoch után .pt, .pkl fájlba)
- tensorboard támogatás (vizuális dashboard)
- Debug és dry-run mód
- Erőforrás-mérés (psutil, tracemalloc)

## New Features latest

## Agents for every model

That means that every model has an agent that is responsible for the model selection, feature selection, parameter selection, data source selection, data source cleaning, data source preprocessing, feature selection, feature engineering, feature preprocessing, parameter selection, parameter tuning, parameter optimization.

## Strategy

- Use the best model for the task
- Use the best data source for the task
- Use the best features for the task
- Use the best parameters for the task


### 📝 New Models

More functional models corners, yellow cards, halftime results, etc.

Add new model to the project

- LightGBM
- CatBoost 
- XGBoost
- Random Forest
- Logistic Regression
- Support Vector Machine
- Neural Network
- Decision Tree
- K-Nearest Neighbors

## More features

- incrase the speed, the accuracy, the robustness, the explainability. Use Gemma for final summary of predictions.
- Use the best model for the task
- Use the best data source for the task
- Use the best features for the task
- Use the best parameters for the task


### 📝 New Data Source

- Football Data Org API (10 calls/minute)
- Kaggle search another datasets
- ESPN data source is already integrated


## 📝 Summary

This project has a solid structure and logging setup. Focus on the following for smoother development:

- Use log files to monitor long trainings
- Run short tests on reduced datasets first
- Save model checkpoints and logs with timestamps
- Plan for evaluation and visualization in the future

Happy training! ⚽🧠📈