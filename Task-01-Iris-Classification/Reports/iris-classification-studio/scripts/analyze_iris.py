import csv
import json
import math
import random
from collections import Counter, defaultdict

FEATURES = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
FEATURE_LABELS = {
    "sepal_length": "Sepal Length (cm)",
    "sepal_width": "Sepal Width (cm)",
    "petal_length": "Petal Length (cm)",
    "petal_width": "Petal Width (cm)",
}
SPECIES = ["Iris-setosa", "Iris-versicolor", "Iris-virginica"]


def load_data(path="data/iris_dataset.csv"):
    rows = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for idx, r in enumerate(reader):
            rows.append({
                "id": idx + 1,
                "sepal_length": float(r["sepal_length"]),
                "sepal_width": float(r["sepal_width"]),
                "petal_length": float(r["petal_length"]),
                "petal_width": float(r["petal_width"]),
                "species": r["species"],
            })
    return rows


def quantile(sorted_vals, q):
    n = len(sorted_vals)
    pos = q * (n - 1)
    lo = int(math.floor(pos))
    hi = int(math.ceil(pos))
    if lo == hi:
        return sorted_vals[lo]
    return sorted_vals[lo] + (pos - lo) * (sorted_vals[hi] - sorted_vals[lo])


def stats_summary(vals):
    n = len(vals)
    s = sorted(vals)
    mean = sum(vals) / n
    var = sum((x - mean) ** 2 for x in vals) / (n - 1)
    std = math.sqrt(var)
    q1 = quantile(s, 0.25)
    med = quantile(s, 0.5)
    q3 = quantile(s, 0.75)
    iqr = q3 - q1
    return {
        "count": n,
        "mean": round(mean, 4),
        "median": round(med, 4),
        "std": round(std, 4),
        "variance": round(var, 4),
        "min": round(s[0], 4),
        "q1": round(q1, 4),
        "q3": round(q3, 4),
        "iqr": round(iqr, 4),
        "max": round(s[-1], 4),
    }


def pearson(x, y):
    n = len(x)
    mx = sum(x) / n
    my = sum(y) / n
    num = sum((a - mx) * (b - my) for a, b in zip(x, y))
    den = math.sqrt(sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y))
    return num / den if den else 0.0


def one_way_anova(groups):
    k = len(groups)
    all_vals = [v for g in groups for v in g]
    N = len(all_vals)
    grand_mean = sum(all_vals) / N
    ss_between = sum(len(g) * (sum(g) / len(g) - grand_mean) ** 2 for g in groups)
    ss_within = sum(sum((v - sum(g) / len(g)) ** 2 for v in g) for g in groups)
    df_between = k - 1
    df_within = N - k
    ms_between = ss_between / df_between
    ms_within = ss_within / df_within
    f_stat = ms_between / ms_within
    eta_sq = ss_between / (ss_between + ss_within)
    return {
        "f_stat": round(f_stat, 2),
        "df_between": df_between,
        "df_within": df_within,
        "eta_squared": round(eta_sq, 4),
    }


def stratified_split(rows, test_ratio=0.2, seed=42):
    # Reproducible stratified split mimicking scikit-learn random_state=42
    rng = random.Random(seed)
    train, test = [], []
    for sp in SPECIES:
        sp_rows = [r for r in rows if r["species"] == sp]
        idx = list(range(len(sp_rows)))
        rng.shuffle(idx)
        n_test = round(len(sp_rows) * test_ratio)
        test.extend(sp_rows[i] for i in idx[:n_test])
        train.extend(sp_rows[i] for i in idx[n_test:])
    return train, test


def fit_scaler(train_rows):
    means = {}
    stds = {}
    for f in FEATURES:
        vals = [r[f] for r in train_rows]
        m = sum(vals) / len(vals)
        # sklearn StandardScaler uses population std (ddof=0)
        s = math.sqrt(sum((v - m) ** 2 for v in vals) / len(vals))
        means[f] = m
        stds[f] = s
    return means, stds


def transform_rows(rows, means, stds):
    X = []
    y = []
    for r in rows:
        X.append([(r[f] - means[f]) / stds[f] for f in FEATURES])
        y.append(SPECIES.index(r["species"]))
    return X, y


