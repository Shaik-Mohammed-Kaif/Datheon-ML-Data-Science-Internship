"""IRIS INTELLIGENCE STUDIO - CLEAN 16:9 FULL CANVAS"""
from __future__ import annotations
import re
from pathlib import Path
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

st.set_page_config(page_title="Iris Intelligence Studio", page_icon="🌿", layout="wide", initial_sidebar_state="collapsed")

# ---------- CONFIG ----------
FEATURES = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
LABELS = {"sepal_length": "Sepal Length", "sepal_width": "Sepal Width", "petal_length": "Petal Length", "petal_width": "Petal Width"}
TARGET = "species"
PALETTE = {"Iris-setosa": "#08733D", "Iris-versicolor": "#35B957", "Iris-virginica": "#A8ED70"}
FLOWER_URL = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1920&auto=format&fit=crop"

# ---------- DATA ----------
def normalize(c):
    n = str(c).strip().lower()
    n = re.sub(r"\(cm\)", "", n)
    n = re.sub(r"[^a-z0-9]+", "_", n).strip("_")
    n = re.sub(r"_+", "_", n)
    if n.endswith("_cm"):
        n = n[:-3]
    # Robust: contains-check for any header style - Sepal Length (cm) / sepal.length / SepalLength
    if "sepal" in n and "length" in n:
        return "sepal_length"
    if "sepal" in n and "width" in n:
        return "sepal_width"
    if "petal" in n and "length" in n:
        return "petal_length"
    if "petal" in n and "width" in n:
        return "petal_width"
    if n in ("class", "variety", "species", "iris_species", "target", "type"):
        return "species"
    return {"sepallength": "sepal_length", "sepalwidth": "sepal_width", "petallength": "petal_length", "petalwidth": "petal_width"}.get(n, n)

def find_data():
    here = Path(__file__).resolve().parent
    for f in [here, *here.parents]:
        for p in [f/"data"/"processed"/"iris_cleaned.csv", f/"data"/"processed"/"iris.csv", f/"data"/"raw"/"iris.csv", f/"data"/"raw"/"iris.data", f/"iris.csv"]:
            if p.is_file():
                return p
    return None

@st.cache_data
def load_data(path):
    df = pd.read_csv(path, header=None, names=FEATURES+[TARGET]) if str(path).endswith(".data") else pd.read_csv(path)
    df.columns = [normalize(c) for c in df.columns]
    # Drop unnamed index column if CSV has it
    df = df.loc[:, ~df.columns.astype(str).str.startswith("Unnamed")]
    missing_cols = [c for c in FEATURES+[TARGET] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"CSV columns {list(df.columns)} do not match Iris schema. Missing: {missing_cols}")
    df = df[FEATURES+[TARGET]].copy()
    for c in FEATURES:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    s = df[TARGET].astype(str).str.replace(r"^iris[-_ ]?", "", regex=True, case=False).str.strip().str.lower()
    df[TARGET] = "Iris-" + s.str[0].str.upper() + s.str[1:]
    return df.dropna(subset=[TARGET])

