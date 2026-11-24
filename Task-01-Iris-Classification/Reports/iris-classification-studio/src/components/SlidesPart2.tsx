import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpDown, RotateCcw, Search } from 'lucide-react';
import type Plotly from 'plotly.js-dist-min';
import analysisRaw from '../data/irisAnalysis.json';
import { IMAGES } from '../data/slidesMeta';
import { FeatureKey, IrisAnalysisReport, IrisObservation, SpeciesName } from '../types/iris';
import {
  computeGaussianKde,
  computeLinearRegression,
  FEATURE_META,
  FEATURE_ORDER,
  filterObservations,
  SPECIES_META,
  SPECIES_ORDER,
} from '../utils/statistics';
import { BotanicalImage } from './BotanicalImage';
import { PlotlyChart } from './PlotlyChart';

const report = analysisRaw as IrisAnalysisReport;

export const Slide05Dataset: React.FC<{ active: boolean }> = ({ active }) => {
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'ALL' | SpeciesName>('ALL');
  const [sortCol, setSortCol] = useState<'id' | FeatureKey | 'species'>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [quickSlice, setQuickSlice] = useState<'all' | 'head5' | 'tail5'>('all');
  const pageSize = 8;

  const filteredRows = useMemo(() => {
    let base = [...report.dataset.rows];
    if (quickSlice === 'head5') base = base.slice(0, 5);
    if (quickSlice === 'tail5') base = base.slice(-5);

    if (speciesFilter !== 'ALL') {
      base = base.filter((r) => r.species === speciesFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      base = base.filter(
        (r) =>
          String(r.id).includes(q) ||
          r.species.toLowerCase().includes(q) ||
          String(r.sepal_length).includes(q) ||
          String(r.petal_length).includes(q)
      );
    }
    base.sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return base;
  }, [search, speciesFilter, sortCol, sortAsc, quickSlice]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (col: 'id' | FeatureKey | 'species') => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
    setPage(0);
  };

  const donutData = useMemo(
    () => [
      {
        type: 'pie' as const,
        hole: 0.58,
        labels: SPECIES_ORDER.map((s) => SPECIES_META[s].short),
        values: SPECIES_ORDER.map((s) => report.dataset.class_counts[s]),
        marker: { colors: SPECIES_ORDER.map((s) => SPECIES_META[s].color) },
        textinfo: 'label+value',
        hovertemplate: '%{label}: %{value} specimens (%{percent})<extra></extra>',
      },
    ],
    []
  );

  const donutLayout = useMemo(
    () => ({
      margin: { t: 16, r: 16, b: 16, l: 16 },
      showlegend: false,
      annotations: [
        {
          text: '150<br>Total',
          x: 0.5,
          y: 0.5,
          showarrow: false,
          font: { size: 15, color: '#1E152A', family: 'JetBrains Mono' },
        },
      ],
    }),
    []
  );

  return (
    <section aria-label="Slide 05: Benchmark Dataset" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-6 lg:col-span-4">
        <div>
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 02 · Slide 05 · Benchmark Source
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A]">
            The 150-Observation Benchmark
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#5C4F6E]">
            {report.dataset.source}. Balanced multiclass design with zero missing values.
          </p>
        </div>

        <div className="my-2 flex min-h-0 flex-1 flex-col justify-center">
          <PlotlyChart
            id="slide05-species-donut"
            active={active}
            height={250}
            fillHeight
            exportFilename="iris_species_donut"
            data={donutData}
            layout={donutLayout}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-[#E3DAF0] pt-3 text-center text-xs">
          {SPECIES_ORDER.map((sp) => (
            <div key={sp}>
              <div className="font-semibold" style={{ color: SPECIES_META[sp].color }}>
                {SPECIES_META[sp].short}
              </div>
              <div className="font-mono-tabular text-[#1E152A]">50 (33.3%)</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 sm:p-6 lg:col-span-8">
        <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3DAF0] pb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5C4F6E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by row ID, species, or value..."
              aria-label="Search dataset rows"
              className="w-full rounded-lg border border-[#E3DAF0] bg-white py-2 pl-9 pr-3 text-xs text-[#1E152A] focus-visible:outline-2 focus-visible:outline-[#6D28D9]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', ...SPECIES_ORDER] as const).map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => {
                  setSpeciesFilter(sp);
                  setPage(0);
                }}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  speciesFilter === sp
                    ? 'bg-[#4C1D95] text-white'
                    : 'bg-[#F3EEF9] text-[#4C1D95] hover:bg-[#E3DAF0]'
                }`}
              >
                {sp === 'ALL' ? 'All (150)' : SPECIES_META[sp].short}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-[#F3EEF9] p-1">
            {(
              [
                { id: 'all', label: 'All Rows' },
                { id: 'head5', label: 'First 5' },
                { id: 'tail5', label: 'Last 5' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setQuickSlice(btn.id);
                  setPage(0);
                }}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${
                  quickSlice === btn.id
                    ? 'bg-white text-[#1E152A] shadow-sm'
                    : 'text-[#5C4F6E] hover:text-[#1E152A]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E3DAF0] text-[#5C4F6E]">
                {(
                  [
                    { key: 'id', label: 'ID' },
                    { key: 'sepal_length', label: 'Sepal Len' },
                    { key: 'sepal_width', label: 'Sepal Wid' },
                    { key: 'petal_length', label: 'Petal Len' },
                    { key: 'petal_width', label: 'Petal Wid' },
                    { key: 'species', label: 'Species' },
                  ] as const
                ).map((col) => (
                  <th key={col.key} className="py-2 pr-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-[#4C1D95]"
                    >
                      <span>{col.label}</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
              {currentRows.map((row: IrisObservation) => (
                <tr key={row.id} className="hover:bg-[#FAF8FC]">
                  <td className="py-2 pr-3 text-[#5C4F6E]">#{row.id}</td>
                  <td className="py-2 pr-3">{row.sepal_length.toFixed(1)}</td>
                  <td className="py-2 pr-3">{row.sepal_width.toFixed(1)}</td>
                  <td className="py-2 pr-3">{row.petal_length.toFixed(1)}</td>
                  <td className="py-2 pr-3">{row.petal_width.toFixed(1)}</td>
                  <td
                    className="py-2 font-sans font-semibold"
                    style={{ color: SPECIES_META[row.species].color }}
                  >
                    {row.species}
                  </td>
                </tr>
              ))}
              {currentRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-sans text-[#5C4F6E]">
                    No specimens match the active filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#E3DAF0] pt-3 text-xs text-[#5C4F6E]">
          <span className="font-mono-tabular">
            Showing {currentRows.length} of {filteredRows.length} matching records
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded border border-[#E3DAF0] bg-white px-2.5 py-1 text-xs font-medium text-[#1E152A] disabled:opacity-40"
            >
              Prev
            </button>
            <span className="font-mono-tabular">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded border border-[#E3DAF0] bg-white px-2.5 py-1 text-xs font-medium text-[#1E152A] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide06Vocabulary: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>('petal_length');
  const st = report.statistics.overall[selectedFeature];
  const anova = report.statistics.anova[selectedFeature];

  return (
    <section aria-label="Slide 06: Feature Vocabulary" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl lg:col-span-5">
        <div className="relative h-64 w-full flex-1">
          <BotanicalImage
            src={IMAGES.morphology}
            alt="Iris floral anatomy showing petals and sepals"
            fallbackTitle="Morphometric Specimen"
            className="h-full w-full object-cover brightness-105 contrast-[1.02]"
          />
        </div>
        <div className="border-t border-[#E3DAF0] bg-white/90 p-5">
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 02 · Slide 06 · Botanical Data Dictionary
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A]">
            Four Morphometric Features
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#5C4F6E]">
            In Iris flowers, the outer three drooping segments are sepals (falls), while the inner three upright segments are petals (standards). All four measurements are continuous <span className="font-mono-tabular">float64</span> values recorded to 0.1 cm precision.
          </p>
        </div>
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-6 lg:col-span-7">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          {FEATURE_ORDER.map((f) => {
            const fSt = report.statistics.overall[f];
            const isSel = f === selectedFeature;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFeature(f)}
                className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#6D28D9] ${
                  isSel
                    ? 'border-[#6D28D9] bg-[#4C1D95] text-white shadow-md'
                    : 'border-[#E3DAF0] bg-white text-[#1E152A] hover:bg-[#FAF8FC]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{FEATURE_META[f].short}</span>
                  <span
                    className={`font-mono-tabular text-xs ${
                      isSel ? 'text-[#5EEAD4]' : 'text-[#6D28D9]'
                    }`}
                  >
                    {fSt.min.toFixed(1)}–{fSt.max.toFixed(1)} cm
                  </span>
                </div>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isSel ? 'text-[#DDD6FE]' : 'text-[#5C4F6E]'
                  }`}
                >
                  {FEATURE_META[f].description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-[#E3DAF0] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3DAF0] pb-3">
            <h3 className="text-base font-semibold text-[#1E152A]">
              {FEATURE_META[selectedFeature].label} — Empirical Summary (n = 150)
            </h3>
            <span className="font-mono-tabular text-xs font-semibold text-[#0F766E]">
              ANOVA F = {anova.f_stat} · η² = {anova.eta_squared}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {[
              { label: 'Mean', val: st.mean.toFixed(3) },
              { label: 'Median', val: st.median.toFixed(2) },
              { label: 'Std Dev', val: st.std.toFixed(3) },
              { label: 'Variance', val: st.variance.toFixed(3) },
              { label: 'IQR', val: st.iqr.toFixed(2) },
              { label: 'Range', val: `${(st.max - st.min).toFixed(1)}` },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-[11px] text-[#5C4F6E]">{m.label}</div>
                <div className="font-mono-tabular mt-0.5 text-base font-semibold text-[#1E152A]">
                  {m.val}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-[#E3DAF0] pt-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              {SPECIES_ORDER.map((sp) => {
                const spSt = report.statistics.by_species[sp][selectedFeature];
                return (
                  <div key={sp} className="rounded-lg bg-[#FAF8FC] p-2.5">
                    <div className="font-semibold" style={{ color: SPECIES_META[sp].color }}>
                      {SPECIES_META[sp].short}
                    </div>
                    <div className="font-mono-tabular mt-1 text-[#1E152A]">
                      {spSt.mean.toFixed(2)} ± {spSt.std.toFixed(2)} cm
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide07Verification: React.FC = () => {
  const dup = report.dataset.duplicates[0];
  const sepalOutliers = report.statistics.outliers_overall.sepal_width;

  return (
    <section aria-label="Slide 07: Data Verification" className="slide-stage glass-panel flex flex-col justify-between rounded-2xl p-5 lg:p-6">
      <div className="border-b border-[#E3DAF0] pb-3">
        <p className="text-xs font-medium text-[#6D28D9]">
          Part 02 · Slide 07 · Data Integrity Audit
        </p>
        <h2 className="font-editorial mt-0.5 text-2xl font-semibold text-[#1E152A]">
          Data Quality Verification Report
        </h2>
        <p className="mt-0.5 text-xs text-[#5C4F6E]">
          Programmatic checks executed on all 150 observations prior to exploratory visualization.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E3DAF0] bg-white p-4">
          <div className="text-xs text-[#5C4F6E]">Dimensions</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[#1E152A]">
            150 × 5
          </div>
          <div className="mt-1 text-xs text-[#0F766E]">4 float64 + 1 categorical</div>
        </div>
        <div className="rounded-xl border border-[#E3DAF0] bg-white p-4">
          <div className="text-xs text-[#5C4F6E]">Missing Values</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[#0F766E]">
            0 / 750
          </div>
          <div className="mt-1 text-xs text-[#5C4F6E]">100% cell completeness</div>
        </div>
        <div className="rounded-xl border border-[#E3DAF0] bg-white p-4">
          <div className="text-xs text-[#5C4F6E]">Exact Duplicates</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[#BE185D]">
            1 Pair
          </div>
          <div className="mt-1 text-xs text-[#5C4F6E]">
            Rows #{dup.first_id} &amp; #{dup.duplicate_id} identical
          </div>
        </div>
        <div className="rounded-xl border border-[#E3DAF0] bg-white p-4">
          <div className="text-xs text-[#5C4F6E]">1.5×IQR Outliers</div>
          <div className="font-mono-tabular mt-1 text-2xl font-semibold text-[#4C1D95]">
            {sepalOutliers.count} Records
          </div>
          <div className="mt-1 text-xs text-[#5C4F6E]">All in Sepal Width</div>
        </div>
      </div>

      <div className="mt-4 grid flex-1 gap-5 lg:grid-cols-12 lg:items-stretch">
        <div className="min-w-0 rounded-xl border border-[#E3DAF0] bg-white p-4 sm:p-5 lg:col-span-7">
          <h3 className="text-sm font-semibold text-[#1E152A]">
            Column-Level Schema &amp; Uniqueness Audit
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E3DAF0] text-[#5C4F6E]">
                  <th className="py-2 pr-3">Column</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Missing</th>
                  <th className="py-2 pr-3">Unique</th>
                  <th className="py-2">1.5×IQR Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DAF0]/60 font-mono-tabular">
                {FEATURE_ORDER.map((f) => (
                  <tr key={f}>
                    <td className="py-2 pr-3 font-sans font-medium text-[#1E152A]">
                      {FEATURE_META[f].short}
                    </td>
                    <td className="py-2 pr-3 text-[#5C4F6E]">float64</td>
                    <td className="py-2 pr-3 text-[#0F766E]">0</td>
                    <td className="py-2 pr-3">{report.dataset.unique_counts[f]}</td>
                    <td className="py-2">
                      {report.statistics.outliers_overall[f].count} (
                      {report.statistics.outliers_overall[f].lower_fence}–
                      {report.statistics.outliers_overall[f].upper_fence})
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3 font-sans font-medium text-[#1E152A]">Species</td>
                  <td className="py-2 pr-3 text-[#5C4F6E]">category</td>
                  <td className="py-2 pr-3 text-[#0F766E]">0</td>
                  <td className="py-2 pr-3">3</td>
                  <td className="py-2 font-sans text-[#5C4F6E]">Balanced (50 each)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-xl border border-[#E3DAF0] bg-white p-4 sm:p-5 lg:col-span-5">
          <div>
            <h3 className="text-sm font-semibold text-[#1E152A]">
              Duplicate &amp; Outlier Forensics
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#5C4F6E]">
              Specimen <span className="font-mono-tabular font-semibold text-[#1E152A]">#{dup.duplicate_id}</span> matches specimen <span className="font-mono-tabular font-semibold text-[#1E152A]">#{dup.first_id}</span> exactly ({dup.values.slice(0, 4).join(', ')} cm, {dup.values[4]}). We retain all 150 rows to preserve exact benchmark comparability, while flagging potential split overlap if both enter opposite folds.
            </p>
          </div>
          <div className="mt-4 border-t border-[#E3DAF0] pt-3">
            <div className="text-xs font-semibold text-[#1E152A]">
              Flagged Sepal Width Outliers (1.5×IQR: 2.05–4.05 cm)
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono-tabular text-xs">
              {sepalOutliers.records.map((r) => (
                <div key={r.id} className="rounded bg-[#FAF8FC] px-2.5 py-1.5">
                  #{r.id} · {r.value.toFixed(1)} cm ({SPECIES_META[r.species].short})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Slide08Exploratory: React.FC<{ active: boolean }> = ({ active }) => {
  const [feature, setFeature] = useState<FeatureKey>('petal_length');
  const [chartMode, setChartMode] = useState<'hist_kde' | 'box' | 'violin' | 'profile'>('hist_kde');
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesName[]>([...SPECIES_ORDER]);

  const toggleSpecies = (sp: SpeciesName) => {
    setSelectedSpecies((prev) => {
      if (prev.includes(sp)) {
        return prev.length > 1 ? prev.filter((s) => s !== sp) : prev;
      }
      return [...prev, sp];
    });
  };

  const resetControls = () => {
    setFeature('petal_length');
    setChartMode('hist_kde');
    setSelectedSpecies([...SPECIES_ORDER]);
  };

  const chartData = useMemo(() => {
    if (chartMode === 'hist_kde') {
      const traces: Plotly.Data[] = [];
      selectedSpecies.forEach((sp) => {
        const vals = report.dataset.rows
          .filter((r) => r.species === sp)
          .map((r) => r[feature]);
        traces.push({
          type: 'histogram',
          x: vals,
          name: `${SPECIES_META[sp].short} Hist`,
          histnorm: 'probability density',
          opacity: 0.45,
          nbinsx: 14,
          marker: { color: SPECIES_META[sp].color },
        });
        const kde = computeGaussianKde(vals);
        traces.push({
          type: 'scatter',
          mode: 'lines',
          x: kde.x,
          y: kde.y,
          name: `${SPECIES_META[sp].short} KDE`,
          line: { color: SPECIES_META[sp].color, width: 2.5 },
        });
      });
      return traces;
    }

    if (chartMode === 'box') {
      return selectedSpecies.map((sp) => ({
        type: 'box' as const,
        y: report.dataset.rows.filter((r) => r.species === sp).map((r) => r[feature]),
        name: SPECIES_META[sp].short,
        marker: { color: SPECIES_META[sp].color },
        boxpoints: 'all' as const,
        jitter: 0.35,
        pointpos: -1.6,
      }));
    }

    if (chartMode === 'violin') {
      return selectedSpecies.map((sp) => ({
        type: 'violin' as const,
        y: report.dataset.rows.filter((r) => r.species === sp).map((r) => r[feature]),
        name: SPECIES_META[sp].short,
        line: { color: SPECIES_META[sp].color },
        box: { visible: true },
        meanline: { visible: true },
      }));
    }

    // Species Mean Profile across all 4 features
    return selectedSpecies.map((sp) => ({
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: SPECIES_META[sp].short,
      x: FEATURE_ORDER.map((f) => FEATURE_META[f].short),
      y: FEATURE_ORDER.map((f) => report.statistics.by_species[sp][f].mean),
      error_y: {
        type: 'data' as const,
        array: FEATURE_ORDER.map((f) => report.statistics.by_species[sp][f].std),
        visible: true,
      },
      line: { color: SPECIES_META[sp].color, width: 3 },
      marker: { size: 8 },
    }));
  }, [feature, chartMode, selectedSpecies]);

  const layout = useMemo(() => {
    if (chartMode === 'hist_kde') {
      return {
        barmode: 'overlay' as const,
        xaxis: { title: { text: FEATURE_META[feature].label } },
        yaxis: { title: { text: 'Probability Density' } },
        legend: { orientation: 'h' as const, y: 1.15 },
      };
    }
    if (chartMode === 'profile') {
      return {
        xaxis: { title: { text: 'Morphometric Feature' } },
        yaxis: { title: { text: 'Species Mean ± 1 SD (cm)' } },
        legend: { orientation: 'h' as const, y: 1.14 },
      };
    }
    return {
      xaxis: { title: { text: 'Species' } },
      yaxis: { title: { text: FEATURE_META[feature].label } },
      legend: { orientation: 'h' as const, y: 1.14 },
    };
  }, [feature, chartMode]);

  return (
    <section aria-label="Slide 08: Exploratory Analysis" className="slide-stage glass-panel flex flex-col rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E3DAF0] pb-4">
        <div>
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 02 · Slide 08 · Univariate &amp; Profile EDA
          </p>
          <h2 className="font-editorial mt-0.5 text-2xl font-semibold text-[#1E152A]">
            Interactive Distribution Explorer
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select feature"
            value={feature}
            disabled={chartMode === 'profile'}
            onChange={(e) => setFeature(e.target.value as FeatureKey)}
            className="rounded-lg border border-[#E3DAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#1E152A] disabled:opacity-50"
          >
            {FEATURE_ORDER.map((f) => (
              <option key={f} value={f}>
                {FEATURE_META[f].label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-lg bg-[#F3EEF9] p-1">
            {(
              [
                { id: 'hist_kde', label: 'Hist + KDE' },
                { id: 'box', label: 'Box Plot' },
                { id: 'violin', label: 'Violin' },
                { id: 'profile', label: 'Species Profile' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setChartMode(m.id)}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  chartMode === m.id
                    ? 'bg-white text-[#1E152A] shadow-sm'
                    : 'text-[#5C4F6E] hover:text-[#1E152A]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetControls}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E3DAF0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1E152A] hover:bg-[#F3EEF9]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-[#5C4F6E]">Species Filter:</span>
        {SPECIES_ORDER.map((sp) => {
          const checked = selectedSpecies.includes(sp);
          return (
            <label key={sp} className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSpecies(sp)}
                className="accent-[#6D28D9]"
              />
              <span className="font-semibold" style={{ color: SPECIES_META[sp].color }}>
                {sp}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-2.5">
        <PlotlyChart
          id="slide08-eda-chart"
          active={active}
          height={310}
          fillHeight
          exportFilename={`iris_${chartMode}_${feature}`}
          data={chartData}
          layout={layout}
        />
      </div>
    </section>
  );
};

export const Slide09Relationships: React.FC<{ active: boolean }> = ({ active }) => {
  const [xFeature, setXFeature] = useState<FeatureKey>('petal_length');
  const [yFeature, setYFeature] = useState<FeatureKey>('petal_width');
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesName[]>([...SPECIES_ORDER]);
  const [showTrend, setShowTrend] = useState(true);

  const filtered = useMemo(
    () => filterObservations(report.dataset.rows, selectedSpecies),
    [selectedSpecies]
  );

  const regression = useMemo(
    () =>
      computeLinearRegression(
        filtered.map((r) => r[xFeature]),
        filtered.map((r) => r[yFeature])
      ),
    [filtered, xFeature, yFeature]
  );

  const scatterData = useMemo(() => {
    const traces: Plotly.Data[] = selectedSpecies.map((sp) => {
      const sub = filtered.filter((r) => r.species === sp);
      return {
        type: 'scatter',
        mode: 'markers',
        name: SPECIES_META[sp].short,
        x: sub.map((r) => r[xFeature]),
        y: sub.map((r) => r[yFeature]),
        text: sub.map((r) => `ID #${r.id}`),
        marker: {
          color: SPECIES_META[sp].color,
          size: 8.5,
          opacity: 0.85,
          line: { width: 1, color: '#ffffff' },
        },
        hovertemplate: `%{text}<br>${FEATURE_META[xFeature].short}: %{x:.1f} cm<br>${FEATURE_META[yFeature].short}: %{y:.1f} cm<extra>${SPECIES_META[sp].short}</extra>`,
      };
    });

    if (showTrend && regression && filtered.length >= 2) {
      const xs = filtered.map((r) => r[xFeature]);
      const xMin = Math.min(...xs);
      const xMax = Math.max(...xs);
      traces.push({
        type: 'scatter',
        mode: 'lines',
        name: `OLS Fit (r=${regression.r.toFixed(3)})`,
        x: [xMin, xMax],
        y: [
          regression.slope * xMin + regression.intercept,
          regression.slope * xMax + regression.intercept,
        ],
        line: { color: '#1E152A', width: 2, dash: 'dash' },
      });
    }
    return traces;
  }, [filtered, selectedSpecies, xFeature, yFeature, showTrend, regression]);

  const heatmapData = useMemo(() => {
    const labels = FEATURE_ORDER.map((f) => FEATURE_META[f].short);
    const z = report.statistics.correlation_matrix;
    const text = z.map((row) => row.map((v) => v.toFixed(2)));
    return [
      {
        type: 'heatmap' as const,
        x: labels,
        y: labels,
        z,
        text: text as unknown as string[],
        texttemplate: '%{text}',
        zmin: -1,
        zmax: 1,
        colorscale: [
          [0, '#0F766E'],
          [0.5, '#FAF8FC'],
          [1, '#4C1D95'],
        ] as Array<[number, string]>,
        hovertemplate: '%{x} × %{y}: r = %{z:.4f}<extra></extra>',
      },
    ];
  }, []);

  const toggleSpecies = (sp: SpeciesName) => {
    setSelectedSpecies((prev) => {
      if (prev.includes(sp)) return prev.length > 1 ? prev.filter((s) => s !== sp) : prev;
      return [...prev, sp];
    });
  };

  const reset = () => {
    setXFeature('petal_length');
    setYFeature('petal_width');
    setSelectedSpecies([...SPECIES_ORDER]);
    setShowTrend(true);
  };

  const scatterLayout = useMemo(
    () => ({
      xaxis: { title: { text: FEATURE_META[xFeature].label } },
      yaxis: { title: { text: FEATURE_META[yFeature].label } },
      legend: { orientation: 'h' as const, y: 1.15 },
      margin: { t: 28, r: 16, b: 42, l: 50 },
    }),
    [xFeature, yFeature]
  );

  const heatmapLayout = useMemo(
    () => ({
      margin: { t: 20, r: 16, b: 56, l: 84 },
      yaxis: { autorange: 'reversed' as const },
    }),
    []
  );

  return (
    <section aria-label="Slide 09: Feature Relationships" className="slide-stage grid gap-6 lg:grid-cols-12 lg:items-stretch">
      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 lg:col-span-7">
        <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E3DAF0] pb-3">
          <div>
            <p className="text-xs font-medium text-[#6D28D9]">
              Part 02 · Slide 09 · Bivariate Scatter Explorer
            </p>
            <h2 className="font-editorial text-xl font-semibold text-[#1E152A]">
              Pairwise Feature Relationships
            </h2>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E3DAF0] bg-white px-2.5 py-1 text-xs font-medium text-[#1E152A] hover:bg-[#F3EEF9]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <span className="font-medium text-[#5C4F6E]">X:</span>
            <select
              aria-label="X-axis feature"
              value={xFeature}
              onChange={(e) => setXFeature(e.target.value as FeatureKey)}
              className="rounded-md border border-[#E3DAF0] bg-white px-2 py-1 font-medium text-[#1E152A]"
            >
              {FEATURE_ORDER.map((f) => (
                <option key={f} value={f}>
                  {FEATURE_META[f].short}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="font-medium text-[#5C4F6E]">Y:</span>
            <select
              aria-label="Y-axis feature"
              value={yFeature}
              onChange={(e) => setYFeature(e.target.value as FeatureKey)}
              className="rounded-md border border-[#E3DAF0] bg-white px-2 py-1 font-medium text-[#1E152A]"
            >
              {FEATURE_ORDER.map((f) => (
                <option key={f} value={f}>
                  {FEATURE_META[f].short}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-[#1E152A]">
            <input
              type="checkbox"
              checked={showTrend}
              onChange={(e) => setShowTrend(e.target.checked)}
              className="accent-[#6D28D9]"
            />
            <span>OLS Trend</span>
          </label>
          <div className="flex items-center gap-2">
            {SPECIES_ORDER.map((sp) => (
              <label key={sp} className="inline-flex cursor-pointer items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSpecies.includes(sp)}
                  onChange={() => toggleSpecies(sp)}
                  className="accent-[#6D28D9]"
                />
                <span style={{ color: SPECIES_META[sp].color }}>{SPECIES_META[sp].short}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-2 flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-2">
          <PlotlyChart
            id="slide09-scatter"
            active={active}
            height={285}
            fillHeight
            exportFilename={`iris_scatter_${xFeature}_vs_${yFeature}`}
            data={scatterData}
            layout={scatterLayout}
          />
        </div>
        </div>

        {regression && (
          <div className="font-mono-tabular mt-2 flex flex-wrap justify-between gap-2 text-xs text-[#5C4F6E]">
            <span>n = {filtered.length} plotted observations</span>
            <span>
              Pearson r = {regression.r.toFixed(4)} · R² = {regression.r2.toFixed(4)} · y ={' '}
              {regression.slope.toFixed(3)}x {regression.intercept >= 0 ? '+' : '−'}{' '}
              {Math.abs(regression.intercept).toFixed(3)}
            </span>
          </div>
        )}
      </div>

      <div className="glass-panel flex min-w-0 flex-col justify-between rounded-2xl p-5 lg:col-span-5">
        <div>
          <h3 className="text-base font-semibold text-[#1E152A]">
            Pearson Correlation Matrix (n = 150)
          </h3>
          <p className="mt-1 text-xs text-[#5C4F6E]">
            Petal dimensions exhibit strong positive linear coupling (r = +0.9629), while Sepal Width correlates negatively with Petal Length (r = −0.4284).
          </p>
        </div>

        <div className="my-2 flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-[#E3DAF0] bg-white p-2">
          <PlotlyChart
            id="slide09-corr-heatmap"
            active={active}
            height={275}
            fillHeight
            exportFilename="iris_correlation_heatmap"
            data={heatmapData}
            layout={heatmapLayout}
          />
        </div>

        <p className="text-xs text-[#5C4F6E]">
          Visual observation: Setosa separates linearly on petal space alone; Versicolor and Virginica require joint multivariate thresholds.
        </p>
      </div>
    </section>
  );
};

export const Slide10Part1Findings: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const findings = [
    {
      num: '01',
      title: 'Petal Measurements Dominate Discriminative Power',
      evidence: 'ANOVA F = 1180.16 (η² = 0.9414) for Petal Length; F = 960.01 (η² = 0.9289) for Petal Width.',
      implication:
        'A classifier using petal dimensions alone captures nearly all inter-species morphological variance.',
    },
    {
      num: '02',
      title: 'Setosa Is Linearly Separable',
      evidence: 'Setosa Petal Length spans 1.0–1.9 cm vs ≥ 3.0 cm for Versicolor and ≥ 4.5 cm for Virginica.',
      implication:
        'Any linear hyperplane or single depth-1 decision split isolates Setosa with 100% recall and precision.',
    },
    {
      num: '03',
      title: 'Strong Petal Collinearity (r = +0.9629)',
      evidence: 'Petal Length and Petal Width share R² = 92.7% linear variance across the 150 specimens.',
      implication:
        'Tree models naturally split along redundant petal axes, whereas L2 regularization stabilizes linear coefficients.',
    },
    {
      num: '04',
      title: 'Versicolor–Virginica Boundary Overlap',
      evidence: 'Versicolor reaches up to 5.1 cm petal length while Virginica starts at 4.5 cm.',
      implication:
        'Model differentiation will hinge exclusively on how accurately classifiers handle the 4.5–5.1 cm transition band.',
    },
  ];

  return (
    <section aria-label="Slide 10: Part One Findings" className="slide-stage glass-panel flex flex-col justify-between rounded-2xl p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E3DAF0] pb-4">
        <div>
          <p className="text-xs font-medium text-[#6D28D9]">
            Part 02 · Slide 10 · EDA Synthesis
          </p>
          <h2 className="font-editorial mt-1 text-2xl font-semibold text-[#1E152A] sm:text-3xl">
            Key Exploratory Findings Before Modeling
          </h2>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#4C1D95] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
        >
          <span>Proceed to Machine Learning</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-6 grid flex-1 gap-5 md:grid-cols-2">
        {findings.map((f) => (
          <div key={f.num} className="flex flex-col justify-between rounded-xl border border-[#E3DAF0] bg-white p-5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono-tabular text-xs font-bold text-[#6D28D9]">{f.num}.</span>
              <h3 className="text-base font-semibold text-[#1E152A]">{f.title}</h3>
            </div>
            <p className="font-mono-tabular mt-2.5 rounded-lg bg-[#FAF8FC] px-3 py-2 text-xs text-[#4C1D95]">
              Evidence: {f.evidence}
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-[#5C4F6E]">
              {f.implication}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
