# Datheon Task 01 — Iris ML Source Code

This `src/` package contains reusable Python modules for loading, inspecting, cleaning, exploring, and modeling the Iris dataset.

## Expected project layout

```text
Task-01-Iris-Classification/
├── data/
│   ├── raw/iris.data
│   └── processed/iris_cleaned.csv   # optional input from notebook workflow
├── outputs/
└── src/
    ├── __init__.py
    ├── data_loader.py
    ├── inspection.py
    ├── cleaning.py
    ├── eda.py
    ├── modeling.py
    └── run_pipeline.py
```

## Install dependencies

```bash
pip install pandas numpy matplotlib seaborn plotly scikit-learn joblib
```

## Run the complete pipeline

Open PowerShell in the `Task-01-Iris-Classification` root folder, then run:

```powershell
python -m src.run_pipeline
```

The pipeline:
1. Loads `data/processed/iris_cleaned.csv` if present, otherwise `data/raw/iris.data`.
2. Inspects schema, missing values, duplicates and descriptive statistics.
3. Performs conservative cleaning. Exact duplicates are retained by default.
4. Saves a source-pipeline cleaned copy as `data/processed/iris_cleaned_src.csv`.
5. Generates EDA figures, Plotly HTML charts and reports.
6. Trains seven baseline classifiers and tunes Logistic Regression, Decision Tree, SVM and Random Forest.
7. Saves model pipelines and evaluation reports.

## Important notes

- This source workflow is separate from the numbered Jupyter notebooks.
- It does not create or modify any `.ipynb` files.
- It does not overwrite `data/raw/iris.data` or `data/processed/iris_cleaned.csv`.
- Output filenames created by this package use the `_src` suffix to avoid overwriting existing notebook outputs.
- The Iris dataset has no timestamp field; no time-series data is fabricated.
- The selected model is chosen using training cross-validation Macro F1, not test-set performance.
