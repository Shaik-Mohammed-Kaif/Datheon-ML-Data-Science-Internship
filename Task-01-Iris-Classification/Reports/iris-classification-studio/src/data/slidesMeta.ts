export type PartId = 'intro' | 'eda' | 'ml' | 'conclusion';

export interface SlideDefinition {
  index: number; // 0-based (0..19)
  number: string; // "01".."20"
  part: PartId;
  partLabel: string;
  title: string;
  subtitle: string;
}

export const IMAGES = {
  heroCover: '/src/assets/images/iris_hero_cover_1795354279615.jpg',
  morphology: '/src/assets/images/iris_morphology_anatomy_1795354278652.jpg',
  specimen: '/src/assets/images/iris_setosa_specimen_1795354279460.jpg',
  conservatory: '/src/assets/images/iris_field_meadow_1795354278475.jpg',
};

export const PART_SECTIONS: Array<{ id: PartId; label: string; startSlide: number }> = [
  { id: 'intro', label: 'Introduction', startSlide: 0 },
  { id: 'eda', label: 'Data & EDA', startSlide: 4 },
  { id: 'ml', label: 'Modeling', startSlide: 10 },
  { id: 'conclusion', label: 'Conclusions', startSlide: 16 },
];

export const SLIDES_META: SlideDefinition[] = [
  {
    index: 0,
    number: '01',
    part: 'intro',
    partLabel: 'Part 01 · Introduction',
    title: 'Iris Classification',
    subtitle: 'From Exploratory Data Analysis to Supervised Machine Learning',
  },
  {
    index: 1,
    number: '02',
    part: 'intro',
    partLabel: 'Part 01 · Introduction',
    title: 'The Classification Task',
    subtitle: 'Mapping four continuous floral measurements to three botanical species',
  },
  {
    index: 2,
    number: '03',
    part: 'intro',
    partLabel: 'Part 01 · Introduction',
    title: 'Central Analytical Question',
    subtitle: 'Where does morphology separate species cleanly, and where do boundaries overlap?',
  },
  {
    index: 3,
    number: '04',
    part: 'intro',
    partLabel: 'Part 01 · Introduction',
    title: 'Evidence Pipeline',
    subtitle: 'Four reproducible stages from raw benchmark verification to error forensics',
  },
  {
    index: 4,
    number: '05',
    part: 'eda',
    partLabel: 'Part 02 · Data Understanding',
    title: 'The Benchmark Dataset',
    subtitle: '150 canonical observations balanced equally across three Iris species',
  },
  {
    index: 5,
    number: '06',
    part: 'eda',
    partLabel: 'Part 02 · Data Understanding',
    title: 'Feature Vocabulary',
    subtitle: 'Botanical anatomy, measurement units, and empirical feature ranges',
  },
  {
    index: 6,
    number: '07',
    part: 'eda',
    partLabel: 'Part 02 · Data Understanding',
    title: 'Data Quality Verification',
    subtitle: 'Schema audit, missingness, exact duplicates, and 1.5×IQR outlier inspection',
  },
  {
    index: 7,
    number: '08',
    part: 'eda',
    partLabel: 'Part 02 · Data Understanding',
    title: 'Exploratory Distributions',
    subtitle: 'Interactive histograms, Gaussian KDE curves, box plots, and violin profiles',
  },
  {
    index: 8,
    number: '09',
    part: 'eda',
    partLabel: 'Part 02 · Data Understanding',
    title: 'Feature Relationships',
    subtitle: 'Pearson correlation matrix and interactive bivariate regression explorer',
  },
  {
    index: 9,
    number: '10',
    part: 'eda',
    partLabel: 'Part 02 · Data Understanding',
    title: 'Part One Findings',
    subtitle: 'Empirical evidence transitioning from descriptive statistics to modeling',
  },
  {
    index: 10,
    number: '11',
    part: 'ml',
    partLabel: 'Part 03 · Machine Learning',
    title: 'Preprocessing & Stratification',
    subtitle: 'Leakage-free feature scaling and reproducible 80/20 train-test splitting',
  },
  {
    index: 11,
    number: '12',
    part: 'ml',
    partLabel: 'Part 03 · Machine Learning',
    title: 'Logistic Regression',
    subtitle: 'Multinomial linear boundaries, standardized weights, and petal decision plane',
  },
  {
    index: 12,
    number: '13',
    part: 'ml',
    partLabel: 'Part 03 · Machine Learning',
    title: 'Decision Tree (CART)',
    subtitle: 'Gini-impurity axis-aligned rules and hierarchical feature importance',
  },
  {
    index: 13,
    number: '14',
    part: 'ml',
    partLabel: 'Part 03 · Machine Learning',
    title: 'Model Comparison',
    subtitle: 'Holdout test performance versus 5-fold stratified cross-validation across five classifiers',
  },
  {
    index: 14,
    number: '15',
    part: 'ml',
    partLabel: 'Part 03 · Machine Learning',
    title: 'Evaluation Metrics',
    subtitle: 'Precision, recall, F1-score, and macro versus weighted multiclass averaging',
  },
  {
    index: 15,
    number: '16',
    part: 'ml',
    partLabel: 'Part 03 · Machine Learning',
    title: 'Confusion Matrix Forensics',
    subtitle: 'Interactive cell inspection and specimen-level misclassification review',
  },
  {
    index: 16,
    number: '17',
    part: 'conclusion',
    partLabel: 'Part 04 · Insights & Conclusion',
    title: 'Analytical Findings',
    subtitle: 'Synthesizing ANOVA effect sizes, tree importances, and classifier convergence',
  },
  {
    index: 17,
    number: '18',
    part: 'conclusion',
    partLabel: 'Part 04 · Insights & Conclusion',
    title: 'Limitations & Caveats',
    subtitle: 'Sample size sensitivity, duplicate records, and botanical generalization bounds',
  },
  {
    index: 18,
    number: '19',
    part: 'conclusion',
    partLabel: 'Part 04 · Insights & Conclusion',
    title: 'Conclusion & Next Steps',
    subtitle: 'Recommended model architecture and future methodological extensions',
  },
  {
    index: 19,
    number: '20',
    part: 'conclusion',
    partLabel: 'Part 04 · Insights & Conclusion',
    title: 'Project Summary & Credits',
    subtitle: 'Complete empirical archive, source attribution, and export controls',
  },
];
