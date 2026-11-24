"""Load the Iris dataset from the Task-01 project data directory."""
from pathlib import Path
import pandas as pd

COLUMNS = ["sepal_length", "sepal_width", "petal_length", "petal_width", "species"]

def find_project_root(start=None):
    start = Path(start or Path.cwd()).resolve()
    for path in (start, *start.parents):
        if (path / "data" / "raw" / "iris.data").exists() or (path / "data" / "processed" / "iris_cleaned.csv").exists():
            return path
    raise FileNotFoundError(
        "Project root not found. Expected data/raw/iris.data or data/processed/iris_cleaned.csv."
    )

def load_iris_data(project_root=None, prefer_cleaned=True):
    """Load cleaned CSV when available; otherwise load original UCI iris.data."""
    root = Path(project_root).resolve() if project_root else find_project_root()
    processed = root / "data" / "processed" / "iris_cleaned.csv"
    raw = root / "data" / "raw" / "iris.data"

    if prefer_cleaned and processed.exists():
        df = pd.read_csv(processed)
        source = processed
    elif raw.exists():
        df = pd.read_csv(raw, header=None, names=COLUMNS, na_values=["", "?", "NA", "NaN"])
        source = raw
    elif processed.exists():
        df = pd.read_csv(processed)
        source = processed
    else:
        raise FileNotFoundError(f"No Iris dataset found under {root / 'data'}")

    df.columns = [str(c).strip().lower() for c in df.columns]
    missing = sorted(set(COLUMNS) - set(df.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    df = df[COLUMNS].copy()

    for col in COLUMNS[:4]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["species"] = df["species"].astype("string").str.strip()

    return df, source, root
