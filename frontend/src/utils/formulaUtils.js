/**
 * formulaUtils.js
 *
 * Utility functions for the unlimited formula builder.
 *
 * Token types:
 *   { type: "constant",  value: <number> }
 *   { type: "parameter", parameterId: <string>, parameterName: <string> }
 *   { type: "operator",  value: "+" | "-" | "*" | "/" }
 *
 * A valid token array always follows the pattern:
 *   operand (operator operand)*
 * e.g., [operand, operator, operand, operator, operand, ...]
 */

// ─── Migration ────────────────────────────────────────────────────────────────

/**
 * Converts the old 3-field formula structure into a token array.
 * If `formula.tokens` already exists and has entries, it is returned as-is.
 * If the formula is null/undefined an empty token array is returned.
 *
 * @param {Object|null} formula
 * @returns {Array} token array
 */
export function migrateFormula(formula) {
  if (!formula) return [];

  // Already migrated
  if (Array.isArray(formula.tokens) && formula.tokens.length > 0) {
    return formula.tokens;
  }

  // Old format: leftType / operator / rightType
  const tokens = [];

  // Left operand
  if (formula.leftType === 'constant') {
    const v = parseFloat(formula.leftConstant);
    if (!isNaN(v)) tokens.push({ type: 'constant', value: v });
  } else if (formula.leftParameterId) {
    tokens.push({
      type: 'parameter',
      parameterId: formula.leftParameterId,
      parameterName: formula.leftParameterName || '',
    });
  }

  // Operator
  if (formula.operator && tokens.length === 1) {
    tokens.push({ type: 'operator', value: formula.operator });
  }

  // Right operand
  if (formula.rightType === 'constant') {
    const v = parseFloat(formula.rightConstant);
    if (!isNaN(v)) tokens.push({ type: 'constant', value: v });
  } else if (formula.rightParameterId) {
    tokens.push({
      type: 'parameter',
      parameterId: formula.rightParameterId,
      parameterName: formula.rightParameterName || '',
    });
  }

  // Require at least operand + operator + operand
  return tokens.length >= 3 ? tokens : [];
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a token array.
 * Returns an array of error strings. Empty array means valid.
 *
 * @param {Array} tokens
 * @returns {string[]}
 */
export function validateTokens(tokens) {
  const errors = [];

  if (!Array.isArray(tokens) || tokens.length === 0) {
    errors.push('Formula must have at least one operand.');
    return errors;
  }

  // Must start with an operand
  if (tokens[0].type === 'operator') {
    errors.push('Formula cannot start with an operator.');
  }

  // Must end with an operand
  if (tokens[tokens.length - 1].type === 'operator') {
    errors.push('Formula cannot end with an operator.');
  }

  tokens.forEach((token, i) => {
    if (token.type === 'operator') {
      // Two consecutive operators
      if (i + 1 < tokens.length && tokens[i + 1].type === 'operator') {
        errors.push(`Two consecutive operators at position ${i + 1}.`);
      }
    } else if (token.type === 'constant') {
      // Two consecutive operands
      if (i + 1 < tokens.length && tokens[i + 1].type !== 'operator') {
        errors.push(`Missing operator between operands at position ${i + 1}.`);
      }
      if (token.value === undefined || token.value === null || token.value === '' || isNaN(Number(token.value))) {
        errors.push(`Constant at position ${i + 1} is not a valid number.`);
      }
    } else if (token.type === 'parameter') {
      // Two consecutive operands
      if (i + 1 < tokens.length && tokens[i + 1].type !== 'operator') {
        errors.push(`Missing operator between operands at position ${i + 1}.`);
      }
      if (!token.parameterId) {
        errors.push(`Parameter at position ${i + 1} has no parameter selected.`);
      }
    } else {
      errors.push(`Unknown token type "${token.type}" at position ${i + 1}.`);
    }
  });

  return errors;
}

// ─── Preview builder ──────────────────────────────────────────────────────────

/**
 * Builds a human-readable formula preview string.
 *
 * @param {Array} tokens
 * @param {Function} [resolveParamName] – optional: (parameterId) => string
 * @returns {string}
 */
export function buildFormulaPreview(tokens, resolveParamName) {
  if (!Array.isArray(tokens) || tokens.length === 0) return '';

  return tokens.map((token) => {
    if (token.type === 'operator') return token.value;
    if (token.type === 'constant') {
      return token.value !== undefined && token.value !== null && token.value !== ''
        ? String(token.value)
        : '?';
    }
    if (token.type === 'parameter') {
      if (resolveParamName && token.parameterId) {
        return resolveParamName(token.parameterId) || token.parameterName || '?';
      }
      return token.parameterName || token.parameterId || '?';
    }
    return '?';
  }).join(' ');
}

// ─── Safe evaluator (shunting-yard + operator precedence) ─────────────────────

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

/**
 * Safely evaluates a token array to a numeric result.
 *
 * @param {Array} tokens – the token list
 * @param {Function} resolveParam – (parameterId) => number | null
 *   Return null if the parameter value is unavailable or non-numeric.
 * @returns {number|null} the result, or null on any error
 */
export function evaluateTokens(tokens, resolveParam) {
  if (!Array.isArray(tokens) || tokens.length === 0) return null;

  // Step 1: resolve each token to a number or operator
  const resolved = [];
  for (const token of tokens) {
    if (token.type === 'operator') {
      resolved.push({ kind: 'op', value: token.value });
    } else if (token.type === 'constant') {
      const n = parseFloat(token.value);
      if (isNaN(n)) return null;
      resolved.push({ kind: 'num', value: n });
    } else if (token.type === 'parameter') {
      if (!token.parameterId) return null;
      const n = resolveParam ? resolveParam(token.parameterId) : null;
      if (n === null || n === undefined || isNaN(Number(n))) return null;
      resolved.push({ kind: 'num', value: Number(n) });
    } else {
      return null;
    }
  }

  // Step 2: shunting-yard → postfix (RPN)
  const output = []; // number values
  const opStack = []; // operator strings

  const applyOp = () => {
    const op = opStack.pop();
    const b = output.pop();
    const a = output.pop();
    if (a === undefined || b === undefined) return null;
    switch (op) {
      case '+': output.push(a + b); break;
      case '-': output.push(a - b); break;
      case '*': output.push(a * b); break;
      case '/':
        if (b === 0) return null; // division by zero
        output.push(a / b);
        break;
      default: return null;
    }
    return true;
  };

  for (const item of resolved) {
    if (item.kind === 'num') {
      output.push(item.value);
    } else if (item.kind === 'op') {
      while (
        opStack.length > 0 &&
        PRECEDENCE[opStack[opStack.length - 1]] >= PRECEDENCE[item.value]
      ) {
        if (applyOp() === null) return null;
      }
      opStack.push(item.value);
    }
  }

  while (opStack.length > 0) {
    if (applyOp() === null) return null;
  }

  if (output.length !== 1 || typeof output[0] !== 'number' || isNaN(output[0])) {
    return null;
  }

  return Math.round(output[0] * 1000) / 1000;
}
