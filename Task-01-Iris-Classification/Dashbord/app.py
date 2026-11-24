"""Iris Intelligence Studio — single-file Streamlit application.
Run: streamlit run app.py
Place this file in Task-01-Iris-Classification or its Dashbord/ subfolder.
"""
from pathlib import Path
from datetime import datetime, timezone
import json, sqlite3, warnings, re
import joblib
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px

warnings.filterwarnings('ignore')
st.set_page_config(page_title='Iris Intelligence Studio', page_icon='🌿', layout='wide', initial_sidebar_state='collapsed')

FEATURES = ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']
TARGET = 'species'
SPECIES = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica']
PAGES = ['Overview', 'Data Explorer', 'EDA Analytics', 'Model Performance', 'Live Prediction', 'Batch Prediction', 'Prediction History']

# Resolve project root even when app.py is inside Task-01-Iris-Classification/Dashbord/.
def locate_project_root():
    here = Path(__file__).resolve().parent
    candidates = [here, *here.parents]
    for candidate in candidates:
        if (candidate / 'outputs' / 'models').is_dir() or (candidate / 'data').is_dir():
            return candidate
    return here

ROOT = locate_project_root()
OUTPUTS = ROOT / 'outputs'
MODELS_DIR = OUTPUTS / 'models'
REPORTS_DIR = OUTPUTS / 'reports'
DB_PATH = OUTPUTS / 'prediction_history.db'
OUTPUTS.mkdir(exist_ok=True)

