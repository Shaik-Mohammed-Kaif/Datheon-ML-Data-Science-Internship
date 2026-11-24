# Iris Classification — Botanical Analytics & Interactive Presentation

An end-to-end data science study and 20-slide interactive presentation exploring how four floral measurements classify three Iris species (*Iris setosa*, *Iris versicolor*, and *Iris virginica*) using real statistical analysis and five supervised machine learning models.

## Project Structure

- `index.html`, `src/` — 20-slide interactive web presentation built with React, TypeScript, Tailwind CSS, and bundled Plotly.js visualizations.
- `data/iris_dataset.csv` — Canonical 150-observation Fisher (1936) / Anderson (1935) Iris dataset.
- `scripts/analyze_iris.py` — Executable Python pipeline computing descriptive statistics, ANOVA, Pearson correlations, 80/20 stratified train/test metrics, Decision Tree structure, and 5-fold cross-validation (`src/data/irisAnalysis.json`).
- `analysis/iris_analysis.ipynb` — Reproducible Jupyter notebook mirroring the analysis workflow.
- `reports/data_quality_report.md` & `reports/model_evaluation.md` — Detailed audit and evaluation reports.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Re-run the Python statistical & ML pipeline:
   ```bash
   python3 scripts/analyze_iris.py
   ```
3. Start the interactive presentation server on port 3000:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Interactive Presentation Shortcuts

- `←` / `→` or `PageUp` / `PageDown`: Navigate previous / next slide
- `Home` / `End`: Jump to Slide 01 / Slide 20
- `O`: Toggle 20-slide Overview index
- `F`: Toggle Fullscreen presentation mode
- Use **Copy HTML** or **Save HTML** in the top bar to export a standalone HTML report (uses Plotly CDN with an automatic offline fallback notice if disconnected).
