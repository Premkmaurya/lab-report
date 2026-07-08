const mongoose = require("mongoose");

const labDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    laboratoryDisplayName: {
      type: String,
      default: "",
    },
    letterheadAddressLine: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const labDetailsModel = mongoose.model("LabDetails", labDetailsSchema);

module.exports = labDetailsModel;