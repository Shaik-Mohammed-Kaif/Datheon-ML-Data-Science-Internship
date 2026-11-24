import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Printer,
  LayoutGrid,
} from 'lucide-react';
import { SLIDES_META } from '../data/slidesMeta';

interface TopNavProps {
  currentSlide: number;
  totalSlides: number;
  isFullscreen: boolean;
  onJump: (idx: number) => void;
  onOpenOverview: () => void;
  onCopyHtml: () => void;
  onDownloadHtml: () => void;
  onPrint: () => void;
  onToggleFullscreen: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentSlide,
  totalSlides,
  isFullscreen,
  onJump,
  onOpenOverview,
  onCopyHtml,
  onDownloadHtml,
  onPrint,
  onToggleFullscreen,
}) => {
  const activeSlide = SLIDES_META[currentSlide];
  const progressPct = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <header className="no-print sticky top-0 z-30 shrink-0 border-b border-[#E3DAF0] bg-[#FAF8FC]/95 backdrop-blur-md">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-3 sm:px-5 md:px-[68px]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onJump(0)}
            className="font-editorial shrink-0 whitespace-nowrap text-base font-semibold tracking-tight text-[#1E152A] transition-colors hover:text-[#6D28D9] focus-visible:outline-2 focus-visible:outline-[#6D28D9] sm:text-lg"
          >
            Iris Classification
          </button>

          <span aria-hidden="true" className="hidden text-[#D6CEBE] sm:inline">
            ·
          </span>

          <div className="flex items-center gap-2">
            <span className="font-mono-tabular shrink-0 text-xs font-semibold text-[#4C1D95]">
              {activeSlide.number} / {String(totalSlides).padStart(2, '0')}
            </span>
            <select
              aria-label="Jump to slide"
              value={currentSlide}
              onChange={(e) => onJump(Number(e.target.value))}
              className="hidden max-w-[200px] truncate rounded-md border border-[#E3DAF0] bg-white px-2 py-1 text-xs font-medium text-[#1E152A] focus-visible:outline-2 focus-visible:outline-[#6D28D9] lg:block"
            >
              {SLIDES_META.map((s) => (
                <option key={s.index} value={s.index}>
                  {s.number}. {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onCopyHtml}
            title="Copy standalone HTML"
            aria-label="Copy HTML"
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E3DAF0] bg-white px-2.5 text-xs font-medium text-[#1E152A] transition-colors hover:bg-[#F3EEF9] focus-visible:outline-2 focus-visible:outline-[#6D28D9]"
          >
            <Copy className="h-3.5 w-3.5 text-[#6D28D9]" />
            <span className="hidden md:inline">Copy HTML</span>
          </button>

          <button
            type="button"
            onClick={onDownloadHtml}
            title="Save standalone HTML file"
            aria-label="Save HTML"
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E3DAF0] bg-white px-2.5 text-xs font-medium text-[#1E152A] transition-colors hover:bg-[#F3EEF9] focus-visible:outline-2 focus-visible:outline-[#6D28D9]"
          >
            <Download className="h-3.5 w-3.5 text-[#6D28D9]" />
            <span className="hidden md:inline">Save HTML</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            title="Print or save as PDF"
            aria-label="Print or save PDF"
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E3DAF0] bg-white px-2.5 text-xs font-medium text-[#1E152A] transition-colors hover:bg-[#F3EEF9] focus-visible:outline-2 focus-visible:outline-[#6D28D9]"
          >
            <Printer className="h-3.5 w-3.5 text-[#6D28D9]" />
            <span className="hidden lg:inline">Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E3DAF0] bg-white px-2.5 text-xs font-medium text-[#1E152A] transition-colors hover:bg-[#F3EEF9] focus-visible:outline-2 focus-visible:outline-[#6D28D9]"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-[#6D28D9]" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-[#6D28D9]" />
            )}
            <span className="hidden xl:inline">
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenOverview}
            aria-label="Open slide overview"
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#4C1D95] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#6D28D9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>
        </div>
      </div>

      <div className="h-[2px] w-full bg-[#E3DAF0]">
        <div
          className="h-full origin-left bg-[#6D28D9] transition-transform duration-200"
          style={{ transform: `scaleX(${progressPct / 100})` }}
        />
      </div>
    </header>
  );
};

interface SlideArrowNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
}

export const SlideArrowNavigation: React.FC<SlideArrowNavigationProps> = ({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
}) => {
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === totalSlides - 1;
  const activeSlide = SLIDES_META[currentSlide];

  return (
    <>
      {/* Desktop / Tablet centered side arrow controls */}
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        aria-label="Previous slide"
        title="Previous slide (Left Arrow)"
        className="no-print fixed left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E3DAF0] bg-white/95 text-[#1E152A] shadow-md transition-[colors,transform] duration-150 hover:scale-105 hover:border-[#6D28D9] hover:bg-[#4C1D95] hover:text-white disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-2 focus-visible:outline-[#6D28D9] md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={isLast}
        aria-label="Next slide"
        title="Next slide (Right Arrow)"
        className="no-print fixed right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E3DAF0] bg-white/95 text-[#1E152A] shadow-md transition-[colors,transform] duration-150 hover:scale-105 hover:border-[#6D28D9] hover:bg-[#4C1D95] hover:text-white disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-2 focus-visible:outline-[#6D28D9] md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Mobile bottom compact arrow bar (< md) */}
      <div className="no-print fixed bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#E3DAF0] bg-white/95 px-3 py-1.5 shadow-lg md:hidden">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous slide"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F3EEF9] text-[#4C1D95] transition-colors hover:bg-[#4C1D95] hover:text-white disabled:opacity-35"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="font-mono-tabular whitespace-nowrap px-1 text-xs font-semibold text-[#1E152A]">
          {activeSlide.number} / {String(totalSlides).padStart(2, '0')}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={isLast}
          aria-label="Next slide"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#4C1D95] text-white transition-colors hover:bg-[#6D28D9] disabled:opacity-35"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};