# ---------- CLEAN CSS : FULL CANVAS 16:9 ----------
st.markdown("<style>" + """
html,body{margin:0;padding:0;overflow-x:hidden;background:#F4FBF5}
.stApp{background:#F4FBF5}
header[data-testid="stHeader"]{background:transparent}
footer{visibility:hidden}
[data-testid="stSidebar"]{display:none!important}
.block-container{max-width:100%!important;width:100%!important;padding:0 20px 12px!important;margin:0 auto!important}
/* HERO */
.hero{position:relative;overflow:hidden;border-radius:18px;padding:22px 24px;margin-bottom:14px;color:#fff;background:linear-gradient(90deg,rgba(3,49,29,.97) 0%,rgba(4,72,39,.90) 50%,rgba(4,66,36,.30) 100%),url(""" + FLOWER_URL + """) right center/cover no-repeat;display:flex;justify-content:space-between;align-items:center;gap:20px;min-height:160px}
.hero h1{font-size:34px;font-weight:800;margin:8px 0 8px;line-height:1.1}
.hero h1 span{color:#9BF17C}
.hero p{color:#E2F1E6;font-size:13px;max-width:600px;margin:0;line-height:1.6}
.hero-kicker{color:#A6F28E;font-size:11px;font-weight:800;letter-spacing:1.8px}
.hero-tags{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
.hero-tag{border:1px solid rgba(255,255,255,.45);border-radius:20px;padding:7px 12px;font-size:11px;font-weight:700;background:rgba(255,255,255,.12)}
.hero-info{text-align:right;font-size:12px;line-height:2;min-width:260px}
.hero-info strong{font-size:16px;display:block;margin-bottom:6px}
/* FILTER */
.filter-bar{background:#fff;border:1px solid #D9E8DD;border-radius:14px;padding:12px 16px;margin-bottom:14px}
.filter-bar label{font-size:11px!important;font-weight:700!important;color:#426A50!important}
/* KPI */
.kpi{background:#fff;border:1px solid #E3EFE6;border-radius:14px;padding:12px 14px;display:flex;gap:12px;align-items:center;height:100%}
.kpi-icon{width:48px;height:48px;border-radius:50%;background:#E7FBE9;display:grid;place-items:center;font-size:22px;flex:none}
.kpi-label{font-size:10px;font-weight:800;color:#344F3D;letter-spacing:.4px}
.kpi-value{font-size:26px;font-weight:800;color:#07552F;line-height:1.15}
.kpi-note{font-size:10px;color:#788B7E}
/* PANEL */
.panel{background:#fff;border:1px solid #E3EFE6;border-radius:14px;padding:12px 10px 6px;height:100%}
.panel-title{font-size:14px;font-weight:800;color:#173B29;margin:0 0 8px}
.panel-title span{font-size:10px;font-weight:500;color:#718477;margin-left:4px}
.info-line{display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid #EDF2EE;font-size:11px}
.info-line b{color:#294B34}
.insight{background:#F1FAF2;border:1px solid #DCEFE0;border-radius:10px;padding:9px 11px;margin:7px 0;font-size:11px;line-height:1.5;color:#31563B}
.insight b{color:#145B34}
.footer{text-align:center;color:#8A9B8E;font-size:9px;letter-spacing:1px;padding:14px 0 2px}
/* --- COMPRESSED WIDTH : no wasted space --- */
.block-container{max-width:100%!important;width:100%!important;padding:0 12px 10px!important}
[data-testid="column"]{padding:0 4px!important}
[data-testid="stHorizontalBlock"]{gap:8px!important}
/* --- ANIMATIONS --- */
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(53,185,87,.35)}50%{box-shadow:0 0 0 9px rgba(53,185,87,0)}}
.hero{animation:fadeUp .6s ease both}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%);transform:translateX(-100%);animation:shimmer 4.5s ease-in-out infinite;pointer-events:none}
.hero h1 span{display:inline-block;animation:floatY 3.2s ease-in-out infinite}
.hero-tag{transition:all .3s ease}
.hero-tag:hover{background:#fff;color:#043b25;transform:translateY(-3px) scale(1.03)}
.kpi{animation:fadeUp .5s ease both;transition:all .3s ease}
.kpi:hover{transform:translateY(-4px);box-shadow:0 12px 24px rgba(8,115,61,.14);background:#fff}
.kpi:hover .kpi-icon{transform:rotate(12deg) scale(1.1);background:linear-gradient(145deg,#08713b,#35B957);color:#fff;animation:pulseGlow 1.4s infinite}
.kpi-icon{transition:all .35s ease}
.panel{animation:fadeUp .5s ease both;transition:all .3s ease}
.panel:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(8,115,61,.12)}
.panel:hover .panel-title{color:#08713b}
.insight{transition:all .3s ease}
.insight:hover{transform:translateX(4px);background:#fff;box-shadow:0 6px 14px rgba(8,115,61,.12)}
.info-line{transition:all .25s ease}
.info-line:hover{background:#F1FAF2;padding-left:8px}
[data-testid="stPlotlyChart"]{transition:transform .3s ease}
[data-testid="stPlotlyChart"]:hover{transform:scale(1.01)}
div[data-testid="stDataFrame"]{border:1px solid #CFE6D3;border-radius:11px;overflow:hidden;transition:box-shadow .3s ease}
div[data-testid="stDataFrame"]:hover{box-shadow:0 12px 26px rgba(8,115,61,.15)}
div[data-testid="stDataFrame"] thead tr th{background:#0B3D2E!important;color:#fff!important;font-size:11px!important}
div[data-testid="stDataFrame"] tbody tr:hover td{background:#D9F2DE!important}
.stDownloadButton button{transition:all .3s ease!important}
.stDownloadButton button:hover{transform:translateY(-2px) scale(1.02)!important}
@media (max-width:900px){.hero{flex-direction:column;align-items:flex-start}.hero-info{text-align:left}}
""" + "</style>", unsafe_allow_html=True)

