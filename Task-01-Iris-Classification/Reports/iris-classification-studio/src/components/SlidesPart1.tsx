import React, { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import analysisRaw from '../data/irisAnalysis.json';
import { IMAGES } from '../data/slidesMeta';
import { IrisAnalysisReport, SpeciesName } from '../types/iris';
import { FEATURE_META, FEATURE_ORDER, SPECIES_META, SPECIES_ORDER } from '../utils/statistics';
import { BotanicalImage } from './BotanicalImage';

const report = analysisRaw as IrisAnalysisReport;

interface Part1Props {
  activeSlide: number;
  onNext: () => void;
  onJump: (idx: number) => void;
}

function softmax(logits: number[]): number[] {
  const m = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export const Slide01Cover: React.FC<Part1Props> = ({ onNext, onJump }) => {
  return (
    <section
      aria-label="Slide 01: Cover"
      className="slide-stage relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#2E1065]/20 bg-[#1F1430] text-[#FAF8FC] shadow-xl"
    >
      <BotanicalImage
        src={IMAGES.heroCover}
        alt="Deep violet Iris blossoms photographed in natural daylight"
        fallbackTitle="Iris Specimen Collection"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-90 brightness-110 saturate-[1.08]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#1E152A]/78 via-[#2E1065]/42 to-[#2E1065]/15"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#1E152A]/68 via-transparent to-transparent"
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8 lg:px-14">
        <div className="max-w-3xl">
          <p className="text-xs font-medium tracking-wide text-[#EDE9FE]">
            Slide 01 · Botanical Machine Learning Case Study · Fisher (1936) Benchmark
          </p>
          <h1
            className="font-editorial mt-3 text-3xl font-semibold leading-tight text-white drop-shadow-sm sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Iris Classification: From Exploratory Data Analysis to Machine Learning
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#F5F3FF] sm:text-base">
            An empirical study examining how four floral measurements distinguish three closely related botanical species using statistical inference and five supervised classification models.
          </p>
          <p className="mt-3 text-xs font-medium text-[#5EEAD4]">
            Presented by S. Mohammed Kaif · Data Science | Machine Learning | Data Analytics
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#6D28D9] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#7C3AED] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span>Begin Presentation</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onJump(8)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/35 bg-white/15 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
            >
              <span>Explore Interactive Charts</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 border-t border-white/20 bg-[#241638]/60 backdrop-blur-md sm:grid-cols-4">
        <div className="border-b border-r border-white/15 px-6 py-4 sm:border-b-0">
          <div className="text-xs text-[#DDD6FE]">Benchmark Observations</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-white">150</div>
        </div>
        <div className="border-b border-white/15 px-6 py-4 sm:border-b-0 sm:border-r">
          <div className="text-xs text-[#DDD6FE]">Morphometric Features</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-white">4 cm</div>
        </div>
        <div className="border-r border-white/15 px-6 py-4">
          <div className="text-xs text-[#DDD6FE]">Balanced Target Classes</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-white">3 × 50</div>
        </div>
        <div className="px-6 py-4">
          <div className="text-xs text-[#DDD6FE]">Peak 5-Fold CV Accuracy</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[#5EEAD4]">
            {(report.models.logistic_regression.cv.mean * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide02Task: React.FC = () => {
  const [inputs, setInputs] = useState({
    sepal_length: 5.9,
    sepal_width: 3.0,
    petal_length: 4.5,
    petal_width: 1.5,
  });

  const prediction = useMemo(() => {
    const lr = report.models.logistic_regression;
    const means = report.preprocessing.scaler_means;
    const stds = report.preprocessing.scaler_stds;
    const z = FEATURE_ORDER.map((f) => (inputs[f] - means[f]) / stds[f]);
    const logits = (lr.coefficients || []).map((row, cIdx) => {
      const dot = row.reduce((acc, w, j) => acc + w * z[j], 0);
      return dot + (lr.intercepts?.[cIdx] ?? 0);
    });
    const probs = softmax(logits);
    const bestIdx = probs.indexOf(Math.max(...probs));
    return {
      species: SPECIES_ORDER[bestIdx] as SpeciesName,
      probs: SPECIES_ORDER.map((sp, i) => ({ species: sp, prob: probs[i] })),
    };
  }, [inputs]);

  const applyPreset = (vals: typeof inputs) => setInputs(vals);

  return (
    <section aria-label="Slide 02: Classification Task" className="slide-stage grid gap-5 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl lg:col-span-5">
        <div className="relative min-h-48 w-full flex-1 overflow-hidden lg:min-h-56">
          <BotanicalImage
            src={IMAGES.morphology}
            alt="Botanical Iris flower laid flat on linen showing upright petals and outer sepals"
            fallbackTitle="Iris Floral Anatomy"
            className="h-full w-full object-cover brightness-105 contrast-[1.02]"
          />
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 01 · Slide 02 · Problem Formulation
          </p>
          <h2 className="font-editorial mt-1.5 text-2xl font-semibold text-[#1E152A]">
            Supervised Multiclass Classification
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#5C4F6E] sm:text-sm">
            Given a four-dimensional continuous feature vector <span className="font-mono-tabular font-medium text-[#1E152A]">X ∈ ℝ⁴</span> measured in centimeters from a single specimen, a trained classifier <span className="font-mono-tabular font-medium text-[#1E152A]">f(X)</span> assigns one of three mutually exclusive botanical species labels.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#E3DAF0] pt-3 text-xs">
            <div>
              <div className="text-[#5C4F6E]">Input Space</div>
              <div className="font-mono-tabular mt-0.5 font-semibold text-[#1E152A]">4 Features</div>
            </div>
            <div>
              <div className="text-[#5C4F6E]">Mapping</div>
              <div className="font-mono-tabular mt-0.5 font-semibold text-[#6D28D9]">f(X) → ŷ</div>
            </div>
            <div>
              <div className="text-[#5C4F6E]">Target Space</div>
              <div className="font-mono-tabular mt-0.5 font-semibold text-[#1E152A]">3 Species</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-6 lg:col-span-7">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3DAF0] pb-4">
            <div>
              <h3 className="text-base font-semibold text-[#1E152A]">
                Live Trained Logistic Regression Simulator
              </h3>
              <p className="text-xs text-[#5C4F6E]">
                Adjust measurements below to evaluate real standardized coefficients from the trained model.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                applyPreset({
                  sepal_length: 5.9,
                  sepal_width: 3.0,
                  petal_length: 4.5,
                  petal_width: 1.5,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3DAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#1E152A] hover:bg-[#F3EEF9]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                applyPreset({ sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 })
              }
              className="rounded-lg border border-[#E3DAF0] bg-[#FAF8FC] px-3 py-1.5 text-xs font-medium text-[#4C1D95] hover:bg-[#F3EEF9]"
            >
              Preset: Typical Setosa
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset({ sepal_length: 6.0, sepal_width: 2.7, petal_length: 4.3, petal_width: 1.3 })
              }
              className="rounded-lg border border-[#E3DAF0] bg-[#FAF8FC] px-3 py-1.5 text-xs font-medium text-[#0F766E] hover:bg-[#F3EEF9]"
            >
              Preset: Typical Versicolor
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset({ sepal_length: 6.7, sepal_width: 3.0, petal_length: 5.6, petal_width: 2.1 })
              }
              className="rounded-lg border border-[#E3DAF0] bg-[#FAF8FC] px-3 py-1.5 text-xs font-medium text-[#BE185D] hover:bg-[#F3EEF9]"
            >
              Preset: Typical Virginica
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FEATURE_ORDER.map((f) => {
              const st = report.statistics.overall[f];
              return (
                <label key={f} className="block rounded-xl border border-[#E3DAF0] bg-white/80 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1E152A]">{FEATURE_META[f].short}</span>
                    <span className="font-mono-tabular font-semibold text-[#4C1D95]">
                      {inputs[f].toFixed(1)} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={st.min}
                    max={st.max}
                    step={0.1}
                    value={inputs[f]}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [f]: parseFloat(e.target.value) }))
                    }
                    className="mt-2 w-full accent-[#6D28D9]"
                  />
                  <div className="font-mono-tabular mt-1 flex justify-between text-[11px] text-[#5C4F6E]">
                    <span>{st.min.toFixed(1)}</span>
                    <span>{st.max.toFixed(1)}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#E3DAF0] bg-[#F3EEF9]/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#5C4F6E]">Predicted Classification</span>
            <span
              className="text-base font-bold"
              style={{ color: SPECIES_META[prediction.species].color }}
            >
              {prediction.species}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {prediction.probs.map(({ species, prob }) => (
              <div key={species} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 font-medium text-[#1E152A]">
                  {SPECIES_META[species].short}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full transition-all duration-150"
                    style={{
                      width: `${(prob * 100).toFixed(1)}%`,
                      backgroundColor: SPECIES_META[species].color,
                    }}
                  />
                </div>
                <span className="font-mono-tabular w-14 text-right font-semibold text-[#1E152A]">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide03Question: React.FC = () => {
  const hypotheses = [
    {
      index: '01',
      title: 'Petal Geometry Drives Separation',
      detail:
        'Petal length (F = 1180.16, η² = 0.9414) and petal width (F = 960.01, η² = 0.9289) account for over 92% of between-species variance.',
    },
    {
      index: '02',
      title: 'Setosa Forms an Isolated Cluster',
      detail:
        'Iris setosa exhibits compact petals (1.0–1.9 cm) completely disjoint from Versicolor and Virginica (≥ 3.0 cm).',
    },
    {
      index: '03',
      title: 'Versicolor–Virginica Boundary Overlap',
      detail:
        'Intermediate specimens between 4.5 and 5.1 cm petal length overlap in feature space, bounding single-split accuracy.',
    },
  ];

  return (
    <section
      aria-label="Slide 03: Central Analytical Question"
      className="slide-stage grid h-full gap-5 overflow-y-auto lg:grid-cols-12 lg:items-stretch"
    >
      <div className="relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#4C1D95]/25 bg-gradient-to-br from-[#2B1948] via-[#231538] to-[#1C122B] p-6 text-white lg:col-span-7">
        <div>
          <p className="text-xs font-medium text-[#DDD6FE]">
            Part 01 · Slide 03 · Central Hypothesis
          </p>
          <h2
            className="font-editorial mt-2 text-2xl font-semibold leading-snug text-white sm:text-3xl"
            style={{ textWrap: 'balance' }}
          >
            Can four floral measurements reliably distinguish three Iris species?
          </h2>
          <p className="mt-2.5 max-w-xl text-xs leading-relaxed text-[#EDE9FE] sm:text-sm">
            Rather than relying on visual petal coloration—which varies under field lighting—we test whether linear dimensions of sepals and petals alone support reproducible classification.
          </p>
        </div>

        <div className="mt-5 space-y-2.5">
          {hypotheses.map((h) => (
            <div
              key={h.index}
              className="rounded-xl border border-white/20 bg-white/12 p-3"
            >
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono-tabular text-xs font-semibold text-[#5EEAD4]">
                  {h.index}.
                </span>
                <h3 className="text-sm font-semibold text-white">{h.title}</h3>
              </div>
              <p className="mt-1 pl-6 text-xs leading-relaxed text-[#EDE9FE]">
                {h.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl lg:col-span-5">
        <div className="relative min-h-48 w-full flex-1 overflow-hidden lg:min-h-60">
          <BotanicalImage
            src={IMAGES.specimen}
            alt="Lavender Iris specimen in soft daylight"
            fallbackTitle="Iris Specimen Study"
            className="h-full w-full object-cover brightness-105 contrast-[1.02]"
          />
        </div>
        <div className="border-t border-[#E3DAF0] bg-white/90 p-5">
          <div className="text-xs font-medium text-[#6D28D9]">
            One-Way ANOVA Variance Explained (η²)
          </div>
          <div className="mt-3 space-y-2">
            {FEATURE_ORDER.map((f) => {
              const eta = report.statistics.anova[f].eta_squared;
              return (
                <div key={f} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 font-medium text-[#1E152A]">
                    {FEATURE_META[f].short}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3EEF9]">
                    <div
                      className="h-full bg-[#6D28D9]"
                      style={{ width: `${(eta * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <span className="font-mono-tabular w-12 text-right font-semibold text-[#1E152A]">
                    {(eta * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide04Pipeline: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState(0);

  const stages = [
    {
      step: '01',
      title: 'Dataset & Quality Audit',
      metric: '150 rows · 0 nulls · 1 duplicate',
      summary:
        'Load canonical 150-observation Fisher/Anderson Iris records, verify numeric float64 types, audit missingness, inspect exact duplicates (#102 & #143), and detect 1.5×IQR outliers.',
      outputs: [
        'Shape verified: 150 observations × 5 columns',
        'Class balance verified: 50 Setosa, 50 Versicolor, 50 Virginica',
        'Outlier check: 4 observations flagged in Sepal Width only',
      ],
    },
    {
      step: '02',
      title: 'Exploratory & Statistical Analysis',
      metric: '4 distributions · ANOVA · Pearson r',
      summary:
        'Evaluate univariate histograms, Gaussian KDE densities, box/violin profiles, Pearson correlation pairs, and one-way ANOVA F-tests across the three species.',
      outputs: [
        'Strongest correlation: Petal Length vs Petal Width (r = +0.9629)',
        'Strongest species separator: Petal Length (F = 1180.16, η² = 0.9414)',
        'Weakest separator: Sepal Width (F = 49.16, η² = 0.4008)',
      ],
    },
    {
      step: '03',
      title: 'Leakage-Free Preprocessing',
      metric: '120 train / 30 test · seed 42',
      summary:
        'Separate X and y, apply stratified 80/20 splitting (40 train / 10 test per class), and fit StandardScaler parameters exclusively on the 120 training observations.',
      outputs: [
        'Scaling applied for distance/linear models (Logistic Regression, KNN)',
        'Raw cm units preserved for tree & Gaussian Naive Bayes models',
        'Zero test-set statistics leaked into scaling transforms',
      ],
    },
    {
      step: '04',
      title: 'Training, CV & Error Forensics',
      metric: '5 models · 5-fold CV · Confusion matrix',
      summary:
        'Train five distinct supervised classifiers, evaluate holdout precision/recall/F1, verify stability via 5-fold stratified cross-validation, and inspect misclassified specimens.',
      outputs: [
        'All 5 classifiers achieve 93.33% (28/30) on the fixed holdout split',
        '5-fold CV separates top tier: Logistic Regression & KNN at 96.00% ± 1.49%',
        'Errors concentrate on borderline Virginica specimens (#107, #120)',
      ],
    },
  ];

  const active = stages[selectedStage];

  return (
    <section
      aria-label="Slide 04: Evidence Pipeline"
      className="slide-stage glass-panel flex flex-col justify-between rounded-2xl p-6 lg:p-8"
    >
      <div>
        <div className="border-b border-[#E3DAF0] pb-4">
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 01 · Slide 04 · Analytical Workflow
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A] sm:text-3xl">
            Four-Stage Reproducible Evidence Pipeline
          </h2>
          <p className="mt-1 text-sm text-[#5C4F6E]">
            Select any stage below to inspect exact inputs, leakage safeguards, and verified outputs.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((st, idx) => {
          const isCurrent = idx === selectedStage;
          return (
            <button
              key={st.step}
              type="button"
              onClick={() => setSelectedStage(idx)}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#6D28D9] ${
                isCurrent
                  ? 'border-[#6D28D9] bg-[#4C1D95] text-white shadow-md'
                  : 'border-[#E3DAF0] bg-white text-[#1E152A] hover:border-[#6D28D9]/50 hover:bg-[#FAF8FC]'
              }`}
            >
              <span
                className={`font-mono-tabular text-xs font-semibold ${
                  isCurrent ? 'text-[#5EEAD4]' : 'text-[#6D28D9]'
                }`}
              >
                Stage {st.step}
              </span>
              <span className="mt-1.5 text-sm font-semibold">{st.title}</span>
              <span
                className={`font-mono-tabular mt-2 text-xs ${
                  isCurrent ? 'text-[#DDD6FE]' : 'text-[#5C4F6E]'
                }`}
              >
                {st.metric}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      <div className="mt-6 grid flex-1 items-center gap-6 rounded-xl border border-[#E3DAF0] bg-white p-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-6">
          <div className="font-mono-tabular text-xs font-semibold text-[#6D28D9]">
            Stage {active.step} Specification
          </div>
          <h3 className="mt-1 text-xl font-semibold text-[#1E152A]">{active.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#5C4F6E]">{active.summary}</p>
        </div>
        <div className="min-w-0 lg:col-span-6 lg:border-l lg:border-[#E3DAF0] lg:pl-6">
          <div className="text-xs font-semibold text-[#1E152A]">Verified Pipeline Outputs</div>
          <ul className="mt-3 space-y-2.5">
            {active.outputs.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-[#1E152A]"
              >
                <span className="font-mono-tabular mt-0.5 text-xs font-bold text-[#0F766E]">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
