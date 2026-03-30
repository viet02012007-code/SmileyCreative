import { NavLink, useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, CalendarClock, MessageSquare,
    BookOpen, LayoutDashboard, Settings, LogOut
} from 'lucide-react';
import { useAdminAccess } from '../hooks/useAdminAccess';

const MENU_ITEMS = [
    { icon: CalendarClock, label: 'Chấm công', path: '/timekeeping' },
    { icon: Users, label: 'Nhân sự', path: '/employees' },
    { icon: Briefcase, label: 'Dự án', path: '/projects' },
    { icon: LayoutDashboard, label: 'CRM', path: '/crm' },
    { icon: BookOpen, label: 'Học tập', path: '/knowledge' },
    { icon: MessageSquare, label: 'Chat Nội bộ', path: '/chat' },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const hasAccess = useAdminAccess();

    return (
        <aside className="glass-panel sidebar" style={{
            width: 'var(--sidebar-width)',
            height: 'calc(100vh - 2rem)',
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem',
            zIndex: 100,
        }}>
            <div className="logo-container" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0 0.5rem 2rem 0.5rem',
                borderBottom: '1px solid var(--glass-border)',
                marginBottom: '1rem'
            }}>
                <img
                    src={`${import.meta.env.BASE_URL}logo.png`}
                    alt="Smiley Agency Logo"
                    style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'contain',
                        borderRadius: '8px'
                    }}
                />
                <h1 className="logo-text">
                    Smiley Agency
                </h1>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {MENU_ITEMS.filter((item) => hasAccess ? true : item.path !== '/crm').map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--border-radius-sm)',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-light)',
                            backgroundColor: isActive ? 'var(--color-background)' : 'transparent',
                            fontWeight: isActive ? 600 : 500,
                            transition: 'all var(--transition-fast)',
                            textDecoration: 'none'
                        })}
                        className={({ isActive }) => isActive ? 'active-nav menu-item-transition hover-lift active-bounce' : 'hover-nav menu-item-transition hover-lift active-bounce'}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <NavLink
                    to="/ai-assistant"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                        width: '100%', marginBottom: '1rem', padding: '0.6rem 1.2rem', borderRadius: 'var(--border-radius-sm)',
                        fontWeight: 500, color: 'white',
                        background: 'linear-gradient(135deg, var(--color-primary), #818CF8)', border: 'none'
                    }}
                    className="btn hover-lift active-bounce glass-hover"
                >
                    ✨ Trợ lý AI
                </NavLink>
                <NavLink
                    to="/settings"
                    style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        width: '100%',
                        borderRadius: 'var(--border-radius-sm)',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-light)',
                        backgroundColor: isActive ? 'var(--color-background)' : 'transparent',
                        fontWeight: isActive ? 600 : 500,
                        transition: 'all var(--transition-fast)',
                        textDecoration: 'none'
                    })}
                    className={({ isActive }) => isActive ? 'active-nav menu-item-transition hover-lift active-bounce' : 'hover-nav menu-item-transition hover-lift active-bounce'}
                >
                    <Settings size={20} />
                    <span>Cài đặt</span>
                </NavLink>

                <button
                    onClick={() => {
                        localStorage.removeItem('isAuthenticated');
                        navigate('/login');
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        width: '100%',
                        borderRadius: 'var(--border-radius-sm)',
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        fontWeight: 500,
                        transition: 'all var(--transition-fast)',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        marginTop: '0.5rem'
                    }}
                    className="hover-nav menu-item-transition hover-lift active-bounce"
                >
                    <LogOut size={20} />
                    <span>Đăng xuất</span>
                </button>
            </div>

            {/* Adding some global hover styles specifically for sidebar */}
            <style>{`
        .hover-nav:hover {
          background-color: var(--color-background);
          color: var(--color-text);
          transform: translateX(4px);
        }
        .active-nav {
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
      `}</style>
        </aside>
    );
}
