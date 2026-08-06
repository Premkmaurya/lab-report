/**
 * Test Feature Types & Definitions
 */

export const PARAMETER_TYPES = {
  PARAMETER: "parameter",
  SECTION: "section",
};

export const DEFAULT_SUBTEST = () => ({
  _id: "",
  name: "",
  type: "parameter",
  price: "",
  unit: "",
  normalRange: "",
  isListParameter: false,
  allowedValues: [],
  isCalculated: false,
  isTextBlock: false,
  formula: { tokens: [] },
  textBlockSettings: { defaultText: "" },
});
