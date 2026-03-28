import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Mail, Phone, Briefcase, MapPin, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../config/firebase';
import { collection, query, getDocs, setDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default function Employees() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const q = query(collection(db, 'employees'));
                const querySnapshot = await getDocs(q);
                const fetchedEmployees = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setEmployees(fetchedEmployees);
            } catch (error) {
                console.error("Lỗi khi tải danh sách nhân sự:", error);
                toast.error("Không thể tải danh sách nhân sự");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmployees();
    }, []);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState<any | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState<any>({ status: 'Active', avatar: 'https://i.pravatar.cc/150?img=1', statusColor: '#10b981' });
    const [activeFilter, setActiveFilter] = useState('Tất cả');

    const filters = ['Tất cả', 'Sáng tạo', 'Chiến lược', 'Kỹ thuật', 'Khách hàng'];

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (confirm('Bạn có chắc chắn muốn xóa nhân sự này?')) {
            toast.loading('Đang xóa nhân sự...', { id: 'del-emp' });
            try {
                await deleteDoc(doc(db, 'employees', id));
                setEmployees(employees.filter((emp: any) => emp.id !== id));
                if (selectedUser?.id === id) {
                    setSelectedUser(null);
                    setIsEditing(false);
                }
                toast.success('Đã xóa nhân sự thành công!', { id: 'del-emp' });
            } catch (error: any) {
                console.error(error);
                toast.error("Lỗi khi xóa: " + error.message, { id: 'del-emp' });
            }
        }
    };

    const filtered = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = activeFilter === 'Tất cả' || emp.department.toLowerCase() === activeFilter.toLowerCase();

        return matchesSearch && matchesFilter;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Danh sách Nhân sự</h2>
                        <span style={{ background: '#fff3e0', color: '#ff7d0d', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            {employees.length} Thành viên
                        </span>
                    </div>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>Quản lý và theo dõi thông tin nhân sự Smiley Agency.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ background: 'var(--color-surface)', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.6rem 1.2rem' }}>
                        <Mail size={16} /> Xuất CSV
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => { setIsAdding(true); setNewUser({ status: 'Active', avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`, statusColor: '#10b981', department: 'SÁNG TẠO', location: 'HÀ NỘI' }); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 600 }}
                    >
                        <Plus size={18} /> Thêm Nhân viên
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', borderRadius: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem', color: 'var(--color-text-light)', fontWeight: 600, fontSize: '0.85rem' }}>
                        <Filter size={16} /> LỌC:
                    </div>
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '2rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                background: activeFilter === filter ? '#ff7d0d' : 'var(--color-background)',
                                color: activeFilter === filter ? 'white' : 'var(--color-text)',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '1rem', padding: '0 0.5rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--color-background)',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        width: '250px',
                    }}>
                        <Search size={16} color="var(--color-text-light)" />
                        <input
                            type="text"
                            placeholder="Tìm tên, email, vị trí..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', width: '100%', marginLeft: '0.5rem', fontSize: '0.85rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', background: 'var(--color-background)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                        <button style={{ padding: '0.5rem', background: 'white', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                                <div style={{ width: '6px', height: '6px', background: '#ff7d0d', borderRadius: '1px' }}></div>
                                <div style={{ width: '6px', height: '6px', background: '#ff7d0d', borderRadius: '1px' }}></div>
                                <div style={{ width: '6px', height: '6px', background: '#ff7d0d', borderRadius: '1px' }}></div>
                                <div style={{ width: '6px', height: '6px', background: '#ff7d0d', borderRadius: '1px' }}></div>
                            </div>
                        </button>
                        <button style={{ padding: '0.5rem', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', color: 'var(--color-text-light)' }}>
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* User Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', overflowY: 'auto', paddingBottom: '1rem' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '30px', height: '30px', border: '3px solid #ff7d0d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Đang lấy dữ liệu nhân sự từ Firebase...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                        Không có nhân sự nào khớp với kết quả tìm kiếm.
                    </div>
                ) : filtered.map((emp) => (
                    <div key={emp.id} className="glass-panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '1rem', position: 'relative' }}>
                        <button onClick={(e) => handleDelete(emp.id, e)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', outline: 'none' }} title="Xóa nhân sự">
                            <Trash2 size={16} />
                        </button>

                        <div style={{ position: 'relative', marginBottom: '1rem', marginTop: '0.5rem' }}>
                            <img src={emp.avatar} alt={emp.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-surface)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                            <div style={{
                                position: 'absolute', bottom: '0', right: '0',
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: emp.statusColor, border: '3px solid var(--color-surface)'
                            }}></div>
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>{emp.name}</h3>
                        <p style={{ color: '#ff7d0d', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 1rem 0' }}>{emp.role}</p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', background: 'var(--color-background)', color: 'var(--color-text-light)', borderRadius: '4px', letterSpacing: '0.5px' }}>{emp.department}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', background: 'var(--color-background)', color: 'var(--color-text-light)', borderRadius: '4px', letterSpacing: '0.5px' }}>{emp.location}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: 'auto' }}>
                            <button onClick={() => setSelectedUser(emp)} style={{ flex: 1, padding: '0.6rem', background: 'var(--color-background)', border: 'none', borderRadius: '0.5rem', fontWeight: 600, color: 'var(--color-text)', cursor: 'pointer', transition: 'background 0.2s' }}>Chi tiết</button>
                            <button style={{ padding: '0.6rem', background: 'var(--color-background)', border: 'none', borderRadius: '0.5rem', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Mail size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination / Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                    Hiển thị <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{filtered.length}</span> trên <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{employees.length}</span> nhân sự toàn hệ thống
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-light)' }}>&lt;</button>
                    <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '4px', background: '#ff7d0d', color: 'white', fontWeight: 600, cursor: 'pointer' }}>1</button>
                    <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>2</button>
                    <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>3</button>
                    <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '4px', background: 'transparent', color: 'var(--color-text-light)' }}>...</button>
                    <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>12</button>
                    <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-light)' }}>&gt;</button>
                </div>
            </div>

            {/* Add/Edit Profile Modal */}
            {(selectedUser || isAdding) && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => { setSelectedUser(null); setIsEditing(false); setIsAdding(false); }}>
                    <div className="glass-panel" style={{
                        width: '100%',
                        maxWidth: '500px',
                        backgroundColor: 'var(--color-surface)',
                        padding: '0',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ height: '120px', minHeight: '120px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', position: 'relative', flexShrink: 0 }}>
                            <button
                                onClick={() => { setSelectedUser(null); setIsEditing(false); setIsAdding(false); }}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
                            <div style={{ position: 'relative', width: '100px', height: '100px', marginTop: '-50px', marginBottom: '1rem', zIndex: 10 }}>
                                <img src={isAdding ? newUser.avatar : (isEditing ? editedUser?.avatar : selectedUser?.avatar)} alt={isAdding ? "New User" : selectedUser?.name} style={{
                                    width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--color-surface)',
                                    objectFit: 'cover', backgroundColor: 'white'
                                }} />
                                {(isEditing || isAdding) && (
                                    <button
                                        onClick={() => {
                                            const newUrl = prompt("Nhập URL Avatar thay thế (VD: https://i.pravatar.cc/150?img=1)");
                                            if (newUrl) {
                                                if (isAdding) setNewUser({ ...newUser, avatar: newUrl });
                                                else if (editedUser) setEditedUser({ ...editedUser, avatar: newUrl });
                                            }
                                        }}
                                        style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                        <Plus size={16} style={{ margin: 'auto' }} />
                                    </button>
                                )}
                            </div>

                            {!isEditing && !isAdding ? (
                                <>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedUser?.name}</h3>
                                    <p style={{ color: 'var(--color-primary)', fontWeight: 500, marginBottom: '1.5rem' }}>{selectedUser?.role}</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-light)' }}>
                                            <Briefcase size={18} /> <span>{selectedUser?.department}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-light)' }}>
                                            <Mail size={18} /> <span>{selectedUser?.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-light)' }}>
                                            <Phone size={18} /> <span>{selectedUser?.phone}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-light)' }}>
                                            <MapPin size={18} /> <span>{selectedUser?.location || 'Hà Nội, Việt Nam'}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setIsEditing(true); setEditedUser({ ...selectedUser! }); }}>Sửa hồ sơ</button>
                                        <button className="btn btn-secondary" style={{ flex: 1, color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2' }} onClick={() => selectedUser && handleDelete(selectedUser.id)}>Xóa hồ sơ</button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', animation: 'fadeIn 0.2s' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{isAdding ? 'Thêm nhân viên mới' : 'Chỉnh sửa hồ sơ'}</h3>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.25rem', display: 'block' }}>Họ và tên</label>
                                        <input type="text" value={isAdding ? (newUser.name || '') : (editedUser?.name || '')} onChange={e => isAdding ? setNewUser({ ...newUser, name: e.target.value }) : setEditedUser({ ...editedUser!, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.25rem', display: 'block' }}>Chức vụ</label>
                                            <input type="text" value={isAdding ? (newUser.role || '') : (editedUser?.role || '')} onChange={e => isAdding ? setNewUser({ ...newUser, role: e.target.value }) : setEditedUser({ ...editedUser!, role: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.25rem', display: 'block' }}>Phòng ban</label>
                                            <select
                                                value={isAdding ? (newUser.department || '') : (editedUser?.department || '')}
                                                onChange={e => isAdding ? setNewUser({ ...newUser, department: e.target.value }) : setEditedUser({ ...editedUser!, department: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }}
                                            >
                                                {filters.slice(1).map(f => <option key={f} value={f.toUpperCase()}>{f.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.25rem', display: 'block' }}>Khu vực</label>
                                            <input type="text" placeholder="HÀ NỘI, TP. HCM, REMOTE..." value={isAdding ? (newUser.location || '') : (editedUser?.location || '')} onChange={e => isAdding ? setNewUser({ ...newUser, location: e.target.value }) : setEditedUser({ ...editedUser!, location: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.25rem', display: 'block' }}>Mã NV</label>
                                            <input type="text" value={isAdding ? (newUser.id || '') : (editedUser?.id || '')} onChange={e => isAdding ? setNewUser({ ...newUser, id: e.target.value }) : setEditedUser({ ...editedUser!, id: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.25rem', display: 'block' }}>Email</label>
                                        <input type="email" value={isAdding ? (newUser.email || '') : (editedUser?.email || '')} onChange={e => isAdding ? setNewUser({ ...newUser, email: e.target.value }) : setEditedUser({ ...editedUser!, email: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0.25rem', display: 'block' }}>Số điện thoại</label>
                                        <input type="tel" value={isAdding ? (newUser.phone || '') : (editedUser?.phone || '')} onChange={e => isAdding ? setNewUser({ ...newUser, phone: e.target.value }) : setEditedUser({ ...editedUser!, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                    </div>

                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                        <button className="btn btn-primary" style={{ flex: 1, border: '2px solid #000', boxShadow: '0 2px 0 #000' }} onClick={async () => {
                                            if (isAdding) {
                                                if (!newUser.name || !newUser.id) {
                                                    toast.error('Vui lòng nhập tên và mã NV');
                                                    return;
                                                }
                                                toast.loading('Đang thêm nhân sự...', { id: 'save-emp' });
                                                try {
                                                    const newEmpData = { ...newUser, createdAt: new Date().toISOString() };
                                                    await setDoc(doc(db, 'employees', String(newUser.id)), newEmpData);
                                                    setEmployees([{ ...newEmpData, id: newUser.id } as any, ...employees]);
                                                    setIsAdding(false);
                                                    toast.success('Thêm nhân sự thành công!', { id: 'save-emp' });
                                                } catch (err: any) {
                                                    toast.error('Lỗi: ' + err.message, { id: 'save-emp' });
                                                }
                                            } else if (editedUser) {
                                                toast.loading('Đang cập nhật...', { id: 'save-emp' });
                                                try {
                                                    const empRef = doc(db, 'employees', editedUser.id);
                                                    const updateData = { ...editedUser };
                                                    delete updateData.id; // don't update ID field itself since it's the doc key
                                                    await updateDoc(empRef, updateData);
                                                    setEmployees(employees.map((emp: any) => emp.id === editedUser.id ? editedUser : emp));
                                                    setSelectedUser(editedUser);
                                                    setIsEditing(false);
                                                    toast.success('Cập nhật thành công!', { id: 'save-emp' });
                                                } catch (err: any) {
                                                    toast.error('Lỗi: ' + err.message, { id: 'save-emp' });
                                                }
                                            }
                                        }}>Lưu thay đổi</button>
                                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setIsEditing(false); setIsAdding(false); }}>Hủy</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .table-row:hover { background-color: rgba(0,0,0,0.02); }
        .table-row:hover .btn-icon { background-color: var(--color-background); color: var(--color-text); }
        @media (prefers-color-scheme: dark) {
          .table-row:hover { background-color: rgba(255,255,255,0.02); }
        }
      `}</style>
        </div>
    );
}