def raw_xy(rows):
    X = [[r[f] for f in FEATURES] for r in rows]
    y = [SPECIES.index(r["species"]) for r in rows]
    return X, y


def softmax(logits):
    m = max(logits)
    exps = [math.exp(z - m) for z in logits]
    s = sum(exps)
    return [e / s for e in exps]


def train_logistic_regression(X, y, C=1.0, lr=0.35, steps=2000):
    # Multinomial logistic regression with L2 penalty (1/(C*N) * 0.5 * ||W||^2)
    n = len(X)
    d = len(X[0])
    k = len(SPECIES)
    W = [[0.0] * d for _ in range(k)]
    b = [0.0] * k
    reg = 1.0 / (C * n)

    for _ in range(steps):
        gW = [[0.0] * d for _ in range(k)]
        gb = [0.0] * k
        for xi, yi in zip(X, y):
            logits = [sum(W[c][j] * xi[j] for j in range(d)) + b[c] for c in range(k)]
            probs = softmax(logits)
            for c in range(k):
                diff = probs[c] - (1.0 if c == yi else 0.0)
                gb[c] += diff
                for j in range(d):
                    gW[c][j] += diff * xi[j]
        for c in range(k):
            b[c] -= lr * (gb[c] / n)
            for j in range(d):
                W[c][j] -= lr * (gW[c][j] / n + reg * W[c][j])

    def predict(X_test):
        preds = []
        probas = []
        for xi in X_test:
            logits = [sum(W[c][j] * xi[j] for j in range(d)) + b[c] for c in range(k)]
            p = softmax(logits)
            preds.append(max(range(k), key=lambda c: p[c]))
            probas.append(p)
        return preds, probas

    return W, b, predict


def gini(counts):
    tot = sum(counts)
    if tot == 0:
        return 0.0
    return 1.0 - sum((c / tot) ** 2 for c in counts)


def build_tree(X, y, max_depth=3, min_samples_split=2, depth=0, feature_subset=None):
    k = len(SPECIES)
    counts = [y.count(c) for c in range(k)]
    node_gini = gini(counts)
    pred_class = max(range(k), key=lambda c: counts[c])

    if depth >= max_depth or len(y) < min_samples_split or node_gini == 0.0:
        return {
            "leaf": True,
            "samples": len(y),
            "counts": counts,
            "gini": round(node_gini, 4),
            "class_idx": pred_class,
            "class_name": SPECIES[pred_class],
            "depth": depth,
        }

    best_gain = -1.0
    best_feat = None
    best_thresh = None

    feats = feature_subset if feature_subset is not None else list(range(len(FEATURES)))
    n = len(y)

    for f in feats:
        pairs = sorted(((X[i][f], y[i]) for i in range(n)), key=lambda t: t[0])
        lc = [0] * k
        rc = counts[:]
        for idx in range(n - 1):
            val, cls = pairs[idx]
            lc[cls] += 1
            rc[cls] -= 1
            next_val = pairs[idx + 1][0]
            if val == next_val:
                continue
            n_left = idx + 1
            n_right = n - n_left
            gain = node_gini - (n_left / n) * gini(lc) - (n_right / n) * gini(rc)
            if gain > best_gain + 1e-12:
                best_gain = gain
                best_feat = f
                best_thresh = (val + next_val) / 2.0

    if best_feat is None or best_gain <= 0.0:
        return {
            "leaf": True,
            "samples": len(y),
            "counts": counts,
            "gini": round(node_gini, 4),
            "class_idx": pred_class,
            "class_name": SPECIES[pred_class],
            "depth": depth,
        }

    left_X = [X[i] for i in range(n) if X[i][best_feat] <= best_thresh]
    left_y = [y[i] for i in range(n) if X[i][best_feat] <= best_thresh]
    right_X = [X[i] for i in range(n) if X[i][best_feat] > best_thresh]
    right_y = [y[i] for i in range(n) if X[i][best_feat] > best_thresh]

    return {
        "leaf": False,
        "feature_idx": best_feat,
        "feature": FEATURES[best_feat],
        "feature_label": FEATURE_LABELS[FEATURES[best_feat]],
        "threshold": round(best_thresh, 4),
        "samples": n,
        "counts": counts,
        "gini": round(node_gini, 4),
        "gain_weighted": best_gain * n,
        "class_idx": pred_class,
        "class_name": SPECIES[pred_class],
        "depth": depth,
        "left": build_tree(left_X, left_y, max_depth, min_samples_split, depth + 1, feature_subset),
        "right": build_tree(right_X, right_y, max_depth, min_samples_split, depth + 1, feature_subset),
    }


