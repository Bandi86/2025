# 📊 ESPN Soccer Data Download & Update Task

## 📝 Description

This task handles the automated downloading, saving, and updating of the [ESPN Soccer Data](https://www.kaggle.com/datasets/excel4soccer/espn-soccer-data) dataset from Kaggle. The data is used for training a prediction model and is refreshed daily to ensure up-to-date insights.

---

## 🔗 Links

- Kaggle dataset: [excel4soccer/espn-soccer-data](https://www.kaggle.com/datasets/excel4soccer/espn-soccer-data)  
- KaggleHub documentation: [KaggleHub Pandas Adapter](https://github.com/Kaggle/kagglehub/blob/main/README.md#kaggledatasetadapterpandas)
- Kaggle Api docs: [Kaggle Api](https://github.com/Kaggle/kaggle-api)

---

## 🧩 Features

- ✅ Downloads the latest ESPN Soccer data from Kaggle  
- 📂 Saves data to `prediction_model/data/espn/` directory  
- 🔁 Automatically updates daily at **00:00 (12:00 AM)**  
- 🧠 Integrates with your model training pipeline  
- 📈 Optionally supports smart update with change detection and reporting

---

# Important Notes
in the data/espn folder is data from 2 days ago.
its good partice to update it and test is with the new method what wee can use.

## 🚀 Usage Steps

### 1. Install Dependencies

Use the kaggle.json for api key and username
```bash
pip install kaggle
```

Make sure you have KaggleHub installed:

```bash
pip install kagglehub[pandas-datasets]
🔑 You also need a valid Kaggle API token (kaggle.json) in ~/.kaggle/.

2. Download & Load the Dataset
Use the following script to download and load the dataset:

python
Copy
Edit
import kagglehub
from kagglehub import KaggleDatasetAdapter

# Define the relative path to the CSV you want to load, e.g., "espn_data.csv"
file_path = "espn_data.csv"

# Load the dataset (latest version)
df = kagglehub.load_dataset(
    KaggleDatasetAdapter.PANDAS,
    "excel4soccer/espn-soccer-data",
    file_path=file_path,
)

print("First 5 records:")
print(df.head())
3. Save to Local Directory
Save the DataFrame to your project folder (if needed manually):

python
Copy
Edit
df.to_csv("prediction_model/data/espn/espn_data.csv", index=False)
4. Automate the Task (Cron Job)
To schedule the task to run every day at 12:00 AM, add the following to your system’s crontab:

bash
Copy
Edit
0 0 * * * /usr/bin/python3 /path/to/your/download_script.py
Replace /path/to/your/download_script.py with your actual script path.

5. Optional: Smart Update & Reporting
For advanced workflows, implement change detection:

python
Copy
Edit
import pandas as pd
import hashlib

def hash_df(df: pd.DataFrame) -> str:
    """Create a hash of the DataFrame content."""
    return hashlib.md5(pd.util.hash_pandas_object(df, index=True).values).hexdigest()

# Load previous data hash (if exists), compare, and notify
💡 You can generate a report if the data has changed significantly (new matches, teams, scores, etc.).

✅ Best Practices
Always work with the latest version of the dataset.

Monitor the Kaggle page for schema changes.

Use version control for both data and model training artifacts.

Automate data freshness checks and notify if updates occur.

📁 Folder Structure
kotlin
Copy
Edit
prediction_model/
├── data/
│   └── espn/
│       └── espn_data.csv
├── scripts/
│   └── download_espn_data.py
📌 License & Attribution
Dataset provided by excel4soccer on Kaggle

Please review the dataset's license before commercial use.