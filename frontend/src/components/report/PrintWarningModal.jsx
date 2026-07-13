import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Monitor } from 'lucide-react';

/**
 * Detects the current browser and returns step-by-step instructions
 * for disabling headers and footers in its print dialog.
 */
const getBrowserInstructions = () => {
  const ua = (navigator.userAgent || '').toLowerCase();

  if (ua.includes('firefox')) {
    return {
      browser: 'Firefox',
      steps: [
        'Click "Continue Printing" below to open the print dialog.',
        'In the print dialog, click "More Settings" or the gear icon.',
        'Under "Options", uncheck "Print headers and footers".',
        'Click "Print" to finish.',
      ],
    };
  }

  if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) {
    return {
      browser: 'Safari',
      steps: [
        'Click "Continue Printing" below to open the print dialog.',
        'In the dialog, click "Show Details" if options are collapsed.',
        'Uncheck "Print headers and footers".',
        'Click "Print" to finish.',
      ],
    };
  }

  // Chrome / Edge / Chromium (default)
  return {
    browser: 'Chrome / Edge',
    steps: [
      'Click "Continue Printing" below — a new print window will open.',
      'In the print dialog, click "⚙ More settings".',
      'Scroll down and uncheck "Headers and footers".',
      'Click "Print" to print the clean report.',
    ],
  };
};

export const PrintWarningModal = ({ onContinue, onConfirm, onCancel }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const continueRef = useRef(null);
  const { browser, steps } = getBrowserInstructions();

  // Auto-focus the primary action so keyboard users can press Enter immediately
  useEffect(() => {
    continueRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem('hidePrintWarning', 'true');
    }
    if (typeof onContinue === 'function') {
      onContinue();
    } else if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-warning-title"
    >
      <div className="bg-paper-white rounded-cards max-w-lg w-full shadow-2xl overflow-hidden">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="border-b border-cream-border p-5 flex items-center justify-between bg-warm-canvas">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <h2
              id="print-warning-title"
              className="text-base font-semibold text-charcoal"
            >
              Before You Print — Action Required
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-stone hover:text-charcoal transition-colors p-1 rounded"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="p-6 bg-paper-white space-y-5">

          {/* Warning callout */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Disable Browser Headers &amp; Footers
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Your browser automatically adds its own date, page URL, and page numbers to
              every printed page. You must turn these off to get a clean lab report without
              unwanted annotations.
            </p>
          </div>

          {/* Browser-specific numbered steps */}
          <div>
            <p className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3 flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              Steps for {browser}
            </p>
            <ol className="space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-charcoal">
                  <span className="flex-shrink-0 w-5 h-5 bg-electric-cobalt text-white rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Don't show again */}
          <label className="flex items-center space-x-3 cursor-pointer group pt-3 border-t border-cream-border">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-cream-border text-electric-cobalt focus:ring-electric-cobalt cursor-pointer"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              id="dont-show-again"
            />
            <span
              htmlFor="dont-show-again"
              className="text-sm text-stone group-hover:text-charcoal transition-colors select-none"
            >
              Don't show this again
            </span>
          </label>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="bg-warm-canvas border-t border-cream-border p-4 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="bg-paper-white border border-cream-border text-graphite font-medium py-2 px-5 rounded-buttons text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            ref={continueRef}
            onClick={handleContinue}
            className="bg-electric-cobalt text-paper-white font-medium py-2 px-6 rounded-buttons text-sm shadow-sm hover:bg-opacity-95 transition-all focus:outline-none focus:ring-2 focus:ring-electric-cobalt focus:ring-offset-2"
          >
            Continue Printing
          </button>
        </div>
      </div>
    </div>
  );
};
