import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Building2, Check } from 'lucide-react';

export const LaboratorySelect = ({
  value,
  onChange,
  laboratories = [],
  error,
  required = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedLab = laboratories.find((lab) => lab._id === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const filteredLabs = laboratories.filter((lab) => {
    const term = searchTerm.toLowerCase();
    return (
      (lab.name && lab.name.toLowerCase().includes(term)) ||
      (lab.code && lab.code.toLowerCase().includes(term))
    );
  });

  const handleSelect = (lab) => {
    onChange(lab._id);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredLabs.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && filteredLabs[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filteredLabs[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
        Laboratory {required && <span className="text-red-500">*</span>}
      </label>

      {/* Select Box Trigger */}
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between bg-paper-white border ${
          error ? 'border-red-500' : 'border-cream-border'
        } rounded-inputs px-4 py-3 outline-none cursor-pointer text-sm font-medium transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-electric-cobalt/50'
        }`}
      >
        {selectedLab ? (
          <div className="flex items-center gap-2 text-charcoal font-semibold truncate">
            <Building2 className="w-4 h-4 text-electric-cobalt shrink-0" />
            <span className="truncate">{selectedLab.name}</span>
            <span className="font-mono text-xs text-stone bg-warm-canvas px-1.5 py-0.5 rounded">
              {selectedLab.code}
            </span>
          </div>
        ) : (
          <span className="text-stone flex items-center gap-2">
            <Search className="w-4 h-4 text-stone shrink-0" />
            Select Laboratory
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-stone shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-electric-cobalt' : ''
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-paper-white border border-cream-border rounded-cards shadow-xl max-h-72 overflow-hidden flex flex-col animate-fade-in">
          {/* Search Box */}
          <div className="p-2 border-b border-cream-border bg-warm-canvas/30 sticky top-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-stone" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search laboratory..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-paper-white border border-cream-border rounded-md outline-none focus:border-electric-cobalt text-charcoal"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 max-h-56 divide-y divide-cream-border/50">
            {filteredLabs.length > 0 ? (
              filteredLabs.map((lab, index) => {
                const isSelected = lab._id === value;
                const isHighlighted = highlightedIndex === index;
                return (
                  <div
                    key={lab._id}
                    onClick={() => handleSelect(lab)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-lavender-mist/60 text-electric-cobalt font-semibold'
                        : isHighlighted
                        ? 'bg-warm-canvas text-charcoal font-medium'
                        : 'text-graphite hover:bg-warm-canvas/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 shrink-0 text-stone" />
                      <span className="truncate">{lab.name}</span>
                      <span className="font-mono text-xs text-stone bg-warm-canvas px-1.5 py-0.5 rounded shrink-0">
                        {lab.code}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-electric-cobalt shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-xs text-center text-stone italic">
                No laboratory found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LaboratorySelect;
