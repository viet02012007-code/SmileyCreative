import { useState, useRef, useEffect } from 'react';
import { User, Bell, Settings as SettingsIcon } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    // Pull from active logged in user
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    
    const initialProfile = {
        name: currentUser?.name || 'Nhân viên',
        email: currentUser?.email || 'Chưa cập nhật',
        role: currentUser?.department || 'Phòng ban',
        phone: currentUser?.phone || '',
        address: currentUser?.address || '',
        avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=11'
    };

    const [profile, setProfile] = useLocalStorage('currentUser', initialProfile);
    const [systemConfig, setSystemConfig] = useLocalStorage('smiley_system_settings', { radius: 1, coords: '21.028511, 105.804817' });
    const [formData, setFormData] = useState(initialProfile);
    const [systemFormData, setSystemFormData] = useState(systemConfig);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (profile) {
            const p = profile as any;
            setFormData({
                name: p.name || initialProfile.name,
                email: p.email || initialProfile.email,
                role: p.department || p.role || initialProfile.role,
                phone: p.phone || initialProfile.phone,
                address: p.address || initialProfile.address,
                avatar: p.avatar || initialProfile.avatar
            });
        }
        if (systemConfig) setSystemFormData(systemConfig);
    }, [profile, systemConfig]);

    const avatarIcons = [
        { bg: '#FFE4D6', emoji: '😊', color: '#ff7d0d' },
        { bg: '#E1E9FF', emoji: '🐾', color: '#4F46E5' },
        { bg: '#D1FAE5', emoji: '🐰', color: '#10B981' },
        { bg: '#EDE9FE', emoji: '🌱', color: '#8B5CF6' },
        { bg: '#FCE7F3', emoji: '🌸', color: '#EC4899' },
        { bg: '#FEF3C7', emoji: '🌻', color: '#F59E0B' },
        { bg: '#CCFBF1', emoji: '🤖', color: '#14B8A6' },
        { bg: '#E0E7FF', emoji: '👩‍💻', color: '#6366F1' },
    ];

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('File quá lớn. Vui lòng chọn file dưới 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormData({ ...formData, avatar: event.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        // Mở rộng thông tin form kèm các id cũ
        const updatedUser = { ...currentUser, ...formData, department: formData.role };
        
        // Lưu cho phiên hiện tại
        setProfile(updatedUser);
        
        // Đồng thời ghi lại thay đổi vào sổ users hệ thống để lần sau đăng nhập không bị mất
        const usersStr = localStorage.getItem('app_users');
        if (usersStr) {
            let users = JSON.parse(usersStr);
            users = users.map((u: any) => u.email === updatedUser.email ? updatedUser : u);
            localStorage.setItem('app_users', JSON.stringify(users));
        }
        
        alert('Đã lưu thay đổi hồ sơ thành công!');
    };

    const handleCancel = () => {
        setFormData(profile);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>Cài đặt Hệ thống</h2>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>Quản lý hồ sơ cá nhân và cấu hình vận hành của Smiley Agency.</p>
            </div>

            <div className="glass-panel" style={{ padding: 0, backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>
                {/* Top Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 1rem' }}>
                    {[
                        { id: 'profile', icon: User, label: 'Hồ sơ cá nhân' },
                        { id: 'notifications', icon: Bell, label: 'Thông báo' },
                        { id: 'system', icon: SettingsIcon, label: 'Cấu hình hệ thống' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1.25rem 1rem',
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-light)',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                transition: 'all 0.2s',
                                position: 'relative',
                                top: '1px' // To overlap the container's bottom border
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ padding: '2rem 2.5rem' }}>
                    {activeTab === 'profile' && (
                        <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start' }}>
                            {/* Left Column: Avatar */}
                            <div style={{ width: '240px', flexShrink: 0 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ảnh đại diện</h3>

                                <div style={{
                                    border: '1px dashed var(--color-border)',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginBottom: '2rem'
                                }}>
                                    {formData.avatar.startsWith('http') || formData.avatar.startsWith('data:') ? (
                                        <img
                                            src={formData.avatar}
                                            alt="Profile Avatar"
                                            style={{ width: '120px', height: '120px', borderRadius: '1rem', objectFit: 'cover', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        />
                                    ) : (
                                        <div style={{ width: '120px', height: '120px', borderRadius: '1rem', marginBottom: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', backgroundColor: avatarIcons.find(a => a.emoji === formData.avatar)?.bg || '#FFF' }}>
                                            {formData.avatar}
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg" style={{ display: 'none' }} />
                                    <button onClick={() => fileInputRef.current?.click()} style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        marginBottom: '0.5rem',
                                        cursor: 'pointer'
                                    }}>
                                        Thay đổi ảnh đại diện
                                    </button>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 500 }}>JPG, PNG TỐI ĐA 5MB</span>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>Hoặc chọn biểu tượng đại diện</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                        {avatarIcons.map((icon, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setFormData({ ...formData, avatar: icon.emoji })}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    backgroundColor: icon.bg,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    fontSize: '1.25rem',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                {icon.emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Forms */}
                            <div style={{ flex: 1 }}>
                                {/* Personal Info Section */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Thông tin cá nhân</h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Họ và tên</label>
                                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Email công việc</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid transparent', backgroundColor: '#F3F4F6', color: '#6B7280', outline: 'none', fontSize: '0.95rem', cursor: 'not-allowed' }} />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Chức vụ</label>
                                        <input type="text" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} disabled style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid transparent', backgroundColor: '#F3F4F6', color: '#6B7280', outline: 'none', fontSize: '0.95rem', cursor: 'not-allowed' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Số điện thoại</label>
                                            <input type="tel" placeholder="Nhập số điện thoại" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Địa chỉ</label>
                                            <input type="text" placeholder="Nhập địa chỉ của bạn" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Password Section */}
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Đổi mật khẩu</h3>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Mật khẩu hiện tại</label>
                                        <input type="password" defaultValue="••••••••" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem', letterSpacing: '2px' }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Mật khẩu mới</label>
                                            <input type="password" placeholder="Nhập mật khẩu mới" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Xác nhận mật khẩu</label>
                                            <input type="password" placeholder="Xác nhận mật khẩu" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.95rem' }} />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem' }}>
                                        <button onClick={handleCancel} style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-text-light)',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}>
                                            Hủy bỏ
                                        </button>
                                        <button className="btn btn-primary" onClick={handleSave} style={{
                                            padding: '0.75rem 2rem',
                                            borderRadius: '2rem',
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'white',
                                            backgroundColor: '#ff7d0d'
                                        }}>
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Cấu hình thông báo</h3>
                            <p style={{ color: 'var(--color-text-light)' }}>Đang cập nhật...</p>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cấu hình hệ thống</h3>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>Chấm công & Vị trí</h4>
                                <div style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '0.75rem', backgroundColor: '#F9FAFB' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>Bán kính chấm công hợp lệ</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Khoảng cách tối đa từ vị trí của nhân viên đến công ty ở chế độ "Tại văn phòng Agency".</div>
                                        </div>
                                        <select 
                                            value={systemFormData.radius}
                                            onChange={(e) => setSystemFormData({ ...systemFormData, radius: parseFloat(e.target.value) })}
                                            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', fontWeight: 600, color: 'var(--color-text)', backgroundColor: 'white' }}
                                        >
                                            <option value={0.5}>500m</option>
                                            <option value={1}>1km</option>
                                            <option value={2}>2km</option>
                                            <option value={5}>5km</option>
                                            <option value={0}>Không giới hạn</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>Tọa độ văn phòng Agency</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Vị trí trung tâm để tính khoảng cách (Vĩ độ, Kinh độ).</div>
                                        </div>
                                        <input 
                                            value={systemFormData.coords}
                                            onChange={(e) => setSystemFormData({ ...systemFormData, coords: e.target.value })}
                                            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', width: '200px', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => {
                                            setSystemConfig(systemFormData);
                                            alert('Đã lưu cấu hình hệ thống (Bán kính & Tọa độ)!');
                                        }}
                                        style={{ padding: '0.75rem 2rem', borderRadius: '2rem', fontWeight: 600, backgroundColor: '#ff7d0d', color: 'white', border: 'none', cursor: 'pointer' }}
                                    >
                                        Lưu cấu hình
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
