import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Download, AlertTriangle } from 'lucide-react';

interface PlotlyChartProps {
  id: string;
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  className?: string;
  height?: number;
  exportFilename?: string;
  active?: boolean;
  fillHeight?: boolean;
  onCellClick?: (point: { x: unknown; y: unknown; z: unknown; pointIndex?: unknown }) => void;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  id,
  data,
  layout,
  config,
  className = '',
  height = 360,
  exportFilename,
  active = true,
  fillHeight = false,
  onCellClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const isRenderedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !active) return;

    let cancelled = false;
    let retryRafId: number | null = null;

    const mergedLayout: Partial<Plotly.Layout> = {
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(255,255,255,0.45)',
      font: {
        family: "'Plus Jakarta Sans', sans-serif",
        color: '#1E152A',
        size: 12,
      },
      margin: { t: 36, r: 20, b: 48, l: 54 },
      hoverlabel: {
        bgcolor: '#1E152A',
        bordercolor: '#6D28D9',
        font: {
          family: "'Plus Jakarta Sans', sans-serif",
          color: '#FAF8FC',
          size: 12,
        },
      },
      ...layout,
      xaxis: {
        automargin: true,
        ...layout?.xaxis,
      },
      yaxis: {
        automargin: true,
        ...layout?.yaxis,
      },
    };

    const mergedConfig: Partial<Plotly.Config> = {
      responsive: false,
      scrollZoom: false,
      displaylogo: false,
      displayModeBar: 'hover',
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d', 'toImage'],
      ...config,
    };

    const renderChart = async () => {
      try {
        if (!el || cancelled) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          retryRafId = requestAnimationFrame(() => {
            if (!cancelled) renderChart();
          });
          return;
        }
        lastSizeRef.current = { w: Math.round(rect.width), h: Math.round(rect.height) };
        await Plotly.react(el, data, mergedLayout, mergedConfig);
        if (!cancelled) {
          isRenderedRef.current = true;
          setError(null);
          setRendered(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Chart rendering failed');
        }
      }
    };

    const rafId = requestAnimationFrame(() => {
      renderChart();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (retryRafId !== null) cancelAnimationFrame(retryRafId);
    };
  }, [data, layout, config, active]);

  useEffect(() => {
    const el = containerRef.current;
    return () => {
      isRenderedRef.current = false;
      if (el) {
        try {
          Plotly.purge(el);
        } catch {
          // ignore purge error during teardown
        }
      }
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onCellClick || !rendered) return;

    const plotlyEl = el as HTMLDivElement & {
      on?: (event: string, cb: (ev: { points?: Array<{ x: unknown; y: unknown; z: unknown; pointIndex?: unknown }> }) => void) => void;
      removeAllListeners?: (event: string) => void;
    };

    const handler = (ev: { points?: Array<{ x: unknown; y: unknown; z: unknown; pointIndex?: unknown }> }) => {
      const pt = ev.points?.[0];
      if (pt) {
        onCellClick({ x: pt.x, y: pt.y, z: pt.z, pointIndex: pt.pointIndex });
      }
    };

    if (typeof plotlyEl.on === 'function') {
      plotlyEl.on('plotly_click', handler);
    }

    return () => {
      if (typeof plotlyEl.removeAllListeners === 'function') {
        plotlyEl.removeAllListeners('plotly_click');
      }
    };
  }, [onCellClick, rendered]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !rendered) return;

    let rafId: number | null = null;

    const scheduleResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!el || !isRenderedRef.current) return;
        const rect = el.getBoundingClientRect();
        const nextW = Math.round(rect.width);
        const nextH = Math.round(rect.height);
        if (nextW <= 0 || nextH <= 0) return;
        if (
          Math.abs(nextW - lastSizeRef.current.w) <= 1 &&
          Math.abs(nextH - lastSizeRef.current.h) <= 1
        ) {
          return;
        }
        lastSizeRef.current = { w: nextW, h: nextH };
        try {
          Plotly.Plots.resize(el);
        } catch {
          // ignore resize during teardown
        }
      });
    };

    const observer = new ResizeObserver(scheduleResize);
    observer.observe(el);
    window.addEventListener('resize', scheduleResize, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleResize);
    };
  }, [rendered]);

  const handleDownload = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      await Plotly.downloadImage(el, {
        format: 'png',
        width: 1200,
        height: 750,
        filename: exportFilename || id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export chart PNG');
    }
  };

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center ${className}`}
        style={{ minHeight: height }}
        role="alert"
      >
        <AlertTriangle className="mb-2 h-6 w-6 text-rose-700" />
        <p className="text-sm font-semibold text-rose-900">Visualization Error ({id})</p>
        <p className="mt-1 text-xs text-rose-700">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full min-w-0 ${
        fillHeight ? 'flex min-h-0 flex-1 flex-col' : ''
      } ${className}`}
    >
      {exportFilename && (
        <div className="no-print mb-1 flex shrink-0 justify-end">
          <button
            type="button"
            onClick={handleDownload}
            title="Download chart as PNG"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E3DAF0] bg-white px-2.5 py-1 text-xs font-medium text-[#4C1D95] transition-colors hover:bg-[#F3EEF9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Export PNG</span>
          </button>
        </div>
      )}
      <div
        id={id}
        ref={containerRef}
        className={`w-full ${fillHeight ? 'min-h-0 flex-1' : ''}`}
        style={
          fillHeight
            ? { minHeight: `${height}px`, touchAction: 'pan-y' }
            : { height: `${height}px`, minHeight: `${height}px`, touchAction: 'pan-y' }
        }
      />
    </div>
  );
};
