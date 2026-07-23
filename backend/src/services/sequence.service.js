const mongoose = require("mongoose");
const Counter = require("../models/counter.model");

/**
 * Gets the next sequential visit number for a specific laboratory.
 * Atomically increments sequence using findOneAndUpdate.
 * If counter doesn't exist, initializes it based on existing patients for that laboratory.
 *
 * @param {string|mongoose.Types.ObjectId} laboratoryId
 * @returns {Promise<number>}
 */
const getNextVisitNumber = async (laboratoryId) => {
  if (!laboratoryId) return 1;

  let counter = await Counter.findOne({ laboratoryId, name: "visitNumber" });

  if (!counter) {
    const Patient = mongoose.model("Patient");
    const lastPatient = await Patient.findOne({
      laboratoryId,
      visitNumber: { $exists: true, $ne: null },
    })
      .sort({ visitNumber: -1 })
      .select("visitNumber");

    let initialSeq = 0;
    if (lastPatient && typeof lastPatient.visitNumber === "number") {
      initialSeq = lastPatient.visitNumber;
    }

    try {
      await Counter.create({
        laboratoryId,
        name: "visitNumber",
        seq: initialSeq,
      });
    } catch (err) {
      // Counter might have been created concurrently by another process
    }
  }

  const updatedCounter = await Counter.findOneAndUpdate(
    { laboratoryId, name: "visitNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, returnDocument: "after" }
  );

  return updatedCounter.seq;
};

/**
 * Formats a visit ID from laboratory code and visit number.
 * Example: labCode "BJ", visitNumber 1 -> "BJ000001"
 * Example: labCode "CP", visitNumber 34343 -> "CP034343"
 *
 * @param {string} labCode
 * @param {number} visitNumber
 * @returns {string}
 */
const formatVisitId = (labCode, visitNumber) => {
  const code = (labCode || "LAB").toUpperCase().trim();
  const paddedNumber = String(visitNumber).padStart(6, "0");
  return `${code}${paddedNumber}`;
};

module.exports = {
  getNextVisitNumber,
  formatVisitId,
};