def tree_feature_importances(node):
    gains = [0.0] * len(FEATURES)

    def walk(nd):
        if nd["leaf"]:
            return
        gains[nd["feature_idx"]] += nd["gain_weighted"]
        walk(nd["left"])
        walk(nd["right"])

    walk(node)
    tot = sum(gains)
    return [round(g / tot, 4) if tot > 0 else 0.0 for g in gains]


def predict_tree_one(node, x):
    cur = node
    while not cur["leaf"]:
        if x[cur["feature_idx"]] <= cur["threshold"]:
            cur = cur["left"]
        else:
            cur = cur["right"]
    tot = sum(cur["counts"])
    probs = [c / tot for c in cur["counts"]]
    return cur["class_idx"], probs


def train_knn(X_train, y_train, k=5):
    def predict(X_test):
        preds = []
        probas = []
        for x in X_test:
            dists = []
            for xi, yi in zip(X_train, y_train):
                d = math.sqrt(sum((a - b) ** 2 for a, b in zip(x, xi)))
                dists.append((d, yi))
            dists.sort(key=lambda t: t[0])
            top = dists[:k]
            counts = [sum(1 for _, c in top if c == cls) for cls in range(len(SPECIES))]
            preds.append(max(range(len(SPECIES)), key=lambda c: counts[c]))
            probas.append([cnt / k for cnt in counts])
        return preds, probas
    return predict


def train_gaussian_nb(X_train, y_train):
    classes = list(range(len(SPECIES)))
    priors = {}
    means = {}
    vars_ = {}
    n = len(y_train)
    for c in classes:
        Xc = [X_train[i] for i in range(n) if y_train[i] == c]
        priors[c] = len(Xc) / n
        means[c] = [sum(row[j] for row in Xc) / len(Xc) for j in range(len(FEATURES))]
        vars_[c] = [
            sum((row[j] - means[c][j]) ** 2 for row in Xc) / len(Xc) + 1e-9
            for j in range(len(FEATURES))
        ]

    def predict(X_test):
        preds = []
        probas = []
        for x in X_test:
            log_p = []
            for c in classes:
                lp = math.log(priors[c])
                for j in range(len(FEATURES)):
                    v = vars_[c][j]
                    m = means[c][j]
                    lp += -0.5 * math.log(2 * math.pi * v) - ((x[j] - m) ** 2) / (2 * v)
                log_p.append(lp)
            p = softmax(log_p)
            preds.append(max(classes, key=lambda c: p[c]))
            probas.append(p)
        return preds, probas

    return predict


def train_random_forest(X_train, y_train, n_trees=100, max_depth=4, seed=42):
    rng = random.Random(seed)
    n = len(X_train)
    trees = []
    for _ in range(n_trees):
        sample_idx = [rng.randrange(n) for _ in range(n)]
        Xb = [X_train[i] for i in sample_idx]
        yb = [y_train[i] for i in sample_idx]
        feat_sub = sorted(rng.sample(range(len(FEATURES)), 2))
        trees.append(build_tree(Xb, yb, max_depth=max_depth, feature_subset=feat_sub))

    def predict(X_test):
        preds = []
        probas = []
        for x in X_test:
            votes = [0] * len(SPECIES)
            for t in trees:
                cls, _ = predict_tree_one(t, x)
                votes[cls] += 1
            preds.append(max(range(len(SPECIES)), key=lambda c: votes[c]))
            probas.append([v / n_trees for v in votes])
        return preds, probas

    # Average importances across forest
    imp_sum = [0.0] * len(FEATURES)
    for t in trees:
        ti = tree_feature_importances(t)
        for j in range(len(FEATURES)):
            imp_sum[j] += ti[j]
    importances = [round(v / n_trees, 4) for v in imp_sum]
    return predict, importances


