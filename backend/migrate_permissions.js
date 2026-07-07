require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const config = require('./src/config/config');

// Mapping from old permissions to new permissions
const permissionMap = {
  // Patients
  create_patient: 'manage_patients',
  edit_patient: 'manage_patients',
  view_patients: 'manage_patients',
  // Doctors
  create_doctor: 'manage_doctors',
  edit_doctor: 'manage_doctors',
  view_doctors: 'manage_doctors',
  // Tests
  create_test: 'manage_tests',
  edit_test: 'manage_tests',
  delete_test: 'manage_tests',
  view_tests: 'manage_tests',
  create_department: 'manage_tests',
  edit_department: 'manage_tests',
  // Reports
  manage_reports: 'manage_reports',
  view_reports: 'manage_reports',
  print_reports: 'print_reports',
  // System
  settings_access: null // Removing completely
};

async function migratePermissions() {
  try {
    console.log('Connecting to database...', config.MONGO_URI);
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected to database.');

    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate.`);

    let migratedCount = 0;

    for (const user of users) {
      if (!user.permissions || user.permissions.length === 0) continue;

      const newPermissionsSet = new Set();
      let changed = false;

      for (const perm of user.permissions) {
        if (permissionMap[perm] !== undefined) {
          const newPerm = permissionMap[perm];
          if (newPerm) {
            newPermissionsSet.add(newPerm);
          }
          changed = true;
        } else {
          // If it's already one of the new permissions or unknown, just keep it
          newPermissionsSet.add(perm);
        }
      }

      const newPermissionsArray = Array.from(newPermissionsSet);

      // If array changed, update user
      if (changed || user.permissions.length !== newPermissionsArray.length) {
        user.permissions = newPermissionsArray;
        await user.save();
        migratedCount++;
        console.log(`Migrated user ${user.username} to permissions: ${newPermissionsArray.join(', ')}`);
      }
    }

    console.log(`Migration complete. Successfully updated ${migratedCount} users.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

migratePermissions();
