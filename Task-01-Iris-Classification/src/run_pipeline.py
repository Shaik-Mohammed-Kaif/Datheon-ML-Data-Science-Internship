"""Run the complete source-code workflow from the Task-01 project root.

From Task-01-Iris-Classification:
    python -m src.run_pipeline
"""
from pathlib import Path
import pandas as pd

from .data_loader import load_iris_data
from .inspection import inspect_dataset, descriptive_statistics, validate_iris_schema
from .cleaning import clean_iris_data
from .eda import run_eda
from .modeling import train_evaluate_models

def main():
    df, source, root = load_iris_data()
    print(f"Loaded: {source}")
    print(f"Initial shape: {df.shape}")

    overview, quality = inspect_dataset(df)
    print("Initial overview:", overview)
    print("Initial quality:")
    print(quality)

    problems = validate_iris_schema(df)
    if problems:
        print("Validation findings:", problems)

    cleaned, audit = clean_iris_data(df, drop_exact_duplicates=False)
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(processed_dir / "iris_cleaned_src.csv", index=False)
    print("Cleaning audit:", audit)

    eda_overview = run_eda(cleaned, root)
    print("EDA overview:", eda_overview)

    baseline, cv, metrics = train_evaluate_models(cleaned, root, tune=True)
    print("\\nBaseline model comparison:")
    print(baseline.to_string(index=False))
    print("\\nCross-validation:")
    print(cv.to_string(index=False))
    print("\\nFinal model metrics:")
    print(metrics)
    print("\\nSource pipeline completed successfully.")

if __name__ == "__main__":
    main()
