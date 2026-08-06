const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const PatientTest = require("../src/models/patientTest.model");

test("PatientTest Model Hook Test", async (t) => {
  await t.test("Pre-save hook populates verificationToken without error", () => {
    const pt = new PatientTest({
      patientId: new mongoose.Types.ObjectId(),
      laboratoryId: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      tests: [],
    });

    // Execute pre-save hooks
    pt.schema.s.hooks.execPreSync("save", pt);

    assert.ok(pt.verificationToken, "verificationToken should be generated");
    assert.strictEqual(typeof pt.verificationToken, "string");
  });
});
