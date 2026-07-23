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
    visitNumber: {
      type: Number,
      sparse: true,
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
  if (!this.visitId && this.laboratoryId) {
    const Laboratory = mongoose.model("Laboratory");
    const lab = await Laboratory.findById(this.laboratoryId).select("code");
    const labCode = lab && lab.code ? lab.code.toUpperCase().trim() : "LAB";

    if (!this.visitNumber) {
      const { getNextVisitNumber, formatVisitId } = require("../services/sequence.service");
      this.visitNumber = await getNextVisitNumber(this.laboratoryId);
      this.visitId = formatVisitId(labCode, this.visitNumber);
    } else {
      const { formatVisitId } = require("../services/sequence.service");
      this.visitId = formatVisitId(labCode, this.visitNumber);
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
patientSchema.index({ visitNumber: 1, laboratoryId: 1 });
patientSchema.index({ date: -1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ laboratoryId: 1, createdAt: -1 });
patientSchema.index({ laboratoryId: 1, date: -1 });

const patientModel = mongoose.model("Patient", patientSchema);

module.exports = patientModel;
