import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';

export default function Header() {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    // Fallback info
    const userName = currentUser?.name || 'Nhân viên';
    const userRole = currentUser?.department === 'sangtao' ? 'Khối Sáng tạo' :
                     currentUser?.department === 'chienluoc' ? 'Khối Chiến lược' :
                     currentUser?.department === 'kythuat' ? 'Khối Kỹ thuật & Công nghệ' :
                     currentUser?.department === 'khachhang' ? 'Khối Quản lý Khách hàng' :
                     currentUser?.department || 'Thành viên';
    const userAvatar = currentUser?.avatar || 'https://i.pravatar.cc/150?img=11';

    const handleLogout = async () => {
        try {
            await logout();
            // Optional: navigate('/login') not strictly needed if ProtectedRoute automatically bounces
            navigate('/login');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    // Close when click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!currentUser?.uid) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', String(currentUser.uid)));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            notifs.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setNotifications(notifs);
        });
        return () => unsubscribe();
    }, [currentUser]);

    const handleMarkAllRead = async () => {
        try {
            const batch = writeBatch(db);
            let updated = false;
            notifications.forEach(n => {
                if (n.isNew) {
                    batch.update(doc(db, 'notifications', n.id), { isNew: false });
                    updated = true;
                }
            });
            if (updated) await batch.commit();
        } catch (e) {
            console.error("Lỗi đánh dấu đã đọc", e);
        }
    };

    const handleNotificationClick = async (n: any) => {
        if (n.isNew) {
            await updateDoc(doc(db, 'notifications', n.id), { isNew: false });
        }
        if (n.link) {
            navigate(n.link);
            setShowNotifications(false);
        }
    };

    const unreadCount = notifications.filter(n => n.isNew).length;

    const renderTime = (timeStr: string) => {
        if(!timeStr) return '';
        const d = new Date(timeStr);
        if(isNaN(d.getTime())) return timeStr;
        return d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) + ' - ' + d.toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'});
    };

    return (
        <header className="glass-panel header" style={{
            height: 'var(--header-height)',
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            left: 'calc(var(--sidebar-width) + 2rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            zIndex: 90,
        }}>

            <div className="search-bar" style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-background)',
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                width: '300px',
                gap: '0.5rem',
                border: '1px solid var(--color-border)'
            }}>
                <Search size={18} color="var(--color-text-light)" />
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        color: 'var(--color-text)',
                        width: '100%',
                        fontSize: '0.9rem'
                    }}
                />
            </div>

            <div className="header-actions" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                {/* Notifications Dropdown Wrapper */}
                <div ref={notificationsRef} style={{ position: 'relative' }}>
                    <button
                        className="action-btn hover-lift active-bounce"
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: showNotifications ? 'var(--color-border)' : 'var(--color-background)',
                            position: 'relative',
                            transition: 'all var(--transition-fast)'
                        }}
                    >
                        <Bell size={20} color="var(--color-text-light)" />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '8px',
                                height: '8px',
                                backgroundColor: 'var(--color-danger)',
                                borderRadius: '50%',
                                border: '2px solid white'
                            }}></span>
                        )}
                    </button>

                    {/* Dropdown Panel */}
                    {showNotifications && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: 'calc(100% + 10px)',
                            right: '-50px',
                            width: '320px',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            transformOrigin: 'top right',
                            animation: 'dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            zIndex: 100
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Thông báo mới</h4>
                                <button onClick={() => setShowNotifications(false)} style={{ color: 'var(--color-text-light)' }} className="hover-nav">
                                    <X size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Chưa có thông báo nào</div>
                                ) : notifications.map(notification => (
                                    <div key={notification.id} onClick={() => handleNotificationClick(notification)} style={{
                                        display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: '8px',
                                        background: notification.isNew ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                                        transition: 'all 0.2s', cursor: 'pointer'
                                    }} className="hover-bg">
                                        <div style={{ width: '8px', height: '8px', minWidth: '8px', borderRadius: '50%', background: notification.isNew ? 'var(--color-primary)' : 'transparent', marginTop: '6px' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem', color: notification.isNew ? 'var(--color-text)' : 'var(--color-text-light)' }}>
                                                {notification.title}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '0.4rem', lineHeight: '1.4' }}>
                                                {notification.text}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                                                {renderTime(notification.time)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>Đánh dấu đã đọc tất cả</button>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
                    <Link to="/settings" className="profile hover-lift active-bounce glass-hover" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px'
                    }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'capitalize' }}>{userRole}</div>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            overflow: 'hidden',
                            transition: 'transform 0.2s',
                            fontSize: '1.2rem'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            {userAvatar.startsWith('http') || userAvatar.startsWith('data:') ? (
                                <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                userAvatar
                            )}
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="action-btn hover-lift active-bounce"
                        title="Đăng xuất khỏi hệ thống"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            transition: 'backgrounds 0.2s'
                        }}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            <style>{`
        .action-btn:hover {
          background: var(--color-border) !important;
          transform: scale(1.05);
        }
        .hover-bg:hover {
            background-color: var(--color-background) !important;
        }
        @keyframes dropdownFade {
            from { opacity: 0; transform: scale(0.95) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
        </header>
    );
}
