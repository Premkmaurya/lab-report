const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const tenantPlugin = require("../plugins/tenantPlugin");

const referenceRangeRuleSchema = new mongoose.Schema(
  {
    ageFrom: { type: Number, default: 0 },
    ageTo: { type: Number, default: 120 },
    ageUnit: { type: String, enum: ['Days', 'Months', 'Years'], default: 'Years' },
    gender: { type: String, enum: ['Male', 'Female', 'Any', 'Child'], default: 'Any' },
    referenceRange: { type: String, default: '' },
  },
  { _id: true }
);

const subTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['parameter', 'section', 'text_block'],
      default: 'parameter',
    },
    isListParameter: {
      type: Boolean,
      default: false,
    },
    isCalculated: {
      type: Boolean,
      default: false,
    },
    isTextBlock: {
      type: Boolean,
      default: false,
    },
    formula: {
      // ── New: unlimited token-based formula ────────────────────────────
      // Each token is one of:
      //   { type: "constant",  value: <number> }
      //   { type: "parameter", parameterId: <string>, parameterName: <string> }
      //   { type: "operator",  value: "+" | "-" | "*" | "/" }
      tokens: { type: mongoose.Schema.Types.Mixed, default: [] },

      // ── Legacy: kept for backward compatibility with existing formulas ─
      leftParameterId: { type: String },
      leftConstant: { type: Number },
      leftType: { type: String, enum: ['parameter', 'constant'], default: 'parameter' },
      operator: { type: String, enum: ['+', '-', '*', '/'] },
      rightParameterId: { type: String },
      rightConstant: { type: Number },
      rightType: { type: String, enum: ['parameter', 'constant'], default: 'parameter' },
    },
    allowedValues: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: function() { return this.type === 'parameter'; },
      default: 0,
    },
    normalRange: {
      type: String,
      // optional: normal range may be omitted
    },
    referenceRanges: {
      type: [referenceRangeRuleSchema],
      default: [],
    },
    unit: {
      type: String,
      // optional: unit may be omitted
    },
    textBlockSettings: {
      defaultText: { type: String, default: "" },
      placeholder: { type: String, default: "" },
      rows: { type: Number, default: 3 },
    },
  },
  {
    timestamps: true,
    id: false,
  },
);

const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    subTests: [subTestSchema],
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBySystem: {
      type: Boolean,
      default: false,
    },
    sourceTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      default: null,
      index: true,
    },
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: function() { return !this.isGlobal; },
      default: null,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    importedVersion: {
      type: Number,
      default: null,
    },
    importedAt: {
      type: Date,
      default: null,
    },
    lastUpdatedFromGlobalAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

testSchema.plugin(tenantPlugin);
testSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
testSchema.index({ departmentId: 1 });
testSchema.index({ createdAt: -1 });
testSchema.index({ isGlobal: 1, departmentId: 1 });
testSchema.index({ laboratoryId: 1, sourceTestId: 1 });
testSchema.index({ laboratoryId: 1, departmentId: 1 });
testSchema.index({ laboratoryId: 1, createdAt: -1 });

const testModel = mongoose.model("Test", testSchema);

module.exports = testModel;
