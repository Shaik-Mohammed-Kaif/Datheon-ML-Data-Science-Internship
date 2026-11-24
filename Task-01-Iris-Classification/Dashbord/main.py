"""IRIS INTELLIGENCE STUDIO"""
from __future__ import annotations
import json
import re
from pathlib import Path
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
st.set_page_config(page_title="Iris Intelligence Studio", page_icon="🌿", layout="wide", initial_sidebar_state="collapsed")
FEATURES = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
FEATURE_LABELS = {"sepal_length": "Sepal Length", "sepal_width": "Sepal Width", "petal_length": "Petal Length", "petal_width": "Petal Width"}
TARGET = "species"
PALETTE = {"Iris-setosa": "#08733D", "Iris-versicolor": "#35B957", "Iris-virginica": "#A8ED70"}
INK = "#173B29"
FLOWER_URL = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1400&auto=format&fit=crop"
def project_ancestors():
    here = Path(__file__).resolve().parent
    return [here, *here.parents]
def dataset_candidates_for(folder):
    return [folder / "data" / "processed" / "iris_cleaned.csv", folder / "data" / "processed" / "iris.csv", folder / "data" / "raw" / "iris.csv", folder / "data" / "raw" / "iris.data", folder / "Dashbord" / "data" / "processed" / "iris_cleaned.csv", folder / "Dashbord" / "data" / "raw" / "iris.csv", folder / "iris.csv"]
def find_project_root():
    ancestors = project_ancestors()
    for folder in ancestors:
        if any(p.is_file() for p in dataset_candidates_for(folder)):
            return folder
    for folder in ancestors:
        if (folder / "outputs" / "reports").is_dir():
            return folder
    return ancestors[0]
ROOT = find_project_root()
REPORTS_DIR = ROOT / "outputs" / "reports"
def locate_dataset():
    for folder in project_ancestors():
        for cand in dataset_candidates_for(folder):
            if cand.is_file():
                return cand
        for dfolder in (folder / "data" / "processed", folder / "data" / "raw"):
            if dfolder.is_dir():
                m = sorted(list(dfolder.glob("*iris*.csv")) + list(dfolder.glob("*iris*.data")))
                if m:
                    return m[0]
    return None
def normalize_column_name(value):
    name = str(value).strip().lower()
    name = re.sub(r"\(cm\)", "", name)
    name = re.sub(r"[^a-z0-9]+", "_", name).strip("_")
    name = re.sub(r"_+", "_", name)
    if name.endswith("_cm"):
        name = name[:-3]
    aliases = {"sepallength": "sepal_length", "sepalwidth": "sepal_width", "petallength": "petal_length", "petalwidth": "petal_width", "class": "species", "variety": "species", "iris_species": "species"}
    return aliases.get(name, name)
@st.cache_data(show_spinner="Loading Iris dataset...")
def load_dataset(file_path: str, modified_ns: int) -> pd.DataFrame:
    path = Path(file_path)
    if path.suffix.lower() == ".data":
        frame = pd.read_csv(path, header=None, names=FEATURES + [TARGET], na_values=["", "?", "NA", "NaN"])
    else:
        frame = pd.read_csv(path)
    frame.columns = [normalize_column_name(c) for c in frame.columns]
    if not set(FEATURES + [TARGET]).issubset(frame.columns):
        raise ValueError("Dataset columns do not match Iris schema.")
    frame = frame[FEATURES + [TARGET]].copy()
    for f in FEATURES:
        frame[f] = pd.to_numeric(frame[f], errors="coerce")
    frame[TARGET] = frame[TARGET].astype("string").str.strip()
    frame = frame.dropna(subset=[TARGET])
    s = frame[TARGET].str.replace(r"^iris[-_ ]?", "", regex=True, case=False).str.strip().str.lower()
    s = s.str[0].str.upper() + s.str[1:]
    frame[TARGET] = "Iris-" + s
    return frame
def find_column(columns, candidates):
    lookup = {normalize_column_name(c): c for c in columns}
    for cand in candidates:
        key = normalize_column_name(cand)
        if key in lookup:
            return lookup[key]
    return None
