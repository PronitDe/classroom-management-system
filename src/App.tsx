import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChangePassword from "./pages/ChangePassword";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import BookRoom from "./pages/teacher/BookRoom";
import Attendance from "./pages/teacher/Attendance";
import History from "./pages/teacher/History";
import Issues from "./pages/teacher/Issues";
import SpocDashboard from "./pages/spoc/SpocDashboard";
import ManageRooms from "./pages/spoc/ManageRooms";
import ManageBookings from "./pages/spoc/ManageBookings";
import ManageIssues from "./pages/spoc/ManageIssues";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Change Password Route (Protected for all authenticated users) */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            
            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/book"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <BookRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/attendance"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/history"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/issues"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <Issues />
                </ProtectedRoute>
              }
            />
            
            {/* SPOC Routes */}
            <Route
              path="/spoc/dashboard"
              element={
                <ProtectedRoute allowedRoles={['SPOC']}>
                  <SpocDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spoc/rooms"
              element={
                <ProtectedRoute allowedRoles={['SPOC']}>
                  <ManageRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spoc/bookings"
              element={
                <ProtectedRoute allowedRoles={['SPOC']}>
                  <ManageBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spoc/issues"
              element={
                <ProtectedRoute allowedRoles={['SPOC']}>
                  <ManageIssues />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
