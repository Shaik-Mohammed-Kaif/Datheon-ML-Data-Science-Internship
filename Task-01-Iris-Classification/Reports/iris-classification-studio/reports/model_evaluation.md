# Model Evaluation Report — Supervised Iris Classification

## 1. Experimental Protocol
- **Train/Test Split**: Stratified 80/20 partition (`random_state=42`): 120 training specimens (40 per class), 30 holdout test specimens (10 per class).
- **Scaling**: `StandardScaler` fit strictly on the 120 training observations (`μ` and `σ`) and applied to test features only for scale-sensitive models (Logistic Regression, KNN).
- **Cross-Validation**: 5-fold Stratified Cross-Validation across all 150 observations (`seed=42`), fitting scaling independently inside each fold.

## 2. Executed Model Comparison
| Model | Scaling | Holdout Test Acc | Macro Precision | Macro Recall | Macro F1 | 5-Fold CV Mean ± SD |
|---|---|---:|---:|---:|---:|---|
| Logistic Regression | Yes | 93.33% (28/30) | 0.9444 | 0.9333 | 0.9327 | **96.00% ± 1.49%** |
| K-Nearest Neighbors (k=5) | Yes | 93.33% (28/30) | 0.9444 | 0.9333 | 0.9327 | **96.00% ± 1.49%** |
| Decision Tree (CART, depth=3) | No | 93.33% (28/30) | 0.9444 | 0.9333 | 0.9327 | 95.33% ± 1.83% |
| Random Forest (100 trees) | No | 93.33% (28/30) | 0.9444 | 0.9333 | 0.9327 | 95.33% ± 1.83% |
| Gaussian Naive Bayes | No | 93.33% (28/30) | 0.9444 | 0.9333 | 0.9327 | 95.33% ± 1.83% |

## 3. Holdout Confusion Matrix & Misclassification Forensics
All five classifiers produced an identical holdout confusion matrix (`[[10, 0, 0], [0, 10, 0], [0, 2, 8]]`):
- **Setosa**: 100% Precision, 100% Recall (10/10).
- **Versicolor**: 83.33% Precision, 100% Recall (10/10).
- **Virginica**: 100% Precision, 80.00% Recall (8/10).
- **Misclassified Specimens**:
  - `#107` (`4.9, 2.5, 4.5, 1.7`, Actual: `Iris-virginica`, Predicted: `Iris-versicolor`)
  - `#120` (`6.0, 2.2, 5.0, 1.5`, Actual: `Iris-virginica`, Predicted: `Iris-versicolor`)

## 4. Recommendation
**Standardized Multinomial Logistic Regression** is selected as the primary model: it matches the highest 5-fold cross-validation accuracy (`96.00% ± 1.49%`), produces calibrated probabilities, and exposes interpretable feature coefficients.