st.markdown(r"""<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{--ink:#17251f;--muted:#75847b;--line:rgba(219,231,222,.82);--green:#1d6549}
*{font-family:'DM Sans',sans-serif}
.stApp{background:radial-gradient(ellipse at 8% 5%,#e7f2e9 0,transparent 33%),radial-gradient(ellipse at 95% 18%,#e8f1ed 0,transparent 28%),linear-gradient(135deg,#f8faf7,#f1f6f1 52%,#f7f9f6);color:var(--ink)}
.block-container{max-width:1500px;padding-top:1.05rem;padding-bottom:3.4rem}
[data-testid="stSidebar"],[data-testid="collapsedControl"]{display:none!important}
header[data-testid="stHeader"]{background:transparent}
.topline{display:flex;justify-content:space-between;align-items:center;padding:5px 2px 17px;border-bottom:1px solid var(--line);margin-bottom:19px}
.brand{font:800 18px Manrope,sans-serif;color:#193d2e}.brand small{display:block;font:700 9px 'DM Sans';letter-spacing:2.3px;color:#82968a;margin-top:4px}
.eyebrow{font-size:10px;letter-spacing:2px;font-weight:700;color:#71917e;text-transform:uppercase}
.status{font-size:11px;color:#526b5d;padding:8px 12px;border:1px solid #d5e4d8;border-radius:30px;background:#ffffffb8;backdrop-filter:blur(12px);box-shadow:0 5px 18px #234b3210}
.hero{position:relative;overflow:hidden;display:grid;grid-template-columns:1.45fr .8fr;align-items:center;gap:24px;background:linear-gradient(115deg,#133729f7,#255b42f0);padding:32px 36px;border-radius:27px;color:white;margin:12px 0 27px;box-shadow:0 22px 55px #18432f2b;isolation:isolate}
.hero:before{content:"";position:absolute;width:460px;height:460px;border:1px solid #ffffff18;border-radius:50%;right:9%;top:-310px;z-index:-1}
.hero-copy{position:relative;z-index:2}.hero h1{font:800 clamp(29px,3vw,42px) Manrope,sans-serif;line-height:1.1;margin:10px 0 11px;color:#fff;letter-spacing:-1.2px}.hero p{color:#d8e9de;font-size:14px;line-height:1.75;margin:0;max-width:670px}
.hero-art{height:205px;position:relative;display:flex;align-items:center;justify-content:center}
.hero-photo{width:230px;height:185px;object-fit:cover;border-radius:23px;border:1px solid #ffffff60;box-shadow:0 18px 40px #071b1280;transform:rotate(3deg);animation:photoFloat 6s ease-in-out infinite}
.orbit{position:absolute;width:270px;height:190px;border:1px solid #d9f0df55;border-radius:50%;transform:rotate(-24deg);animation:orbit 18s linear infinite}
.orbit:after{content:"";position:absolute;width:11px;height:11px;border-radius:50%;background:#d5efad;top:14px;left:36px;box-shadow:0 0 20px #d5efad}
.art-chip{position:absolute;right:2px;bottom:6px;padding:10px 13px;border:1px solid #ffffff55;border-radius:13px;background:#ffffff20;backdrop-filter:blur(16px);color:#fff;font-size:11px;box-shadow:0 10px 24px #071b1240;animation:chipFloat 4s ease-in-out infinite}
@keyframes photoFloat{0%,100%{transform:translateY(0) rotate(3deg)}50%{transform:translateY(-9px) rotate(1deg)}}
@keyframes chipFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes orbit{to{transform:rotate(336deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
.section-title{font:800 21px Manrope,sans-serif;color:#1c3529;margin:21px 0 4px;letter-spacing:-.35px}.section-sub{font-size:13px;color:var(--muted);margin-bottom:15px}
.metric{position:relative;overflow:hidden;background:#ffffffb8;backdrop-filter:blur(18px);border:1px solid #ffffffd9;border-radius:19px;padding:18px 20px;min-height:112px;box-shadow:0 9px 28px #1d39240b,inset 0 1px #fff;transition:transform .28s ease,box-shadow .28s ease;animation:fadeUp .55s ease both}
.metric:hover{transform:translateY(-5px);box-shadow:0 18px 34px #1d392416}.metric:after{content:"";position:absolute;width:90px;height:90px;border-radius:50%;right:-40px;top:-42px;background:#dceee1aa}
.metric .k{font-size:10px;letter-spacing:1.15px;font-weight:700;color:#819187;position:relative;z-index:1}.metric .v{font:800 28px Manrope,sans-serif;color:#1c4934;margin-top:8px;position:relative;z-index:1}.metric .n{font-size:11px;color:#89968e;margin-top:2px;position:relative;z-index:1}
.surface,.result{background:#ffffffb0;backdrop-filter:blur(18px);border:1px solid #ffffffd9;border-radius:21px;padding:22px;box-shadow:0 12px 32px #1d39240c,inset 0 1px #fff;animation:fadeUp .45s ease both}
.result{background:linear-gradient(135deg,#e9f6eddd,#ffffffb8);border-color:#cde5d3}.result-name{font:800 29px Manrope,sans-serif;color:#205b40}
div.stButton>button,div.stFormSubmitButton>button,.stDownloadButton button{border-radius:13px!important;font-weight:700!important;transition:all .22s ease!important;box-shadow:0 5px 14px #1c563510!important}
div.stButton>button[kind="primary"],div.stFormSubmitButton>button{background:linear-gradient(110deg,#1d6549,#2d805b)!important;color:white!important;border:1px solid #2a7655!important}
div.stButton>button:hover,div.stFormSubmitButton>button:hover,.stDownloadButton button:hover{transform:translateY(-2px);box-shadow:0 10px 22px #1c563526!important;filter:brightness(1.035)}
div.stButton>button:active,div.stFormSubmitButton>button:active{transform:translateY(0) scale(.985)}
.stDownloadButton button{background:#ffffffc9!important;border:1px solid #dce8de!important;color:#28563e!important}
[data-testid="stRadio"]>div{gap:7px;flex-wrap:wrap}[data-testid="stRadio"] label{background:#ffffff9c;border:1px solid #e0e9e2;border-radius:30px;padding:8px 14px!important;font-size:12px!important;transition:all .2s ease;backdrop-filter:blur(10px)}
[data-testid="stRadio"] label:hover{border-color:#a9cbb4;transform:translateY(-1px)}[data-testid="stRadio"] label:has(input:checked){background:#e5f2e9;border-color:#9fc6ab;color:#205a40;box-shadow:0 4px 12px #1c563510}
.stTextInput input,.stNumberInput input,.stSelectbox div[data-baseweb="select"],.stMultiSelect div[data-baseweb="select"],.stFileUploader section{border-radius:12px!important}
div[data-testid="stForm"]{background:#ffffffad;backdrop-filter:blur(18px);border:1px solid #ffffffd9;border-radius:21px;padding:20px;box-shadow:0 12px 30px #1d39240c}
div[data-testid="stPlotlyChart"]{background:#ffffff7a;border:1px solid #ffffffb8;border-radius:18px;padding:8px}\n[data-testid="stDataFrame"]{border:1px solid #e2ebe4;border-radius:16px;overflow:hidden}\n.stAlert{border-radius:14px}
hr{border-color:var(--line)}footer{visibility:hidden}
@media(max-width:850px){.hero{grid-template-columns:1fr;padding:26px}.hero-art{height:145px}.hero-photo{width:170px;height:130px}.orbit{width:210px;height:140px}.art-chip{right:8%}.topline{align-items:flex-start;gap:12px}.eyebrow{text-align:right}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>""", unsafe_allow_html=True)

