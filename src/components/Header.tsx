import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, writeBatch, addDoc, runTransaction } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Avatar from './Avatar';

export default function Header() {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    // Fallback info
    const userName = currentUser?.name || 'Nhân viên';
    const userRole = currentUser?.department === 'giamdoc' ? 'Giám Đốc' :
                     currentUser?.department === 'truongphong' ? 'Trưởng Phòng' :
                     currentUser?.department === 'nhanvien' ? 'Nhân Viên' :
                     currentUser?.department === 'sangtao' ? 'Khối Sáng tạo' :
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
        if (!currentUser?.id) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', String(currentUser.id)));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            notifs.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setNotifications(notifs);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Timer refs to clean up alarms
    const alarmTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        if (!currentUser?.id) return;

        const qTasks = query(collection(db, 'project_tasks'));

        const fireAlarm = async (task: any) => {
            try {
                const taskRef = doc(db, 'project_tasks', task.id);
                // Dùng transaction để đảm bảo chỉ có 1 client duy nhất tạo thông báo
                const shouldNotify = await runTransaction(db, async (transaction) => {
                    const taskDoc = await transaction.get(taskRef);
                    if (!taskDoc.exists() || taskDoc.data().notifiedPassed) {
                        return false;
                    }
                    transaction.update(taskRef, { notifiedPassed: true });
                    return true;
                });
                
                if (shouldNotify) {
                    // Gửi Notification Panel cho toàn bộ những người có liên quan
                    if (task.assignees && task.assignees.length > 0) {
                        for (const assignee of task.assignees) {
                            try {
                                await addDoc(collection(db, 'notifications'), {
                                    userId: String(assignee.id),
                                    title: '⏰ Báo động Hạn chót',
                                    text: `Công việc "${task.title}" đã quá thời gian hoàn thành!`,
                                    time: new Date().toISOString(),
                                    isNew: true,
                                    link: `/projects/${task.projectId || ''}`
                                });
                            } catch(e) {
                                console.error("Lỗi thêm thông báo", e);
                            }
                        }
                    }
                }
            } catch(e) {
                console.error("Lỗi khi báo động task", e);
            }
            if (alarmTimersRef.current[task.id]) delete alarmTimersRef.current[task.id];
        };

        const unsubscribe = onSnapshot(qTasks, (snapshot) => {
            const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

            allTasks.forEach(task => {
                // Nếu không có hạn chót, đã hoàn thành, hoặc đã từng báo động thì bỏ qua
                if (!task.deadline || task.notifiedPassed || task.status === 'HOÀN THÀNH') {
                    if (alarmTimersRef.current[task.id]) {
                        clearTimeout(alarmTimersRef.current[task.id]);
                        delete alarmTimersRef.current[task.id];
                    }
                    return;
                }

                // Bất kỳ client nào cũng tham gia đánh giá để giúp những người offline vẫn nhận được thông báo
                // Tuy nhiên chỉ báo Toast cho những người dùng liên quan
                const amIAssigned = task.assignees?.some((a: any) => String(a.id) === String(currentUser.id));
                const isDirector = currentUser?.department === 'giamdoc';

                const deadlineDate = new Date(task.deadline);
                const now = new Date();
                const msUntilDeadline = deadlineDate.getTime() - now.getTime();

                const triggerLocalToastAndFireAlarm = () => {
                     // Nếu mình có liên quan thì hiện Toast
                     if (amIAssigned || isDirector) {
                         toast.error(`⏰ BÁO ĐỘNG: Công việc "${task.title}" ĐÃ QUÁ HẠN CHÓT!`, { duration: 10000, position: 'top-center' });
                     }
                     // Chạy background FireAlarm để tạo Notification Panel cho người liên quan (đã chặn trùng trong code của fireAlarm)
                     fireAlarm(task);
                };

                // Nếu thời gian đã lố (hoặc chạm ngưỡng) -> Pinging alarm!
                if (msUntilDeadline <= 0) {
                    triggerLocalToastAndFireAlarm();
                } else if (msUntilDeadline <= 24 * 60 * 60 * 1000) {
                    // Nếu thời gian còn lại dưới 24 giờ, thì cài báo thức (setTimeout)
                    // (setTimeout trong JS chạy quá giới hạn 32 bit int (~24 ngày) sẽ bị lỗi tức thời, nên ta giới hạn quét 24 giờ)
                    if (!alarmTimersRef.current[task.id]) {
                        alarmTimersRef.current[task.id] = setTimeout(() => {
                            triggerLocalToastAndFireAlarm();
                        }, msUntilDeadline);
                    }
                }
            });
        });

        const currentTimers = alarmTimersRef.current;
        return () => {
            unsubscribe();
            Object.values(currentTimers).forEach(clearTimeout);
        };
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
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{userName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'capitalize' }}>{userRole}</div>
                        </div>
                        <div style={{ transition: 'transform 0.2s', display: 'flex' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            <Avatar src={userAvatar} name={userName} size={40} />
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
