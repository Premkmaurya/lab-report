const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const tenantPlugin = require("../plugins/tenantPlugin");

const patientSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      enum: ["Mr.", "Mrs.", "Miss", "Master", "Baby of", ""],
      default: "",
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
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
    registeredAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visitId: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

patientSchema.plugin(tenantPlugin);

patientSchema.pre("validate", async function () {
  if (!this.visitId) {
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 10) {
      const id = String(Math.floor(10000 + Math.random() * 90000));
      const existing = await mongoose.model("Patient").findOne({ visitId: id, laboratoryId: this.laboratoryId });
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
  
  if (this.firstName) {
    this.name = [this.title, this.firstName, this.lastName].filter(Boolean).join(" ");
  }
});

patientSchema.plugin(mongooseDelete, { overrideMethods: "all", deletedAt: true });
patientSchema.index(
  { visitId: 1, laboratoryId: 1 },
  { unique: true, partialFilterExpression: { visitId: { $type: "string" } } }
);
patientSchema.index({ date: -1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ laboratoryId: 1, createdAt: -1 });
patientSchema.index({ laboratoryId: 1, date: -1 });

const patientModel = mongoose.model("Patient", patientSchema);

module.exports = patientModel;
