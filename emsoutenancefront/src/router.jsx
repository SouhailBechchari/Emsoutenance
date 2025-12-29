import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./auth/AuthContext";

// Pages Publiques
import Login from "./pages/auth/Login";
import AdminLogin from "./pages/auth/AdminLogin";
import StudentLogin from "./pages/auth/StudentLogin";
import ProfessorLogin from "./pages/auth/ProfessorLogin";

import About from "./pages/public/About";
import Guide from "./pages/public/Guide";
import Contact from "./pages/public/Contact";

// Pages Administrateur
import AdminHome from "./pages/admin/AdminHome";
import StudentManagement from "./pages/admin/StudentManagement";
import ProfessorManagement from "./pages/admin/ProfessorManagement";
import ScheduleManagement from "./pages/admin/ScheduleManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import ContactMessages from "./pages/admin/ContactMessages";

// Pages Étudiant
import StudentHome from "./pages/student/StudentHome";
import StudentProfile from "./pages/student/StudentProfile";
import ReportSubmission from "./pages/student/ReportSubmission";

// Pages Professeur
import ProfessorHome from "./pages/professor/ProfessorHome";
import ProfessorProfile from "./pages/professor/ProfessorProfile";
import ReportReview from "./pages/professor/ReportReview";
import ProfessorDefenses from "./pages/professor/ProfessorDefenses";

/**
 * Configuration des Routes de l'application
 * 
 * Nous utilisons createBrowserRouter pour définir toutes les URL possibles.
 * Les routes sont protégées par "ProtectedRoute" qui vérifie si l'utilisateur est connecté.
 */
const router = createBrowserRouter([
  // --- 1. Route par défaut ---
  { path: "/", element: <App /> },

  // --- 2. Routes d'authentification ---
  { path: "/login", element: <Login /> },
  { path: "/login/admin", element: <AdminLogin /> },
  { path: "/login/student", element: <StudentLogin /> },
  { path: "/login/professor", element: <ProfessorLogin /> },

  // --- 3. Pages Publiques (accessibles à tous) ---
  { path: "/about", element: <About /> },
  { path: "/guide", element: <Guide /> },
  { path: "/contact", element: <Contact /> },

  // --- 4. Espace ADMINISTRATEUR ---
  // Toutes ces routes nécessitent le rôle "admin"
  {
    path: "/admin",
    element: <ProtectedRoute roles={["admin"]}><AdminHome /></ProtectedRoute>,
  },
  {
    path: "/admin/students",
    element: <ProtectedRoute roles={["admin"]}><StudentManagement /></ProtectedRoute>,
  },
  {
    path: "/admin/professors",
    element: <ProtectedRoute roles={["admin"]}><ProfessorManagement /></ProtectedRoute>,
  },
  {
    path: "/admin/schedule",
    element: <ProtectedRoute roles={["admin"]}><ScheduleManagement /></ProtectedRoute>,
  },
  {
    path: "/admin/settings",
    element: <ProtectedRoute roles={["admin"]}><AdminSettings /></ProtectedRoute>,
  },
  {
    path: "/admin/contact-messages",
    element: <ProtectedRoute roles={["admin"]}><ContactMessages /></ProtectedRoute>,
  },

  // --- 5. Espace ÉTUDIANT ---
  // Toutes ces routes nécessitent le rôle "student"
  {
    path: "/student",
    element: <ProtectedRoute roles={["student"]}><StudentHome /></ProtectedRoute>,
  },
  {
    path: "/student/profile",
    element: <ProtectedRoute roles={["student"]}><StudentProfile /></ProtectedRoute>,
  },
  {
    path: "/student/report",
    element: <ProtectedRoute roles={["student"]}><ReportSubmission /></ProtectedRoute>,
  },

  // --- 6. Espace PROFESSEUR ---
  // Toutes ces routes nécessitent le rôle "professor"
  {
    path: "/professor",
    element: <ProtectedRoute roles={["professor"]}><ProfessorHome /></ProtectedRoute>,
  },
  {
    path: "/professor/profile",
    element: <ProtectedRoute roles={["professor"]}><ProfessorProfile /></ProtectedRoute>,
  },
  {
    path: "/professor/reports",
    element: <ProtectedRoute roles={["professor"]}><ReportReview /></ProtectedRoute>,
  },
  {
    path: "/professor/defenses",
    element: <ProtectedRoute roles={["professor"]}><ProfessorDefenses /></ProtectedRoute>,
  },
]);

export default router;

