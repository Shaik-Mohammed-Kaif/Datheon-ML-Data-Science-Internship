export type FeatureKey = 'sepal_length' | 'sepal_width' | 'petal_length' | 'petal_width';

export type SpeciesName = 'Iris-setosa' | 'Iris-versicolor' | 'Iris-virginica';

export interface IrisObservation {
  id: number;
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
  species: SpeciesName;
}

export interface FeatureStatSummary {
  count: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  q1: number;
  q3: number;
  iqr: number;
  max: number;
}

export interface AnovaResult {
  f_stat: number;
  df_between: number;
  df_within: number;
  eta_squared: number;
}

export interface OutlierSummary {
  lower_fence: number;
  upper_fence: number;
  count: number;
  records: Array<{ id: number; species: SpeciesName; value: number }>;
}

export interface TreeNode {
  leaf: boolean;
  feature_idx?: number;
  feature?: FeatureKey;
  feature_label?: string;
  threshold?: number;
  samples: number;
  counts: number[];
  gini: number;
  gain_weighted?: number;
  class_idx: number;
  class_name: SpeciesName;
  depth: number;
  left?: TreeNode;
  right?: TreeNode;
}

export interface PerClassMetric {
  species: SpeciesName;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface TestPrediction {
  id: number;
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
  actual: SpeciesName;
  predicted: SpeciesName;
  correct: boolean;
  confidence: number | null;
}

export interface ModelEvaluation {
  name: string;
  scaling_required: boolean;
  hyperparameters: string;
  accuracy: number;
  correct_count: number;
  total_test: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  weighted_precision: number;
  weighted_recall: number;
  weighted_f1: number;
  confusion_matrix: number[][];
  per_class: PerClassMetric[];
  misclassified: TestPrediction[];
  test_predictions: TestPrediction[];
  cv: {
    fold_scores: number[];
    mean: number;
    std: number;
  };
  coefficients?: number[][];
  intercepts?: number[];
  feature_importances?: Record<FeatureKey, number>;
  tree?: TreeNode;
}

export interface IrisAnalysisReport {
  dataset: {
    source: string;
    total_rows: number;
    num_features: number;
    num_classes: number;
    class_counts: Record<SpeciesName, number>;
    missing_values: Record<string, number>;
    duplicates: Array<{
      first_id: number;
      duplicate_id: number;
      values: Array<string | number>;
    }>;
    unique_counts: Record<string, number>;
    rows: IrisObservation[];
  };
  statistics: {
    overall: Record<FeatureKey, FeatureStatSummary>;
    by_species: Record<SpeciesName, Record<FeatureKey, FeatureStatSummary>>;
    correlation_matrix: number[][];
    anova: Record<FeatureKey, AnovaResult>;
    outliers_overall: Record<FeatureKey, OutlierSummary>;
  };
  preprocessing: {
    split_ratio: string;
    random_state: number;
    train_size: number;
    test_size: number;
    train_class_counts: Record<SpeciesName, number>;
    test_class_counts: Record<SpeciesName, number>;
    scaler_means: Record<FeatureKey, number>;
    scaler_stds: Record<FeatureKey, number>;
  };
  models: {
    logistic_regression: ModelEvaluation;
    decision_tree: ModelEvaluation;
    knn: ModelEvaluation;
    random_forest: ModelEvaluation;
    gaussian_nb: ModelEvaluation;
  };
}

export type ModelKey = keyof IrisAnalysisReport['models'];
