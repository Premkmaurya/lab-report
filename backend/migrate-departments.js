require("dotenv").config();
const mongoose = require("mongoose");
const Department = require("./src/models/department.model");
const Test = require("./src/models/test.model");

const migrate = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Create default General department if it doesn't exist
    let generalDept = await Department.findOne({ name: "General" });
    if (!generalDept) {
      console.log("Creating default 'General' department...");
      generalDept = await Department.create({
        name: "General",
        description: "Default department for uncategorized tests",
      });
      console.log("Created 'General' department with ID:", generalDept._id);
    } else {
      console.log("Found existing 'General' department with ID:", generalDept._id);
    }

    // Find tests without departmentId
    const tests = await Test.find({ departmentId: { $exists: false } });
    console.log(`Found ${tests.length} tests without departmentId.`);

    if (tests.length > 0) {
      const updateResult = await Test.updateMany(
        { departmentId: { $exists: false } },
        { $set: { departmentId: generalDept._id } }
      );
      console.log(`Updated ${updateResult.modifiedCount} tests to reference 'General' department.`);
    }

    // Also update tests where departmentId might be null
    const nullTests = await Test.find({ departmentId: null });
    if (nullTests.length > 0) {
      const updateResult = await Test.updateMany(
        { departmentId: null },
        { $set: { departmentId: generalDept._id } }
      );
      console.log(`Updated ${updateResult.modifiedCount} tests with null departmentId.`);
    }

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

migrate();