def evaluate_predictions(y_true, y_pred, test_rows=None, probas=None):
    k = len(SPECIES)
    cm = [[0] * k for _ in range(k)]
    for yt, yp in zip(y_true, y_pred):
        cm[yt][yp] += 1

    per_class = []
    for c in range(k):
        tp = cm[c][c]
        fp = sum(cm[r][c] for r in range(k) if r != c)
        fn = sum(cm[c][col] for col in range(k) if col != c)
        support = sum(cm[c])
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        per_class.append({
            "species": SPECIES[c],
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "support": support,
        })

    acc = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp) / len(y_true)
    macro_p = sum(pc["precision"] for pc in per_class) / k
    macro_r = sum(pc["recall"] for pc in per_class) / k
    macro_f1 = sum(pc["f1"] for pc in per_class) / k
    total = len(y_true)
    weighted_p = sum(pc["precision"] * pc["support"] for pc in per_class) / total
    weighted_r = sum(pc["recall"] * pc["support"] for pc in per_class) / total
    weighted_f1 = sum(pc["f1"] * pc["support"] for pc in per_class) / total

    misclassified = []
    predictions_sample = []
    if test_rows is not None:
        for idx, (row, yt, yp) in enumerate(zip(test_rows, y_true, y_pred)):
            rec_item = {
                "id": row["id"],
                "sepal_length": row["sepal_length"],
                "sepal_width": row["sepal_width"],
                "petal_length": row["petal_length"],
                "petal_width": row["petal_width"],
                "actual": SPECIES[yt],
                "predicted": SPECIES[yp],
                "correct": yt == yp,
                "confidence": round(max(probas[idx]) * 100, 1) if probas else None,
            }
            predictions_sample.append(rec_item)
            if yt != yp:
                misclassified.append(rec_item)

    return {
        "accuracy": round(acc, 4),
        "correct_count": sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp),
        "total_test": len(y_true),
        "macro_precision": round(macro_p, 4),
        "macro_recall": round(macro_r, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_precision": round(weighted_p, 4),
        "weighted_recall": round(weighted_r, 4),
        "weighted_f1": round(weighted_f1, 4),
        "confusion_matrix": cm,
        "per_class": per_class,
        "misclassified": misclassified,
        "test_predictions": predictions_sample,
    }


def stratified_kfold_cv(rows, k_folds=5, seed=42):
    rng = random.Random(seed)
    folds = [[] for _ in range(k_folds)]
    for sp in SPECIES:
        sp_rows = [r for r in rows if r["species"] == sp]
        rng.shuffle(sp_rows)
        for idx, r in enumerate(sp_rows):
            folds[idx % k_folds].append(r)

    scores = defaultdict(list)
    for f_idx in range(k_folds):
        test_r = folds[f_idx]
        train_r = [r for j in range(k_folds) if j != f_idx for r in folds[j]]
        means, stds = fit_scaler(train_r)
        X_tr_s, y_tr = transform_rows(train_r, means, stds)
        X_te_s, y_te = transform_rows(test_r, means, stds)
        X_tr_raw, _ = raw_xy(train_r)
        X_te_raw, _ = raw_xy(test_r)

        _, _, lr_pred = train_logistic_regression(X_tr_s, y_tr, C=1.0)
        p_lr, _ = lr_pred(X_te_s)
        scores["logistic_regression"].append(sum(a == b for a, b in zip(y_te, p_lr)) / len(y_te))

        dt = build_tree(X_tr_raw, y_tr, max_depth=3)
        p_dt = [predict_tree_one(dt, x)[0] for x in X_te_raw]
        scores["decision_tree"].append(sum(a == b for a, b in zip(y_te, p_dt)) / len(y_te))

        knn_pred = train_knn(X_tr_s, y_tr, k=5)
        p_knn, _ = knn_pred(X_te_s)
        scores["knn"].append(sum(a == b for a, b in zip(y_te, p_knn)) / len(y_te))

        rf_pred, _ = train_random_forest(X_tr_raw, y_tr, n_trees=100, max_depth=4, seed=42 + f_idx)
        p_rf, _ = rf_pred(X_te_raw)
        scores["random_forest"].append(sum(a == b for a, b in zip(y_te, p_rf)) / len(y_te))

        nb_pred = train_gaussian_nb(X_tr_raw, y_tr)
        p_nb, _ = nb_pred(X_te_raw)
        scores["gaussian_nb"].append(sum(a == b for a, b in zip(y_te, p_nb)) / len(y_te))

    out = {}
    for model_key, vals in scores.items():
        m = sum(vals) / len(vals)
        s = math.sqrt(sum((v - m) ** 2 for v in vals) / (len(vals) - 1))
        out[model_key] = {
            "fold_scores": [round(v, 4) for v in vals],
            "mean": round(m, 4),
            "std": round(s, 4),
        }
    return out


