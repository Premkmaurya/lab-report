import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleGuard } from "./routes/RoleGuard";

// Layouts
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Pages
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Pending } from "./pages/Pending";
import { Dashboard } from "./pages/Dashboard";

// Users (Admin Only)
import { UserList } from "./pages/Users/UserList";
import { CreateUser } from "./pages/Users/CreateUser";
import { EditUser } from "./pages/Users/EditUser";

// Patients
import { PatientList } from "./pages/Patients/PatientList";
import { CreatePatient } from "./pages/Patients/CreatePatient";
import { PatientDetails } from "./pages/Patients/PatientDetails";
import { EditPatient } from "./pages/Patients/EditPatient";

// Doctors
import { DoctorList } from "./pages/Doctors/DoctorList";
import { CreateDoctor } from "./pages/Doctors/CreateDoctor";
import { EditDoctor } from "./pages/Doctors/EditDoctor";

// Tests
import { TestList } from "./pages/Tests/TestList";
import { CreateTest } from "./pages/Tests/CreateTest";
import { EditTest } from "./pages/Tests/EditTest";
// Reports
import { ReportList } from "./pages/Reports/ReportList";
import { CreateReport } from "./pages/Reports/CreateReport";
import { ViewReport } from "./pages/Reports/ViewReport";
// Settings
import { Settings } from "./pages/Settings";

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Pending Authorization Route */}
          <Route path="/pending" element={<Pending />} />

          {/* Secure Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Main Application Shell */}
            <Route element={<DashboardLayout />}>
              {/* Common Authorized Views (Both Admin and Lab Tech) */}
              <Route path="/" element={<Dashboard />} />

              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/create" element={<CreatePatient />} />
              <Route path="/patients/:id" element={<PatientDetails />} />
              <Route path="/patients/edit/:id" element={<EditPatient />} />

              <Route path="/tests" element={<TestList />} />
              <Route path="/reports" element={<ReportList />} />
              <Route path="/reports/create" element={<CreateReport />} />
              <Route path="/reports/:id" element={<ViewReport />} />
              {/* Admin Only Views */}
              <Route element={<RoleGuard allowedRoles={["admin"]} />}>
                <Route path="/users" element={<UserList />} />
                <Route path="/users/create" element={<CreateUser />} />
                <Route path="/users/edit/:id" element={<EditUser />} />

                <Route path="/doctors" element={<DoctorList />} />
                <Route path="/doctors/create" element={<CreateDoctor />} />
                <Route path="/doctors/edit/:id" element={<EditDoctor />} />

                <Route path="/tests/create" element={<CreateTest />} />
                <Route path="/tests/edit/:id" element={<EditTest />} />

                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
export default App;
