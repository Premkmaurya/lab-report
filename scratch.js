const mongoose = require('mongoose');
require('dotenv').config({path: './backend/.env'});
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/report-generator')
  .then(async () => {
    const PatientTest = require('./backend/src/models/patientTest.model');
    const Test = require('./backend/src/models/test.model');
    
    const report = await PatientTest.findOne({'tests.0': {$exists: true}});
    if (!report) {
      console.log('No reports with tests found.');
    } else {
      console.log('Found Report ID:', report._id);
      const testItem = report.tests[0];
      console.log('Test Item:', testItem);
      console.log('testItem.testId type:', typeof testItem.testId);
      
      const testTemplate = await Test.findById(testItem.testId);
      console.log('Test Template found?:', !!testTemplate);
      if (!testTemplate) {
        console.log('Looking up Test Template by string...');
        const testTemplateStr = await Test.findById(testItem.testId.toString());
        console.log('Found by string?:', !!testTemplateStr);

        console.log('Looking up Test Template by name...');
        const testTemplateName = await Test.findOne({ name: testItem.testName });
        console.log('Found by name?:', !!testTemplateName);
        if (testTemplateName) {
            console.log('Actual Template ID:', testTemplateName._id);
            console.log('Stored Report testId:', testItem.testId);
        }
      }
    }
    mongoose.disconnect();
  })
  .catch(console.error);