# Search for artifacts under the project root; supports common naming variants.
def find_model():
    preferred = [MODELS_DIR/'iris_best_classifier.joblib', MODELS_DIR/'iris_best_classifier_src.joblib']
    for p in preferred:
        if p.is_file(): return p
    if MODELS_DIR.is_dir():
        candidates = sorted(MODELS_DIR.glob('*.joblib'))
        # Prefer tuned estimators over baseline files if the expected best artifact is absent.
        tuned = [p for p in candidates if 'tuned' in p.stem.lower()]
        return tuned[0] if tuned else (candidates[0] if candidates else None)
    return None

@st.cache_resource(show_spinner='Loading saved classifier…')
def load_model(path, modified):
    obj = joblib.load(path)
    if not hasattr(obj, 'predict'):
        raise TypeError('Saved artifact does not expose a predict() method.')
    return obj


def find_dataset():
    processed = ROOT/'data'/'processed'
    raw = ROOT/'data'/'raw'
    candidates = [processed/'iris_cleaned.csv', raw/'iris.data', raw/'iris.csv', ROOT/'iris.csv']
    for p in candidates:
        if p.is_file(): return p
    # Accept a clearly named Iris CSV if the user's file uses a slightly different name.
    for folder in [processed, raw]:
        if folder.is_dir():
            matches = sorted([*folder.glob('*iris*.csv'), *folder.glob('*iris*.data')])
            if matches: return matches[0]
    return None

@st.cache_data(show_spinner='Loading Iris dataset…')
def load_dataset(path, modified):
    p = Path(path)
    if p.suffix.lower() == '.data':
        df = pd.read_csv(p, header=None, names=FEATURES+[TARGET], na_values=['', '?', 'NA', 'NaN'])
    else:
        df = pd.read_csv(p)
    # Normalize common Iris column variants, including the project's *_cm names.
    # Examples: sepal_length_cm, Sepal Length (cm), sepallength -> sepal_length.
    normalized = []
    for column in df.columns:
        name = str(column).strip().lower()
        name = re.sub(r'\(cm\)', '', name)
        name = re.sub(r'[^a-z0-9]+', '_', name).strip('_')
        name = re.sub(r'_+', '_', name)
        if name.endswith('_cm'):
            name = name[:-3]
        normalized.append(name)
    df.columns = normalized
    aliases = {
        'sepallength': 'sepal_length',
        'sepalwidth': 'sepal_width',
        'petallength': 'petal_length',
        'petalwidth': 'petal_width',
        'class': 'species',
        'variety': 'species',
        'iris_species': 'species',
    }
    df = df.rename(columns={c: aliases.get(c, c) for c in df.columns})
    if not set(FEATURES+[TARGET]).issubset(df.columns):
        raise ValueError(f"Dataset schema mismatch. Expected {FEATURES+[TARGET]}; found {df.columns.tolist()}")
    df = df[FEATURES+[TARGET]].copy()
    for c in FEATURES: df[c] = pd.to_numeric(df[c], errors='coerce')
    df[TARGET] = df[TARGET].astype('string').str.strip()
    return df


def init_db():
    with sqlite3.connect(DB_PATH) as con:
        con.execute('''CREATE TABLE IF NOT EXISTS predictions(
        id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL,
        sepal_length REAL NOT NULL,sepal_width REAL NOT NULL,petal_length REAL NOT NULL,petal_width REAL NOT NULL,
        predicted_species TEXT NOT NULL,probabilities_json TEXT)''')


def save_prediction(values, label, probs):
    init_db()
    with sqlite3.connect(DB_PATH) as con:
        con.execute('INSERT INTO predictions(created_at,sepal_length,sepal_width,petal_length,petal_width,predicted_species,probabilities_json) VALUES(?,?,?,?,?,?,?)',
        (datetime.now(timezone.utc).astimezone().isoformat(timespec='seconds'),*[float(values[x]) for x in FEATURES],str(label),json.dumps(probs)))


