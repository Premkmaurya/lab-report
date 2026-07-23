const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: "visitNumber",
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

counterSchema.index({ laboratoryId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Counter", counterSchema);