def parse_metric_value(value):
    if pd.isna(value):
        return np.nan
    if isinstance(value, str):
        value = value.strip().replace("%", "")
    try:
        number = float(value)
    except (TypeError, ValueError):
        return np.nan
    if number > 1 and number <= 100:
        number /= 100
    return number if 0 <= number <= 1 else np.nan
def load_model_summary():
    frames = []
    csv_path = REPORTS_DIR / "baseline_model_comparison.csv"
    if csv_path.is_file():
        try:
            frames.append(pd.read_csv(csv_path))
        except Exception:
            pass
    for json_path in [REPORTS_DIR / "final_model_metrics.json", REPORTS_DIR / "tuned_model_test_results.json", REPORTS_DIR / "model_metrics.json"]:
        if json_path.is_file():
            try:
                payload = json.loads(json_path.read_text(encoding="utf-8"))
                if isinstance(payload, dict):
                    for key in ("best_model", "best_model_metrics", "metrics", "final_metrics"):
                        if isinstance(payload.get(key), dict):
                            payload = payload[key]
                            break
                    frames.append(pd.DataFrame([payload]))
                    break
            except Exception:
                continue
    if not frames:
        return pd.DataFrame(), None
    for frame in frames:
        model_col = find_column(frame.columns, ["model", "classifier", "algorithm", "model_name"])
        f1_col = find_column(frame.columns, ["f1_macro", "macro_f1", "f1_score", "f1"])
        if model_col and f1_col:
            values = frame[f1_col].map(parse_metric_value)
            if values.notna().any():
                return frame, frame.loc[values.idxmax()]
    frame = frames[0]
    return frame, frame.iloc[0] if not frame.empty else None
def metric_from_row(row, names):
    if row is None:
        return np.nan
    col = find_column(row.index, names)
    return parse_metric_value(row[col]) if col else np.nan
def model_name_from_row(row):
    if row is None:
        return None
    col = find_column(row.index, ["model", "classifier", "algorithm", "model_name"])
    return str(row[col]) if col and pd.notna(row[col]) else "Saved model report"
def fmt_metric(value, percent=False):
    if pd.isna(value):
        return "-"
    return f"{value:.1%}" if percent else f"{value:.3f}"
def card_title(text, sub=None):
    suffix = '<span class="panel-sub">' + str(sub) + '</span>' if sub else ""
    st.markdown('<div class="panel-title">' + text + suffix + '</div>', unsafe_allow_html=True)
def plotly_style(fig, height=230):
    fig.update_layout(height=height, margin=dict(l=8, r=8, t=12, b=8), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(family="DM Sans, sans-serif", size=10, color="#405849"), showlegend=True, legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0, font=dict(size=9)))
    fig.update_xaxes(showgrid=False, zeroline=False, linecolor="#dce9df")
    fig.update_yaxes(showgrid=True, gridcolor="#e9f1eb", zeroline=False)
    return fig
def metric_card(label, value, note, icon):
    html = '<div class="kpi-card"><div class="kpi-icon">' + icon + '</div>'
    html += '<div class="kpi-copy"><div class="kpi-label">' + label + '</div>'
    html += '<div class="kpi-value">' + str(value) + '</div>'
    html += '<div class="kpi-note">' + note + '</div></div></div>'
    st.markdown(html, unsafe_allow_html=True)
def render_empty(message):
    st.markdown('<div class="empty-state">' + message + '</div>', unsafe_allow_html=True)
