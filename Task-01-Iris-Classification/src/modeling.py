"""Train, compare, tune, evaluate, and save Iris classifiers."""
from pathlib import Path
import json
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)

def build_models(random_state=42):
    return {
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", LogisticRegression(max_iter=2000, random_state=random_state))
        ]),
        "Decision Tree": Pipeline([
            ("classifier", DecisionTreeClassifier(random_state=random_state))
        ]),
        "K-Nearest Neighbors": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", KNeighborsClassifier(n_neighbors=5))
        ]),
        "Support Vector Machine": Pipeline([
            ("scaler", StandardScaler()),
            ("classifier", SVC(kernel="rbf", probability=True, random_state=random_state))
        ]),
        "Random Forest": Pipeline([
            ("classifier", RandomForestClassifier(n_estimators=300, random_state=random_state, n_jobs=-1))
        ]),
        "Gaussian Naive Bayes": Pipeline([
            ("classifier", GaussianNB())
        ]),
        "Gradient Boosting": Pipeline([
            ("classifier", GradientBoostingClassifier(random_state=random_state))
        ]),
    }

def train_evaluate_models(df, project_root, random_state=42, tune=True):
    root = Path(project_root)
    reports = root / "outputs" / "reports"
    models_dir = root / "outputs" / "models"
    reports.mkdir(parents=True, exist_ok=True)
    models_dir.mkdir(parents=True, exist_ok=True)

    features = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
    X, y = df[features].copy(), df["species"].copy()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )

    models = build_models(random_state)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    scoring = {"accuracy": "accuracy", "precision_macro": "precision_macro",
               "recall_macro": "recall_macro", "f1_macro": "f1_macro"}

    cv_rows, baseline_rows, fitted = [], [], {}
    for name, estimator in models.items():
        scores = cross_validate(estimator, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        cv_rows.append({
            "Model": name,
            "CV Accuracy Mean": scores["test_accuracy"].mean(),
            "CV Accuracy Std": scores["test_accuracy"].std(),
            "CV Precision Macro": scores["test_precision_macro"].mean(),
            "CV Recall Macro": scores["test_recall_macro"].mean(),
            "CV F1 Macro": scores["test_f1_macro"].mean(),
        })
        estimator.fit(X_train, y_train)
        fitted[name] = estimator
        pred = estimator.predict(X_test)
        baseline_rows.append({
            "Model": name,
            "Accuracy": accuracy_score(y_test, pred),
            "Precision Macro": precision_score(y_test, pred, average="macro", zero_division=0),
            "Recall Macro": recall_score(y_test, pred, average="macro", zero_division=0),
            "F1 Macro": f1_score(y_test, pred, average="macro", zero_division=0),
            "F1 Weighted": f1_score(y_test, pred, average="weighted", zero_division=0),
        })
        safe = name.lower().replace(" ", "_")
        joblib.dump(estimator, models_dir / f"{safe}_baseline_src.joblib")
        pd.DataFrame(classification_report(y_test, pred, output_dict=True, zero_division=0)).T.to_csv(
            reports / f"{safe}_classification_report_src.csv"
        )
        pd.DataFrame(confusion_matrix(y_test, pred, labels=sorted(y.unique())),
                     index=sorted(y.unique()), columns=sorted(y.unique())).to_csv(
            reports / f"confusion_matrix_{safe}_src.csv"
        )

    cv_df = pd.DataFrame(cv_rows).sort_values("CV F1 Macro", ascending=False)
    baseline_df = pd.DataFrame(baseline_rows).sort_values("F1 Macro", ascending=False)
    cv_df.to_csv(reports / "cross_validation_results_src.csv", index=False)
    baseline_df.to_csv(reports / "baseline_model_comparison_src.csv", index=False)

    tuned = {}
    tuning_rows = []
    grids = {
        "Logistic Regression": {
            "classifier__C": [0.01, 0.1, 1, 10, 100],
            "classifier__class_weight": [None, "balanced"]
        },
        "Decision Tree": {
            "classifier__criterion": ["gini", "entropy", "log_loss"],
            "classifier__max_depth": [None, 2, 3, 4, 5],
            "classifier__min_samples_split": [2, 4, 6],
            "classifier__min_samples_leaf": [1, 2, 3]
        },
        "Support Vector Machine": {
            "classifier__C": [0.1, 1, 10, 100],
            "classifier__gamma": ["scale", "auto"],
            "classifier__kernel": ["rbf", "linear"]
        },
        "Random Forest": {
            "classifier__n_estimators": [100, 300],
            "classifier__max_depth": [None, 3, 5, 8],
            "classifier__min_samples_leaf": [1, 2]
        },
    }

    if tune:
        for name, grid in grids.items():
            search = GridSearchCV(models[name], grid, scoring="f1_macro", cv=cv, n_jobs=-1, refit=True)
            search.fit(X_train, y_train)
            tuned[name] = search.best_estimator_
            tuning_rows.append({
                "Model": name,
                "Best CV Macro F1": search.best_score_,
                "Best Parameters": json.dumps(search.best_params_, default=str)
            })
            joblib.dump(search.best_estimator_, models_dir / f"{name.lower().replace(' ', '_')}_tuned_src.joblib")

    if tuned:
        tuning_df = pd.DataFrame(tuning_rows).sort_values("Best CV Macro F1", ascending=False)
        tuning_df.to_csv(reports / "hyperparameter_tuning_results_src.csv", index=False)
        best_name = tuning_df.iloc[0]["Model"]
        best_model = tuned[best_name]
    else:
        best_name = cv_df.iloc[0]["Model"]
        best_model = fitted[best_name]

    pred = best_model.predict(X_test)
    metrics = {
        "selected_model": best_name,
        "selection_basis": "Highest training cross-validation macro F1 among tuned candidates" if tuned
                           else "Highest training cross-validation macro F1 among baseline candidates",
        "test_accuracy": float(accuracy_score(y_test, pred)),
        "test_precision_macro": float(precision_score(y_test, pred, average="macro", zero_division=0)),
        "test_recall_macro": float(recall_score(y_test, pred, average="macro", zero_division=0)),
        "test_f1_macro": float(f1_score(y_test, pred, average="macro", zero_division=0)),
        "test_f1_weighted": float(f1_score(y_test, pred, average="weighted", zero_division=0)),
        "features": features,
        "classes": [str(c) for c in best_model.classes_],
        "random_state": random_state,
        "test_size": 0.20
    }
    joblib.dump(best_model, models_dir / "iris_best_classifier_src.joblib")
    (reports / "final_model_metrics_src.json").write_text(json.dumps(metrics, indent=4), encoding="utf-8")
    (reports / "final_classification_report_src.json").write_text(
        json.dumps(classification_report(y_test, pred, output_dict=True, zero_division=0), indent=4),
        encoding="utf-8"
    )

    return baseline_df, cv_df, metrics
