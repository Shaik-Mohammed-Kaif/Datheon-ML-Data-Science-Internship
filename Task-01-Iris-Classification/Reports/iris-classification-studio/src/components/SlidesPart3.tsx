import React, { useMemo, useState } from 'react';
import type Plotly from 'plotly.js-dist-min';
import analysisRaw from '../data/irisAnalysis.json';
import {
  IrisAnalysisReport,
  ModelKey,
  TreeNode,
} from '../types/iris';
import {
  FEATURE_META,
  FEATURE_ORDER,
  SPECIES_META,
  SPECIES_ORDER,
} from '../utils/statistics';
import { PlotlyChart } from './PlotlyChart';

const report = analysisRaw as IrisAnalysisReport;

const MODEL_KEYS: ModelKey[] = [
  'logistic_regression',
  'decision_tree',
  'knn',
  'random_forest',
  'gaussian_nb',
];

export const Slide11Preprocessing: React.FC = () => {
  const prep = report.preprocessing;
  return (
    <section aria-label="Slide 11: Preprocessing" className="slide-stage glass-panel flex flex-col justify-between rounded-2xl p-5 lg:p-6">
      <div className="border-b border-[#E3DAF0] pb-3">
        <p className="text-xs font-medium text-[#6D28D9]">
          Part 03 · Slide 11 · Leakage-Free Pipeline
        </p>
        <h2 className="font-editorial mt-0.5 text-2xl font-semibold text-[#1E152A]">
          Stratified Splitting &amp; Feature Standardization
        </h2>
        <p className="mt-0.5 text-xs text-[#5C4F6E]">
          All preprocessing statistics are estimated strictly on the 120-specimen training partition to prevent data leakage.
        </p>
      </div>

      <div className="mt-4 grid flex-1 gap-5 lg:grid-cols-12 lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between gap-4 lg:col-span-6">
          <div className="rounded-xl border border-[#E3DAF0] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1E152A]">
              Stratified 80 / 20 Partition (random_state = {prep.random_state})
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-[#F3EEF9] p-3.5">
                <div className="text-xs text-[#5C4F6E]">Training Set (80%)</div>
                <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[#4C1D95]">
                  {prep.train_size} rows
                </div>
                <div className="font-mono-tabular mt-1 text-[11px] text-[#5C4F6E]">
                  40 Setosa · 40 Versicolor · 40 Virginica
                </div>
              </div>
              <div className="rounded-lg bg-[#FAF8FC] border border-[#E3DAF0] p-3.5">
                <div className="text-xs text-[#5C4F6E]">Holdout Test Set (20%)</div>
                <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[#0F766E]">
                  {prep.test_size} rows
                </div>
                <div className="font-mono-tabular mt-1 text-[11px] text-[#5C4F6E]">
                  10 Setosa · 10 Versicolor · 10 Virginica
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-[#E3DAF0] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#1E152A]">
              StandardScaler Parameters (Fit on Train Fold Only)
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E3DAF0] text-[#5C4F6E]">
                    <th className="py-2 pr-3">Feature</th>
                    <th className="py-2 pr-3">Train Mean (μ)</th>
                    <th className="py-2">Train Std (σ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
                  {FEATURE_ORDER.map((f) => (
                    <tr key={f}>
                      <td className="py-2 pr-3 font-sans font-medium text-[#1E152A]">
                        {FEATURE_META[f].short}
                      </td>
                      <td className="py-2 pr-3">{prep.scaler_means[f].toFixed(4)} cm</td>
                      <td className="py-2">{prep.scaler_stds[f].toFixed(4)} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-xl border border-[#E3DAF0] bg-white p-5 lg:col-span-6">
          <div>
            <h3 className="text-sm font-semibold text-[#1E152A]">
              Model-Specific Scaling Requirements
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5C4F6E]">
              Feature standardization <span className="font-mono-tabular">z = (x − μ_train) / σ_train</span> equalizes feature variance for gradient-based optimization and Euclidean distance metrics, whereas axis-aligned tree splits are invariant to monotonic rescaling.
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E3DAF0] text-[#5C4F6E]">
                <th className="py-2 pr-3">Classifier</th>
                <th className="py-2 pr-3">Scaling</th>
                <th className="py-2">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DAF0]/60">
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-[#1E152A]">Logistic Regression</td>
                <td className="py-2.5 pr-3 font-mono-tabular text-[#6D28D9]">Required</td>
                <td className="py-2.5 text-[#5C4F6E]">L2 penalty assumes comparable feature scales</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-[#1E152A]">K-Nearest Neighbors</td>
                <td className="py-2.5 pr-3 font-mono-tabular text-[#6D28D9]">Required</td>
                <td className="py-2.5 text-[#5C4F6E]">Euclidean distances dominated by wide-range axes</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-[#1E152A]">Decision Tree (CART)</td>
                <td className="py-2.5 pr-3 font-mono-tabular text-[#0F766E]">Not Needed</td>
                <td className="py-2.5 text-[#5C4F6E]">Preserves interpretable threshold splits in cm</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-[#1E152A]">Random Forest</td>
                <td className="py-2.5 pr-3 font-mono-tabular text-[#0F766E]">Not Needed</td>
                <td className="py-2.5 text-[#5C4F6E]">Ensemble of scale-invariant Gini splits</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-semibold text-[#1E152A]">Gaussian Naive Bayes</td>
                <td className="py-2.5 pr-3 font-mono-tabular text-[#0F766E]">Not Needed</td>
                <td className="py-2.5 text-[#5C4F6E]">Per-feature class variance normalizes likelihood</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide12LogisticRegression: React.FC<{ active: boolean }> = ({ active }) => {
  const lr = report.models.logistic_regression;

  const boundaryData = useMemo(() => {
    const means = report.preprocessing.scaler_means;
    const stds = report.preprocessing.scaler_stds;
    const coefs = lr.coefficients || [];
    const intercepts = lr.intercepts || [];

    const xGrid: number[] = [];
    const yGrid: number[] = [];
    for (let x = 0.8; x <= 7.1; x += 0.14) xGrid.push(Number(x.toFixed(2)));
    for (let y = 0.05; y <= 2.65; y += 0.06) yGrid.push(Number(y.toFixed(2)));

    // Slice at training means for Sepal Length and Sepal Width (z0=0, z1=0)
    const zClass: number[][] = yGrid.map((pw) =>
      xGrid.map((pl) => {
        const z2 = (pl - means.petal_length) / stds.petal_length;
        const z3 = (pw - means.petal_width) / stds.petal_width;
        const logits = coefs.map((row, idx) => row[2] * z2 + row[3] * z3 + intercepts[idx]);
        return logits.indexOf(Math.max(...logits));
      })
    );

    const traces: Plotly.Data[] = [
      {
        type: 'contour',
        x: xGrid,
        y: yGrid,
        z: zClass,
        showscale: false,
        opacity: 0.24,
        contours: { start: 0, end: 2, size: 1 },
        colorscale: [
          [0, '#6D28D9'],
          [0.5, '#0F766E'],
          [1, '#BE185D'],
        ] as Array<[number, string]>,
        hoverinfo: 'skip',
      },
    ];

    SPECIES_ORDER.forEach((sp) => {
      const sub = report.dataset.rows.filter((r) => r.species === sp);
      traces.push({
        type: 'scatter',
        mode: 'markers',
        name: SPECIES_META[sp].short,
        x: sub.map((r) => r.petal_length),
        y: sub.map((r) => r.petal_width),
        marker: {
          color: SPECIES_META[sp].color,
          size: 7.5,
          line: { width: 1, color: '#ffffff' },
        },
        hovertemplate: `${SPECIES_META[sp].short}<br>Petal L: %{x:.1f} cm · Petal W: %{y:.1f} cm<extra></extra>`,
      });
    });

    return traces;
  }, [lr]);

  const boundaryLayout = useMemo(
    () => ({
      xaxis: { title: { text: 'Petal Length (cm)' } },
      yaxis: { title: { text: 'Petal Width (cm)' } },
      legend: { orientation: 'h' as const, y: 1.13 },
      margin: { t: 32, r: 16, b: 46, l: 52 },
    }),
    []
  );

  return (
    <section aria-label="Slide 12: Logistic Regression" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-6 lg:col-span-5">
        <div>
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 03 · Slide 12 · Linear Probabilistic Classifier
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A]">
            Multinomial Logistic Regression
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#5C4F6E]">
            Models calibrated class probabilities via softmax over linear combinations of standardized features with L2 regularization (<span className="font-mono-tabular">C = 1.0</span>).
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#F3EEF9] p-3">
              <div className="text-[11px] text-[#5C4F6E]">Test Acc</div>
              <div className="font-mono-tabular text-lg font-bold text-[#4C1D95]">
                {(lr.accuracy * 100).toFixed(2)}%
              </div>
            </div>
            <div className="rounded-lg bg-[#F3EEF9] p-3">
              <div className="text-[11px] text-[#5C4F6E]">Macro F1</div>
              <div className="font-mono-tabular text-lg font-bold text-[#4C1D95]">
                {lr.macro_f1.toFixed(4)}
              </div>
            </div>
            <div className="rounded-lg bg-[#FAF8FC] border border-[#E3DAF0] p-3">
              <div className="text-[11px] text-[#5C4F6E]">5-Fold CV</div>
              <div className="font-mono-tabular text-lg font-bold text-[#0F766E]">
                {(lr.cv.mean * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[#E3DAF0] bg-white p-4">
          <h3 className="text-xs font-semibold text-[#1E152A]">
            Trained Standardized Coefficients (W)
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#E3DAF0] text-[#5C4F6E]">
                  <th className="py-1.5 pr-2">Class</th>
                  <th className="py-1.5 pr-2">SL</th>
                  <th className="py-1.5 pr-2">SW</th>
                  <th className="py-1.5 pr-2">PL</th>
                  <th className="py-1.5">PW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
                {SPECIES_ORDER.map((sp, i) => (
                  <tr key={sp}>
                    <td className="py-1.5 pr-2 font-sans font-semibold" style={{ color: SPECIES_META[sp].color }}>
                      {SPECIES_META[sp].short}
                    </td>
                    {lr.coefficients?.[i].map((w, j) => (
                      <td key={j} className="py-1.5 pr-2">
                        {w >= 0 ? `+${w.toFixed(2)}` : w.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col rounded-2xl p-5 lg:col-span-7">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1E152A]">
              Decision Regions in Petal Plane (Sepal features fixed at train mean)
            </h3>
            <p className="text-xs text-[#5C4F6E]">
              Linear hyperplanes cleanly isolate Setosa and partition Versicolor vs Virginica.
            </p>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-2">
          <PlotlyChart
            id="slide12-lr-boundary"
            active={active}
            height={380}
            fillHeight
            exportFilename="iris_logistic_regression_boundary"
            data={boundaryData}
            layout={boundaryLayout}
          />
        </div>
      </div>
    </section>
  );
};

export const Slide13DecisionTree: React.FC<{ active: boolean }> = ({ active }) => {
  const dt = report.models.decision_tree;
  const rootTree = dt.tree!;
  const [selectedState, setSelectedState] = useState<{ path: string; node: TreeNode }>({
    path: 'root',
    node: rootTree,
  });
  const selectedNode = selectedState.node;

  const importanceData = useMemo(() => {
    const imp = dt.feature_importances!;
    const sorted = [...FEATURE_ORDER].sort((a, b) => imp[a] - imp[b]);
    return [
      {
        type: 'bar' as const,
        orientation: 'h' as const,
        y: sorted.map((f) => FEATURE_META[f].short),
        x: sorted.map((f) => imp[f]),
        text: sorted.map((f) => `${(imp[f] * 100).toFixed(1)}%`),
        textposition: 'outside' as const,
        marker: { color: '#6D28D9' },
      },
    ];
  }, [dt]);

  const importanceLayout = useMemo<Partial<Plotly.Layout>>(
    () => ({
      margin: { t: 8, r: 46, b: 30, l: 96 },
      xaxis: { range: [0, 0.72], title: { text: 'Normalized Gini Gain' } },
    }),
    []
  );

  const renderNodeButton = (node: TreeNode, labelPrefix: string, path: string) => {
    const isSelected = selectedState.path === path;

    return (
      <button
        key={path}
        type="button"
        onClick={() => setSelectedState({ path, node })}
        className={`w-full min-w-0 rounded-lg border p-2.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[#6D28D9] ${
          isSelected
            ? 'border-[#6D28D9] bg-[#4C1D95] text-white shadow-sm'
            : 'border-[#E3DAF0] bg-white text-[#1E152A] hover:bg-[#FAF8FC]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="font-semibold">
            {labelPrefix}
            {node.leaf
              ? `Predict ${SPECIES_META[node.class_name].short}`
              : `${FEATURE_META[node.feature!].short} ≤ ${node.threshold?.toFixed(2)}`}
          </span>
          <span
            className={`font-mono-tabular text-[11px] ${
              isSelected ? 'text-[#5EEAD4]' : 'text-[#5C4F6E]'
            }`}
          >
            n={node.samples} · gini={node.gini.toFixed(2)}
          </span>
        </div>
        <div
          className={`font-mono-tabular mt-1 text-[11px] ${
            isSelected ? 'text-[#DDD6FE]' : 'text-[#5C4F6E]'
          }`}
        >
          [{node.counts.join(', ')}]
        </div>
      </button>
    );
  };

  return (
    <section aria-label="Slide 13: Decision Tree" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-7">
        <div className="border-b border-[#E3DAF0] pb-3">
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 03 · Slide 13 · CART Gini Classifier (max_depth = 3)
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A]">
            Interactive Decision Tree Rules
          </h2>
          <p className="mt-1 text-xs text-[#5C4F6E]">
            Click any decision or leaf node to inspect its sample distribution [Setosa, Versicolor, Virginica].
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {renderNodeButton(rootTree, 'Root: ', 'root')}
          {rootTree.left && (
            <div className="ml-2.5 border-l border-[#E3DAF0] pl-2.5 sm:ml-5 sm:pl-4">
              {renderNodeButton(rootTree.left, 'True (≤): ', 'root-L')}
            </div>
          )}
          {rootTree.right && (
            <div className="ml-2.5 space-y-2 border-l border-[#E3DAF0] pl-2.5 sm:ml-5 sm:pl-4">
              {renderNodeButton(rootTree.right, 'False (>): ', 'root-R')}
              {rootTree.right.left && (
                <div className="ml-2.5 space-y-2 border-l border-[#E3DAF0] pl-2.5 sm:ml-5 sm:pl-4">
                  {renderNodeButton(rootTree.right.left, 'True (≤): ', 'root-R-L')}
                  {rootTree.right.left.left && (
                    <div className="ml-2.5 grid gap-2 sm:ml-5 sm:grid-cols-2">
                      {renderNodeButton(rootTree.right.left.left, '≤: ', 'root-R-L-L')}
                      {rootTree.right.left.right &&
                        renderNodeButton(rootTree.right.left.right, '>: ', 'root-R-L-R')}
                    </div>
                  )}
                </div>
              )}
              {rootTree.right.right && (
                <div className="ml-2.5 space-y-2 border-l border-[#E3DAF0] pl-2.5 sm:ml-5 sm:pl-4">
                  {renderNodeButton(rootTree.right.right, 'False (>): ', 'root-R-R')}
                  {rootTree.right.right.left && (
                    <div className="ml-2.5 grid gap-2 sm:ml-5 sm:grid-cols-2">
                      {renderNodeButton(rootTree.right.right.left, '≤: ', 'root-R-R-L')}
                      {rootTree.right.right.right &&
                        renderNodeButton(rootTree.right.right.right, '>: ', 'root-R-R-R')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-5">
        <div>
          <h3 className="text-sm font-semibold text-[#1E152A]">
            Selected Node Inspection (Depth {selectedNode.depth})
          </h3>
          <div className="mt-3 rounded-xl border border-[#E3DAF0] bg-white p-4 text-xs">
            <div className="font-semibold text-[#4C1D95]">
              {selectedNode.leaf
                ? `Terminal Leaf → Predicts ${selectedNode.class_name}`
                : `Split Rule → ${selectedNode.feature_label} ≤ ${selectedNode.threshold?.toFixed(2)} cm`}
            </div>
            <div className="font-mono-tabular mt-2 grid grid-cols-3 gap-2 text-center">
              {SPECIES_ORDER.map((sp, i) => (
                <div key={sp} className="rounded bg-[#FAF8FC] p-2">
                  <div className="font-sans font-semibold" style={{ color: SPECIES_META[sp].color }}>
                    {SPECIES_META[sp].short}
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-[#1E152A]">
                    {selectedNode.counts[i]}
                  </div>
                </div>
              ))}
            </div>
            <div className="font-mono-tabular mt-2 text-[#5C4F6E]">
              Gini Impurity: {selectedNode.gini.toFixed(4)} · Total Samples: {selectedNode.samples}
            </div>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-3">
          <h3 className="mb-1 shrink-0 text-xs font-semibold text-[#1E152A]">
            Gini Feature Importance (CART max_depth=3)
          </h3>
          <PlotlyChart
            id="slide13-dt-importance"
            active={active}
            height={175}
            fillHeight
            exportFilename="iris_decision_tree_importance"
            data={importanceData}
            layout={importanceLayout}
          />
        </div>
      </div>
    </section>
  );
};

export const Slide14ModelComparison: React.FC<{ active: boolean }> = ({ active }) => {
  const [metricView, setMetricView] = useState<'accuracy_cv' | 'f1'>('accuracy_cv');

  const models = useMemo(() => MODEL_KEYS.map((k) => report.models[k]), []);

  const chartData = useMemo(() => {
    if (metricView === 'accuracy_cv') {
      return [
        {
          type: 'bar' as const,
          name: 'Holdout Test Accuracy (%)',
          x: models.map((m) => m.name),
          y: models.map((m) => Number((m.accuracy * 100).toFixed(2))),
          marker: { color: '#6D28D9' },
        },
        {
          type: 'bar' as const,
          name: '5-Fold CV Mean (%)',
          x: models.map((m) => m.name),
          y: models.map((m) => Number((m.cv.mean * 100).toFixed(2))),
          error_y: {
            type: 'data' as const,
            array: models.map((m) => Number((m.cv.std * 100).toFixed(2))),
            visible: true,
            color: '#1E152A',
          },
          marker: { color: '#0F766E' },
        },
      ];
    }
    return [
      {
        type: 'bar' as const,
        name: 'Macro F1 (%)',
        x: models.map((m) => m.name),
        y: models.map((m) => Number((m.macro_f1 * 100).toFixed(2))),
        marker: { color: '#4C1D95' },
      },
      {
        type: 'bar' as const,
        name: 'Weighted F1 (%)',
        x: models.map((m) => m.name),
        y: models.map((m) => Number((m.weighted_f1 * 100).toFixed(2))),
        marker: { color: '#BE185D' },
      },
    ];
  }, [metricView, models]);

  const comparisonLayout = useMemo<Partial<Plotly.Layout>>(
    () => ({
      barmode: 'group',
      xaxis: { tickangle: -15, automargin: true },
      yaxis: { range: [85, 102], title: { text: 'Score (%)' } },
      legend: { orientation: 'h', y: 1.15 },
      margin: { t: 32, r: 16, b: 64, l: 52 },
    }),
    []
  );

  return (
    <section aria-label="Slide 14: Model Comparison" className="slide-stage glass-panel flex flex-col rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E3DAF0] pb-4">
        <div>
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 03 · Slide 14 · Multi-Model Benchmark
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A]">
            Comparison Across Five Trained Classifiers
          </h2>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-[#F3EEF9] p-1">
          <button
            type="button"
            onClick={() => setMetricView('accuracy_cv')}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
              metricView === 'accuracy_cv'
                ? 'bg-white text-[#1E152A] shadow-sm'
                : 'text-[#5C4F6E] hover:text-[#1E152A]'
            }`}
          >
            Test Acc vs 5-Fold CV
          </button>
          <button
            type="button"
            onClick={() => setMetricView('f1')}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
              metricView === 'f1'
                ? 'bg-white text-[#1E152A] shadow-sm'
                : 'text-[#5C4F6E] hover:text-[#1E152A]'
            }`}
          >
            Macro vs Weighted F1
          </button>
        </div>
      </div>

      <div className="mt-4 grid flex-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-[#E3DAF0] bg-white p-3 lg:col-span-7">
          <PlotlyChart
            id="slide14-model-comparison"
            active={active}
            height={320}
            fillHeight
            exportFilename="iris_model_comparison"
            data={chartData}
            layout={comparisonLayout}
          />
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-xl border border-[#E3DAF0] bg-white p-4 lg:col-span-5">
          <div>
            <h3 className="text-sm font-semibold text-[#1E152A]">
              Executed Benchmark Ledger
            </h3>
            <p className="mt-1 text-xs text-[#5C4F6E]">
              On the 30-specimen holdout split, every model scores 28/30 (93.33%). Across 5-fold CV (all 150 specimens), Logistic Regression and KNN lead at 96.00% ± 1.49%.
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E3DAF0] text-[#5C4F6E]">
                  <th className="py-2 pr-2">Model</th>
                  <th className="py-2 pr-2">Holdout</th>
                  <th className="py-2">5-Fold CV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
                {models.map((m) => (
                  <tr key={m.name}>
                    <td className="py-2 pr-2 font-sans font-medium text-[#1E152A]">{m.name}</td>
                    <td className="py-2 pr-2">{(m.accuracy * 100).toFixed(2)}%</td>
                    <td className="py-2 text-[#0F766E]">
                      {(m.cv.mean * 100).toFixed(2)}% ± {(m.cv.std * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide15EvaluationMetrics: React.FC<{ active: boolean }> = ({ active }) => {
  const [selectedModel, setSelectedModel] = useState<ModelKey>('logistic_regression');
  const model = report.models[selectedModel];

  const perClassData = useMemo(() => {
    const names = model.per_class.map((p) => SPECIES_META[p.species].short);
    return [
      {
        type: 'bar' as const,
        name: 'Precision',
        x: names,
        y: model.per_class.map((p) => Number((p.precision * 100).toFixed(2))),
        marker: { color: '#6D28D9' },
      },
      {
        type: 'bar' as const,
        name: 'Recall',
        x: names,
        y: model.per_class.map((p) => Number((p.recall * 100).toFixed(2))),
        marker: { color: '#0F766E' },
      },
      {
        type: 'bar' as const,
        name: 'F1-Score',
        x: names,
        y: model.per_class.map((p) => Number((p.f1 * 100).toFixed(2))),
        marker: { color: '#BE185D' },
      },
    ];
  }, [model]);

  const perClassLayout = useMemo<Partial<Plotly.Layout>>(
    () => ({
      barmode: 'group',
      yaxis: { range: [70, 105], title: { text: 'Metric (%)' } },
      legend: { orientation: 'h', y: 1.15 },
      margin: { t: 30, r: 16, b: 36, l: 50 },
    }),
    []
  );

  return (
    <section aria-label="Slide 15: Evaluation Metrics" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-5">
        <div>
        <p className="text-xs font-medium text-[#6D28D9]">
          Part 03 · Slide 15 · Classification Report
        </p>
        <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A]">
          Multiclass Evaluation Metrics
        </h2>

        <label className="mt-4 block text-xs">
          <span className="font-medium text-[#5C4F6E]">Inspect Trained Classifier:</span>
          <select
            aria-label="Select model for evaluation metrics"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
            className="mt-1.5 w-full rounded-lg border border-[#E3DAF0] bg-white px-3 py-2 text-xs font-semibold text-[#1E152A]"
          >
            {MODEL_KEYS.map((k) => (
              <option key={k} value={k}>
                {report.models[k].name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 space-y-2.5 text-xs text-[#5C4F6E]">
          <div className="rounded-lg bg-white p-3 border border-[#E3DAF0]">
            <strong className="text-[#1E152A]">Precision:</strong> Share of predicted species labels that truly belong to that species (<span className="font-mono-tabular">TP / (TP + FP)</span>).
          </div>
          <div className="rounded-lg bg-white p-3 border border-[#E3DAF0]">
            <strong className="text-[#1E152A]">Recall:</strong> Share of actual species specimens correctly recovered (<span className="font-mono-tabular">TP / (TP + FN)</span>).
          </div>
          <div className="rounded-lg bg-white p-3 border border-[#E3DAF0]">
            <strong className="text-[#1E152A]">Macro vs Weighted Averaging:</strong> Macro averages classes equally (1/3 each); Weighted weights by class support. Since holdout classes are balanced (10/10/10), Macro = Weighted (<span className="font-mono-tabular font-semibold text-[#4C1D95]">{model.macro_f1.toFixed(4)}</span>).
          </div>
        </div>
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-7">
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-2">
          <PlotlyChart
            id="slide15-per-class-metrics"
            active={active}
            height={265}
            fillHeight
            exportFilename={`iris_per_class_${selectedModel}`}
            data={perClassData}
            layout={perClassLayout}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E3DAF0] text-[#5C4F6E]">
                <th className="py-2 pr-3">Class</th>
                <th className="py-2 pr-3">Precision</th>
                <th className="py-2 pr-3">Recall</th>
                <th className="py-2 pr-3">F1-Score</th>
                <th className="py-2">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
              {model.per_class.map((pc) => (
                <tr key={pc.species}>
                  <td className="py-2 pr-3 font-sans font-semibold whitespace-nowrap" style={{ color: SPECIES_META[pc.species].color }}>
                    {pc.species}
                  </td>
                  <td className="py-2 pr-3">{(pc.precision * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-3">{(pc.recall * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-3">{(pc.f1 * 100).toFixed(2)}%</td>
                  <td className="py-2">{pc.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export const Slide16ConfusionMatrix: React.FC<{ active: boolean }> = ({ active }) => {
  const [selectedModel, setSelectedModel] = useState<ModelKey>('logistic_regression');
  const [selectedCell, setSelectedCell] = useState<{ actualIdx: number; predIdx: number }>({
    actualIdx: 2,
    predIdx: 1,
  });

  const model = report.models[selectedModel];
  const shortNames = SPECIES_ORDER.map((s) => SPECIES_META[s].short);

  const cmData = useMemo(() => {
    const z = model.confusion_matrix;
    const text = z.map((row) => row.map((v) => `${v} / 10`));
    return [
      {
        type: 'heatmap' as const,
        x: shortNames,
        y: shortNames,
        z,
        text: text as unknown as string[],
        texttemplate: '%{text}',
        zmin: 0,
        zmax: 10,
        colorscale: [
          [0, '#FAF8FC'],
          [0.3, '#DDD6FE'],
          [1, '#4C1D95'],
        ] as Array<[number, string]>,
        hovertemplate: 'Actual: %{y}<br>Predicted: %{x}<br>Count: %{z}<extra></extra>',
      },
    ];
  }, [model, shortNames]);

  const matchingSpecimens = useMemo(() => {
    const actualSp = SPECIES_ORDER[selectedCell.actualIdx];
    const predSp = SPECIES_ORDER[selectedCell.predIdx];
    return model.test_predictions.filter(
      (p) => p.actual === actualSp && p.predicted === predSp
    );
  }, [model, selectedCell]);

  const cmLayout = useMemo(
    () => ({
      xaxis: { title: { text: 'Predicted Species' } },
      yaxis: { title: { text: 'Actual Species' }, autorange: 'reversed' as const },
      margin: { t: 24, r: 20, b: 50, l: 84 },
    }),
    []
  );

  return (
    <section aria-label="Slide 16: Confusion Matrix" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col rounded-2xl p-5 sm:p-6 lg:col-span-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3DAF0] pb-3">
          <div>
            <p className="text-xs font-medium text-[#6D28D9]">
              Part 03 · Slide 16 · Interactive Error Matrix
            </p>
            <h2 className="font-editorial text-2xl font-semibold text-[#1E152A]">
              Confusion Matrix Heatmap
            </h2>
          </div>
          <select
            aria-label="Select model for confusion matrix"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
            className="rounded-lg border border-[#E3DAF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E152A]"
          >
            {MODEL_KEYS.map((k) => (
              <option key={k} value={k}>
                {report.models[k].name}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-2 text-xs text-[#5C4F6E]">
          Click any matrix cell to inspect the exact holdout test specimens classified into that cell.
        </p>

        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-2">
          <PlotlyChart
            id="slide16-confusion-matrix"
            active={active}
            height={320}
            fillHeight
            exportFilename={`iris_cm_${selectedModel}`}
            data={cmData}
            layout={cmLayout}
            onCellClick={(pt) => {
              const predIdx = shortNames.indexOf(String(pt.x));
              const actualIdx = shortNames.indexOf(String(pt.y));
              if (predIdx >= 0 && actualIdx >= 0) {
                setSelectedCell({ actualIdx, predIdx });
              }
            }}
          />
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-6">
        <div>
          <h3 className="text-base font-semibold text-[#1E152A]">
            Cell Forensics: Actual {shortNames[selectedCell.actualIdx]} → Predicted{' '}
            {shortNames[selectedCell.predIdx]}
          </h3>
          <p className="mt-1 text-xs text-[#5C4F6E]">
            Showing {matchingSpecimens.length} holdout test specimen(s) for {model.name}. (Click any cell or select misclassified pair below.)
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCell({ actualIdx: 2, predIdx: 1 })}
              className="rounded-md bg-[#F3EEF9] px-2.5 py-1 text-xs font-medium text-[#BE185D] hover:bg-[#E3DAF0]"
            >
              Inspect Errors: Actual Virginica → Predicted Versicolor (2)
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-[#E3DAF0] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E3DAF0] bg-[#FAF8FC] text-[#5C4F6E]">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">SL / SW</th>
                  <th className="px-3 py-2">PL / PW</th>
                  <th className="px-3 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
                {matchingSpecimens.map((s) => (
                  <tr key={s.id} className={!s.correct ? 'bg-rose-50/70' : ''}>
                    <td className="px-3 py-2 font-semibold text-[#1E152A]">#{s.id}</td>
                    <td className="px-3 py-2">
                      {s.sepal_length.toFixed(1)} / {s.sepal_width.toFixed(1)}
                    </td>
                    <td className="px-3 py-2">
                      {s.petal_length.toFixed(1)} / {s.petal_width.toFixed(1)}
                    </td>
                    <td className="px-3 py-2">
                      {s.confidence !== null ? `${s.confidence.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
                {matchingSpecimens.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center font-sans text-[#5C4F6E]">
                      0 specimens in this matrix cell.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 border-t border-[#E3DAF0] pt-3 text-xs leading-relaxed text-[#5C4F6E]">
          Root cause of errors: Virginica specimens <span className="font-mono-tabular font-semibold text-[#1E152A]">#107</span> (PL 4.5, PW 1.7 cm) and <span className="font-mono-tabular font-semibold text-[#1E152A]">#120</span> (PL 5.0, PW 1.5 cm) sit inside the upper Versicolor petal envelope.
        </p>
      </div>
    </section>
  );
};