def style_preview_table(df: pd.DataFrame):
    species_style = {"Iris-setosa": "background-color:#08733D; color:#fff; font-weight:700;", "Iris-versicolor": "background-color:#35B957; color:#fff; font-weight:700;", "Iris-virginica": "background-color:#A8ED70; color:#0B3D2E; font-weight:700;"}
    def species_color(val):
        return species_style.get(str(val), "")
    styled = (df.style.background_gradient(subset=["Sepal Length", "Sepal Width", "Petal Length", "Petal Width"], cmap="Greens", vmin=0, vmax=7.5).map(species_color, subset=["Species"]).set_table_styles([{"selector": "th", "props": [("background-color", "#0B3D2E"), ("color", "white"), ("font-size", "11px"), ("font-weight", "700"), ("text-align", "center")]}, {"selector": "td", "props": [("font-size", "11px"), ("text-align", "center"), ("border", "1px solid #E2EDE4")]}]).format({"Sepal Length": "{:.1f}", "Sepal Width": "{:.1f}", "Petal Length": "{:.1f}", "Petal Width": "{:.1f}"}).set_properties(**{"text-align": "center"}))
    return styled
css_parts = []
css_parts.append("<style>")
css_parts.append("@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');")
css_parts.append("* { font-family:'DM Sans',sans-serif; box-sizing:border-box; }")
css_parts.append("@keyframes bgMove { 0% { background-position:0% 0%; } 50% { background-position:100% 50%; } 100% { background-position:0% 0%; } }")
css_parts.append("@keyframes floatY { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }")
css_parts.append("@keyframes sway { 0%,100% { transform:rotate(-4deg); } 50% { transform:rotate(5deg); } }")
css_parts.append("@keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(250%); } }")
css_parts.append("@keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }")
css_parts.append("@keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 rgba(53,185,87,.35); } 50% { box-shadow:0 0 0 10px rgba(53,185,87,0); } }")
css_parts.append("@keyframes progressShine { 0% { background-position:0% 0; } 100% { background-position:200% 0; } }")
css_parts.append(".stApp { background:linear-gradient(120deg,#f8fcf8,#dff3e5,#edf7f0,#c8f0d4); background-size:300% 300%; animation:bgMove 14s ease infinite; color:#173b29; }")
css_parts.append(".block-container { max-width:1780px; padding:8px 22px 22px; animation:fadeUp .6s ease both; }")
css_parts.append("header[data-testid='stHeader'] { background:transparent; }")
css_parts.append("footer { visibility:hidden; }")
css_parts.append("[data-testid='stSidebar'] { display:none !important; }")
css_parts.append(".hero { position:relative; overflow:hidden; min-height:224px; display:grid; grid-template-columns:1.25fr .75fr; align-items:center; gap:20px; padding:25px 34px; border-radius:22px; color:white; margin-bottom:15px; transition:transform .35s ease, box-shadow .35s ease; }")
css_parts.append(".hero:hover { transform:translateY(-2px); box-shadow:0 18px 38px rgba(18,73,42,.28); }")
css_parts.append(".hero::after { content:''; position:absolute; inset:0; background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%); transform:translateX(-100%); animation:shimmer 4.5s ease-in-out infinite; pointer-events:none; }")
css_parts.append(".hero-kicker { color:#a6f28e; font-size:11px; font-weight:800; letter-spacing:1.6px; }")
css_parts.append(".hero h1 { color:#fff; font:800 32px Manrope,sans-serif; margin:9px 0 10px; }")
css_parts.append(".hero h1 span { color:#9bf17c; display:inline-block; animation:floatY 3.2s ease-in-out infinite; }")
css_parts.append(".hero p { max-width:630px; color:#e2f1e6; font-size:13px; line-height:1.55; margin:0; }")
css_parts.append(".hero-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:17px; }")
css_parts.append(".hero-tag { display:inline-block; padding:8px 13px; border:1px solid #ffffff70; border-radius:24px; background:#ffffff18; color:#fff; font-size:11px; font-weight:700; transition:all .3s ease; }")
css_parts.append(".hero-tag:hover { background:#fff; color:#043b25; transform:translateY(-3px) scale(1.03); }")
css_parts.append(".hero-info { justify-self:end; width:min(100%,310px); padding:15px 5px; color:white; font-size:12px; line-height:2; position:relative; z-index:2; }")
css_parts.append(".hero-info strong { display:block; font:800 16px Manrope,sans-serif; margin-bottom:7px; }")
css_parts.append(".hero-svg { position:absolute; right:18px; top:10px; width:340px; height:180px; pointer-events:none; z-index:1; opacity:.95; }")
css_parts.append(".hero-svg .petal { transform-origin:center; animation:sway 3s ease-in-out infinite; }")
css_parts.append(".hero-svg .leaf { animation:floatY 4s ease-in-out infinite; }")
css_parts.append(".filter-shell { border-bottom:1px solid #d9e8dd !important; padding:9px 4px 8px; margin:0 0 13px; }")
css_parts.append(".filter-heading { font:800 10px Manrope,sans-serif; letter-spacing:1.2px; color:#426a50; text-transform:uppercase; }")
css_parts.append(".kpi-card { min-height:91px; display:flex; align-items:center; gap:12px; padding:13px 10px; border-bottom:1px solid #d9e8dd !important; border-radius:14px; transition:all .3s ease; }")
css_parts.append(".kpi-card:hover { transform:translateY(-5px); background:#fff !important; box-shadow:0 14px 28px rgba(8,115,61,.16) !important; }")
css_parts.append(".kpi-icon { width:49px; height:49px; flex:none; display:grid; place-items:center; border-radius:50%; color:#08713b; background:linear-gradient(145deg,#e7fbe9,#baf2c4); font-size:23px; transition:all .35s ease; }")
css_parts.append(".kpi-card:hover .kpi-icon { transform:rotate(12deg) scale(1.12); background:linear-gradient(145deg,#08713b,#35B957); color:#fff; animation:pulseGlow 1.4s infinite; }")
css_parts.append(".kpi-label { color:#344f3d; font-size:10px; font-weight:800; white-space:nowrap; }")
css_parts.append(".kpi-value { color:#07552f; font:800 25px Manrope,sans-serif; line-height:1.2; margin:2px 0; }")
css_parts.append(".kpi-note { color:#788b7e; font-size:9px; white-space:nowrap; }")
css_parts.append(".panel { height:100%; padding:12px 8px 8px; border-bottom:1px solid #d9e8dd !important; border-radius:14px !important; transition:all .3s ease; animation:fadeUp .5s ease both; }")
css_parts.append(".panel:hover { background:#ffffffcc !important; box-shadow:0 12px 26px rgba(8,115,61,.12) !important; transform:translateY(-3px); }")
css_parts.append(".panel-title { color:#173b29; font:800 14px Manrope,sans-serif; margin:0 0 5px; }")
css_parts.append(".panel:hover .panel-title { color:#08713b; }")
css_parts.append(".panel-sub { color:#718477; font:500 10px 'DM Sans',sans-serif; margin-left:4px; }")
css_parts.append(".mini-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; margin:12px 0 15px; }")
css_parts.append(".mini-metric { text-align:center; padding:11px 4px; background:linear-gradient(145deg,#f4fbf5,#e4f7e8); border:1px solid #edf7ee; border-radius:13px; transition:all .3s ease; }")
css_parts.append(".mini-metric:hover { transform:translateY(-4px) scale(1.03); background:#fff; box-shadow:0 10px 20px rgba(8,115,61,.14); }")
css_parts.append(".mini-metric label { display:block; color:#657b6a; font-size:9px; }")
css_parts.append(".mini-metric b { display:block; color:#07552f; font:800 18px Manrope,sans-serif; margin-top:4px; }")
css_parts.append(".progress-track { height:11px; border-radius:20px; background:#e6f0e9; overflow:hidden; margin-top:19px; }")
css_parts.append(".progress-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,#25b84b,#6cde70,#25b84b); background-size:200% 100%; animation:progressShine 2.2s linear infinite; }")
css_parts.append(".progress-caption { display:flex; justify-content:space-between; font-size:10px; color:#62796a; margin-top:6px; }")
css_parts.append(".insight { padding:8px 10px; margin:6px 0; border-radius:10px; border:1px solid #dcefe0; background:#f1faf2; color:#31563b; font-size:10px; line-height:1.45; transition:all .3s ease; }")
css_parts.append(".insight:hover { transform:translateX(4px); background:#fff; box-shadow:0 6px 14px rgba(8,115,61,.12); }")
css_parts.append(".insight b { color:#145b34; }")
css_parts.append(".info-line { display:flex; justify-content:space-between; gap:8px; padding:7px 4px; border-bottom:1px solid #edf2ee; font-size:10px; border-radius:6px; transition:all .25s ease; }")
css_parts.append(".info-line:hover { background:#f1faf2; padding-left:8px; }")
css_parts.append(".info-line span:first-child { color:#748679; }")
css_parts.append(".info-line b { color:#294b34; text-align:right; }")
css_parts.append("[data-testid='stPlotlyChart'] { transition:transform .3s ease; }")
css_parts.append("[data-testid='stPlotlyChart']:hover { transform:scale(1.01); }")
css_parts.append("div[data-testid='stDataFrame'] { border:1px solid #cfe6d3; border-radius:11px; overflow:hidden; }")
css_parts.append("div[data-testid='stDataFrame']:hover { box-shadow:0 12px 26px rgba(8,115,61,.15); }")
css_parts.append("div[data-testid='stDataFrame'] thead tr th { background:#0B3D2E !important; color:#fff !important; font-size:11px !important; }")
css_parts.append("div[data-testid='stDataFrame'] tbody tr:hover td { background:#D9F2DE !important; }")
css_parts.append(".stDownloadButton button { min-height:35px; border-radius:10px !important; border:1px solid #0b8245 !important; background:linear-gradient(110deg,#08713b,#169b50) !important; color:#fff !important; font-size:11px !important; font-weight:800 !important; transition:all .3s ease !important; }")
css_parts.append(".stDownloadButton button:hover { transform:translateY(-2px) scale(1.02) !important; box-shadow:0 10px 20px rgba(8,115,61,.25) !important; }")
css_parts.append(".empty-state { padding:28px 10px; text-align:center; color:#829287; font-size:11px; }")
css_parts.append(".footer { text-align:center; color:#8a9b8e; font-size:9px; letter-spacing:1px; padding:16px 0 2px; }")
css_parts.append("</style>")
hero_bg = "background:linear-gradient(90deg,rgba(3,49,29,.98) 0%,rgba(4,72,39,.92) 48%,rgba(4,66,36,.25) 100%), url(" + FLOWER_URL + ") right center/cover no-repeat, linear-gradient(120deg,#043b25,#0c7040);"
css_parts.append("<style>.hero { " + hero_bg + " }</style>")
st.markdown("".join(css_parts), unsafe_allow_html=True)
dataset_path = locate_dataset()
if dataset_path is None:
    st.error("Iris dataset file was not found.")
    st.code("Project root: " + str(ROOT))
    st.stop()