def read_history():
    init_db()
    with sqlite3.connect(DB_PATH) as con: return pd.read_sql_query('SELECT * FROM predictions ORDER BY id DESC',con)


def section(title, subtitle=None):
    st.markdown(f'<div class="section-title">{title}</div>',unsafe_allow_html=True)
    if subtitle: st.markdown(f'<div class="section-sub">{subtitle}</div>',unsafe_allow_html=True)


def metric(label,value,note=''):
    st.markdown(f'<div class="metric"><div class="k">{label}</div><div class="v">{value}</div><div class="n">{note}</div></div>',unsafe_allow_html=True)


def classes_of(clf):
    return [str(x) for x in getattr(clf,'classes_',SPECIES)]


def model_feature_names(clf):
    """Return the exact input feature names and order used when this artifact was fitted."""
    names = getattr(clf, "feature_names_in_", None)
    if names is not None:
        return [str(name) for name in names]
    steps = getattr(clf, "steps", None)
    if steps:
        names = getattr(steps[-1][1], "feature_names_in_", None)
        if names is not None:
            return [str(name) for name in names]
    return None


def adapt_features_for_model(clf, frame):
    """Map canonical Iris measurements to the model's original fitted schema."""
    canonical = frame.copy()
    canonical.columns = [
        re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", str(c).strip().lower())).strip("_")
        for c in canonical.columns
    ]
    aliases = {
        "sepal_length_cm": "sepal_length",
        "sepal_width_cm": "sepal_width",
        "petal_length_cm": "petal_length",
        "petal_width_cm": "petal_width",
    }
    canonical_by_base = {aliases.get(name, name): name for name in canonical.columns}
    expected = model_feature_names(clf)
    if not expected:
        return canonical[FEATURES]

    source_columns = []
    for expected_name in expected:
        base_name = aliases.get(expected_name, expected_name)
        source_name = canonical_by_base.get(base_name)
        if source_name is None:
            raise ValueError(
                f"Model expects features {expected}; unable to map '{expected_name}' "
                "to the supplied Iris measurements."
            )
        source_columns.append(source_name)

    adapted = canonical[source_columns].copy()
    adapted.columns = expected
    return adapted


def predict(clf, values):
    canonical = pd.DataFrame([[values[f] for f in FEATURES]], columns=FEATURES)
    X = adapt_features_for_model(clf, canonical)
    label = str(clf.predict(X)[0]); probs={}
    if hasattr(clf,'predict_proba'):
        probs={k:float(v) for k,v in zip(classes_of(clf),clf.predict_proba(X)[0])}
    return label,probs

# Load data/model independently so a missing dataset doesn't block inference.
model_path=find_model(); model=None; model_error=None
data_path=find_dataset(); data=None; data_error=None
if model_path:
    try: model=load_model(str(model_path),model_path.stat().st_mtime_ns)
    except Exception as exc: model_error=f'{type(exc).__name__}: {exc}'
if data_path:
    try: data=load_dataset(str(data_path),data_path.stat().st_mtime_ns)
    except Exception as exc: data_error=f'{type(exc).__name__}: {exc}'

# Top-level minimalist navigation — no sidebar.
st.markdown('<div class="topline"><div class="brand">🌿 IRIS STUDIO<small>MACHINE LEARNING WORKSPACE</small></div><div class="eyebrow">DATHEON · TASK 01&nbsp;&nbsp; / &nbsp;&nbsp; LOCAL ML</div></div>',unsafe_allow_html=True)
page=st.radio('Workspace',PAGES,horizontal=True,label_visibility='collapsed',key='top_navigation')
model_status='Model ready' if model else 'Model unavailable'
data_status='Dataset ready' if data is not None else 'Dataset unavailable'
st.markdown(f'<div style="display:flex;gap:8px;justify-content:flex-end;margin:0 0 12px"><span class="status">{"●" if model else "○"} {model_status}</span><span class="status">{"●" if data is not None else "○"} {data_status}</span></div>',unsafe_allow_html=True)

