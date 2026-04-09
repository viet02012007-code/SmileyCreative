import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Timekeeping from './pages/Timekeeping';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import KnowledgeBase from './pages/KnowledgeBase';
import Chat from './pages/Chat';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import AttendanceTracking from './pages/AttendanceTracking';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';

function App() {
  const location = useLocation();
  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Dynamic unified auth page handling both routes mapping cleanly */}
        <Route path="/register" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        
        {/* Route bảo vệ yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="timekeeping" element={<Timekeeping />} />
            <Route path="employees" element={<Employees />} />
            <Route path="projects" element={<Projects />} />
            
            {/* Các Routes yêu cầu quyền quản trị */}
            <Route element={<RoleProtectedRoute />}>
              <Route path="crm" element={<CRM />} />
              <Route path="attendance" element={<AttendanceTracking />} />
            </Route>

            <Route path="settings" element={<Settings />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="chat" element={<Chat />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
          </Route>
        </Route>
        </Routes>
      </AnimatePresence>
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            color: '#1F2937',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            padding: '16px 24px',
            borderRadius: '16px',
            maxWidth: '500px',
            fontSize: '0.95rem'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