try:
    raw_data = load_dataset(str(dataset_path), dataset_path.stat().st_mtime_ns)
except Exception as exc:
    st.error("Could not load the Iris dataset: " + str(exc))
    st.stop()
report_frame, best_row = load_model_summary()
best_model = model_name_from_row(best_row)
accuracy = metric_from_row(best_row, ["accuracy", "test_accuracy", "accuracy_score"])
precision = metric_from_row(best_row, ["precision_macro", "precision", "macro_precision"])
recall = metric_from_row(best_row, ["recall_macro", "recall", "macro_recall"])
f1 = metric_from_row(best_row, ["f1_macro", "macro_f1", "f1_score", "f1"])
hero = []
hero.append('<section class="hero">')
hero.append('<svg class="hero-svg" viewBox="0 0 340 180" fill="none">')
hero.append('<g class="petal"><ellipse cx="260" cy="55" rx="34" ry="16" fill="#A8ED70" /></g>')
hero.append('<g class="leaf"><path d="M40 140 Q80 90 130 130 Q85 150 40 140Z" fill="#35B957" /></g>')
hero.append('<g><circle cx="300" cy="120" r="6" fill="#fff" /></g>')
hero.append('</svg>')
hero.append('<div>')
hero.append('<div class="hero-kicker">DATHEON TASK 01</div>')
hero.append('<h1>Iris Intelligence <span>Studio</span></h1>')
hero.append('<p>A complete machine learning workspace for exploring the Iris dataset.</p>')
hero.append('<div class="hero-tags">')
hero.append('<span class="hero-tag">Iris Classification Dashboard</span>')
hero.append('<span class="hero-tag">3 Species - 4 Features</span>')
hero.append('</div></div>')
hero.append('<div class="hero-info">')
hero.append('<strong>Iris Classification</strong>')
hero.append('<div>3 Species - Setosa, Versicolor, Virginica</div>')
hero.append('<div>4 Numerical Features</div>')
hero.append('<div>Multi-class Classification</div>')
hero.append('</div>')
hero.append('</section>')
st.markdown("".join(hero), unsafe_allow_html=True)
st.markdown('<div class="filter-shell"><div class="filter-heading">Interactive Filters and Slicers</div>', unsafe_allow_html=True)
filter_cols = st.columns([1.18, 1, 1, 1, 1], gap="small")
species_values = sorted(raw_data[TARGET].dropna().astype(str).unique().tolist())
with filter_cols[0]:
    species_choice = st.selectbox("Species", ["All species"] + species_values, key="filter_species")