def style_preview_table(df):
    # CONDITION COLOR: species pill + value heat (Greens gradient)
    pills = {"Iris-setosa": "background-color:#08733D;color:#fff;font-weight:700;", "Iris-versicolor": "background-color:#35B957;color:#fff;font-weight:700;", "Iris-virginica": "background-color:#A8ED70;color:#0B3D2E;font-weight:700;"}
    def pill(v):
        return pills.get(str(v), "")
    return (df.style.background_gradient(subset=["Sepal Length", "Sepal Width", "Petal Length", "Petal Width"], cmap="Greens", vmin=0, vmax=7.5).map(pill, subset=["Species"]).set_table_styles([{"selector": "th", "props": [("background-color", "#0B3D2E"), ("color", "white"), ("font-size", "11px"), ("font-weight", "700"), ("text-align", "center")]}, {"selector": "td", "props": [("font-size", "11px"), ("text-align", "center"), ("border", "1px solid #E2EDE4")]}]).format({"Sepal Length": "{:.1f}", "Sepal Width": "{:.1f}", "Petal Length": "{:.1f}", "Petal Width": "{:.1f}"}).set_properties(**{"text-align": "center"}))

def style_fig(fig, h=300):
    fig.update_layout(height=h, margin=dict(l=10, r=10, t=10, b=10), paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(family="DM Sans,sans-serif", size=11, color="#405849"), legend=dict(orientation="h", y=1.08, x=0, font=dict(size=10)))
    fig.update_xaxes(showgrid=False, linecolor="#DCE9DF")
    fig.update_yaxes(showgrid=True, gridcolor="#E9F1EB")
    return fig

def panel(title, sub=""):
    st.markdown(f'<div class="panel"><div class="panel-title">{title} <span>{sub}</span></div>', unsafe_allow_html=True)

def close_panel():
    st.markdown("</div>", unsafe_allow_html=True)

# ---------- LOAD ----------
path = find_data()
if path is None:
    st.error("Iris dataset not found.")
    st.stop()
raw = load_data(str(path))

# ---------- 1. HERO ----------
st.markdown('<div class="hero"><div><div class="hero-kicker">DATHEON TASK 01</div><h1>Iris Intelligence <span>Studio</span></h1><p>A complete machine learning workspace for exploring the Iris dataset.</p><div class="hero-tags"><span class="hero-tag">Iris Classification Dashboard</span><span class="hero-tag">3 Species - 4 Features</span></div></div><div class="hero-info"><strong>Iris Classification</strong>3 Species - Setosa, Versicolor, Virginica<br>4 Numerical Features<br>Multi-class Classification</div></div>', unsafe_allow_html=True)

# ---------- 2. FILTERS ----------
st.markdown('<div class="filter-bar">', unsafe_allow_html=True)
f1, f2, f3, f4, f5 = st.columns(5, gap="small")
with f1:
    sp = st.selectbox("Species", ["All species"] + sorted(raw[TARGET].unique().tolist()))
