const mongoose = require("mongoose");

const elementStyleSchema = new mongoose.Schema({
  fontSize: { type: String, default: "" },
  fontWeight: { type: String, default: "" },
  color: { type: String, default: "" },
  textAlign: { type: String, default: "" },
  marginTop: { type: String, default: "" },
  marginBottom: { type: String, default: "" },
  textTransform: { type: String, default: "" },
  textDecoration: { type: String, default: "" }
}, { _id: false });

const printTemplateSchema = new mongoose.Schema({
  // Use a singleton approach by enforcing a specific field
  singletonIdentifier: { type: String, default: "DEFAULT", unique: true },
  
  page: {
    marginTop: { type: String, default: "15mm" },
    marginBottom: { type: String, default: "15mm" },
    marginLeft: { type: String, default: "15mm" },
    marginRight: { type: String, default: "15mm" },
    paperSize: { type: String, default: "A4" },
    orientation: { type: String, default: "portrait" },
  },
  typography: {
    baseFont: { type: String, default: "sans-serif" },
    baseFontSize: { type: String, default: "12px" },
    lineHeight: { type: String, default: "1.5" },
  },
  elements: {
    patientName: { type: elementStyleSchema, default: () => ({ fontSize: "12px", fontWeight: "600" }) },
    departmentHeading: { type: elementStyleSchema, default: () => ({ fontSize: "16px", fontWeight: "700", textAlign: "center", textTransform: "uppercase" }) },
    profileName: { type: elementStyleSchema, default: () => ({ fontSize: "14px", fontWeight: "700", textDecoration: "underline" }) },
    tableHeader: { type: elementStyleSchema, default: () => ({ fontSize: "12px", fontWeight: "600" }) },
    parameter: { type: elementStyleSchema, default: () => ({ fontSize: "12px", fontWeight: "400" }) },
    result: { type: elementStyleSchema, default: () => ({ fontSize: "12px", fontWeight: "400" }) },
    unit: { type: elementStyleSchema, default: () => ({ fontSize: "12px", fontWeight: "400", color: "#475569" }) },
    footer: { type: elementStyleSchema, default: () => ({ fontSize: "12px", fontWeight: "400" }) }
  }
}, { timestamps: true });

module.exports = mongoose.model("PrintTemplate", printTemplateSchema);
