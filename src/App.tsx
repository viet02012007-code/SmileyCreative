import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Timekeeping from './pages/Timekeeping';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import KnowledgeBase from './pages/KnowledgeBase';
import Chat from './pages/Chat';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* Route bảo vệ yêu cầu đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/timekeeping" replace />} />
          <Route path="timekeeping" element={<Timekeeping />} />
          <Route path="employees" element={<Employees />} />
          <Route path="projects" element={<Projects />} />
          <Route path="crm" element={<CRM />} />
          <Route path="knowledge" element={<KnowledgeBase />} />
          <Route path="chat" element={<Chat />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
