import React, { useCallback, useEffect, useState } from 'react';
import { SLIDES_META } from './data/slidesMeta';
import { OverviewModal } from './components/OverviewModal';
import { SlideArrowNavigation, TopNav } from './components/PresentationChrome';
import {
  buildPrintableHtml,
  PrintableDeck,
  PrintReportModal,
} from './components/PrintReportModal';
import {
  Slide01Cover,
  Slide02Task,
  Slide03Question,
  Slide04Pipeline,
} from './components/SlidesPart1';
import {
  Slide05Dataset,
  Slide06Vocabulary,
  Slide07Verification,
  Slide08Exploratory,
  Slide09Relationships,
  Slide10Part1Findings,
} from './components/SlidesPart2';
import {
  Slide11Preprocessing,
  Slide12LogisticRegression,
  Slide13DecisionTree,
  Slide14ModelComparison,
  Slide15EvaluationMetrics,
  Slide16ConfusionMatrix,
} from './components/SlidesPart3';
import {
  Slide17Findings,
  Slide18Limitations,
  Slide19Conclusion,
  Slide20ThankYou,
} from './components/SlidesPart4';
import { buildStandalonePresentationHtml } from './utils/exportStandaloneHtml';

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'err' } | null>(null);

  const showToast = useCallback((message: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ message, kind });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentSlide]);

  const goToSlide = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(SLIDES_META.length - 1, idx));
    setCurrentSlide(clamped);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(SLIDES_META.length - 1, prev + 1));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      showToast('Fullscreen permission denied by browser frame.', 'err');
    }
  }, [showToast]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (overviewOpen) setOverviewOpen(false);
        if (printModalOpen) setPrintModalOpen(false);
        return;
      }

      if (overviewOpen || printModalOpen) return;

      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(SLIDES_META.length - 1);
      } else if ((e.key === 'o' || e.key === 'O') && !e.metaKey && !e.ctrlKey) {
        setOverviewOpen(true);
      } else if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, goToSlide, overviewOpen, printModalOpen, toggleFullscreen]);

  const triggerNativePrint = useCallback(() => {
    try {
      window.print();
    } catch {
      showToast('Iframe blocked print dialog — download the Print-Ready HTML instead.', 'err');
    }
  }, [showToast]);

  const handleOpenPrint = useCallback(() => {
    setPrintModalOpen(true);
  }, []);

  const handleDownloadPrintable = () => {
    try {
      const html = buildPrintableHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'iris-classification-printable.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded print-ready HTML. Open locally and press Ctrl+P to save PDF.');
    } catch {
      showToast('Unable to download printable report.', 'err');
    }
  };

  const handleCopyHtml = async () => {
    try {
      const html = buildStandalonePresentationHtml();
      await navigator.clipboard.writeText(html);
      showToast('Standalone HTML copied to clipboard.');
    } catch {
      showToast('Clipboard blocked; use Save HTML instead.', 'err');
    }
  };

  const handleDownloadHtml = () => {
    try {
      const html = buildStandalonePresentationHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'iris-classification-presentation.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded iris-classification-presentation.html');
    } catch {
      showToast('Unable to download standalone HTML.', 'err');
    }
  };

  const renderSlide = (idx: number) => {
    switch (idx) {
      case 0:
        return <Slide01Cover activeSlide={idx} onNext={handleNext} onJump={goToSlide} />;
      case 1:
        return <Slide02Task />;
      case 2:
        return <Slide03Question />;
      case 3:
        return <Slide04Pipeline />;
      case 4:
        return <Slide05Dataset active={currentSlide === 4} />;
      case 5:
        return <Slide06Vocabulary />;
      case 6:
        return <Slide07Verification />;
      case 7:
        return <Slide08Exploratory active={currentSlide === 7} />;
      case 8:
        return <Slide09Relationships active={currentSlide === 8} />;
      case 9:
        return <Slide10Part1Findings onNext={handleNext} />;
      case 10:
        return <Slide11Preprocessing />;
      case 11:
        return <Slide12LogisticRegression active={currentSlide === 11} />;
      case 12:
        return <Slide13DecisionTree active={currentSlide === 12} />;
      case 13:
        return <Slide14ModelComparison active={currentSlide === 13} />;
      case 14:
        return <Slide15EvaluationMetrics active={currentSlide === 14} />;
      case 15:
        return <Slide16ConfusionMatrix active={currentSlide === 15} />;
      case 16:
        return <Slide17Findings active={currentSlide === 16} />;
      case 17:
        return <Slide18Limitations />;
      case 18:
        return <Slide19Conclusion />;
      case 19:
        return (
          <Slide20ThankYou
            onRestart={() => goToSlide(0)}
            onPrint={handleOpenPrint}
            onCopyHtml={handleCopyHtml}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAF8FC] text-[#1E152A]">
      <TopNav
        currentSlide={currentSlide}
        totalSlides={SLIDES_META.length}
        isFullscreen={isFullscreen}
        onJump={goToSlide}
        onOpenOverview={() => setOverviewOpen(true)}
        onCopyHtml={handleCopyHtml}
        onDownloadHtml={handleDownloadHtml}
        onPrint={handleOpenPrint}
        onToggleFullscreen={toggleFullscreen}
      />

      <main className="screen-only-slide flex w-full flex-1 flex-col px-3 pt-3 pb-20 sm:px-5 md:px-[68px] md:py-3">
        <div key={currentSlide} className="animate-slide-reveal flex min-h-0 w-full flex-1 flex-col">
          {renderSlide(currentSlide)}
        </div>
      </main>

      <PrintableDeck />

      <SlideArrowNavigation
        currentSlide={currentSlide}
        totalSlides={SLIDES_META.length}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <OverviewModal
        open={overviewOpen}
        currentSlide={currentSlide}
        onSelectSlide={goToSlide}
        onClose={() => setOverviewOpen(false)}
      />

      <PrintReportModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        onNativePrint={triggerNativePrint}
        onDownloadPrintable={handleDownloadPrintable}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`no-print fixed bottom-16 right-5 z-50 rounded-lg border px-4 py-2.5 text-xs font-medium shadow-lg md:bottom-5 ${
            toast.kind === 'err'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-[#E3DAF0] bg-[#1E152A] text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
