const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    referredDoctor: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visitId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

patientSchema.pre("validate", async function (next) {
  if (!this.visitId) {
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 10) {
      const id = String(Math.floor(10000 + Math.random() * 90000));
      const existing = await mongoose.model("Patient").findOne({ visitId: id });
      if (!existing) {
        this.visitId = id;
        unique = true;
      }
      attempts++;
    }
    if (!unique) {
      // Fallback: use timestamp-based ID
      this.visitId = String(Date.now()).slice(-5);
    }
  }
  next();
});

patientSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
patientSchema.index({ date: -1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ visitId: 1 });

const patientModel = mongoose.model("Patient", patientSchema);

module.exports = patientModel;