st.markdown('''<div class="hero">
<div class="hero-copy"><div class="eyebrow" style="color:#b9d6c4">DATHEON · MACHINE LEARNING PROJECT</div>
<h1>Iris Intelligence Studio</h1><p>Explore flower measurements, review the classifiers trained in your project and generate predictions from new Iris observations.</p></div>
<div class="hero-art"><div class="orbit"></div><img class="hero-photo" src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85" alt="Botanical flower study"><div class="art-chip">✦ Botanical intelligence<br><b>4 features · 3 species</b></div></div>
</div>''',unsafe_allow_html=True)

# Diagnostics are concise and actionable, not fake "zero data" snapshots.
if not model:
    st.error('Saved classifier could not be loaded.' + (f' Details: {model_error}' if model_error else ''))
    st.caption(f'Project root detected: {ROOT} · Expected model folder: {MODELS_DIR}')
if data is None:
    st.warning('Iris dataset was not found or could not be read.' + (f' Details: {data_error}' if data_error else ''))
    st.caption(f'Expected: {ROOT / "data" / "processed" / "iris_cleaned.csv"} or {ROOT / "data" / "raw" / "iris.data"}')

if page=='Overview':
    section('Your workspace at a glance',
            'A live project snapshot — dataset health, classifier performance and recent prediction activity.')

    history = read_history()
    rows = len(data) if data is not None else 0
    class_count = int(data[TARGET].nunique()) if data is not None else 0
    missing_cells = int(data[FEATURES + [TARGET]].isna().sum().sum()) if data is not None else None
    duplicate_rows = int(data.duplicated().sum()) if data is not None else None

    # Read actual model comparison output when available; never invent performance values.
    comparison_path = REPORTS_DIR / 'baseline_model_comparison.csv'
    comparison = None
    best_row = None
    metric_columns = ['Accuracy', 'Precision Macro', 'Recall Macro', 'F1 Macro']
    if comparison_path.exists():
        try:
            comparison = pd.read_csv(comparison_path)
            score_col = next((c for c in ['F1 Macro', 'F1_macro', 'f1_macro'] if c in comparison.columns), None)
            if score_col and not comparison.empty:
                best_row = comparison.loc[comparison[score_col].astype(float).idxmax()]
        except Exception:
            comparison = None
            best_row = None

    k1, k2, k3, k4 = st.columns(4)
    with k1:
        metric('DATASET RECORDS', f'{rows:,}' if data is not None else '—',
               'Verified rows loaded' if data is not None else 'Dataset unavailable')
    with k2:
        metric('SPECIES CLASSES', f'{class_count:02d}' if data is not None else '—',
               'Distinct target labels' if data is not None else 'Waiting for dataset')
    with k3:
        metric('DATA QUALITY', f'{missing_cells:,} missing' if data is not None else '—',
               f'{duplicate_rows:,} duplicate rows' if data is not None else 'Not evaluated')
    with k4:
        metric('PREDICTIONS MADE', f'{len(history):,}',
               'Saved in local prediction history')

    st.markdown('<div style="height:8px"></div>', unsafe_allow_html=True)
    left, right = st.columns([1.25, 0.9], gap='large')

    with left:
        section('Species composition', 'How the labeled observations are distributed across Iris classes.')
        if data is not None and not data.empty:
            counts = data[TARGET].dropna().value_counts().rename_axis('Species').reset_index(name='Records')
            fig = px.bar(counts, x='Species', y='Records', color='Species', text='Records',
                         template='plotly_white', color_discrete_sequence=['#397b5b', '#83ad91', '#b8d4bd'])
            fig.update_traces(textposition='outside', marker_line_width=0)
            fig.update_layout(showlegend=False, height=310, margin=dict(l=12, r=12, t=24, b=10),
                              paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
                              xaxis_title='', yaxis_title='Observations',
                              font=dict(family='DM Sans', color='#52665a'))
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info('Species distribution will appear when a valid Iris dataset is available.')

    with right:
        section('Model health', 'Status of the saved classifier used for inference.')
        st.markdown('<div class="surface">', unsafe_allow_html=True)
        if model is not None:
            st.markdown('<span class="eyebrow">ACTIVE CLASSIFIER</span>', unsafe_allow_html=True)
            st.markdown(f'<h3 style="font-family:Manrope;color:#205b40;margin:8px 0">{model_path.stem.replace("_", " ").title()}</h3>',
                        unsafe_allow_html=True)
            st.success('Model artifact loaded · prediction interface available')
            st.caption(f'Artifact: {model_path.name}')
            st.caption('Classes: ' + ', '.join(classes_of(model)))
        else:
            st.error('No usable model artifact is loaded.')
            st.caption(f'Expected model directory: {MODELS_DIR}')
        st.markdown('</div>', unsafe_allow_html=True)

        if best_row is not None:
            section('Top reported model', 'Best macro F1 from your saved baseline comparison.')
            model_name_col = next((c for c in ['Model', 'model', 'Classifier'] if c in comparison.columns), None)
            model_name = str(best_row[model_name_col]) if model_name_col else 'Best reported classifier'
            score = float(best_row[score_col])
            st.markdown(
                f'<div class="result"><div class="eyebrow">TOP REPORTED CLASSIFIER</div>'
                f'<div class="result-name" style="font-size:21px">{model_name}</div>'
                f'<div style="font:800 30px Manrope;color:#205b40;margin-top:8px">{score:.3f}</div>'
                f'<div style="font-size:11px;color:#718277">Macro F1 · from outputs/reports</div></div>',
                unsafe_allow_html=True
            )
        else:
            st.caption('Model comparison report not found. Open Model Performance to inspect available evaluation files.')

    # Compact feature snapshot from the actual loaded dataset.
    if data is not None:
        section('Measurement profile', 'Average measurements by species, calculated from the currently loaded dataset.')
        means = data.groupby(TARGET, dropna=True)[FEATURES].mean().reset_index()
        means_long = means.melt(id_vars=TARGET, var_name='Measurement', value_name='Mean (cm)')
        fig = px.bar(means_long, x='Measurement', y='Mean (cm)', color=TARGET, barmode='group',
                     template='plotly_white', color_discrete_sequence=['#397b5b', '#83ad91', '#b8d4bd'])
        fig.update_layout(height=330, margin=dict(l=10, r=10, t=20, b=10),
                          paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
                          font=dict(family='DM Sans', color='#52665a'))
        st.plotly_chart(fig, use_container_width=True)

    section('Recent prediction activity', 'The latest predictions saved by this local application.')
    if not history.empty:
        display_cols = ['created_at', 'predicted_species', 'sepal_length', 'sepal_width',
                        'petal_length', 'petal_width']
        display_cols = [c for c in display_cols if c in history.columns]
        st.dataframe(history[display_cols].head(6), use_container_width=True, hide_index=True)
        st.download_button('Export prediction history',
                           history.to_csv(index=False).encode('utf-8'),
                           'iris_prediction_history.csv', 'text/csv')
    else:
        st.markdown('<div class="surface"><b>No prediction activity yet</b>'
                    '<p style="color:#829087;margin:6px 0 0">Open Live Prediction, enter four flower measurements and generate your first result. '
                    'Your successful prediction will appear here automatically.</p></div>', unsafe_allow_html=True)

    st.caption('All overview figures are derived from the loaded dataset, saved model artifact and local reports. Missing sources are shown as unavailable rather than replaced with sample values.')

