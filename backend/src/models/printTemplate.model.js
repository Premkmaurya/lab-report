const mongoose = require("mongoose");
const tenantPlugin = require("../plugins/tenantPlugin");

const elementStyleSchema = new mongoose.Schema(
  {
    fontSize: {
      type: String,
      default: "",
    },
    fontWeight: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "",
    },
    textAlign: {
      type: String,
      default: "",
    },
    marginTop: {
      type: String,
      default: "",
    },
    marginBottom: {
      type: String,
      default: "",
    },
    textTransform: {
      type: String,
      default: "",
    },
    textDecoration: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const printTemplateSchema = new mongoose.Schema(
  {
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    page: {
      marginTop: {
        type: String,
        default: "15mm",
      },
      marginBottom: {
        type: String,
        default: "15mm",
      },
      marginLeft: {
        type: String,
        default: "15mm",
      },
      marginRight: {
        type: String,
        default: "15mm",
      },
      paperSize: {
        type: String,
        default: "A4",
      },
      orientation: {
        type: String,
        default: "portrait",
      },
    },
    typography: {
      baseFont: {
        type: String,
        default: "Times New Roman, serif",
      },
      lineHeight: {
        type: String,
        default: "1.5",
      },
    },
    elements: {
      testHeading: {
        type: elementStyleSchema,
        default: () => ({
          fontSize: "18px",
          fontWeight: "600",
          textAlign: "left",
          textTransform: "uppercase",
          textDecoration: "underline",
        }),
      },
      sectionHeader: {
        type: elementStyleSchema,
        default: () => ({
          fontSize: "16px",
          fontWeight: "700",
          textAlign: "left",
          textTransform: "uppercase",
          textDecoration: "none",
        }),
      },
      departmentHeading: {
        type: elementStyleSchema,
        default: () => ({
          fontSize: "25px",
          fontWeight: "700",
          textAlign: "center",
          textTransform: "uppercase",
          textDecoration: "underline",
        }),
      },
      barcode: {
        enabled: { type: Boolean, default: true },
        format: { type: String, default: "CODE128" },
        valueSource: { type: String, default: "visitId" },
        // Unscaled A4 CSS-pixel coordinates (794 x 1123).
        x: { type: Number, default: 620 },
        y: { type: Number, default: 30 },
        width: { type: Number, default: 2 },
        height: { type: Number, default: 50 },
        margin: { type: Number, default: 0 },
        marginTop: { type: Number, default: 8 },
        marginBottom: { type: Number, default: 0 },
        marginLeft: { type: Number, default: 0 },
        marginRight: { type: Number, default: 0 },
        alignment: { type: String, default: "right" },
        displayValue: { type: Boolean, default: true },
        fontSize: { type: Number, default: 12 },
        rotation: { type: Number, default: 0 },
        lineColor: { type: String, default: "#000000" },
        background: { type: String, default: "transparent" },
      },
      tableHeader: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "16px",
          fontWeight: "500",
          textAlign: "center",
          textTransform: "uppercase",
          textDecoration: "underline",
        }),
      },
      parameter: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "14px",
          fontWeight: "500",
          textAlign: "left",
          textTransform: "capitalize",
          textDecoration: "none",
        }),
      },
      result: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "14px",
          fontWeight: "400",
          textAlign: "center",
          textTransform: "uppercase",
          textDecoration: "none",
        }),
      },
      unit: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "14px",
          fontWeight: "400",
          textAlign: "center",
          textTransform: "capitalize",
          textDecoration: "none",
        }),
      },
      footer: {
        type: elementStyleSchema,
        default: () => ({ fontSize: "12px", fontWeight: "400" }),
      },
    },
    signatures: {
      technician: {
        name: {
          type: String,
          default: "Lab Technician",
        },
        designation: {
          type: String,
          default: "System Admin",
        },
        show: {
          type: Boolean,
          default: true,
        },
        signatureImage: {
          type: String,
          default: "",
        },
        showSignatureImage: {
          type: Boolean,
          default: false,
        },
      },
      pathologist: {
        name: {
          type: String,
          default: "",
        },
        designation: {
          type: String,
          default: "Pathologist",
        },
        qualification: {
          type: String,
          default: "",
        },
        registrationNumber: {
          type: String,
          default: "",
        },
        show: {
          type: Boolean,
          default: true,
        },
        signatureImage: {
          type: String,
          default: "",
        },
        showSignatureImage: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PrintTemplate", printTemplateSchema);
