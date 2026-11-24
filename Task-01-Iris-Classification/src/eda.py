"""Generate static and interactive Iris EDA outputs."""
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
from .inspection import NUMERIC_FEATURES, inspect_dataset, descriptive_statistics

def run_eda(df, project_root):
    root = Path(project_root)
    figures = root / "outputs" / "figures"
    interactive = root / "outputs" / "interactive"
    reports = root / "outputs" / "reports"
    for folder in (figures, interactive, reports):
        folder.mkdir(parents=True, exist_ok=True)

    sns.set_theme(style="whitegrid", context="notebook")
    overview, quality = inspect_dataset(df)
    quality.to_csv(reports / "data_quality_report_src.csv")
    descriptive_statistics(df).to_csv(reports / "descriptive_statistics_src.csv")

    counts = df["species"].value_counts().rename_axis("species").reset_index(name="count")
    counts["percentage"] = counts["count"] / len(df) * 100
    counts.to_csv(reports / "species_distribution_src.csv", index=False)

    fig, ax = plt.subplots(figsize=(9, 5))
    sns.barplot(data=counts, x="species", y="count", hue="species", legend=False, ax=ax)
    ax.set(title="Iris Species Distribution", xlabel="Species", ylabel="Observations")
    fig.tight_layout()
    fig.savefig(figures / "species_distribution_src.png", dpi=300, bbox_inches="tight")
    plt.close(fig)

    fig, axes = plt.subplots(2, 2, figsize=(14, 9))
    for ax, feature in zip(axes.flat, NUMERIC_FEATURES):
        sns.histplot(data=df, x=feature, hue="species", kde=True,
                     element="step", common_norm=False, ax=ax)
        ax.set_title(feature.replace("_", " ").title())
    fig.tight_layout()
    fig.savefig(figures / "feature_distributions_src.png", dpi=300, bbox_inches="tight")
    plt.close(fig)

    fig, axes = plt.subplots(2, 2, figsize=(14, 9))
    for ax, feature in zip(axes.flat, NUMERIC_FEATURES):
        sns.boxplot(data=df, x="species", y=feature, hue="species", legend=False, ax=ax)
        ax.set_title(f"{feature.replace('_', ' ').title()} by species")
    fig.tight_layout()
    fig.savefig(figures / "boxplots_src.png", dpi=300, bbox_inches="tight")
    plt.close(fig)

    corr = df[NUMERIC_FEATURES].corr()
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(corr, annot=True, cmap="coolwarm", vmin=-1, vmax=1, ax=ax)
    ax.set_title("Iris Feature Correlation")
    fig.tight_layout()
    fig.savefig(figures / "correlation_heatmap_src.png", dpi=300, bbox_inches="tight")
    plt.close(fig)

    pair = sns.pairplot(df, vars=NUMERIC_FEATURES, hue="species", corner=True)
    pair.fig.suptitle("Iris Pairwise Feature Relationships", y=1.02)
    pair.savefig(figures / "pairplot_src.png", dpi=300, bbox_inches="tight")
    plt.close(pair.fig)

    means = df.groupby("species")[NUMERIC_FEATURES].mean().reset_index()
    chart = px.bar(means, x="species", y=NUMERIC_FEATURES, barmode="group",
                   title="Mean Measurements by Species", template="plotly_white")
    chart.write_html(interactive / "species_comparison_src.html")

    scatter = px.scatter(df, x="petal_length", y="petal_width", color="species",
                         hover_data=NUMERIC_FEATURES,
                         title="Petal Length vs Petal Width", template="plotly_white")
    scatter.write_html(interactive / "petal_relationship_src.html")

    return overview
