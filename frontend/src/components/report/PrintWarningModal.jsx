import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const PrintWarningModal = ({ onContinue, onCancel }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem('hidePrintWarning', 'true');
    }
    onContinue();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-paper-white rounded-cards max-w-md w-full shadow-2xl overflow-hidden">
        <div className="border-b border-cream-border p-6 flex items-center justify-between bg-warm-canvas">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-electric-cobalt" />
            <h2 className="text-lg font-semibold text-charcoal">Print Settings Required</h2>
          </div>
          <button onClick={onCancel} className="text-stone hover:text-charcoal transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 bg-paper-white">
          <p className="text-sm text-charcoal mb-6 leading-relaxed">
            For the best report output, <strong className="font-semibold text-electric-cobalt">disable 'Headers and Footers'</strong> in your browser print settings. This removes URLs, dates, and page numbers from the final document.
          </p>
          
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-cream-border text-electric-cobalt focus:ring-electric-cobalt cursor-pointer"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span className="text-sm text-stone group-hover:text-charcoal transition-colors">Don't show this warning again</span>
          </label>
        </div>
        
        <div className="bg-warm-canvas border-t border-cream-border p-5 flex justify-end space-x-3">
          <button 
            onClick={onCancel} 
            className="bg-paper-white border border-cream-border text-graphite font-medium py-2 px-5 rounded-buttons text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleContinue}
            className="bg-electric-cobalt text-paper-white font-medium py-2 px-6 rounded-buttons text-sm shadow-sm hover:bg-opacity-95 transition-all"
          >
            Continue Printing
          </button>
        </div>
      </div>
    </div>
  );
};
