import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected presentation rendering error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8FC] p-6 text-[#1E152A]">
          <div className="max-w-md rounded-2xl border border-[#E3DAF0] bg-white p-6 text-center shadow-sm">
            <h1 className="font-editorial text-2xl font-semibold text-[#1E152A]">
              Unable to Render Slide
            </h1>
            <p className="mt-2 text-sm text-[#5C4F6E]">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-[#4C1D95] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
            >
              Reload Presentation
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
