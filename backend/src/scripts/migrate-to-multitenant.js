const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const config = require('../config/config');
const Laboratory = require('../models/laboratory.model');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const Test = require('../models/test.model');
const Department = require('../models/department.model');
const PatientTest = require('../models/patientTest.model');
const PrintTemplate = require('../models/printTemplate.model');
const LabDetails = require('../models/labDetails.model');

async function migrate() {
  console.log('====================================================');
  console.log(' Starting Multi-Tenant Architecture Migration ');
  console.log('====================================================');

  const uri = config.MONGO_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/report-generator';
  console.log(`[Database] Connecting to ${uri}...`);
  await mongoose.connect(uri);
  console.log('[Database] Connected successfully.\n');

  // Step 1: Create Default Laboratory
  console.log('[Step 1/5] Ensuring Default Laboratory exists...');
  let defaultLab = await Laboratory.findOne({ code: 'DEFAULT' });
  if (!defaultLab) {
    defaultLab = await Laboratory.create({
      name: 'Default Laboratory',
      code: 'DEFAULT',
      address: 'Main Hospital Building',
      phone: '1800-000-0000',
      email: 'info@defaultlab.com',
      status: 'active',
    });
    console.log(` -> Created Default Laboratory with ID: ${defaultLab._id}`);
  } else {
    console.log(` -> Default Laboratory exists with ID: ${defaultLab._id}`);
  }

  // Step 2: System Admin Account Setup (Option C)
  console.log('\n[Step 2/5] Setting up System Admin accounts...');
  
  // A. Promote first existing admin if present
  const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (firstAdmin && firstAdmin.role !== 'system_admin') {
    firstAdmin.role = 'system_admin';
    firstAdmin.laboratoryId = null;
    await firstAdmin.save();
    console.log(` -> Promoted existing admin "${firstAdmin.username}" (${firstAdmin.email}) to system_admin.`);
  }

  // B. Create dedicated system admin account
  let sysAdmin = await User.findOne({ email: 'sysadmin@lims.local' });
  if (!sysAdmin) {
    const hashedPassword = await bcrypt.hash('SysAdmin123!', 10);
    sysAdmin = await User.create({
      username: 'sysadmin',
      email: 'sysadmin@lims.local',
      password: hashedPassword,
      role: 'system_admin',
      laboratoryId: null,
      isAuthorized: true,
      permissions: [],
    });
    console.log(` -> Created Dedicated System Admin:`);
    console.log(`    Username: sysadmin`);
    console.log(`    Email:    sysadmin@lims.local`);
    console.log(`    Password: SysAdmin123!`);
  } else {
    console.log(` -> Dedicated System Admin "sysadmin@lims.local" already exists.`);
  }

  // Step 3: Assign all existing records to Default Laboratory
  console.log('\n[Step 3/5] Assigning existing records to Default Laboratory...');

  // Fix patients without visitId to prevent null duplicate key issues
  const patientsWithoutVisitId = await Patient.find({ $or: [{ visitId: null }, { visitId: { $exists: false } }] });
  if (patientsWithoutVisitId.length > 0) {
    console.log(` -> Assigning unique visitIds to ${patientsWithoutVisitId.length} patients with null/missing visitId...`);
    for (const p of patientsWithoutVisitId) {
      p.visitId = String(Math.floor(10000 + Math.random() * 90000));
      p.laboratoryId = defaultLab._id;
      await p.save();
    }
  }

  // Users (except system_admin)
  const userResult = await User.updateMany(
    { role: { $ne: 'system_admin' }, $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated Users: ${userResult.modifiedCount} records assigned.`);

  // Patients
  const patientResult = await Patient.updateMany(
    { $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated Patients: ${patientResult.modifiedCount} records assigned.`);

  // Doctors
  const doctorResult = await Doctor.updateMany(
    { $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated Doctors: ${doctorResult.modifiedCount} records assigned.`);

  // Tests
  const testResult = await Test.updateMany(
    { $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated Tests: ${testResult.modifiedCount} records assigned.`);

  // Departments
  const deptResult = await Department.updateMany(
    { $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated Departments: ${deptResult.modifiedCount} records assigned.`);

  // PatientTests
  const ptResult = await PatientTest.updateMany(
    { $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated PatientTests: ${ptResult.modifiedCount} records assigned.`);

  // PrintTemplates
  const ptplResult = await PrintTemplate.updateMany(
    { $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated PrintTemplates: ${ptplResult.modifiedCount} records assigned.`);

  // Deduplicate PrintTemplates per laboratory so unique index on laboratoryId succeeds
  const allTemplates = await PrintTemplate.find().sort({ updatedAt: -1 });
  const seenLabs = new Set();
  for (const pt of allTemplates) {
    const labStr = pt.laboratoryId ? pt.laboratoryId.toString() : 'none';
    if (seenLabs.has(labStr)) {
      await PrintTemplate.deleteOne({ _id: pt._id });
      console.log(` -> Deleted duplicate PrintTemplate ${pt._id} for lab ${labStr}`);
    } else {
      seenLabs.add(labStr);
    }
  }

  // LabDetails
  const ldResult = await LabDetails.updateMany(
    { $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }] },
    { $set: { laboratoryId: defaultLab._id } }
  );
  console.log(` -> Updated LabDetails: ${ldResult.modifiedCount} records assigned.`);

  // Step 4: Drop old indexes if necessary and sync new indexes
  console.log('\n[Step 4/5] Syncing database indexes...');
  try {
    await Patient.collection.dropIndex('visitId_1').catch(() => {});
    await Patient.collection.dropIndex('visitId_1_laboratoryId_1').catch(() => {});
    await Department.collection.dropIndex('name_1').catch(() => {});
    await PrintTemplate.collection.dropIndex('userId_1').catch(() => {});
    await PrintTemplate.collection.dropIndex('laboratoryId_1').catch(() => {});
    console.log(' -> Dropped obsolete legacy unique indexes.');
  } catch (err) {
    // ignore if didn't exist
  }

  await Promise.all([
    Patient.syncIndexes(),
    Doctor.syncIndexes(),
    Test.syncIndexes(),
    Department.syncIndexes(),
    PatientTest.syncIndexes(),
    PrintTemplate.syncIndexes(),
    Laboratory.syncIndexes(),
    User.syncIndexes(),
  ]);
  console.log(' -> Synchronized multi-tenant compound indexes.');

  // Step 5: Verification
  console.log('\n[Step 5/5] Verifying zero orphaned records remain...');
  const modelsToVerify = [
    { name: 'Patient', model: Patient },
    { name: 'Doctor', model: Doctor },
    { name: 'Test', model: Test },
    { name: 'Department', model: Department },
    { name: 'PatientTest', model: PatientTest },
    { name: 'PrintTemplate', model: PrintTemplate },
  ];

  let errors = 0;
  for (const item of modelsToVerify) {
    const orphanCount = await item.model.countDocuments({
      $or: [{ laboratoryId: { $exists: false } }, { laboratoryId: null }],
    });
    if (orphanCount > 0) {
      console.error(` ❌ WARNING: ${item.name} has ${orphanCount} orphaned records!`);
      errors++;
    } else {
      console.log(` ✅ ${item.name}: 0 orphaned records.`);
    }
  }

  console.log('\n====================================================');
  if (errors === 0) {
    console.log(' 🎉 Migration completed successfully with ZERO errors!');
  } else {
    console.log(' ⚠️ Migration completed with warnings.');
  }
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed with error:', err);
  process.exit(1);
});
