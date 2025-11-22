import React from "react"
import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import { ProtectedRoute } from "./auth/AuthContext"
import Login from "./pages/auth/Login"
import About from "./pages/public/About"
import Guide from "./pages/public/Guide"
import Contact from "./pages/public/Contact"
import AdminHome from "./pages/admin/AdminHome"
import StudentHome from "./pages/student/StudentHome"
import ProfessorHome from "./pages/professor/ProfessorHome"
import ReportSubmission from "./pages/student/ReportSubmission"
import StudentManagement from "./pages/admin/StudentManagement"
import ProfessorManagement from "./pages/admin/ProfessorManagement"
import ScheduleManagement from "./pages/admin/ScheduleManagement"
import AdminSettings from "./pages/admin/AdminSettings"
import ReportReview from "./pages/professor/ReportReview"
import ProfessorDefenses from "./pages/professor/ProfessorDefenses"

import AdminLogin from "./pages/auth/AdminLogin"
import StudentLogin from "./pages/auth/StudentLogin"
import ProfessorLogin from "./pages/auth/ProfessorLogin"

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/login/admin", element: <AdminLogin /> },
  { path: "/login/student", element: <StudentLogin /> },
  { path: "/login/professor", element: <ProfessorLogin /> },
  { path: "/about", element: <About /> },
  { path: "/guide", element: <Guide /> },
  { path: "/contact", element: <Contact /> },
  
  // Routes administrateur
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/students",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <StudentManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/professors",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <ProfessorManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/schedule",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <ScheduleManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminSettings />
      </ProtectedRoute>
    ),
  },
  
  // Routes étudiant
  {
    path: "/student",
    element: (
      <ProtectedRoute roles={["student"]}>
        <StudentHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/report",
    element: (
      <ProtectedRoute roles={["student"]}>
        <ReportSubmission />
      </ProtectedRoute>
    ),
  },
  
  // Routes professeur
  {
    path: "/professor",
    element: (
      <ProtectedRoute roles={["professor"]}>
        <ProfessorHome />
      </ProtectedRoute>
    ),
  },
  {
    path: "/professor/reports",
    element: (
      <ProtectedRoute roles={["professor"]}>
        <ReportReview />
      </ProtectedRoute>
    ),
  },
  {
    path: "/professor/defenses",
    element: (
      <ProtectedRoute roles={["professor"]}>
        <ProfessorDefenses />
      </ProtectedRoute>
    ),
  },
])

export default router
