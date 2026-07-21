const mongoose = require("mongoose");
const tenantPlugin = require("../plugins/tenantPlugin");

const labDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

labDetailsSchema.plugin(tenantPlugin);

const labDetailsModel = mongoose.model("LabDetails", labDetailsSchema);

module.exports = labDetailsModel;