const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const testRoutes = require('./routes/test.routes');
const patientTestRoutes = require('./routes/patientTest.routes');
const departmentRoutes = require('./routes/department.routes');
const { apiLimiter } = require('./middlewares/rateLimit');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173','https://lab-report-theta.vercel.app'],
    credentials: true,
}));
app.use(morgan('dev'));



app.use('/api/auth', authRoutes); // Auth routes have their own limiters
app.use('/api/doctors', apiLimiter, doctorRoutes);
app.use('/api/patients', apiLimiter, patientRoutes);
app.use('/api/departments', apiLimiter, departmentRoutes);
app.use('/api/tests', apiLimiter, testRoutes);
app.use('/api/patient-tests', apiLimiter, patientTestRoutes);

module.exports = app;