filt = raw.copy()
if sp != "All species":
    filt = filt[filt[TARGET] == sp]
for col, feat in zip([f2, f3, f4, f5], FEATURES):
    with col:
        vals = sorted(filt[feat].dropna().unique().tolist())
        sel = st.selectbox(LABELS[feat], ["All values"] + [f"{v:.1f}" for v in vals], key=f"f_{feat}")
    if sel != "All values":
        filt = filt[np.isclose(filt[feat], float(sel))]
st.markdown("</div>", unsafe_allow_html=True)

# ---------- 3. KPI ROW ----------
missing = int(filt[FEATURES + [TARGET]].isna().sum().sum())
quality = (1 - missing / max(1, filt[FEATURES + [TARGET]].size)) * 100
kpis = [("📊", "Dataset Records", f"{len(filt):,}", "Filtered observations"), ("🌸", "Species Classes", str(filt[TARGET].nunique()), "Selected categories"), ("📏", "Input Features", "4", "Sepal and petal measurements"), ("✅", "Data Quality", f"{quality:.1f}%", f"{missing} missing cells"), ("🎯", "Total Records", f"{len(raw):,}", "Full dataset")]
kcols = st.columns(5, gap="small")
for c, (icon, lab, val, note) in zip(kcols, kpis):
    with c:
        st.markdown(f'<div class="kpi"><div class="kpi-icon">{icon}</div><div><div class="kpi-label">{lab}</div><div class="kpi-value">{val}</div><div class="kpi-note">{note}</div></div></div>', unsafe_allow_html=True)

st.markdown("<div style='height:14px'></div>", unsafe_allow_html=True)

# ---------- 4. ROW 1 : Donut + Bar + Scatter ----------
r1c1, r1c2, r1c3 = st.columns([1, 1.15, 1.35], gap="small")
with r1c1:
    panel("Species Distribution", "(Donut Chart)")
    if not filt.empty:
        cnt = filt[TARGET].value_counts()
        fig = go.Figure(data=[go.Pie(labels=cnt.index.tolist(), values=cnt.values.tolist(), hole=0.62, marker=dict(colors=[PALETTE.get(x, "#08733D") for x in cnt.index], line=dict(color="white", width=2)), textinfo="percent")])
        fig.add_annotation(text=f"<b>{len(filt)}</b><br>Samples", x=0.5, y=0.5, showarrow=False, font=dict(size=18, color="#173B29"))
        fig.update_layout(height=270, margin=dict(l=10, r=10, t=10, b=10), showlegend=True, legend=dict(orientation="h", y=-0.08, x=0))
        st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
    close_panel()
with r1c2:
    panel("Measurement Profile", "(Average by Species)")
    if not filt.empty:
        avg = filt.groupby(TARGET)[FEATURES].mean().reset_index().melt(id_vars=TARGET, var_name="Feature", value_name="Mean")
        avg["Feature"] = avg["Feature"].map(LABELS)
        fig = px.bar(avg, x=TARGET, y="Mean", color="Feature", barmode="group", color_discrete_sequence=["#08733D", "#35B957", "#65D96D", "#B2EF7C"])
        st.plotly_chart(style_fig(fig, 270), width="stretch", config={"displayModeBar": False})
    close_panel()
with r1c3:
    panel("Feature Relationship", "(Petal Length vs Sepal Length)")
    if not filt.empty:
        fig = px.scatter(filt, x="petal_length", y="sepal_length", color=TARGET, color_discrete_map=PALETTE, labels={"petal_length": "Petal Length (cm)", "sepal_length": "Sepal Length (cm)", TARGET: "Species"})
        fig.update_traces(marker=dict(size=9, opacity=0.85, line=dict(width=1, color="white")))
        st.plotly_chart(style_fig(fig, 270), width="stretch", config={"displayModeBar": False})
    close_panel()

st.markdown("<div style='height:14px'></div>", unsafe_allow_html=True)

