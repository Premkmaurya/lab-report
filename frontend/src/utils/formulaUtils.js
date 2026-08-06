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
 * Converts old or serialized formula structure into a valid token array.
 * If `formula.tokens` exists and has entries, it is returned as-is.
 * If the formula is null/undefined an empty token array is returned.
 *
 * @param {Object|string|null} formula
 * @returns {Array} token array
 */
export function migrateFormula(formula) {
  if (!formula) return [];

  let tokens = formula.tokens !== undefined ? formula.tokens : (Array.isArray(formula) ? formula : null);

  if (typeof tokens === 'string') {
    try {
      tokens = JSON.parse(tokens);
    } catch (e) {
      tokens = null;
    }
  }

  if (tokens && typeof tokens === 'object' && !Array.isArray(tokens)) {
    tokens = Object.values(tokens);
  }

  if (Array.isArray(tokens) && tokens.length > 0) {
    return tokens;
  }

  // Old format: leftType / operator / rightType
  const legacyTokens = [];

  // Left operand
  if (formula.leftType === 'constant') {
    const v = parseFloat(formula.leftConstant);
    if (!isNaN(v)) legacyTokens.push({ type: 'constant', value: v });
  } else if (formula.leftParameterId || formula.leftParameterName) {
    legacyTokens.push({
      type: 'parameter',
      parameterId: formula.leftParameterId || formula.leftParameterName,
      parameterName: formula.leftParameterName || formula.leftParameterId || '',
    });
  }

  // Operator
  if (formula.operator && legacyTokens.length === 1) {
    legacyTokens.push({ type: 'operator', value: formula.operator });
  }

  // Right operand
  if (formula.rightType === 'constant') {
    const v = parseFloat(formula.rightConstant);
    if (!isNaN(v)) legacyTokens.push({ type: 'constant', value: v });
  } else if (formula.rightParameterId || formula.rightParameterName) {
    legacyTokens.push({
      type: 'parameter',
      parameterId: formula.rightParameterId || formula.rightParameterName,
      parameterName: formula.rightParameterName || formula.rightParameterId || '',
    });
  }

  // Require at least operand + operator + operand
  return legacyTokens.length >= 3 ? legacyTokens : [];
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
      if (!token.parameterId && !token.parameterName) {
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
 * @param {Array} rawTokens – the token list or formula object
 * @param {Function} resolveParam – (parameterId, parameterName) => number | null
 *   Return null if the parameter value is unavailable or non-numeric.
 * @returns {number|null} the result, or null on any error
 */
export function evaluateTokens(rawTokens, resolveParam) {
  const tokens = migrateFormula(rawTokens);
  if (!Array.isArray(tokens) || tokens.length === 0) return null;

  const resolved = [];
  const resolvedLog = [];
  const expressionParts = [];

  // Step 1: Resolve ALL tokens in the expression
  for (const token of tokens) {
    if (token.type === 'operator') {
      resolved.push({ kind: 'op', value: token.value });
      resolvedLog.push({ operator: token.value });
      expressionParts.push(token.value);
    } else if (token.type === 'constant') {
      const n = parseFloat(token.value);
      if (isNaN(n)) return null;
      resolved.push({ kind: 'num', value: n });
      resolvedLog.push({ constant: token.value, value: n });
      expressionParts.push(String(n));
    } else if (token.type === 'parameter') {
      const paramId = token.parameterId || token.parameterName;
      const paramName = token.parameterName || token.parameterId;
      if (!paramId && !paramName) return null;

      let n = resolveParam ? resolveParam(paramId, paramName) : null;

      if (n === null || n === undefined || isNaN(Number(n))) {
        return null;
      }
      n = Number(n);
      resolved.push({ kind: 'num', value: n });
      resolvedLog.push({ parameter: paramName || paramId, value: n });
      expressionParts.push(String(n));
    } else {
      return null;
    }
  }

  // Step 2: Evaluate complete token array via Shunting-Yard (RPN)
  const output = []; // numeric stack
  const opStack = []; // operator stack

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

  const finalResult = Math.round(output[0] * 1000) / 1000;
  const finalExpression = expressionParts.join(' ');

  return Math.abs(finalResult);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    migrateFormula,
    validateTokens,
    buildFormulaPreview,
    evaluateTokens,
  };
}
