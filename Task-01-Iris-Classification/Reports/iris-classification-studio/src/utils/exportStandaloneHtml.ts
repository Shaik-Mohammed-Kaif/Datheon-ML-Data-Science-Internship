import analysisRaw from '../data/irisAnalysis.json';
import { SLIDES_META } from '../data/slidesMeta';
import { IrisAnalysisReport } from '../types/iris';

const report = analysisRaw as IrisAnalysisReport;

export function buildStandalonePresentationHtml(): string {
  const embeddedJson = JSON.stringify(report);
  const embeddedSlides = JSON.stringify(SLIDES_META);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Iris Classification — Standalone Interactive Presentation</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js" defer></script>
  <style>
    :root { --bg:#FAF8FC; --ink:#1E152A; --muted:#5C4F6E; --violet:#6D28D9; --deep:#4C1D95; --teal:#0F766E; --rose:#BE185D; --border:#E3DAF0; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: system-ui, -apple-system, sans-serif; background:var(--bg); color:var(--ink); line-height:1.55; }
    header { position:sticky; top:0; z-index:20; background:rgba(250,248,252,.96); border-bottom:1px solid var(--border); padding:10px 32px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; }
    main { width:100%; max-width:none; margin:0 auto; padding:20px 32px 48px; }
    .slide { width:100%; min-height:calc(100dvh - 104px); display:flex; flex-direction:column; justify-content:space-between; background:#fff; border:1px solid var(--border); border-radius:16px; padding:28px; margin-bottom:20px; box-shadow:0 8px 24px -12px rgba(30,21,42,.08); break-inside:avoid; }
    .kicker { font-size:12px; color:var(--violet); font-weight:600; margin-bottom:6px; }
    h1,h2,h3 { font-family: Georgia, serif; margin:0 0 8px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:12px; margin-top:14px; }
    .kpi { background:#F3EEF9; border-radius:12px; padding:14px; }
    .kpi .val { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--deep); }
    .controls { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:14px 0; }
    select, button { padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:#fff; color:var(--ink); font-size:13px; cursor:pointer; }
    button.primary { background:var(--deep); color:#fff; border-color:var(--deep); }
    .table-wrap { overflow-x:auto; width:100%; }
    table { width:100%; border-collapse:collapse; font-size:13px; font-variant-numeric:tabular-nums; margin-top:12px; }
    th,td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--border); }
    th { background:#FAF8FC; color:var(--muted); }
    .index-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:10px; margin-top:14px; }
    .index-card { border:1px solid var(--border); border-radius:10px; padding:12px; background:#FAF8FC; }
    #cdn-warning { display:none; background:#FEF2F2; border:1px solid #FECACA; color:#991B1B; padding:12px 16px; border-radius:10px; margin-bottom:16px; font-size:13px; }
    @media (max-width:640px) { header { padding:10px 14px; } main { padding:14px 14px 36px; } .slide { min-height:auto; padding:18px; } }
    @media print { @page { size:A4; margin:14mm; } .no-print { display:none !important; } main { padding:0; } .slide { min-height:auto; box-shadow:none; } }
  </style>
</head>
<body>
  <header class="no-print">
    <div>
      <strong>Iris Classification — Standalone Interactive Report (20 Slides)</strong>
      <div style="font-size:12px;color:var(--muted)">Presenter: S. Mohammed Kaif · Data Science | Machine Learning | Data Analytics</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <select id="sectionJump" aria-label="Jump to report section">
        <option value="#sec-overview">01. Executive Summary</option>
        <option value="#sec-scatter">02. Feature Explorer</option>
        <option value="#sec-models">03. Model Benchmark</option>
        <option value="#sec-slides">04. All 20 Slides Index</option>
        <option value="#sec-credits">05. Presenter &amp; Credits</option>
      </select>
      <button class="primary" onclick="window.print()">Print / PDF</button>
    </div>
  </header>
  <main>
    <div id="cdn-warning">Interactive Plotly.js CDN could not load (offline environment). Tabular metrics and findings remain accessible below.</div>
    <section id="sec-overview" class="slide">
      <div class="kicker">Part 01 · Benchmark Overview · Fisher (1936) / Scikit-learn Canonical 150 Records</div>
      <h1>Iris Classification: From Exploratory Data Analysis to Machine Learning</h1>
      <p>Empirical evaluation of four floral measurements across three balanced species (50 specimens each, 0 missing values, 1 exact duplicate pair at rows #102 &amp; #143, 4 Sepal Width 1.5×IQR outliers).</p>
      <div class="grid">
        <div class="kpi"><div>Total Specimens</div><div class="val">150</div></div>
        <div class="kpi"><div>Petal Length ANOVA</div><div class="val">F = 1180.16 (η² = 94.1%)</div></div>
        <div class="kpi"><div>Holdout Accuracy (All 5)</div><div class="val">93.33% (28/30)</div></div>
        <div class="kpi"><div>Peak 5-Fold CV</div><div class="val">96.00% ± 1.49%</div></div>
      </div>
    </section>
    <section id="sec-scatter" class="slide">
      <div class="kicker">Part 02 · Interactive Feature Relationship Explorer</div>
      <h2>Bivariate Scatter &amp; OLS Trend Analysis</h2>
      <div class="controls">
        <label>X: <select id="xSel"><option value="petal_length" selected>Petal Length (cm)</option><option value="petal_width">Petal Width (cm)</option><option value="sepal_length">Sepal Length (cm)</option><option value="sepal_width">Sepal Width (cm)</option></select></label>
        <label>Y: <select id="ySel"><option value="petal_width" selected>Petal Width (cm)</option><option value="petal_length">Petal Length (cm)</option><option value="sepal_length">Sepal Length (cm)</option><option value="sepal_width">Sepal Width (cm)</option></select></label>
        <label><input type="checkbox" id="trendToggle" checked /> Show OLS Trendline</label>
      </div>
      <div id="scatterChart" style="height:360px;"></div>
    </section>
    <section id="sec-models" class="slide">
      <div class="kicker">Part 03 · Supervised Model Comparison (80/20 Stratified Split, random_state=42)</div>
      <h2>Model Performance &amp; 5-Fold Cross-Validation</h2>
      <div id="modelChart" style="height:320px;"></div>
      <div class="table-wrap">
        <table id="modelTable"><thead><tr><th>Model</th><th>Test Accuracy</th><th>Macro F1</th><th>5-Fold CV Mean ± SD</th></tr></thead><tbody></tbody></table>
      </div>
    </section>
    <section id="sec-slides" class="slide">
      <div class="kicker">Complete Deck Architecture · Slides 01–20</div>
      <h2>20-Slide Analytical Presentation Outline</h2>
      <div id="slideIndex" class="index-grid"></div>
    </section>
    <section id="sec-credits" class="slide">
      <div class="kicker">Project &amp; Presenter</div>
      <h2>S. Mohammed Kaif</h2>
      <p>Data Science | Machine Learning | Data Analytics · Botanical EDA &amp; Multiclass Classification (150 Observations · 4 Features · 3 Species · 5 Supervised Classifiers).</p>
      <p style="font-size:12px;color:var(--muted)">Dataset attribution: Edgar Anderson (1935); Ronald A. Fisher (1936). Scikit-learn canonical Iris dataset.</p>
    </section>
  </main>
  <script>
    const DATA = ${embeddedJson};
    const SLIDES = ${embeddedSlides};
    const COLORS = {'Iris-setosa':'#6D28D9','Iris-versicolor':'#0F766E','Iris-virginica':'#BE185D'};
    const tbody = document.querySelector('#modelTable tbody');
    Object.values(DATA.models).forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + m.name + '</td><td>' + (m.accuracy*100).toFixed(2) + '% (' + m.correct_count + '/' + m.total_test + ')</td><td>' + m.macro_f1.toFixed(4) + '</td><td>' + (m.cv.mean*100).toFixed(2) + '% ± ' + (m.cv.std*100).toFixed(2) + '%</td>';
      tbody.appendChild(tr);
    });
    const idxEl = document.getElementById('slideIndex');
    SLIDES.forEach(s => {
      const card = document.createElement('div');
      card.className = 'index-card';
      card.innerHTML = '<div style="font-size:11px;color:var(--violet);font-weight:600">' + s.partLabel + ' · Slide ' + s.number + '</div><div style="font-weight:600;margin-top:2px">' + s.title + '</div><div style="font-size:12px;color:var(--muted);margin-top:2px">' + s.subtitle + '</div>';
      idxEl.appendChild(card);
    });
    document.getElementById('sectionJump').addEventListener('change', (e) => {
      const target = document.querySelector(e.target.value);
      if (target) target.scrollIntoView({ behavior: 'auto' });
    });
    function renderCharts() {
      if (typeof Plotly === 'undefined') {
        document.getElementById('cdn-warning').style.display = 'block';
        return;
      }
      const xKey = document.getElementById('xSel').value;
      const yKey = document.getElementById('ySel').value;
      const showTrend = document.getElementById('trendToggle').checked;
      const traces = ['Iris-setosa','Iris-versicolor','Iris-virginica'].map(sp => {
        const sub = DATA.dataset.rows.filter(r => r.species === sp);
        return { x: sub.map(r => r[xKey]), y: sub.map(r => r[yKey]), mode:'markers', type:'scatter', name:sp, marker:{color:COLORS[sp], size:8} };
      });
      if (showTrend) {
        const xs = DATA.dataset.rows.map(r => r[xKey]), ys = DATA.dataset.rows.map(r => r[yKey]);
        const mx = xs.reduce((a,b)=>a+b,0)/xs.length, my = ys.reduce((a,b)=>a+b,0)/ys.length;
        const num = xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0), den = xs.reduce((s,x)=>s+(x-mx)**2,0);
        if (den > 0) {
          const slope = num/den, intercept = my - slope*mx;
          const xMin = Math.min(...xs), xMax = Math.max(...xs);
          traces.push({ x:[xMin,xMax], y:[slope*xMin+intercept, slope*xMax+intercept], mode:'lines', name:'OLS Trend', line:{color:'#1E152A', dash:'dash'} });
        }
      }
      Plotly.react('scatterChart', traces, { margin:{t:20,r:20,b:45,l:50}, xaxis:{title:xKey}, yaxis:{title:yKey} }, {responsive:true, scrollZoom:false});
      const models = Object.values(DATA.models);
      Plotly.react('modelChart', [
        { x:models.map(m=>m.name), y:models.map(m=>+(m.accuracy*100).toFixed(2)), type:'bar', name:'Holdout Test %', marker:{color:'#6D28D9'} },
        { x:models.map(m=>m.name), y:models.map(m=>+(m.cv.mean*100).toFixed(2)), error_y:{type:'data', array:models.map(m=>+(m.cv.std*100).toFixed(2)), visible:true}, type:'bar', name:'5-Fold CV Mean %', marker:{color:'#0F766E'} }
      ], { barmode:'group', yaxis:{range:[80,102], title:'Accuracy (%)'}, margin:{t:20,r:20,b:50,l:50} }, {responsive:true, scrollZoom:false});
    }
    window.addEventListener('load', () => {
      renderCharts();
      document.getElementById('xSel').addEventListener('change', renderCharts);
      document.getElementById('ySel').addEventListener('change', renderCharts);
      document.getElementById('trendToggle').addEventListener('change', renderCharts);
    });
  </script>
</body>
</html>`;
}
