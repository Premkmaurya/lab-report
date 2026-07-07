import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleGuard } from "./RoleGuard";

// Layouts (Keep Eager)
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";

// Loading Screen
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-warm-canvas">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
  </div>
);

// Lazy Loaded Pages
const Login = lazy(() => import("../pages/Login").then((m) => ({ default: m.Login })));
const Signup = lazy(() => import("../pages/Signup").then((m) => ({ default: m.Signup })));
const Pending = lazy(() => import("../pages/Pending").then((m) => ({ default: m.Pending })));
const Dashboard = lazy(() => import("../pages/Dashboard").then((m) => ({ default: m.Dashboard })));

const UserList = lazy(() => import("../pages/Users/UserList").then((m) => ({ default: m.UserList })));
const CreateUser = lazy(() => import("../pages/Users/CreateUser").then((m) => ({ default: m.CreateUser })));
const EditUser = lazy(() => import("../pages/Users/EditUser").then((m) => ({ default: m.EditUser })));

const PatientList = lazy(() => import("../pages/Patients/PatientList").then((m) => ({ default: m.PatientList })));
const CreatePatient = lazy(() => import("../pages/Patients/CreatePatient").then((m) => ({ default: m.CreatePatient })));
const PatientDetails = lazy(() => import("../pages/Patients/PatientDetails").then((m) => ({ default: m.PatientDetails })));
const EditPatient = lazy(() => import("../pages/Patients/EditPatient").then((m) => ({ default: m.EditPatient })));

const DoctorList = lazy(() => import("../pages/Doctors/DoctorList").then((m) => ({ default: m.DoctorList })));
const CreateDoctor = lazy(() => import("../pages/Doctors/CreateDoctor").then((m) => ({ default: m.CreateDoctor })));
const EditDoctor = lazy(() => import("../pages/Doctors/EditDoctor").then((m) => ({ default: m.EditDoctor })));

const TestList = lazy(() => import("../pages/Tests/TestList").then((m) => ({ default: m.TestList })));
const CreateTest = lazy(() => import("../pages/Tests/CreateTest").then((m) => ({ default: m.CreateTest })));
const EditTest = lazy(() => import("../pages/Tests/EditTest").then((m) => ({ default: m.EditTest })));

const CreateReport = lazy(() => import("../pages/Reports/CreateReport").then((m) => ({ default: m.CreateReport })));

const Settings = lazy(() => import("../pages/Settings").then((m) => ({ default: m.Settings })));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
            <Route path="/reports/create/:id" element={<CreateReport />} />

            <Route path="/tests" element={<TestList />} />
            <Route path="/tests/view/:id" element={<EditTest />} />
            {/* Admin Only Views */}
            <Route element={<RoleGuard allowedRoles={["admin"]} />}>
              <Route path="/users" element={<UserList />} />
              <Route path="/users/create" element={<CreateUser />} />
              <Route path="/users/edit/:id" element={<EditUser />} />

              <Route path="/doctors" element={<DoctorList />} />
              <Route path="/doctors/create" element={<CreateDoctor />} />
              <Route path="/doctors/edit/:id" element={<EditDoctor />} />

              <Route path="/tests/create" element={<CreateTest />} />
              <Route path="/tests/edit" element={<EditTest />} />
              <Route path="/tests/edit/:id" element={<EditTest />} />

              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};