const mongoose = require("mongoose");

const parameterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
    },
    normalRange: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const testSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    parameters: [parameterSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const testModel = mongoose.model("Test", testSchema);

module.exports = testModel;
