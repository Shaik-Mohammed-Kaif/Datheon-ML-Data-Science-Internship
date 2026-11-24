import { FeatureKey, IrisObservation, SpeciesName } from '../types/iris';

export const FEATURE_META: Record<
  FeatureKey,
  { label: string; short: string; unit: string; description: string }
> = {
  sepal_length: {
    label: 'Sepal Length (cm)',
    short: 'Sepal Length',
    unit: 'cm',
    description: 'Outer protective leaf length measured from base to apex.',
  },
  sepal_width: {
    label: 'Sepal Width (cm)',
    short: 'Sepal Width',
    unit: 'cm',
    description: 'Maximum transverse breadth across the outer sepal blade.',
  },
  petal_length: {
    label: 'Petal Length (cm)',
    short: 'Petal Length',
    unit: 'cm',
    description: 'Inner colored petal length from receptacle to tip.',
  },
  petal_width: {
    label: 'Petal Width (cm)',
    short: 'Petal Width',
    unit: 'cm',
    description: 'Maximum width across the inner corolla petal.',
  },
};

export const SPECIES_META: Record<
  SpeciesName,
  { short: string; color: string; tint: string; border: string; note: string }
> = {
  'Iris-setosa': {
    short: 'Setosa',
    color: '#6D28D9',
    tint: 'rgba(109, 40, 217, 0.12)',
    border: 'rgba(109, 40, 217, 0.35)',
    note: 'Compact petals, widest average sepals; linearly separable.',
  },
  'Iris-versicolor': {
    short: 'Versicolor',
    color: '#0F766E',
    tint: 'rgba(15, 118, 110, 0.12)',
    border: 'rgba(15, 118, 110, 0.35)',
    note: 'Intermediate petal dimensions; shares boundary region with Virginica.',
  },
  'Iris-virginica': {
    short: 'Virginica',
    color: '#BE185D',
    tint: 'rgba(190, 24, 93, 0.12)',
    border: 'rgba(190, 24, 93, 0.35)',
    note: 'Largest overall sepal and petal length; broad petal width.',
  },
};

export const SPECIES_ORDER: SpeciesName[] = [
  'Iris-setosa',
  'Iris-versicolor',
  'Iris-virginica',
];

export const FEATURE_ORDER: FeatureKey[] = [
  'sepal_length',
  'sepal_width',
  'petal_length',
  'petal_width',
];

export function computeLinearRegression(
  xs: number[],
  ys: number[]
): { slope: number; intercept: number; r: number; r2: number } | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0) return null;
  const slope = num / denX;
  const intercept = my - slope * mx;
  const r = denY > 0 ? num / Math.sqrt(denX * denY) : 0;
  return { slope, intercept, r, r2: r * r };
}

export function computeGaussianKde(
  values: number[],
  points = 64
): { x: number[]; y: number[] } {
  if (values.length === 0) return { x: [], y: [] };
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
  const std = Math.sqrt(variance) || 0.25;
  // Silverman's rule of thumb bandwidth
  const bandwidth = Math.max(0.08, 1.06 * std * Math.pow(n, -0.2));
  const pad = bandwidth * 1.5;
  const start = min - pad;
  const end = max + pad;
  const step = (end - start) / (points - 1);
  const xs: number[] = [];
  const ys: number[] = [];
  const norm = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI));

  for (let i = 0; i < points; i++) {
    const x = start + i * step;
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const z = (x - values[j]) / bandwidth;
      sum += Math.exp(-0.5 * z * z);
    }
    xs.push(Number(x.toFixed(3)));
    ys.push(Number((norm * sum).toFixed(4)));
  }
  return { x: xs, y: ys };
}

export function filterObservations(
  rows: IrisObservation[],
  selectedSpecies: SpeciesName[]
): IrisObservation[] {
  return rows.filter((r) => selectedSpecies.includes(r.species));
}
