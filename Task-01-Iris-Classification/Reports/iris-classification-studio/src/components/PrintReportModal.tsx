import React, { useEffect } from 'react';
import { Download, Printer, X } from 'lucide-react';
import analysisRaw from '../data/irisAnalysis.json';
import { SLIDES_META } from '../data/slidesMeta';
import { IrisAnalysisReport, ModelKey } from '../types/iris';
import { FEATURE_META, FEATURE_ORDER, SPECIES_META, SPECIES_ORDER } from '../utils/statistics';

const report = analysisRaw as IrisAnalysisReport;
const MODEL_KEYS: ModelKey[] = [
  'logistic_regression',
  'decision_tree',
  'knn',
  'random_forest',
  'gaussian_nb',
];

export function buildPrintableHtml(): string {
  const statsRows = FEATURE_ORDER.map((f) => {
    const s = report.statistics.overall[f];
    const a = report.statistics.anova[f];
    return `<tr>
      <td>${FEATURE_META[f].label}</td>
      <td>${s.mean.toFixed(3)}</td>
      <td>${s.std.toFixed(3)}</td>
      <td>${s.median.toFixed(2)}</td>
      <td>${s.min.toFixed(1)} – ${s.max.toFixed(1)}</td>
      <td>${a.f_stat.toFixed(2)}</td>
      <td>${(a.eta_squared * 100).toFixed(1)}%</td>
    </tr>`;
  }).join('');

  const modelRows = MODEL_KEYS.map((k) => {
    const m = report.models[k];
    return `<tr>
      <td>${m.name}</td>
      <td>${m.scaling_required ? 'Yes' : 'No'}</td>
      <td>${(m.accuracy * 100).toFixed(2)}% (${m.correct_count}/${m.total_test})</td>
      <td>${m.macro_f1.toFixed(4)}</td>
      <td>${(m.cv.mean * 100).toFixed(2)}% ± ${(m.cv.std * 100).toFixed(2)}%</td>
    </tr>`;
  }).join('');

  const slideCards = SLIDES_META.map(
    (s) => `<div class="slide-item">
      <div class="meta">${s.partLabel} · Slide ${s.number}</div>
      <h3>${s.title}</h3>
      <p>${s.subtitle}</p>
    </div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Iris Classification — Printable Analytical Report</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #1E152A; background: #fff; margin: 0; padding: 24px; line-height: 1.5; }
    .toolbar { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E3DAF0; padding-bottom:12px; margin-bottom:20px; }
    .btn { background:#4C1D95; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:13px; font-weight:600; cursor:pointer; }
    h1, h2, h3 { font-family: Georgia, serif; margin: 0 0 8px; }
    .meta { font-size: 11px; color: #6D28D9; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 12px 0 24px; font-variant-numeric: tabular-nums; }
    th, td { border-bottom: 1px solid #E3DAF0; text-align: left; padding: 7px 8px; }
    th { background: #F3EEF9; color: #1E152A; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
    .slide-item { border: 1px solid #E3DAF0; border-radius: 8px; padding: 12px; break-inside: avoid; }
    .author { border: 1px solid #4C1D95; background: #FAF8FC; border-radius: 10px; padding: 16px; margin-top: 20px; break-inside: avoid; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <div><strong>Iris Classification — Print / PDF Edition</strong></div>
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="meta">Fisher (1936) / Anderson (1935) Iris Benchmark · 20-Slide Analytical Report</div>
  <h1>Iris Classification: From Exploratory Data Analysis to Machine Learning</h1>
  <p>Canonical 150-observation study (50 Setosa, 50 Versicolor, 50 Virginica; 0 missing values; 1 exact duplicate pair at rows #102 &amp; #143; 4 Sepal Width 1.5×IQR outliers).</p>

  <h2>1. Feature Statistics &amp; One-Way ANOVA (n = 150)</h2>
  <table>
    <thead><tr><th>Feature</th><th>Mean</th><th>SD</th><th>Median</th><th>Range</th><th>ANOVA F</th><th>η² Explained</th></tr></thead>
    <tbody>${statsRows}</tbody>
  </table>

  <h2>2. Supervised Model Benchmark (80/20 Stratified Split &amp; 5-Fold CV)</h2>
  <table>
    <thead><tr><th>Classifier</th><th>Scaled</th><th>Holdout Test Accuracy</th><th>Macro F1</th><th>5-Fold CV Mean ± SD</th></tr></thead>
    <tbody>${modelRows}</tbody>
  </table>

  <p><strong>Confusion Matrix (All 5 Holdout Models):</strong> [[10, 0, 0], [0, 10, 0], [0, 2, 8]]. Misclassified Virginica specimens: #107 (4.9, 2.5, 4.5, 1.7) and #120 (6.0, 2.2, 5.0, 1.5).</p>

  <h2>3. Complete 20-Slide Presentation Outline</h2>
  <div class="grid">${slideCards}</div>

  <div class="author">
    <div class="meta">Project &amp; Presenter</div>
    <h3>S. Mohammed Kaif</h3>
    <p>Data Science | Machine Learning | Data Analytics · Botanical EDA &amp; Multiclass Classification (150 Observations · 4 Features · 3 Species)</p>
  </div>
</body>
</html>`;
}

export const PrintableDeck: React.FC = () => {
  return (
    <div className="print-only-deck hidden bg-white p-6 text-[#1E152A]">
      <div className="border-b border-[#E3DAF0] pb-4">
        <p className="text-xs font-semibold text-[#6D28D9]">
          Fisher (1936) / Anderson (1935) Benchmark · Complete 20-Slide Report
        </p>
        <h1 className="font-editorial mt-1 text-3xl font-bold">
          Iris Classification: From Exploratory Data Analysis to Machine Learning
        </h1>
        <p className="mt-1 text-xs text-[#5C4F6E]">
          Presenter: S. Mohammed Kaif · Data Science | Machine Learning | Data Analytics · 150 Observations · 4 Features · 5 Classifiers
        </p>
      </div>

      <div className="mt-5">
        <h2 className="font-editorial text-lg font-semibold">
          Descriptive Statistics &amp; One-Way ANOVA (n = 150)
        </h2>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E3DAF0] bg-[#FAF8FC]">
              <th className="py-1.5 pr-2">Feature</th>
              <th className="py-1.5 pr-2">Mean ± SD</th>
              <th className="py-1.5 pr-2">Median (IQR)</th>
              <th className="py-1.5 pr-2">Range</th>
              <th className="py-1.5">ANOVA F (η²)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
            {FEATURE_ORDER.map((f) => {
              const s = report.statistics.overall[f];
              const a = report.statistics.anova[f];
              return (
                <tr key={f}>
                  <td className="py-1.5 pr-2 font-sans font-medium">{FEATURE_META[f].label}</td>
                  <td className="py-1.5 pr-2">
                    {s.mean.toFixed(3)} ± {s.std.toFixed(3)}
                  </td>
                  <td className="py-1.5 pr-2">
                    {s.median.toFixed(2)} ({s.iqr.toFixed(2)})
                  </td>
                  <td className="py-1.5 pr-2">
                    {s.min.toFixed(1)}–{s.max.toFixed(1)}
                  </td>
                  <td className="py-1.5">
                    {a.f_stat.toFixed(2)} ({(a.eta_squared * 100).toFixed(1)}%)
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <h2 className="font-editorial text-lg font-semibold">
          Supervised Model Evaluation (Stratified 80/20 Holdout &amp; 5-Fold CV)
        </h2>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E3DAF0] bg-[#FAF8FC]">
              <th className="py-1.5 pr-2">Classifier</th>
              <th className="py-1.5 pr-2">Holdout Acc</th>
              <th className="py-1.5 pr-2">Macro F1</th>
              <th className="py-1.5">5-Fold CV Mean ± SD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
            {MODEL_KEYS.map((k) => {
              const m = report.models[k];
              return (
                <tr key={k}>
                  <td className="py-1.5 pr-2 font-sans font-medium">{m.name}</td>
                  <td className="py-1.5 pr-2">
                    {(m.accuracy * 100).toFixed(2)}% ({m.correct_count}/{m.total_test})
                  </td>
                  <td className="py-1.5 pr-2">{m.macro_f1.toFixed(4)}</td>
                  <td className="py-1.5">
                    {(m.cv.mean * 100).toFixed(2)}% ± {(m.cv.std * 100).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {SLIDES_META.map((s) => (
          <div key={s.index} className="break-inside-avoid rounded-lg border border-[#E3DAF0] p-3">
            <div className="text-[10px] font-semibold text-[#6D28D9]">
              {s.partLabel} · Slide {s.number}
            </div>
            <div className="text-sm font-semibold">{s.title}</div>
            <div className="mt-0.5 text-xs text-[#5C4F6E]">{s.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PrintModalProps {
  open: boolean;
  onClose: () => void;
  onNativePrint: () => void;
  onDownloadPrintable: () => void;
}

export const PrintReportModal: React.FC<PrintModalProps> = ({
  open,
  onClose,
  onNativePrint,
  onDownloadPrintable,
}) => {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#1E152A]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Print or Save PDF Report"
      onClick={onClose}
    >
      <div
        className="max-h-[88dvh] w-full max-w-3xl overscroll-contain overflow-y-auto rounded-2xl border border-[#E3DAF0] bg-[#FAF8FC] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E3DAF0] pb-4">
          <div className="min-w-0">
            <h2 className="font-editorial text-2xl font-semibold text-[#1E152A]">
              Print / Save PDF Report
            </h2>
            <p className="mt-1 text-xs text-[#5C4F6E]">
              Print the full 20-slide analytical dossier directly, or download the print-ready HTML edition if your embedded browser frame blocks native printing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close print modal"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E3DAF0] bg-white text-[#1E152A] transition-colors hover:bg-[#F3EEF9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onNativePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4C1D95] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
          >
            <Printer className="h-4 w-4" />
            <span>Trigger Browser Print / Save PDF</span>
          </button>
          <button
            type="button"
            onClick={onDownloadPrintable}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E3DAF0] bg-white px-4 py-2 text-xs font-semibold text-[#1E152A] hover:bg-[#F3EEF9]"
          >
            <Download className="h-4 w-4 text-[#6D28D9]" />
            <span>Download Print-Ready HTML (Save as PDF)</span>
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-[#E3DAF0] bg-white p-5 text-xs">
          <div className="flex flex-wrap justify-between gap-2 border-b border-[#E3DAF0] pb-3">
            <div>
              <div className="font-semibold text-[#4C1D95]">
                Iris Classification — Complete Printable Dossier
              </div>
              <div className="text-[#5C4F6E]">
                Presenter: S. Mohammed Kaif · Data Science | Machine Learning | Data Analytics
              </div>
            </div>
            <div className="font-mono-tabular text-right text-[#5C4F6E]">
              150 Rows · 5 Classifiers · 20 Slides
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {SPECIES_ORDER.map((sp) => (
              <div key={sp} className="rounded-lg bg-[#FAF8FC] p-2.5">
                <div className="font-semibold" style={{ color: SPECIES_META[sp].color }}>
                  {sp}
                </div>
                <div className="font-mono-tabular mt-0.5 text-[#1E152A]">
                  50 specimens · PL {report.statistics.by_species[sp].petal_length.mean.toFixed(2)} cm
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 font-mono-tabular text-[11px] text-[#5C4F6E]">
            Top 5-Fold CV: Logistic Regression &amp; KNN (96.00% ± 1.49%) · Holdout: 93.33% (28/30) across all 5 models.
          </div>
        </div>
      </div>
    </div>
  );
};