elif page=='Data Explorer':
    section('Data explorer','Inspect the exact dataset loaded by this application.')
    if data is not None:
        a,b,c=st.columns(3)
        with a: metric('ROWS',f'{len(data):,}')
        with b: metric('MISSING CELLS',f'{data.isna().sum().sum():,}')
        with c: metric('DUPLICATE ROWS',f'{data.duplicated().sum():,}')
        selected=st.multiselect('Species filter',sorted(data[TARGET].dropna().unique()),default=sorted(data[TARGET].dropna().unique()))
        filtered=data[data[TARGET].isin(selected)]
        st.dataframe(filtered,use_container_width=True,hide_index=True)
        st.download_button('Export filtered data',filtered.to_csv(index=False).encode(), 'iris_filtered.csv','text/csv')
        feature=st.selectbox('Feature distribution',FEATURES)
        st.plotly_chart(px.histogram(filtered,x=feature,color=TARGET,marginal='box',barmode='overlay',template='plotly_white'),use_container_width=True)
        st.caption(f'Source: {data_path}')
    else: st.info('Dataset explorer is waiting for a valid Iris CSV or .data file.')

elif page=='EDA Analytics':
    section('Exploratory analytics','Feature relationships, class separation and measurement distributions.')
    if data is not None:
        a,b=st.columns(2)
        with a: st.plotly_chart(px.scatter(data,x='sepal_length',y='sepal_width',color=TARGET,hover_data=FEATURES,template='plotly_white',title='Sepal dimensions'),use_container_width=True)
        with b: st.plotly_chart(px.scatter(data,x='petal_length',y='petal_width',color=TARGET,hover_data=FEATURES,template='plotly_white',title='Petal dimensions'),use_container_width=True)
        st.plotly_chart(px.box(data.melt(id_vars=TARGET,value_vars=FEATURES,var_name='Feature',value_name='Measurement'),x='Feature',y='Measurement',color=TARGET,template='plotly_white',title='Feature distributions by species'),use_container_width=True)
        st.plotly_chart(px.imshow(data[FEATURES].corr(),text_auto='.2f',color_continuous_scale='RdBu_r',zmin=-1,zmax=1,title='Feature correlation'),use_container_width=True)
    else: st.info('EDA charts will appear when the Iris dataset is available.')

