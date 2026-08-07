import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';

/**
 * CreatableResultSelect
 * A searchable, creatable combobox component for report parameters with "Convert To List".
 *
 * Features:
 * - Search existing allowed values (case-insensitive)
 * - Type a custom value and press Enter or click 'Create "value"'
 * - Full keyboard navigation (Arrow Up/Down, Enter, Escape, Tab)
 * - Custom values update report result ONLY without modifying Test Template in DB
 */
export const CreatableResultSelect = ({
  value = '',
  onChange,
  allowedValues = [],
  onKeyDown,
  onBlur,
  inputRef,
  placeholder = 'Select or type result...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const localInputRef = useRef(null);

  // Synchronize searchQuery with value prop changes when not focused or value changed externally
  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  // Clean, trim, and deduplicate allowedValues
  const cleanedAllowed = useMemo(() => {
    if (!Array.isArray(allowedValues)) return [];
    const seen = new Set();
    const result = [];
    allowedValues.forEach((val) => {
      if (val !== undefined && val !== null) {
        const trimmed = String(val).trim();
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          result.push(trimmed);
        }
      }
    });
    return result;
  }, [allowedValues]);

  // Prepend current saved custom value if not in allowedValues
  const allAvailableOptions = useMemo(() => {
    const options = [...cleanedAllowed];
    if (value && typeof value === 'string') {
      const trimmedVal = value.trim();
      if (trimmedVal && !options.some((opt) => opt.toLowerCase() === trimmedVal.toLowerCase())) {
        options.unshift(trimmedVal);
      }
    }
    return options;
  }, [cleanedAllowed, value]);

  // Filter options based on typed search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allAvailableOptions;
    return allAvailableOptions.filter((opt) => opt.toLowerCase().includes(q));
  }, [allAvailableOptions, searchQuery]);

  // Determine if exact match exists in available options
  const isExactMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return allAvailableOptions.some((opt) => opt.toLowerCase() === q);
  }, [allAvailableOptions, searchQuery]);

  const showCreateOption = searchQuery.trim().length > 0 && !isExactMatch;

  // Items list for dropdown rendering & keyboard navigation
  const dropdownItems = useMemo(() => {
    const items = filteredOptions.map((opt) => ({ type: 'option', value: opt, label: opt }));
    if (showCreateOption) {
      const customVal = searchQuery.trim();
      items.push({ type: 'create', value: customVal, label: `Create "${customVal}"` });
    }
    return items;
  }, [filteredOptions, showCreateOption, searchQuery]);

  // Reset highlighted index when dropdown items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [dropdownItems.length, searchQuery]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (itemValue) => {
    const trimmed = String(itemValue || '').trim();
    setSearchQuery(trimmed);
    setIsOpen(false);
    if (onChange) {
      onChange(trimmed);
    }
  };

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setSearchQuery(newText);
    setIsOpen(true);
    if (onChange) {
      onChange(newText);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (dropdownItems.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % dropdownItems.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else if (dropdownItems.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + dropdownItems.length) % dropdownItems.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      if (isOpen && dropdownItems.length > 0 && highlightedIndex >= 0 && highlightedIndex < dropdownItems.length) {
        e.preventDefault();
        e.stopPropagation();
        const selectedItem = dropdownItems[highlightedIndex];
        handleSelect(selectedItem.value);
        return;
      }
      // If dropdown closed, delegate to parent row navigation
      if (onKeyDown) {
        onKeyDown(e);
      }
      return;
    }

    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'Tab') {
      setIsOpen(false);
      if (onKeyDown) {
        onKeyDown(e);
      }
      return;
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-[140px]">
      <div className="relative flex items-center">
        <input
          ref={(e) => {
            localInputRef.current = e;
            if (typeof inputRef === 'function') {
              inputRef(e);
            } else if (inputRef) {
              inputRef.current = e;
            }
          }}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={
            className ||
            'w-full bg-white border border-electric-cobalt focus:border-ink-navy focus:ring-1 focus:ring-ink-navy rounded-inputs px-3 py-1.5 pr-8 text-sm font-medium text-charcoal transition-colors outline-none'
          }
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2 text-stone hover:text-charcoal focus:outline-none"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto bg-white border border-cream-border rounded-cards shadow-lg z-50 py-1 text-sm">
          {dropdownItems.length === 0 ? (
            <div className="px-3 py-2 text-stone text-xs italic">No matching options</div>
          ) : (
            dropdownItems.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              const isSelected = value && item.value.toLowerCase() === value.trim().toLowerCase();

              if (item.type === 'create') {
                return (
                  <div
                    key="create-option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item.value);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 text-electric-cobalt cursor-pointer font-semibold flex items-center space-x-2 border-t border-cream-border transition-colors ${
                      isHighlighted ? 'bg-electric-cobalt/10' : 'hover:bg-electric-cobalt/5'
                    }`}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>Create &quot;{item.value}&quot;</span>
                  </div>
                );
              }

              return (
                <div
                  key={item.value + '-' + index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item.value);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                    isHighlighted
                      ? 'bg-electric-cobalt/10 text-electric-cobalt font-semibold'
                      : 'text-charcoal hover:bg-warm-canvas'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-electric-cobalt shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CreatableResultSelect;
