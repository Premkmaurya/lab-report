const mongoose = require("mongoose");

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
    // Use a singleton approach by enforcing a specific field
    singletonIdentifier: {
      type: String,
      default: "DEFAULT",
      unique: true,
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
      patientName: {
        type: elementStyleSchema,
        default: () => ({
          fontSize: "16px",
          fontWeight: "600",
          textAlign: "left",
          textTransform: "capitalize",
          textDecoration: "none",
        }),
      },
      profileName: {
        type: elementStyleSchema,
        default: () => ({
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "left",
          textTransform: "capitalize",
          textDecoration: "none",
        }),
      },
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
      tableHeader: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "20px",
          fontWeight: "500",
          textAlign: "center",
          textTransform: "uppercase",
          textDecoration: "underline",
        }),
      },
      parameter: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "20px",
          fontWeight: "500",
          textAlign: "left",
          textTransform: "capitalize",
          textDecoration: "none",
        }),
      },
      result: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "20px",
          fontWeight: "400",
          textAlign: "center",
          textTransform: "uppercase",
          textDecoration: "none",
        }),
      },
      unit: {
        type: elementStyleSchema,
         default: () => ({
          fontSize: "20px",
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