elif page=='Model Performance':
    section('Model performance','Evaluation tables generated by your model-training notebooks.')
    comparison=REPORTS_DIR/'baseline_model_comparison.csv'; cv=REPORTS_DIR/'cross_validation_results.csv'; tuned=REPORTS_DIR/'tuned_model_test_results.csv'
    if comparison.exists():
        comp=pd.read_csv(comparison); st.dataframe(comp,use_container_width=True,hide_index=True)
        numeric=[c for c in ['Accuracy','Precision Macro','Recall Macro','F1 Macro'] if c in comp.columns]
        if numeric:
            m=st.selectbox('Compare metric',numeric); namecol='Model' if 'Model' in comp.columns else comp.columns[0]
            st.plotly_chart(px.bar(comp.sort_values(m,ascending=False),x=namecol,y=m,color=namecol,template='plotly_white',title=f'Model comparison · {m}'),use_container_width=True)
    else: st.info('baseline_model_comparison.csv is not present in outputs/reports.')
    for title,path in [('Cross-validation results',cv),('Tuned model test results',tuned)]:
        if path.exists(): section(title); st.dataframe(pd.read_csv(path),use_container_width=True,hide_index=True)
    cms=sorted(REPORTS_DIR.glob('confusion_matrix_*.csv'))
    if cms:
        section('Confusion matrix'); cmfile=st.selectbox('Select classifier',cms,format_func=lambda p:p.stem.replace('confusion_matrix_','').replace('_',' ').title())
        st.plotly_chart(px.imshow(pd.read_csv(cmfile,index_col=0),text_auto=True,color_continuous_scale='Blues'),use_container_width=True)
    roc=REPORTS_DIR/'multiclass_roc_auc.csv'
    if roc.exists(): section('Multiclass ROC-AUC'); st.dataframe(pd.read_csv(roc),use_container_width=True,hide_index=True)

elif page=='Live Prediction':
    section('Live prediction','Enter four measurements. The app uses your saved Scikit-learn model without retraining.')
    if model:
        left,right=st.columns([1,1],gap='large')
        with left:
            with st.form('iris_predict_form'):
                st.markdown('#### Flower measurements')
                st.caption('All measurements are in centimetres.')
                x1,x2=st.columns(2)
                with x1: sl=st.number_input('Sepal length',.1,10.,5.1,.1); pl=st.number_input('Petal length',.1,10.,1.4,.1)
                with x2: sw=st.number_input('Sepal width',.1,10.,3.5,.1); pw=st.number_input('Petal width',.1,10.,.2,.1)
                submitted=st.form_submit_button('Generate prediction',type='primary',use_container_width=True)
        if submitted:
            values=dict(zip(FEATURES,[sl,sw,pl,pw]))
            try:
                label,probs=predict(model,values); save_prediction(values,label,probs)
                st.session_state['iris_last_result']={'label':label,'probs':probs,'values':values}
            except Exception as exc: st.error(f'Prediction failed: {type(exc).__name__}: {exc}')
        with right:
            result=st.session_state.get('iris_last_result')
            if result:
                st.markdown(f'<div class="result"><div class="eyebrow">PREDICTED SPECIES</div><div class="result-name">{result["label"]}</div><p style="color:#62786b;margin:5px 0 0">Prediction from the saved model artifact.</p></div>',unsafe_allow_html=True)
                if result['probs']:
                    pdf=pd.DataFrame({'Species':list(result['probs']),'Probability':list(result['probs'].values())}).sort_values('Probability')
                    st.plotly_chart(px.bar(pdf,x='Probability',y='Species',orientation='h',range_x=[0,1],text=pdf['Probability'].map(lambda v:f'{v:.1%}'),template='plotly_white',title='Class probability estimates'),use_container_width=True)
                st.download_button('Download result JSON',json.dumps(result,indent=2).encode(),'iris_prediction.json','application/json')
            else: st.markdown('<div class="surface"><b>Your prediction will appear here</b><p style="color:#829087">Submit the four measurements to run inference.</p></div>',unsafe_allow_html=True)
    else: st.error('A valid saved model is required before predictions can run.')