# ---------- 5. ROW 2 : Correlation + Box + Info ----------
r2c1, r2c2, r2c3 = st.columns([1, 1.2, 0.9], gap="small")
with r2c1:
    panel("Feature Correlation", "(Pearson r)")
    if len(filt) > 2:
        corr = filt[FEATURES].corr(numeric_only=True)
        fig = go.Figure(data=go.Heatmap(z=corr.values, x=[LABELS[c] for c in FEATURES], y=[LABELS[c] for c in FEATURES], colorscale=[[0, "#DC2626"], [0.5, "#F8FAF8"], [1, "#0E7A4A"]], zmin=-1, zmax=1, text=[[f"{v:.2f}" for v in r] for r in corr.values], texttemplate="%{text}"))
        fig.update_layout(height=270, margin=dict(l=10, r=10, t=10, b=10))
        st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
    close_panel()
with r2c2:
    panel("Feature Distribution", "(Box Plot by Species)")
    if not filt.empty:
        m = filt.melt(id_vars=TARGET, value_vars=FEATURES, var_name="Feature", value_name="Value")
        m["Feature"] = m["Feature"].map(LABELS)
        fig = px.box(m, x="Feature", y="Value", color=TARGET, color_discrete_map=PALETTE, labels={"Feature": "", "Value": "cm"})
        fig.update_layout(boxmode="group")
        st.plotly_chart(style_fig(fig, 270), width="stretch", config={"displayModeBar": False})
    close_panel()
with r2c3:
    panel("Dataset Information")
    for lab, val in [("Source", "UCI Iris" if len(raw) == 150 else path.name), ("Records", f"{len(filt):,} / {len(raw):,}"), ("Features", "4 numerical"), ("Species", str(filt[TARGET].nunique())), ("Missing cells", str(missing))]:
        st.markdown(f'<div class="info-line"><span>{lab}</span><b>{val}</b></div>', unsafe_allow_html=True)
    close_panel()

st.markdown("<div style='height:14px'></div>", unsafe_allow_html=True)

# ---------- 6. ROW 3 : Preview + Insights ----------
b1, b2 = st.columns([1.4, 1], gap="small")
with b1:
    panel("Dataset Preview", "(Filtered sample)")
    if not filt.empty:
        prev = filt.head(6).rename(columns={**LABELS, "species": "Species"})
        st.dataframe(style_preview_table(prev), width="stretch", hide_index=True, height=220)
    close_panel()
with b2:
    panel("Key Insights", "(Live summary)")
    if not filt.empty:
        cnt = filt[TARGET].value_counts()
        st.markdown(f'<div class="insight">Current view contains <b>{len(filt)}</b> observations across <b>{filt[TARGET].nunique()}</b> species.</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="insight">Most represented species: <b>{cnt.index[0]}</b> ({cnt.iloc[0]} rows).</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="insight">Avg Petal Length: <b>{filt["petal_length"].mean():.2f} cm</b> - Avg Sepal Length: <b>{filt["sepal_length"].mean():.2f} cm</b></div>', unsafe_allow_html=True)
        corr = filt[FEATURES].corr(numeric_only=True)
        up = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool)).stack()
        if not up.empty:
            p = up.abs().idxmax()
            st.markdown(f'<div class="insight">Strongest relationship: <b>{LABELS.get(p[0], p[0])}</b> and <b>{LABELS.get(p[1], p[1])}</b> (r = {float(corr.loc[p[0], p[1]]):.2f}).</div>', unsafe_allow_html=True)
    close_panel()

# ---------- 7. FOOTER ----------
d1, d2 = st.columns([5, 1])
with d1:
    st.caption(f"Showing {len(filt):,} of {len(raw):,} dataset records - Source file: {path.name}")
with d2:
    st.download_button("Download CSV", data=filt.to_csv(index=False).encode("utf-8-sig"), file_name="iris_filtered_dataset.csv", mime="text/csv", width="stretch")
st.markdown('<div class="footer">IRIS STUDIO - DATHEON TASK 01 - INTERACTIVE DATA ANALYTICS</div>', unsafe_allow_html=True)
