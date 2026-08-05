const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluateTokens, migrateFormula } = require("../../frontend/src/utils/formulaUtils");

test("Formula Engine Unit Test Suite", async (t) => {

  await t.test("1. Verify Serum Cholesterol - HDL - VLDL (200 - 50 - 30 = 120)", () => {
    const tokens = [
      { type: "parameter", parameterId: "p1", parameterName: "Serum Cholesterol" },
      { type: "operator", value: "-" },
      { type: "parameter", parameterId: "p2", parameterName: "HDL" },
      { type: "operator", value: "-" },
      { type: "parameter", parameterId: "p3", parameterName: "VLDL" }
    ];

    const values = {
      p1: 200,
      p2: 50,
      p3: 30
    };

    const resolver = (id, name) => values[id] !== undefined ? values[id] : values[name];
    const result = evaluateTokens(tokens, resolver);

    assert.strictEqual(result, 120, "200 - 50 - 30 must evaluate to 120");
  });

  await t.test("2. Verify 100 - 20 + 10 = 90", () => {
    const tokens = [
      { type: "constant", value: 100 },
      { type: "operator", value: "-" },
      { type: "constant", value: 20 },
      { type: "operator", value: "+" },
      { type: "constant", value: 10 }
    ];

    const result = evaluateTokens(tokens, () => null);
    assert.strictEqual(result, 90, "100 - 20 + 10 must evaluate to 90");
  });

  await t.test("3. Verify 10 + 20 + 30 = 60", () => {
    const tokens = [
      { type: "constant", value: 10 },
      { type: "operator", value: "+" },
      { type: "constant", value: 20 },
      { type: "operator", value: "+" },
      { type: "constant", value: 30 }
    ];

    const result = evaluateTokens(tokens, () => null);
    assert.strictEqual(result, 60, "10 + 20 + 30 must evaluate to 60");
  });

  await t.test("4. Verify 100 - 10 - 20 - 30 = 40", () => {
    const tokens = [
      { type: "constant", value: 100 },
      { type: "operator", value: "-" },
      { type: "constant", value: 10 },
      { type: "operator", value: "-" },
      { type: "constant", value: 20 },
      { type: "operator", value: "-" },
      { type: "constant", value: 30 }
    ];

    const result = evaluateTokens(tokens, () => null);
    assert.strictEqual(result, 40, "100 - 10 - 20 - 30 must evaluate to 40");
  });

  await t.test("5. Verify 100 + 20 * 2 = 140 (Operator Precedence)", () => {
    const tokens = [
      { type: "constant", value: 100 },
      { type: "operator", value: "+" },
      { type: "constant", value: 20 },
      { type: "operator", value: "*" },
      { type: "constant", value: 2 }
    ];

    const result = evaluateTokens(tokens, () => null);
    assert.strictEqual(result, 140, "100 + 20 * 2 must evaluate to 140");
  });

  await t.test("6. Verify Parameter Resolution by Name Fallback", () => {
    const tokens = [
      { type: "parameter", parameterId: "non_existent_id", parameterName: "Serum Cholesterol" },
      { type: "operator", value: "-" },
      { type: "parameter", parameterId: "", parameterName: "HDL" },
      { type: "operator", value: "-", parameterName: "" },
      { type: "parameter", parameterId: "", parameterName: "VLDL" }
    ];

    const reportValues = {
      "Serum Cholesterol": 200,
      "HDL": 50,
      "VLDL": 30
    };

    const resolver = (id, name) => reportValues[name] !== undefined ? reportValues[name] : reportValues[id];
    const result = evaluateTokens(tokens, resolver);

    assert.strictEqual(result, 120, "Should resolve by parameterName fallback when parameterId is missing or changed");
  });

  await t.test("7. Verify Stringified Token JSON Migration", () => {
    const stringifiedFormula = {
      tokens: JSON.stringify([
        { type: "constant", value: 50 },
        { type: "operator", value: "+" },
        { type: "constant", value: 50 }
      ])
    };

    const migrated = migrateFormula(stringifiedFormula);
    assert.strictEqual(migrated.length, 3);
    const result = evaluateTokens(migrated, () => null);
    assert.strictEqual(result, 100);
  });

});
