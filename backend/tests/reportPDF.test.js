const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const { generateReportPDF } = require("../src/services/reportVerification.service");

test("Report PDF Generation Unit Test", async (t) => {
  await t.test("PDFDocument font switching executes without throwing .bold() error", async () => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
    });

    // Test header font switching
    assert.doesNotThrow(() => {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A").text("TEST LAB", 40, 40);
      doc.fontSize(9).font("Helvetica").fillColor("#475569").text("123 Health St");
    });

    doc.end();

    const pdfBuffer = await pdfPromise;
    assert.ok(Buffer.isBuffer(pdfBuffer), "Result should be a Buffer");
    assert.strictEqual(pdfBuffer.toString("utf8", 0, 4), "%PDF", "Buffer should start with %PDF header");
  });
});