filtered = raw_data.copy()
if species_choice != "All species":
    filtered = filtered[filtered[TARGET].astype(str) == species_choice]
for col, feature in zip(filter_cols[1:], FEATURES):
    values = sorted(pd.to_numeric(filtered[feature], errors="coerce").dropna().unique().tolist())
    with col:
        options = ["All values"] + [f"{v:.1f}" for v in values]
        selected = st.selectbox(FEATURE_LABELS[feature], options, key=f"filter_{feature}")
    if selected != "All values":
        filtered = filtered[np.isclose(filtered[feature], float(selected), equal_nan=False)]
st.markdown("</div>", unsafe_allow_html=True)
missing_cells = int(filtered[FEATURES + [TARGET]].isna().sum().sum())
quality = (1 - missing_cells / max(1, filtered[FEATURES + [TARGET]].size)) * 100
kpi_cols = st.columns(5, gap="small")
kpi_specs = [("Dataset Records", f"{len(filtered):,}", "Filtered observations", "D"), ("Species Classes", str(filtered[TARGET].nunique()), "Selected categories", "S"), ("Input Features", "4", "Sepal and petal measurements", "F"), ("Data Quality", f"{quality:.1f}%", f"{missing_cells} missing cells", "Q"), ("Best Model Accuracy", fmt_metric(accuracy, percent=True), best_model or "Saved report unavailable", "M")]
for col, spec in zip(kpi_cols, kpi_specs):
    with col:
        metric_card(*spec)
