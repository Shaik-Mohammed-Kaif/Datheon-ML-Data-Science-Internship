"""Conservative, auditable data cleaning for the Iris dataset."""
import pandas as pd
from .inspection import NUMERIC_FEATURES
from .data_loader import COLUMNS

def clean_iris_data(df, drop_exact_duplicates=False):
    """
    Clean required fields without silently removing valid records.
    Exact duplicates are retained by default because repeated measurements
    may be legitimate observations in a dataset.
    """
    cleaned = df.copy()
    initial_rows = len(cleaned)

    for col in NUMERIC_FEATURES:
        cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")
    cleaned["species"] = cleaned["species"].astype("string").str.strip()

    missing_before = int(cleaned.isna().any(axis=1).sum())
    cleaned = cleaned.dropna(subset=COLUMNS)

    invalid_mask = (cleaned[NUMERIC_FEATURES] <= 0).any(axis=1)
    invalid_measurements_removed = int(invalid_mask.sum())
    cleaned = cleaned.loc[~invalid_mask].copy()

    allowed = {"Iris-setosa", "Iris-versicolor", "Iris-virginica"}
    unexpected_mask = ~cleaned["species"].isin(allowed)
    unexpected_labels = sorted(cleaned.loc[unexpected_mask, "species"].dropna().unique().tolist())
    if unexpected_mask.any():
        raise ValueError(f"Unexpected species labels; review source data: {unexpected_labels}")

    duplicates_found = int(cleaned.duplicated().sum())
    duplicates_removed = 0
    if drop_exact_duplicates:
        before = len(cleaned)
        cleaned = cleaned.drop_duplicates().copy()
        duplicates_removed = before - len(cleaned)

    audit = {
        "initial_rows": initial_rows,
        "final_rows": len(cleaned),
        "rows_with_missing_values_removed": missing_before,
        "rows_with_non_positive_measurements_removed": invalid_measurements_removed,
        "duplicate_rows_found": duplicates_found,
        "duplicate_rows_removed": duplicates_removed,
        "duplicates_retained_by_default": not drop_exact_duplicates,
    }
    return cleaned.reset_index(drop=True), audit
