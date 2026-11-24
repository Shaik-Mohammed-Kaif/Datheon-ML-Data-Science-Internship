"""Dataset structure, quality, and descriptive inspection utilities."""
import pandas as pd
from .data_loader import COLUMNS

NUMERIC_FEATURES = COLUMNS[:4]

def inspect_dataset(df):
    """Return a compact overview and per-column quality report."""
    overview = {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "duplicate_rows": int(df.duplicated().sum()),
        "missing_cells": int(df.isna().sum().sum()),
        "species_count": int(df["species"].nunique(dropna=True)),
    }
    quality = pd.DataFrame({
        "dtype": df.dtypes.astype(str),
        "missing_count": df.isna().sum(),
        "missing_percent": (df.isna().mean() * 100).round(2),
        "unique_values": df.nunique(dropna=True),
    })
    return overview, quality

def descriptive_statistics(df):
    stats = df[NUMERIC_FEATURES].describe().T
    stats["range"] = stats["max"] - stats["min"]
    stats["coefficient_of_variation"] = stats["std"] / stats["mean"]
    return stats

def validate_iris_schema(df):
    expected_species = {"Iris-setosa", "Iris-versicolor", "Iris-virginica"}
    problems = []
    if df[NUMERIC_FEATURES].isna().any().any():
        problems.append("Missing or non-numeric measurements exist.")
    if df["species"].isna().any():
        problems.append("Missing species labels exist.")
    unexpected = set(df["species"].dropna().unique()) - expected_species
    if unexpected:
        problems.append(f"Unexpected species labels: {sorted(unexpected)}")
    if (df[NUMERIC_FEATURES] <= 0).any().any():
        problems.append("Non-positive measurements exist.")
    return problems
