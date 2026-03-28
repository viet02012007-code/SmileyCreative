import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
    // Kiểm tra xe người dùng đã được đánh dấu là đăng nhập hay chưa (lưu dưới LocalStorage)
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    // Nếu chưa đăng nhập, tự động đá về trang /login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Nếu đã đăng nhập, cho phép render các trang con bên trong (Dashboard, CRM, etc.)
    return <Outlet />;
}
