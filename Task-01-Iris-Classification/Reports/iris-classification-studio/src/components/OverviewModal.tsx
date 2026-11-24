import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { PART_SECTIONS, SLIDES_META } from '../data/slidesMeta';

interface OverviewModalProps {
  open: boolean;
  currentSlide: number;
  onSelectSlide: (idx: number) => void;
  onClose: () => void;
}

export const OverviewModal: React.FC<OverviewModalProps> = ({
  open,
  currentSlide,
  onSelectSlide,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-[#1E152A]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Presentation Slide Index"
      onClick={onClose}
    >
      <div
        className="max-h-[88dvh] w-full max-w-5xl overscroll-contain overflow-y-auto rounded-2xl border border-[#E3DAF0] bg-[#FAF8FC] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-[#E3DAF0] pb-4">
          <div className="min-w-0">
            <h2 className="font-editorial text-2xl font-semibold text-[#1E152A]">
              Slide Overview (20 Slides)
            </h2>
            <p className="mt-1 text-sm text-[#5C4F6E]">
              Select any slide to navigate directly across the four analytical chapters.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close slide overview"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E3DAF0] bg-white text-[#1E152A] transition-colors hover:bg-[#F3EEF9] focus-visible:outline-2 focus-visible:outline-[#6D28D9]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-7">
          {PART_SECTIONS.map((part) => {
            const slides = SLIDES_META.filter((s) => s.part === part.id);
            return (
              <div key={part.id}>
                <h3 className="mb-3 text-sm font-semibold text-[#4C1D95]">
                  {part.label}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {slides.map((slide) => {
                    const isActive = slide.index === currentSlide;
                    return (
                      <button
                        key={slide.index}
                        type="button"
                        onClick={() => {
                          onSelectSlide(slide.index);
                          onClose();
                        }}
                        className={`flex min-w-0 flex-col items-start rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#6D28D9] ${
                          isActive
                            ? 'border-[#6D28D9] bg-[#F3EEF9] shadow-sm'
                            : 'border-[#E3DAF0] bg-white hover:border-[#6D28D9]/45 hover:bg-[#FAF8FC]'
                        }`}
                      >
                        <span className="font-mono-tabular text-xs font-medium text-[#6D28D9]">
                          Slide {slide.number}
                        </span>
                        <span className="mt-1 text-sm font-semibold text-[#1E152A]">
                          {slide.title}
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs text-[#5C4F6E]">
                          {slide.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
