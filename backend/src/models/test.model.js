const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const subTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    normalRange: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
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
    subTests: [subTestSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

testSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
testSchema.index({ departmentId: 1 });
testSchema.index({ createdAt: -1 });

const testModel = mongoose.model("Test", testSchema);

module.exports = testModel;