elif page=='Batch Prediction':
    section('Batch prediction','Upload a CSV of new flower measurements and download the classified results.')
    st.caption('Required columns: sepal_length, sepal_width, petal_length, petal_width')
    template=pd.DataFrame([[5.1,3.5,1.4,.2]],columns=FEATURES)
    st.download_button('Download CSV template',template.to_csv(index=False).encode(),'iris_prediction_template.csv','text/csv')
    upload=st.file_uploader('Choose measurement CSV',type=['csv'])
    if upload is not None:
        if not model: st.error('Saved model is unavailable.')
        else:
            try:
                batch=pd.read_csv(upload)
                normalized_batch = batch.copy()
                normalized_batch.columns = [
                    re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", str(c).strip().lower())).strip("_")
                    for c in normalized_batch.columns
                ]
                aliases = {
                    "sepal_length_cm": "sepal_length", "sepal_width_cm": "sepal_width",
                    "petal_length_cm": "petal_length", "petal_width_cm": "petal_width",
                }
                normalized_batch = normalized_batch.rename(columns={c: aliases.get(c, c) for c in normalized_batch.columns})
                missing=[c for c in FEATURES if c not in normalized_batch.columns]
                if missing: st.error(f'Missing measurement columns: {missing}. Plain names and *_cm names are supported.')
                else:
                    X=normalized_batch[FEATURES].apply(pd.to_numeric,errors='coerce')
                    if X.isna().any().any() or (X<=0).any().any(): st.error('CSV has missing, non-numeric or non-positive measurements.')
                    else:
                        model_X = adapt_features_for_model(model, X)
                        batch['predicted_species']=model.predict(model_X)
                        if hasattr(model,'predict_proba'):
                            probabilities = model.predict_proba(model_X)
                            for i,name in enumerate(classes_of(model)): batch[f'probability_{name}']=probabilities[:,i]
                        st.success(f'{len(batch):,} predictions generated.'); st.dataframe(batch,use_container_width=True,hide_index=True)
                        st.download_button('Download predictions CSV',batch.to_csv(index=False).encode(),'iris_batch_predictions.csv','text/csv')
            except Exception as exc: st.error(f'Could not process CSV: {type(exc).__name__}: {exc}')

elif page=='Prediction History':
    section('Prediction history','Predictions created in this local application.')
    history=read_history()
    if history.empty: st.info('No saved predictions yet. Use Live Prediction first.')
    else:
        a,b,c=st.columns(3)
        with a: metric('TOTAL PREDICTIONS',f'{len(history):,}')
        with b: metric('UNIQUE SPECIES',str(history.predicted_species.nunique()))
        with c: metric('LATEST RESULT',str(history.iloc[0].predicted_species))
        st.dataframe(history,use_container_width=True,hide_index=True)
        st.plotly_chart(px.histogram(history,x='predicted_species',color='predicted_species',template='plotly_white',title='Prediction counts by species'),use_container_width=True)
        st.download_button('Export history CSV',history.to_csv(index=False).encode(),'iris_prediction_history.csv','text/csv')
        if st.button('Clear prediction history'):
            with sqlite3.connect(DB_PATH) as con: con.execute('DELETE FROM predictions')
            st.rerun()

st.markdown('<hr><div style="text-align:center;color:#8a968e;font-size:10px;letter-spacing:1px;padding:8px">IRIS INTELLIGENCE STUDIO · DATHEON TASK 01 · LOCAL ML INFERENCE</div>',unsafe_allow_html=True)
