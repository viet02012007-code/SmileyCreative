import { useState } from 'react';
import { Search, Plus, Filter, Phone, Mail, MapPin, ExternalLink, Star, User, MoreHorizontal, X, Edit, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import toast from 'react-hot-toast';

const INITIAL_CLIENTS = [
    { id: 1, name: 'Công ty Cổ phần Công nghệ ABC', contact: 'Nguyễn Văn Tiến', role: 'Giám đốc IT', email: 'tien.nv@abc.tech', phone: '0987654321', address: 'Quận 1, TP.HCM', status: 'Khách hàng VIP', bg: 'var(--color-primary)' },
    { id: 2, name: 'Tập đoàn Đầu tư XYZ', contact: 'Trần Quỳnh Như', role: 'Trưởng phòng Mua hàng', email: 'nhu.tq@xyz.com', phone: '0987654322', address: 'Ba Đình, Hà Nội', status: 'Khách hàng Tiềm năng', bg: 'var(--color-success)' },
    { id: 3, name: 'Công ty TNHH Dịch vụ 123', contact: 'Lê Minh Hải', role: 'CEO', email: 'hai.lm@123.vn', phone: '0987654323', address: 'Hải Châu, Đà Nẵng', status: 'Đang thương lượng', bg: 'var(--color-warning)' },
    { id: 4, name: 'Hệ thống Bán lẻ VinMarket', contact: 'Phạm Thu Hương', role: 'Quản lý Khu vực', email: 'huong.pt@vinmarket.com', phone: '0987654324', address: 'Cầu Giấy, Hà Nội', status: 'Khách hàng Mới', bg: 'var(--color-secondary)' },
    { id: 5, name: 'Công ty StartUp Fintech', contact: 'Đoàn Hùng', role: 'Founder', email: 'hung.doan@fintech.io', phone: '0987654325', address: 'Quận 3, TP.HCM', status: 'Mất liên lạc', bg: 'var(--color-text-light)' },
];

const COLORS = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-secondary)', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function CRM() {
    const [clients, setClients] = useLocalStorage('smiley_crm_clients', INITIAL_CLIENTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', contact: '', role: '', email: '', phone: '', address: '', status: 'Khách hàng Mới'
    });

    const handleSave = () => {
        if (!formData.name || !formData.contact) {
            toast.error("Vui lòng nhập tên công ty và người liên hệ");
            return;
        }
        
        if (editingClient) {
            setClients(clients.map((c: any) => c.id === editingClient.id ? { ...editingClient, ...formData } : c));
        } else {
            const newClient = {
                ...formData,
                id: Date.now(),
                bg: COLORS[Math.floor(Math.random() * COLORS.length)]
            };
            setClients([newClient, ...clients]);
        }
        closeModal();
    };

    const handleDelete = (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
            setClients(clients.filter((c: any) => c.id !== id));
        }
    };

    const openModal = (client: any = null) => {
        setEditingClient(client);
        if (client) {
            setFormData({
                name: client.name, contact: client.contact, role: client.role,
                email: client.email, phone: client.phone, address: client.address, status: client.status
            });
        } else {
            setFormData({ name: '', contact: '', role: '', email: '', phone: '', address: '', status: 'Khách hàng Mới' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const filteredClients = clients.filter((c: any) => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Quản lý Khách hàng (CRM)</h2>
                    <p style={{ color: 'var(--color-text-light)' }}>Danh sách {clients.length} khách hàng và đối tác kinh doanh.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary">
                        <Filter size={18} /> Lọc
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={18} /> Thống kê & Báo cáo
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--color-background)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--border-radius-sm)',
                    flex: 1,
                    maxWidth: '400px',
                    border: '1px solid var(--color-border)'
                }}>
                    <Search size={18} color="var(--color-text-light)" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên công ty, người liên hệ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', width: '100%', marginLeft: '0.5rem', fontSize: '0.9rem' }}
                    />
                </div>
                <button className="btn btn-primary" style={{ height: '100%' }} onClick={() => openModal()}>
                    <Plus size={18} /> Thêm Khách hàng
                </button>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
                {filteredClients.map((client: any) => (
                    <div key={client.id} className="glass-panel client-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all var(--transition-normal)', position: 'relative' }}>

                        {/* Card Header & Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${client.bg}, ${client.bg}cc)`,
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.25rem', fontWeight: 'bold'
                                }}>
                                    {client.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem', lineHeight: 1.2, paddingRight: '2rem' }}>{client.name}</h3>
                                        <button style={{ color: 'var(--color-text-light)', background: 'transparent', padding: '0', cursor: 'pointer', position: 'absolute', right: '1.5rem', top: '1.5rem' }}>
                                            <Star size={18} />
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '1rem', backgroundColor: `${client.bg}15`, color: client.bg }}>
                                        {client.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div style={{ background: 'var(--color-background)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)', flex: 1, marginTop: '0.5rem' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={16} color="var(--color-primary)" /> {client.contact}
                                <span style={{ fontWeight: 400, color: 'var(--color-text-light)', fontSize: '0.85rem' }}>- {client.role}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={14} /> {client.email}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={14} /> {client.phone}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={14} /> {client.address}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => openModal(client)}>
                                <Edit size={16} /> Sửa
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                                Tạo báo giá
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ef4444', borderColor: '#ef444415', background: '#ef444405' }} onClick={() => handleDelete(client.id)}>
                                <Trash2 size={16} />
                            </button>
                        </div>

                    </div>
                ))}

                {filteredClients.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                        Không tìm thấy khách hàng nào khớp với tìm kiếm.
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={closeModal}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-surface)',
                        padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                        maxHeight: '90vh', overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingClient ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'}</h3>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Tên công ty / Tổ chức *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} placeholder="Công ty TNHH..." />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Người liên hệ *</label>
                                    <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Chức vụ</label>
                                    <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Số điện thoại</label>
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Địa chỉ</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Trạng thái</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }}>
                                    <option value="Khách hàng Mới">Khách hàng Mới</option>
                                    <option value="Đang thương lượng">Đang thương lượng</option>
                                    <option value="Khách hàng Tiềm năng">Khách hàng Tiềm năng</option>
                                    <option value="Khách hàng VIP">Khách hàng VIP</option>
                                    <option value="Mất liên lạc">Mất liên lạc</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '0.75rem' }} onClick={handleSave}>Lưu thông tin</button>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={closeModal}>Hủy</button>
                        </div>

                    </div>
                </div>
            )}

            <style>{`
        .client-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border-color: var(--color-primary); }
      `}</style>
        </div>
    );
}
