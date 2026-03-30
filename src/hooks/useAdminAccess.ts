import { useAuth } from '../contexts/AuthContext';

export function useAdminAccess() {
    const { currentUser } = useAuth();
    if (!currentUser) return false;

    const role = (currentUser.role || '').toUpperCase().trim();
    const department = (currentUser.department || '').toUpperCase().trim();
    
    // Các từ khóa quyền lực (chấp nhận viết liền hoặc có dấu)
    const adminKeywords = [
        'ADMIN', 'GIÁM ĐỐC', 'GIAMDOC', 'GIAM DOC', 
        'TRƯỞNG PHÒNG', 'TRUONGPHONG', 'TRUONG PHONG', 
        'MANAGER', 'QUẢN LÝ', 'QUANLY', 'QUAN LY'
    ];
    
    // Chuẩn hóa chuỗi bằng cách xóa toàn bộ dấu cách để dễ so sánh bằng chính xác
    const normalizedRole = role.replace(/\s+/g, '');
    const normalizedDept = department.replace(/\s+/g, '');

    const hasAdminRole = adminKeywords.some(keyword => {
        const normalizedKeyword = keyword.replace(/\s+/g, '');
        return normalizedRole === normalizedKeyword || normalizedDept === normalizedKeyword;
    });

    // Chỉ dự phòng cho tài khoản quản trị gốc thực sự nêú rỗng
    const isSuperAdminEmail = 
        currentUser.email === 'nguyenviet212007@gmail.com' || 
        currentUser.email === 'admin@smiley.com';

    return hasAdminRole || isSuperAdminEmail;
}
