import React, { useState, useRef, useEffect } from 'react';

export const DoctorAutocomplete = ({ value, onChange, doctors, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

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

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(search.toLowerCase())
  );

  const suggestions = [
    ...filteredDoctors.map(d => `Dr. ${d.name} (${d.qualification})`),
    'Self Referral'
  ].filter(s => s.toLowerCase().includes(search.toLowerCase()));

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    // If it's a doctor format "Dr. Name (Qual)", extract the "Name" part to match previous select behavior
    let selectedName = suggestion;
    if (suggestion.startsWith('Dr. ') && suggestion.includes(' (')) {
      selectedName = suggestion.substring(4, suggestion.lastIndexOf(' ('));
    }
    
    setSearch(selectedName);
    onChange(selectedName);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        placeholder="Type to search doctor..."
        className={`w-full bg-paper-white border ${error ? 'border-red-500' : 'border-cream-border'} rounded-inputs px-4 py-3 outline-none`}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
          onChange(e.target.value); 
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-paper-white border border-cream-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-warm-canvas ${highlightedIndex === index ? 'bg-electric-cobalt/10' : ''}`}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-stone italic">No doctor found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorAutocomplete;
