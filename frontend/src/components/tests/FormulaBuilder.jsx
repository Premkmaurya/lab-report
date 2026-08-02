/**
 * FormulaBuilder.jsx
 *
 * Reusable unlimited formula builder component.
 *
 * Props:
 *   subTestIndex  {number}   – index of the owning sub-test (to exclude from parameter list)
 *   allSubTests   {Array}    – all sub-tests in the form (for parameter dropdown options)
 *   value         {Object}   – formula object: { tokens: [...], ...legacyFields }
 *   onChange      {Function} – called with the updated formula object on every change
 *   disabled      {boolean}  – read-only mode
 */
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { migrateFormula, buildFormulaPreview, validateTokens } from '../../utils/formulaUtils';

// ── Operator select between two operands ─────────────────────────────────────
const OperatorSelect = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`w-14 text-sm border border-cream-border rounded-inputs px-1 py-1.5 text-center focus:outline-none font-bold text-charcoal
      ${disabled ? 'bg-transparent text-stone border-transparent cursor-not-allowed' : 'hover:border-electric-cobalt focus:border-electric-cobalt bg-white'}`}
  >
    <option value="+">+</option>
    <option value="-">−</option>
    <option value="*">×</option>
    <option value="/">/</option>
  </select>
);

// ── Searchable parameter dropdown ─────────────────────────────────────────────
const ParameterDropdown = ({ value, onChange, options, disabled, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Populate search box with the name of the currently selected parameter
  useEffect(() => {
    if (!isOpen) {
      const matched = options.find((o) => o._id === value);
      setSearch(matched ? matched.name : '');
    }
  }, [value, options, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={search}
        disabled={disabled}
        placeholder="Search parameter…"
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          if (e.target.value === '') onChange('', '');
        }}
        onFocus={() => !disabled && setIsOpen(true)}
        className={`w-full text-sm border rounded-inputs px-2 py-1.5 focus:outline-none
          ${error ? 'border-red-400' : 'border-cream-border focus:border-electric-cobalt'}
          ${disabled ? 'bg-transparent text-stone border-transparent cursor-not-allowed' : 'bg-white'}`}
      />
      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-cream-border rounded shadow-lg max-h-36 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-stone italic">No parameters found</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o._id}
                className="px-2 py-1.5 text-sm hover:bg-warm-canvas cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o._id, o.name);
                  setSearch(o.name);
                  setIsOpen(false);
                }}
              >
                {o.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── Main FormulaBuilder component ─────────────────────────────────────────────
export const FormulaBuilder = ({
  subTestIndex,
  allSubTests = [],
  value,
  onChange,
  disabled = false,
}) => {
  // Derive the token array from the formula object, migrating old format on first render
  const [tokens, setTokens] = useState(() => migrateFormula(value));

  // Sync inbound value changes (e.g., form reset)
  useEffect(() => {
    const migrated = migrateFormula(value);
    setTokens(migrated);
  }, [value]);

  // Options available for parameter dropdowns
  const paramOptions = allSubTests.filter(
    (st, i) => i !== subTestIndex && st.name && st.type !== 'section'
  );

  // Emit updated formula object upward on every token change
  const emit = (newTokens) => {
    setTokens(newTokens);
    onChange?.({ ...(value || {}), tokens: newTokens });
  };

  // ── Token manipulation helpers ───────────────────────────────────────────
  const addOperand = () => {
    const next = [...tokens];
    if (next.length > 0) {
      // Insert an operator before the new operand
      next.push({ type: 'operator', value: '+' });
    }
    next.push({ type: 'parameter', parameterId: '', parameterName: '' });
    emit(next);
  };

  const removeOperand = (operandIndex) => {
    // operandIndex is the position of the operand in the token list
    const next = [...tokens];
    if (operandIndex === 0) {
      // First operand: remove it and the operator that follows (if any)
      next.splice(0, next.length > 1 ? 2 : 1);
    } else {
      // Other operands: remove the preceding operator + the operand
      next.splice(operandIndex - 1, 2);
    }
    emit(next);
  };

  const updateOperandType = (operandIndex, newType) => {
    const next = [...tokens];
    if (newType === 'constant') {
      next[operandIndex] = { type: 'constant', value: '' };
    } else {
      next[operandIndex] = { type: 'parameter', parameterId: '', parameterName: '' };
    }
    emit(next);
  };

  const updateConstantValue = (operandIndex, val) => {
    const next = [...tokens];
    next[operandIndex] = { ...next[operandIndex], value: val };
    emit(next);
  };

  const updateParameter = (operandIndex, parameterId, parameterName) => {
    const next = [...tokens];
    next[operandIndex] = { type: 'parameter', parameterId, parameterName };
    emit(next);
  };

  const updateOperator = (operatorIndex, val) => {
    const next = [...tokens];
    next[operatorIndex] = { type: 'operator', value: val };
    emit(next);
  };

  // Build operand positions list for rendering
  const operandIndices = tokens
    .map((t, i) => (t.type !== 'operator' ? i : null))
    .filter((i) => i !== null);

  const preview = buildFormulaPreview(tokens);
  const errors = disabled ? [] : validateTokens(tokens);
  const hasError = errors.length > 0;

  return (
    <div className="w-full space-y-0">
      {/* ── Token rows ───────────────────────────────────────────── */}
      {operandIndices.length === 0 ? (
        <div className="text-sm text-stone italic py-2">
          Click <span className="font-semibold text-electric-cobalt">+ Add Operand</span> to start building the formula.
        </div>
      ) : (
        operandIndices.map((tokenIdx, rowIdx) => {
          const token = tokens[tokenIdx];
          const prevOpIdx = tokenIdx - 1; // operator before this operand (if any)
          const isFirst = rowIdx === 0;
          const isParam = token.type === 'parameter';
          const isConst = token.type === 'constant';
          const constError = isConst && (token.value === '' || token.value === undefined || isNaN(Number(token.value)));
          const paramError = isParam && !token.parameterId;

          return (
            <div key={tokenIdx}>
              {/* Operator row (between operands) */}
              {!isFirst && prevOpIdx >= 0 && tokens[prevOpIdx]?.type === 'operator' && (
                <div className="flex items-center pl-2 py-1">
                  <div className="w-6 flex justify-center text-slate-300 text-xs select-none">│</div>
                  <OperatorSelect
                    value={tokens[prevOpIdx].value}
                    onChange={(val) => updateOperator(prevOpIdx, val)}
                    disabled={disabled}
                  />
                </div>
              )}

              {/* Operand row */}
              <div className="flex items-center gap-2">
                {/* Type toggle */}
                <div className={`flex rounded-inputs overflow-hidden border shrink-0 ${disabled ? 'border-transparent' : 'border-cream-border'}`}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateOperandType(tokenIdx, 'parameter')}
                    className={`px-2 py-1 text-[10px] font-semibold transition-colors whitespace-nowrap
                      ${isParam ? 'bg-electric-cobalt text-white' : 'bg-white text-stone hover:bg-warm-canvas'}
                      ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    Parameter
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateOperandType(tokenIdx, 'constant')}
                    className={`px-2 py-1 text-[10px] font-semibold border-l border-cream-border transition-colors whitespace-nowrap
                      ${isConst ? 'bg-electric-cobalt text-white' : 'bg-white text-stone hover:bg-warm-canvas'}
                      ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    Number
                  </button>
                </div>

                {/* Value input */}
                <div className="flex-1 min-w-0">
                  {isConst ? (
                    <input
                      type="number"
                      step="any"
                      disabled={disabled}
                      placeholder="Enter number"
                      value={token.value !== undefined && token.value !== null ? token.value : ''}
                      onChange={(e) => updateConstantValue(tokenIdx, e.target.value)}
                      className={`w-full text-sm border rounded-inputs px-2 py-1.5 focus:outline-none
                        ${constError ? 'border-red-400' : 'border-cream-border focus:border-electric-cobalt'}
                        ${disabled ? 'bg-transparent text-stone border-transparent cursor-not-allowed' : 'bg-white'}`}
                    />
                  ) : (
                    <ParameterDropdown
                      value={token.parameterId}
                      onChange={(id, name) => updateParameter(tokenIdx, id, name)}
                      options={paramOptions}
                      disabled={disabled}
                      error={paramError}
                    />
                  )}
                </div>

                {/* Delete button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeOperand(tokenIdx)}
                    className="shrink-0 text-stone hover:text-red-500 p-1 rounded transition-colors"
                    title="Remove operand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ── Add Operand button ──────────────────────────────────── */}
      {!disabled && (
        <div className="pt-2">
          <button
            type="button"
            onClick={addOperand}
            className="inline-flex items-center gap-1 text-xs font-semibold text-electric-cobalt hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add Operand
          </button>
        </div>
      )}

      {/* ── Formula preview ─────────────────────────────────────── */}
      {preview && (
        <div className="mt-3 px-3 py-2 bg-slate-50 border border-cream-border rounded-inputs text-sm font-mono text-charcoal">
          <span className="text-[10px] text-stone uppercase font-semibold tracking-wider mr-2">Preview:</span>
          {preview}
        </div>
      )}

      {/* ── Validation errors ───────────────────────────────────── */}
      {!disabled && hasError && (
        <div className="mt-1 space-y-0.5">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-500">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormulaBuilder;
