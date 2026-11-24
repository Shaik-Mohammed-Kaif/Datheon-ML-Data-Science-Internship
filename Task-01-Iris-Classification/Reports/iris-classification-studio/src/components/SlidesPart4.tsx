import React, { useMemo } from 'react';
import { Copy, Printer, RotateCcw } from 'lucide-react';
import analysisRaw from '../data/irisAnalysis.json';
import { IMAGES } from '../data/slidesMeta';
import { IrisAnalysisReport } from '../types/iris';
import { FEATURE_META, FEATURE_ORDER } from '../utils/statistics';
import { BotanicalImage } from './BotanicalImage';
import { PlotlyChart } from './PlotlyChart';

const report = analysisRaw as IrisAnalysisReport;

export const Slide17Findings: React.FC<{ active: boolean }> = ({ active }) => {
  const alignmentData = useMemo(() => {
    const labels = FEATURE_ORDER.map((f) => FEATURE_META[f].short);
    return [
      {
        type: 'bar' as const,
        name: 'ANOVA η² (Variance Explained)',
        x: labels,
        y: FEATURE_ORDER.map((f) => Number((report.statistics.anova[f].eta_squared * 100).toFixed(2))),
        marker: { color: '#6D28D9' },
      },
      {
        type: 'bar' as const,
        name: 'Random Forest Importance (%)',
        x: labels,
        y: FEATURE_ORDER.map((f) =>
          Number(((report.models.random_forest.feature_importances?.[f] ?? 0) * 100).toFixed(2))
        ),
        marker: { color: '#0F766E' },
      },
    ];
  }, []);

  const alignmentLayout = useMemo<Partial<Plotly.Layout>>(
    () => ({
      barmode: 'group',
      yaxis: { range: [0, 105], title: { text: 'Contribution (%)' } },
      legend: { orientation: 'h', y: 1.15 },
      margin: { t: 30, r: 16, b: 36, l: 50 },
    }),
    []
  );

  return (
    <section aria-label="Slide 17: Analytical Findings" className="slide-stage grid gap-5 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col rounded-2xl p-5 lg:col-span-6">
        <p className="text-xs font-medium text-[#6D28D9]">
          Part 04 · Slide 17 · Evidence Convergence
        </p>
        <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A]">
          Statistical &amp; Algorithmic Agreement
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#5C4F6E]">
          Both parametric ANOVA and non-parametric tree ensembles converge on the same conclusion: petal dimensions carry the decisive biological signal for Iris species discrimination.
        </p>

        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-2">
          <PlotlyChart
            id="slide17-convergence"
            active={active}
            height={280}
            fillHeight
            exportFilename="iris_anova_vs_rf_importance"
            data={alignmentData}
            layout={alignmentLayout}
          />
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 lg:col-span-6">
        <h3 className="text-base font-semibold text-[#1E152A]">
          Three Established Findings
        </h3>
        <div className="mt-3 grid flex-1 gap-4">
          <div className="rounded-xl border border-[#E3DAF0] bg-white p-4">
            <div className="text-xs font-semibold text-[#4C1D95]">
              1. Two-Feature Sufficiency for Setosa
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#5C4F6E]">
              A single CART threshold (<span className="font-mono-tabular">Petal Length ≤ 2.45 cm</span>) separates all 50 Iris setosa specimens with zero impurity (Gini = 0.0000).
            </p>
          </div>
          <div className="rounded-xl border border-[#E3DAF0] bg-white p-4">
            <div className="text-xs font-semibold text-[#0F766E]">
              2. Strong Cross-Validated Generalization
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#5C4F6E]">
              Across 5 stratified folds, Logistic Regression and KNN reach <span className="font-mono-tabular font-semibold text-[#1E152A]">96.00% ± 1.49%</span> accuracy, outperforming single-tree and ensemble splits (<span className="font-mono-tabular">95.33% ± 1.83%</span>).
            </p>
          </div>
          <div className="rounded-xl border border-[#E3DAF0] bg-white p-4">
            <div className="text-xs font-semibold text-[#BE185D]">
              3. Irreducible Morphological Overlap
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#5C4F6E]">
              All five models misclassified the exact same two holdout Virginica specimens (#107, #120), confirming a physical overlap rather than model underfitting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide18Limitations: React.FC = () => {
  const caveats = [
    {
      num: '01',
      title: 'Small Sample Volatility (N = 150, n_test = 30)',
      detail:
        'Each misclassified specimen in a 30-flower holdout split shifts test accuracy by 3.33 percentage points, making single-split benchmarks noisy without k-fold cross-validation.',
    },
    {
      num: '02',
      title: 'Exact Duplicate Specimen Pair (#102 & #143)',
      detail:
        'Rows 102 and 143 share identical measurements (5.8, 2.7, 5.1, 1.9, Iris-virginica). If placed in opposite CV folds, evaluation slightly overstates out-of-sample novelty.',
    },
    {
      num: '03',
      title: 'Restricted 4-Feature Morphological Scope',
      detail:
        'Measurements capture only sepal/petal length and width, omitting pigment spectroscopy, stem height, or genetic markers that separate overlapping Versicolor/Virginica specimens.',
    },
    {
      num: '04',
      title: 'Historical Single-Region Cohort (Gaspé Peninsula, 1935)',
      detail:
        'Specimens were collected by Edgar Anderson in one geographic population; seasonal rainfall, soil nutrients, and altitude shifts limit direct transfer to modern global cultivars.',
    },
  ];

  return (
    <section aria-label="Slide 18: Limitations" className="slide-stage glass-panel flex flex-col justify-between rounded-2xl p-6 lg:p-8">
      <div className="border-b border-[#E3DAF0] pb-4">
        <p className="text-xs font-medium text-[#6D28D9]">
          Part 04 · Slide 18 · Methodological Boundaries
        </p>
        <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A] sm:text-3xl">
          Dataset &amp; Generalization Limitations
        </h2>
        <p className="mt-1 text-sm text-[#5C4F6E]">
          Rigorous interpretation requires distinguishing benchmark performance from real-world botanical deployment.
        </p>
      </div>

      <div className="mt-6 grid flex-1 gap-5 md:grid-cols-2">
        {caveats.map((c) => (
          <div key={c.num} className="flex flex-col justify-between rounded-xl border border-[#E3DAF0] bg-white p-5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono-tabular text-xs font-bold text-[#BE185D]">{c.num}.</span>
              <h3 className="text-base font-semibold text-[#1E152A]">{c.title}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5C4F6E]">{c.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const Slide19Conclusion: React.FC = () => {
  return (
    <section aria-label="Slide 19: Conclusion" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-6 lg:col-span-7">
        <div>
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 04 · Slide 19 · Synthesis &amp; Roadmap
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A] sm:text-3xl">
            Conclusion &amp; Recommended Architecture
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5C4F6E]">
            Four simple floral measurements do classify three Iris species reliably: across five distinct classifiers, out-of-sample accuracy reaches <span className="font-mono-tabular font-semibold text-[#1E152A]">93.33%</span> on the holdout set and up to <span className="font-mono-tabular font-semibold text-[#0F766E]">96.00% ± 1.49%</span> under 5-fold stratified cross-validation.
          </p>

          <div className="mt-5 rounded-xl border border-[#E3DAF0] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#4C1D95]">
              Best-Performing Model: Standardized Multinomial Logistic Regression
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5C4F6E]">
              Ties KNN for the highest 5-fold CV accuracy (96.00% ± 1.49%) while providing calibrated softmax probabilities, explicit feature weights, and smooth linear boundaries without retaining the training set at inference time.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#E3DAF0] pt-4 text-xs">
          <div>
            <div className="text-[#5C4F6E]">Top Driver</div>
            <div className="font-mono-tabular mt-0.5 font-semibold text-[#1E152A]">
              Petal Length (η²=0.94)
            </div>
          </div>
          <div>
            <div className="text-[#5C4F6E]">CV Benchmark</div>
            <div className="font-mono-tabular mt-0.5 font-semibold text-[#0F766E]">
              96.00% ± 1.49%
            </div>
          </div>
          <div>
            <div className="text-[#5C4F6E]">Error Locus</div>
            <div className="font-mono-tabular mt-0.5 font-semibold text-[#BE185D]">
              Versicolor–Virginica
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-6 lg:col-span-5">
        <h3 className="text-base font-semibold text-[#1E152A]">
          Future Improvement Opportunities
        </h3>
        <ul className="mt-4 grid flex-1 gap-3 text-xs leading-relaxed text-[#5C4F6E]">
          <li className="rounded-lg border border-[#E3DAF0] bg-white p-3.5">
            <strong className="text-[#1E152A]">1. Feature Engineering (Petal Area &amp; Ratios):</strong>{' '}
            Deriving <span className="font-mono-tabular">petal_length × petal_width</span> and aspect ratios captures elliptical corolla proportions.
          </li>
          <li className="rounded-lg border border-[#E3DAF0] bg-white p-3.5">
            <strong className="text-[#1E152A]">2. Deduplicated Nested Cross-Validation:</strong>{' '}
            Removing duplicate specimen #143 prior to outer/inner CV loops prevents optimistic fold leakage.
          </li>
          <li className="rounded-lg border border-[#E3DAF0] bg-white p-3.5">
            <strong className="text-[#1E152A]">3. Multi-Region Field Sampling:</strong>{' '}
            Expanding specimen collection across botanical gardens, soil climates, and flowering stages to test domain shift.
          </li>
          <li className="rounded-lg border border-[#E3DAF0] bg-white p-3.5">
            <strong className="text-[#1E152A]">4. Confidence Abstention Thresholds:</strong>{' '}
            Flagging borderline predictions (p_max &lt; 0.70) for botanical expert review reduces high-confidence errors.
          </li>
        </ul>
      </div>
    </section>
  );
};

