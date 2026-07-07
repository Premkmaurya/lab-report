import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';

export const TestMultiSelect = ({ tests, selectedTests, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const availableTests = useMemo(() => {
    return tests.filter(test => !selectedTests.some(st => st.testId === test._id));
  }, [tests, selectedTests]);

  const filteredTests = useMemo(() => {
    const searchLower = search.toLowerCase();
    return availableTests.filter(test => {
      const matchName = test.name.toLowerCase().includes(searchLower);
      const matchDept = (test.departmentId?.name || "General").toLowerCase().includes(searchLower);
      return matchName || matchDept;
    });
  }, [availableTests, search]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev < filteredTests.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredTests.length) {
        selectTest(filteredTests[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && search === '') {
      if (selectedTests.length > 0) {
        removeTest(selectedTests[selectedTests.length - 1].testId);
      }
    }
  };

  const selectTest = (test) => {
    onChange([...selectedTests, { testId: test._id, testName: test.name }]);
    setSearch('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTest = (testId) => {
    onChange(selectedTests.filter(t => t.testId !== testId));
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4 w-full">
      <div ref={wrapperRef} className="relative w-full">
        <div className="relative flex items-center bg-paper-white border border-cream-border rounded-inputs px-4 py-2.5 focus-within:border-electric-cobalt focus-within:ring-1 focus-within:ring-electric-cobalt transition-colors">
          <Search className="h-4 w-4 text-stone mr-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tests..."
            className="w-full bg-transparent border-none outline-none text-sm text-charcoal py-0.5"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="test-listbox"
            aria-autocomplete="list"
          />
        </div>
        
        {isOpen && (
          <ul id="test-listbox" role="listbox" className="absolute z-20 w-full mt-2 bg-paper-white border border-cream-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredTests.length > 0 ? (
              filteredTests.map((test, index) => {
                const totalPrice = test.subTests?.reduce((sum, st) => sum + (st.price || 0), 0) || 0;
                const deptName = test.departmentId?.name || "General";
                
                return (
                  <li
                    key={test._id}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    className={`px-4 py-3 cursor-pointer hover:bg-warm-canvas border-b border-cream-border/50 last:border-0 ${highlightedIndex === index ? 'bg-electric-cobalt/5' : ''}`}
                    onClick={() => selectTest(test)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center text-sm font-semibold text-charcoal">
                      <span className="mr-2">🧪</span> {test.name}
                    </div>
                    <div className="text-[11px] text-stone mt-1 ml-6">
                      {deptName} &bull; ₹{totalPrice}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-sm text-stone italic">No matching tests found.</li>
            )}
          </ul>
        )}
      </div>

      <div className="min-h-[40px] pt-1">
        {selectedTests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTests.map((test) => (
              <span
                key={test.testId}
                className="inline-flex items-center px-3 py-1.5 bg-warm-canvas border border-cream-border rounded-full text-xs font-semibold text-charcoal shadow-sm"
              >
                {test.testName}
                <button
                  type="button"
                  onClick={() => removeTest(test.testId)}
                  className="ml-2 text-stone hover:text-red-500 transition-colors focus:outline-none"
                  aria-label={`Remove ${test.testName}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone italic">No tests selected.</p>
        )}
      </div>
    </div>
  );
};

export default TestMultiSelect;
