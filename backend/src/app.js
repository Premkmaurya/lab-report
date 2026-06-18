const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));



app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);

module.exports = app;