export const Slide20ThankYou: React.FC<{
  onRestart: () => void;
  onPrint: () => void;
  onCopyHtml: () => void;
}> = ({ onRestart, onPrint, onCopyHtml }) => {
  return (
    <section
      aria-label="Slide 20: Thank You"
      className="slide-stage relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#2E1065]/20 bg-[#1F1430] p-6 text-white shadow-xl lg:p-10"
    >
      <BotanicalImage
        src={IMAGES.conservatory}
        alt="Atmospheric botanical conservatory filled with violet and lavender Iris flowers"
        fallbackTitle="Iris Botanical Conservatory"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-90 brightness-110 saturate-[1.08]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#1E152A]/72 via-[#2E1065]/44 to-[#2E1065]/22"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#1E152A]/62 via-transparent to-transparent"
      />

      <div className="relative z-10 grid flex-1 items-center gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <p className="text-xs font-medium tracking-wide text-[#EDE9FE]">
            Part 04 · Slide 20 · Closing Summary
          </p>
          <h2
            className="font-editorial mt-3 text-4xl font-semibold leading-tight text-white drop-shadow-sm sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Thank You
          </h2>
          <p className="mt-2 text-lg font-semibold text-[#5EEAD4]">
            Iris Classification — A Data Science Study
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#F5F3FF]">
            Every visualization, statistical analysis, and classifier evaluation in this presentation is based on the canonical 150-observation Iris dataset.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#6D28D9] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-[#7C3AED]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Return to Slide 01</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/35 bg-white/15 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onCopyHtml}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/35 bg-white/15 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Standalone HTML</span>
            </button>
          </div>
        </div>

        <div className="glass-panel-dark min-w-0 rounded-2xl p-6 backdrop-blur-sm lg:col-span-5">
          <div className="text-xs font-medium text-[#5EEAD4]">
            Project &amp; Presenter
          </div>
          <h3 className="font-editorial mt-1 text-2xl font-semibold text-white">
            S. Mohammed Kaif
          </h3>
          <p className="mt-0.5 text-xs text-[#EDE9FE]">
            Data Science | Machine Learning | Data Analytics
          </p>

          <dl className="mt-4 divide-y divide-white/15 border-t border-white/15 text-xs">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-[#DDD6FE]">Project Focus</dt>
              <dd className="text-right font-medium text-white">
                Botanical EDA &amp; Multiclass Classification
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-[#DDD6FE]">Dataset</dt>
              <dd className="font-mono-tabular text-right font-medium text-white">
                150 Observations · 4 Features · 3 Species
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-[#DDD6FE]">Models Evaluated</dt>
              <dd className="font-mono-tabular text-right font-medium text-white">
                5 Supervised Classifiers
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-[#DDD6FE]">Analytical Workflow</dt>
              <dd className="text-right font-medium text-white">
                Data Cleaning · EDA · Visualization · Model Training · Evaluation
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-[#DDD6FE]">Technology Stack</dt>
              <dd className="text-right font-medium text-white">
                Python · Pandas · NumPy · Scikit-learn · HTML · CSS · JavaScript
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-4 text-xs text-[#EDE9FE]">
        <span>
          Dataset attribution: Edgar Anderson (1935); Ronald A. Fisher (1936). Scikit-learn canonical Iris dataset.
        </span>
        <span className="font-medium text-white">Thank you for your time.</span>
      </div>
    </section>
  );
};