row1 = st.columns([1, 1, 1.1, 1.1], gap="small")
with row1[0]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Species Distribution", "(Donut Chart)")
    if not filtered.empty:
        counts = filtered[TARGET].astype(str).value_counts()
        labels = counts.index.tolist()
        values = counts.values.tolist()
        colors = [PALETTE.get(l, "#08733D") for l in labels]
        fig = go.Figure(data=[go.Pie(labels=labels, values=values, hole=0.62, marker=dict(colors=colors, line=dict(color="white", width=2)), textinfo="percent", textposition="outside")])
        fig.add_annotation(text=f"<b>{len(filtered)}</b><br>Samples", x=0.5, y=0.5, showarrow=False, font=dict(size=18, color=INK))
        fig.update_layout(height=260, margin=dict(l=8, r=8, t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", font=dict(family="DM Sans", size=11, color="#405849"), showlegend=True, legend=dict(orientation="h", y=-0.1, x=0))
        st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
        st.caption(" - ".join([f"{l}: {v} ({v/len(filtered)*100:.1f}%)" for l, v in zip(labels, values)]))
    else:
        render_empty("No records match the selected filters.")
    st.markdown("</div>", unsafe_allow_html=True)
with row1[1]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Species Share", "(Pie Chart)")
    if not filtered.empty:
        counts = filtered[TARGET].astype(str).value_counts()
        labels = counts.index.tolist()
        values = counts.values.tolist()
        colors = [PALETTE.get(l, "#08733D") for l in labels]
        fig2 = go.Figure(data=[go.Pie(labels=labels, values=values, hole=0, marker=dict(colors=colors, line=dict(color="white", width=2)), textinfo="label+percent", textposition="inside")])
        fig2.update_layout(height=260, margin=dict(l=8, r=8, t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", font=dict(family="DM Sans", size=11, color="#405849"), showlegend=False)
        st.plotly_chart(fig2, width="stretch", config={"displayModeBar": False})
    else:
        render_empty("No data for pie chart.")
    st.markdown("</div>", unsafe_allow_html=True)
with row1[2]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Model Performance", f"({best_model})" if best_model else "(Saved report)")
    tiles = "".join(f'<div class="mini-metric"><label>{label}</label><b>{fmt_metric(value)}</b></div>' for label, value in [("Accuracy", accuracy), ("Precision", precision), ("Recall", recall), ("F1-Score", f1)])
    st.markdown(f'<div class="mini-metrics">{tiles}</div>', unsafe_allow_html=True)
    if pd.notna(accuracy):
        st.markdown(f'<div class="progress-track"><div class="progress-fill" style="width:{accuracy*100:.2f}%"></div></div><div class="progress-caption"><span>Reported accuracy</span><b>{accuracy:.1%}</b></div>', unsafe_allow_html=True)
    else:
        render_empty("Saved accuracy metrics are unavailable.")
    if best_model:
        st.markdown(f'<div class="insight">Best reported classifier: <b>{best_model}</b></div>', unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)
with row1[3]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Measurement Profile", "(Average by Species)")
    if not filtered.empty:
        averages = filtered.groupby(TARGET, observed=False)[FEATURES].mean().reset_index().melt(id_vars=TARGET, var_name="Feature", value_name="Mean")
        averages["Feature"] = averages["Feature"].map(FEATURE_LABELS)
        fig = px.bar(averages, x=TARGET, y="Mean", color="Feature", barmode="group", color_discrete_sequence=["#08733D", "#35B957", "#65D96D", "#B2EF7C"])
        fig.update_layout(legend_title_text="", bargap=.22, bargroupgap=.08)
        fig.update_xaxes(title="", tickfont=dict(size=9))
        fig.update_yaxes(title="Mean measurement (cm)")
        st.plotly_chart(plotly_style(fig, 238), width="stretch", config={"displayModeBar": False})
    else:
        render_empty("No measurements available.")
    st.markdown("</div>", unsafe_allow_html=True)
row2 = st.columns([1.15, 1, 1], gap="small")
with row2[0]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Feature Relationship", "(Petal Length vs Sepal Length)")
    if not filtered.empty:
        fig = px.scatter(filtered, x="petal_length", y="sepal_length", color=TARGET, color_discrete_map=PALETTE, labels={"petal_length": "Petal Length (cm)", "sepal_length": "Sepal Length (cm)", TARGET: "Species"})
        fig.update_traces(marker=dict(size=9, opacity=0.85, line=dict(width=1, color="white")))
        st.plotly_chart(plotly_style(fig, 260), width="stretch", config={"displayModeBar": False})
    else:
        render_empty("No data for scatter plot.")
    st.markdown("</div>", unsafe_allow_html=True)
with row2[1]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Feature Correlation", "(Pearson r)")
    if len(filtered) > 2:
        corr = filtered[FEATURES].corr(numeric_only=True)
        fig = go.Figure(data=go.Heatmap(z=corr.values, x=[FEATURE_LABELS[c] for c in FEATURES], y=[FEATURE_LABELS[c] for c in FEATURES], colorscale=[[0, "#DC2626"], [0.5, "#F8FAF8"], [1, "#0E7A4A"]], zmin=-1, zmax=1, text=[[f"{v:.2f}" for v in r] for r in corr.values], texttemplate="%{text}"))
        fig.update_xaxes(tickangle=-18)
        st.plotly_chart(plotly_style(fig, 260), width="stretch", config={"displayModeBar": False})
    else:
        render_empty("Not enough data for correlation.")
    st.markdown("</div>", unsafe_allow_html=True)
with row2[2]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Feature Distribution", "(Box Plot by Species)")
    if not filtered.empty:
        melted = filtered.melt(id_vars=TARGET, value_vars=FEATURES, var_name="Feature", value_name="Value")
        melted["Feature"] = melted["Feature"].map(FEATURE_LABELS)
        fig = px.box(melted, x="Feature", y="Value", color=TARGET, color_discrete_map=PALETTE, labels={"Feature": "", "Value": "cm"})
        fig.update_layout(boxmode="group")
        st.plotly_chart(plotly_style(fig, 260), width="stretch", config={"displayModeBar": False})
    else:
        render_empty("No data for distribution.")
    st.markdown("</div>", unsafe_allow_html=True)
bottom = st.columns([.88, 1.45, 1.25], gap="small")
with bottom[0]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Dataset Information")
    source_name = "UCI Iris" if len(raw_data) == 150 and raw_data[TARGET].nunique() == 3 else dataset_path.name
    for label, value in [("Source", source_name), ("Records", f"{len(filtered):,} / {len(raw_data):,}"), ("Features", "4 numerical"), ("Species", str(filtered[TARGET].nunique())), ("Missing cells", str(missing_cells))]:
        st.markdown(f'<div class="info-line"><span>{label}</span><b>{value}</b></div>', unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)
with bottom[1]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Dataset Preview", "(Filtered sample)")
    if not filtered.empty:
        preview = filtered.head(6).rename(columns={"sepal_length": "Sepal Length", "sepal_width": "Sepal Width", "petal_length": "Petal Length", "petal_width": "Petal Width", "species": "Species"})
        st.dataframe(style_preview_table(preview), width="stretch", hide_index=True, height=220)
    else:
        render_empty("No rows to display.")
    st.markdown("</div>", unsafe_allow_html=True)
with bottom[2]:
    st.markdown('<div class="panel">', unsafe_allow_html=True)
    card_title("Key Insights", "(Live summary)")
    if not filtered.empty:
        species_counts = filtered[TARGET].astype(str).value_counts()
        st.markdown(f'<div class="insight">Current view contains <b>{len(filtered)}</b> observations across <b>{filtered[TARGET].nunique()}</b> species.</div>', unsafe_allow_html=True)
        if not species_counts.empty:
            st.markdown(f'<div class="insight">Most represented species: <b>{species_counts.index[0]}</b> ({species_counts.iloc[0]} rows).</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="insight">Avg Petal Length: <b>{filtered["petal_length"].mean():.2f} cm</b> - Avg Sepal Length: <b>{filtered["sepal_length"].mean():.2f} cm</b></div>', unsafe_allow_html=True)
        corr = filtered[FEATURES].corr(numeric_only=True)
        if corr.shape[0] > 1:
            upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool)).stack()
            if not upper.empty:
                pair = upper.abs().idxmax()
                value = float(corr.loc[pair[0], pair[1]])
                st.markdown(f'<div class="insight">Strongest relationship: <b>{FEATURE_LABELS.get(pair[0], pair[0])}</b> and <b>{FEATURE_LABELS.get(pair[1], pair[1])}</b> (r = {value:.2f}).</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="insight">Missing cells: <b>{missing_cells}</b> - Distribution: <b>{" - ".join(f"{k}: {v}" for k, v in species_counts.items())}</b></div>', unsafe_allow_html=True)
    else:
        render_empty("Select a wider filter range to see insights.")
    st.markdown("</div>", unsafe_allow_html=True)
download_left, download_right = st.columns([5, 1])
with download_left:
    st.caption(f"Showing {len(filtered):,} of {len(raw_data):,} dataset records - Source file: {dataset_path.name}")
with download_right:
    st.download_button("Download CSV", data=filtered.to_csv(index=False).encode("utf-8-sig"), file_name="iris_filtered_dataset.csv", mime="text/csv", width="stretch", key="iris_dataset_download")
st.markdown('<div class="footer">IRIS STUDIO - DATHEON TASK 01 - INTERACTIVE DATA ANALYTICS</div>', unsafe_allow_html=True)