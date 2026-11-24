# Data Quality & Integrity Report — Iris Benchmark Dataset

## 1. Source & Provenance
- **Source**: Fisher (1936) / Anderson (1935) Iris Benchmark (`data/iris_dataset.csv`, matching `sklearn.datasets.load_iris()`).
- **Dimensions**: 150 observations × 5 columns (4 continuous numerical features + 1 categorical target).
- **Target Balance**: Exact 3-way balance — 50 `Iris-setosa`, 50 `Iris-versicolor`, 50 `Iris-virginica`.

## 2. Schema, Missingness & Uniqueness
| Column | Data Type | Missing | Unique Values | Min | Median | Max | Mean ± SD |
|---|---|---:|---:|---:|---:|---:|---|
| `sepal_length` | float64 (cm) | 0 | 35 | 4.30 | 5.80 | 7.90 | 5.8433 ± 0.8281 |
| `sepal_width` | float64 (cm) | 0 | 23 | 2.00 | 3.00 | 4.40 | 3.0573 ± 0.4359 |
| `petal_length` | float64 (cm) | 0 | 43 | 1.00 | 4.35 | 6.90 | 3.7580 ± 1.7653 |
| `petal_width` | float64 (cm) | 0 | 22 | 0.10 | 1.30 | 2.50 | 1.1993 ± 0.7622 |
| `species` | category | 0 | 3 | — | — | — | 50 / 50 / 50 |

## 3. Duplicate Audit
- **Exact Duplicate Count**: 1 pair (2 rows).
- **Records**: Row `#102` and Row `#143` share identical values `[5.8, 2.7, 5.1, 1.9, Iris-virginica]`.
- **Handling Decision**: Retained in the 150-row benchmark for exact comparability with standard Iris literature, while explicitly documented as a methodological limitation for k-fold cross-validation.

## 4. Outlier Audit (1.5 × IQR Rule)
- `sepal_length`: 0 outliers (fences: `3.150 – 8.350 cm`).
- `sepal_width`: **4 outliers** (fences: `2.050 – 4.050 cm`): `#16` (4.4 cm, Setosa), `#33` (4.1 cm, Setosa), `#34` (4.2 cm, Setosa), `#61` (2.0 cm, Versicolor).
- `petal_length`: 0 outliers (fences: `-3.650 – 10.350 cm`).
- `petal_width`: 0 outliers (fences: `-1.950 – 4.050 cm`).