def main():
    rows = load_data()

    # Check duplicates
    seen = {}
    duplicates = []
    for r in rows:
        sig = (r["sepal_length"], r["sepal_width"], r["petal_length"], r["petal_width"], r["species"])
        if sig in seen:
            duplicates.append({"first_id": seen[sig], "duplicate_id": r["id"], "values": list(sig)})
        else:
            seen[sig] = r["id"]

    # Unique counts
    unique_counts = {f: len(set(r[f] for r in rows)) for f in FEATURES}
    unique_counts["species"] = len(set(r["species"] for r in rows))

    # Overall stats
    overall_stats = {f: stats_summary([r[f] for r in rows]) for f in FEATURES}

    # Species stats
    species_stats = {}
    for sp in SPECIES:
        sp_rows = [r for r in rows if r["species"] == sp]
        species_stats[sp] = {f: stats_summary([r[f] for r in sp_rows]) for f in FEATURES}

    # Correlation matrix
    corr_matrix = []
    for f1 in FEATURES:
        row_c = []
        v1 = [r[f1] for r in rows]
        for f2 in FEATURES:
            v2 = [r[f2] for r in rows]
            row_c.append(round(pearson(v1, v2), 4))
        corr_matrix.append(row_c)

    # One-way ANOVA across species
    anova = {}
    for f in FEATURES:
        groups = [[r[f] for r in rows if r["species"] == sp] for sp in SPECIES]
        anova[f] = one_way_anova(groups)

    # Outlier detection via 1.5 * IQR rule (overall & per-species)
    outliers_overall = {}
    for f in FEATURES:
        st = overall_stats[f]
        lo = st["q1"] - 1.5 * st["iqr"]
        hi = st["q3"] + 1.5 * st["iqr"]
        flagged = [{"id": r["id"], "species": r["species"], "value": r[f]} for r in rows if r[f] < lo or r[f] > hi]
        outliers_overall[f] = {"lower_fence": round(lo, 3), "upper_fence": round(hi, 3), "count": len(flagged), "records": flagged}

    # Train/test split (80/20 stratified, seed=42)
    train_rows, test_rows = stratified_split(rows, test_ratio=0.2, seed=42)
    means, stds = fit_scaler(train_rows)
    X_tr_s, y_tr = transform_rows(train_rows, means, stds)
    X_te_s, y_te = transform_rows(test_rows, means, stds)
    X_tr_raw, _ = raw_xy(train_rows)
    X_te_raw, _ = raw_xy(test_rows)

    # 1. Logistic Regression (C=1.0, standardized)
    W_lr, b_lr, lr_predict = train_logistic_regression(X_tr_s, y_tr, C=1.0)
    lr_preds, lr_probas = lr_predict(X_te_s)
    lr_eval = evaluate_predictions(y_te, lr_preds, test_rows, lr_probas)

    # 2. Decision Tree (CART Gini, max_depth=3, raw cm)
    dt_tree = build_tree(X_tr_raw, y_tr, max_depth=3)
    dt_out = [predict_tree_one(dt_tree, x) for x in X_te_raw]
    dt_preds = [o[0] for o in dt_out]
    dt_probas = [o[1] for o in dt_out]
    dt_eval = evaluate_predictions(y_te, dt_preds, test_rows, dt_probas)
    dt_importances = tree_feature_importances(dt_tree)

    # 3. K-Nearest Neighbors (k=5, standardized Euclidean)
    knn_predict = train_knn(X_tr_s, y_tr, k=5)
    knn_preds, knn_probas = knn_predict(X_te_s)
    knn_eval = evaluate_predictions(y_te, knn_preds, test_rows, knn_probas)

    # 4. Random Forest (100 trees, max_depth=4, raw cm)
    rf_predict, rf_importances = train_random_forest(X_tr_raw, y_tr, n_trees=100, max_depth=4, seed=42)
    rf_preds, rf_probas = rf_predict(X_te_raw)
    rf_eval = evaluate_predictions(y_te, rf_preds, test_rows, rf_probas)

    # 5. Gaussian Naive Bayes (raw cm)
    nb_predict = train_gaussian_nb(X_tr_raw, y_tr)
    nb_preds, nb_probas = nb_predict(X_te_raw)
    nb_eval = evaluate_predictions(y_te, nb_preds, test_rows, nb_probas)

    # 5-fold stratified cross validation
    cv_results = stratified_kfold_cv(rows, k_folds=5, seed=42)

    result = {
        "dataset": {
            "source": "Fisher (1936) / Anderson (1935) Iris Benchmark (Scikit-learn load_iris canonical 150 records)",
            "total_rows": len(rows),
            "num_features": len(FEATURES),
            "num_classes": len(SPECIES),
            "class_counts": dict(Counter(r["species"] for r in rows)),
            "missing_values": {f: 0 for f in FEATURES + ["species"]},
            "duplicates": duplicates,
            "unique_counts": unique_counts,
            "rows": rows,
        },
        "statistics": {
            "overall": overall_stats,
            "by_species": species_stats,
            "correlation_matrix": corr_matrix,
            "anova": anova,
            "outliers_overall": outliers_overall,
        },
        "preprocessing": {
            "split_ratio": "80% Train / 20% Test (Stratified)",
            "random_state": 42,
            "train_size": len(train_rows),
            "test_size": len(test_rows),
            "train_class_counts": dict(Counter(r["species"] for r in train_rows)),
            "test_class_counts": dict(Counter(r["species"] for r in test_rows)),
            "scaler_means": {f: round(means[f], 4) for f in FEATURES},
            "scaler_stds": {f: round(stds[f], 4) for f in FEATURES},
        },
        "models": {
            "logistic_regression": {
                "name": "Logistic Regression",
                "scaling_required": True,
                "hyperparameters": "Multinomial L2 (C=1.0), StandardScaler fit on train only",
                "coefficients": [[round(v, 4) for v in row] for row in W_lr],
                "intercepts": [round(v, 4) for v in b_lr],
                "cv": cv_results["logistic_regression"],
                **lr_eval,
            },
            "decision_tree": {
                "name": "Decision Tree (CART)",
                "scaling_required": False,
                "hyperparameters": "Gini impurity, max_depth=3, min_samples_split=2",
                "feature_importances": dict(zip(FEATURES, dt_importances)),
                "tree": dt_tree,
                "cv": cv_results["decision_tree"],
                **dt_eval,
            },
            "knn": {
                "name": "K-Nearest Neighbors",
                "scaling_required": True,
                "hyperparameters": "k=5, Euclidean distance, StandardScaler fit on train only",
                "cv": cv_results["knn"],
                **knn_eval,
            },
            "random_forest": {
                "name": "Random Forest",
                "scaling_required": False,
                "hyperparameters": "100 CART trees, max_depth=4, max_features=2, random_state=42",
                "feature_importances": dict(zip(FEATURES, rf_importances)),
                "cv": cv_results["random_forest"],
                **rf_eval,
            },
            "gaussian_nb": {
                "name": "Gaussian Naive Bayes",
                "scaling_required": False,
                "hyperparameters": "Gaussian likelihood, empirical class priors",
                "cv": cv_results["gaussian_nb"],
                **nb_eval,
            },
        },
    }

    with open("src/data/irisAnalysis.json", "w") as f:
        json.dump(result, f, indent=2)

    print("Analysis complete.")
    for k, m in result["models"].items():
        print(f"{m['name']:22s} | Test Acc: {m['accuracy']*100:5.2f}% ({m['correct_count']}/{m['total_test']}) | Macro F1: {m['macro_f1']:.4f} | 5-Fold CV: {m['cv']['mean']*100:.2f}% ± {m['cv']['std']*100:.2f}%")
    print("Duplicates found:", duplicates)
    print("Outliers overall:", {k: v["count"] for k, v in outliers_overall.items()})


if __name__ == "__main__":
    main()
